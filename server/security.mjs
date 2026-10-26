import {randomBytes} from 'node:crypto';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {CmsError,checkPassword} from './store.mjs';
import {hash,constantEqual,base32,newRecoveryCodes,recoveryHash,matchingCounter,encryptSecret,decryptSecret,clientIp,proxyPolicy,integerSetting} from './security-core.mjs';
const fail=(status,message)=>{throw new CmsError(status,message)};
export async function createSecurityService(store,{secureCookies=false,checkOrigin,clock=()=>Date.now()}={}){
 const db=store.db,trusted=proxyPolicy(process.env.CMS_TRUSTED_PROXIES??'127.0.0.1,::1');
 const rootIdle=integerSetting(process.env.CMS_ROOT_IDLE_MINUTES,15,5,120)*60000,adminIdle=integerSetting(process.env.CMS_ADMIN_IDLE_MINUTES,30,5,240)*60000;
 const lifetime=8*3600000,proofLifetime=5*60000,retention=integerSetting(process.env.CMS_AUDIT_DAYS,90,7,365)*86400000;
 let hashing=0,lastPurge=0;const auditNotices=new Map(),pendingAudits=new Set();
 const identity=req=>({ip:clientIp(req,trusted),agent:String(req.headers['user-agent']||'').replace(/[\x00-\x1f]/g,'').slice(0,240)});
 const sessionCookie=(token,seconds)=>`sw_admin=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${seconds}${secureCookies?'; Secure':''}`;
 const deviceCookie=(token,seconds,userId)=>`sw_device_v2_${userId}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${seconds}${secureCookies?'; Secure':''}`;
 const challengeCookie=(token,seconds)=>`sw_mfa=${token}; Path=/api/cms; HttpOnly; SameSite=Strict; Max-Age=${seconds}${secureCookies?'; Secure':''}`;
 async function audit(req,action,result='success',actor='',detail={}){
  const info=identity(req),clean={};for(const key of ['target','device','version','decision','id','path'])if(['string','number'].includes(typeof detail[key]))clean[key]=String(detail[key]).slice(0,160);
  await db.prepare('INSERT INTO security_events(created,actor,action,result,ip,agent,detail) VALUES(?,?,?,?,?,?,?)').run(clock(),String(actor).slice(0,254),action.slice(0,60),result.slice(0,16),info.ip,info.agent,JSON.stringify(clean));
  if(clock()-lastPurge>3600000){lastPurge=clock();await purge()}
 }
 async function purge(){const now=clock();await db.prepare('DELETE FROM security_events WHERE created<?').run(now-retention);await db.exec('DELETE FROM security_events WHERE id NOT IN (SELECT id FROM security_events ORDER BY id DESC LIMIT 20000)');await db.prepare('DELETE FROM security_challenges WHERE expires<?').run(now);await db.prepare('DELETE FROM security_devices WHERE expires<?').run(now);await db.prepare('DELETE FROM security_attempts WHERE until_at<?').run(now);await db.prepare('DELETE FROM sessions WHERE expires<?').run(now)}
 function rateKeys(req,email,purpose){return [{key:purpose+':ip:'+identity(req).ip,limit:20},{key:purpose+':account:'+hash(email),limit:10}]}
 async function checkRate(req,email,purpose){for(const {key,limit} of rateKeys(req,email,purpose)){const row=await db.prepare('SELECT count,until_at FROM security_attempts WHERE key=?').get(key);if(row&&row.until_at>clock()&&row.count>=limit){const note=purpose+':'+identity(req).ip;if((auditNotices.get(note)||0)<clock()-60000){if(auditNotices.size>2000)auditNotices.clear();auditNotices.set(note,clock());await audit(req,'auth.throttled','blocked',email)}fail(429,'Çok fazla başarısız deneme. 15 dakika sonra tekrar deneyin.')}}}
 async function failedAttempt(req,email,purpose){await db.transaction(async()=>{for(const {key} of rateKeys(req,email,purpose)){const now=clock(),row=await db.prepare('SELECT count,until_at FROM security_attempts WHERE key=?').get(key);if(!row||row.until_at<=now)await db.prepare('INSERT INTO security_attempts(key,count,until_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=1,until_at=excluded.until_at').run(key,now+900000);else await db.prepare('UPDATE security_attempts SET count=count+1 WHERE key=?').run(key)}})}
 async function clearRate(req,email,purpose){for(const {key} of rateKeys(req,email,purpose))await db.prepare('DELETE FROM security_attempts WHERE key=?').run(key)}
 function key(create=false){const file=join(store.dir,'security.key');if(!existsSync(file)&&create){try{writeFileSync(file,randomBytes(32),{mode:0o600,flag:'wx'})}catch(error){if(error.code!=='EEXIST')throw error}}try{const bytes=readFileSync(file);if(bytes.length!==32)throw Error();return bytes}catch{fail(503,'2FA şifreleme anahtarı okunamadı. Sunucudaki security.key yedeğini kontrol edin.')}}
 async function mfa(userId){return await db.prepare('SELECT * FROM security_mfa WHERE user_id=?').get(userId)}
 async function trustedDevice(req,user,state){
  const tokens=[...String(req.headers.cookie||'').matchAll(new RegExp('(?:^|;\\s*)(?:sw_device_v2_'+user.id+'|sw_device_v2|sw_device)=([a-f0-9]{64})(?=;|$)','g'))].map(match=>match[1]).slice(0,8),info=identity(req);
  let best=null;for(const token of tokens){const row=await db.prepare('SELECT * FROM security_devices WHERE token=? AND user_id=?').get(hash(token),user.id);if(row&&row.expires>clock()&&row.ip===info.ip&&constantEqual(row.agent,hash(info.agent))&&constantEqual(row.password_hash,hash(user.password))&&state?.enabled&&constantEqual(row.factor_hash,hash(state.secret))&&(!best||row.expires>best.expires))best={...row,rawToken:token}}
  return best;
 }
 async function logout(req,res,s){
  const user=await db.prepare('SELECT * FROM cms_users WHERE email=?').get(s.email),device=user&&await trustedDevice(req,user,await mfa(user.id));
  await db.prepare('DELETE FROM sessions WHERE token=?').run(hash(s.token));
  res.setHeader('Set-Cookie',[sessionCookie('',0),challengeCookie('',0),...(device?[deviceCookie(device.rawToken,Math.max(1,Math.floor((device.expires-clock())/1000)),user.id)]:[])]);
 }
 async function rememberDevice(req,res,user,factorHash){
  const token=randomBytes(32).toString('hex'),info=identity(req);
  await db.transaction(async()=>{const current=await db.prepare('SELECT password FROM cms_users WHERE id=?').get(user.id),state=await mfa(user.id);if(!current||!constantEqual(current.password,user.password)||!state?.enabled||!constantEqual(hash(state.secret),factorHash))fail(401,'Hesap bilgileri değişti. Yeniden giriş yapın.');await db.prepare('INSERT INTO security_devices(token,user_id,password_hash,factor_hash,ip,agent,expires) VALUES(?,?,?,?,?,?,?)').run(hash(token),user.id,hash(user.password),factorHash,info.ip,hash(info.agent),clock()+600000);await db.prepare('DELETE FROM security_devices WHERE user_id=? AND token NOT IN (SELECT token FROM security_devices WHERE user_id=? ORDER BY expires DESC LIMIT 20)').run(user.id,user.id)});
  const previous=res.getHeader('Set-Cookie');res.setHeader('Set-Cookie',[...(Array.isArray(previous)?previous:previous?[previous]:[]),deviceCookie(token,600,user.id)]);
 }
 async function verifyFactor(user,code,type='totp'){
  const state=await mfa(user.id);if(!state?.enabled)return false;
  const normalized=String(code||'').replace(/\s+/g,''),recovery=JSON.parse(state.recovery),candidate=recoveryHash(normalized),index=recovery.findIndex(value=>constantEqual(value,candidate));
  if(type==='recovery'){if(!/^(?:[a-f0-9]{4}-){4}[a-f0-9]{4}$/i.test(normalized)&&! /^[a-f0-9]{20}$/i.test(normalized))return false;if(index<0)return false;recovery.splice(index,1);await db.prepare('UPDATE security_mfa SET recovery=? WHERE user_id=?').run(JSON.stringify(recovery),user.id);return 'recovery'}
  if(type!=='totp'||!/^\d{6}$/.test(normalized))return false;
  const counter=matchingCounter(decryptSecret(state.secret,key()),normalized,clock(),state.last_counter);
  if(counter===null)return false;await db.prepare('UPDATE security_mfa SET last_counter=? WHERE user_id=?').run(counter,user.id);return 'totp';
 }
 const rawSession=store.session;
 async function session(req){
  const row=await rawSession(req);if(!row)return null;
  const idle=row.role==='root'?rootIdle:adminIdle;
  if(row.last_seen+idle<=clock()){
   await db.prepare('DELETE FROM sessions WHERE token=?').run(hash(row.token));await audit(req,'session.idle_expired','success',row.email);return null;
  }
  if(row.role==='root'||row.role==='admin'){
   const user=await db.prepare('SELECT id FROM cms_users WHERE email=?').get(row.email),state=user&&await mfa(user.id);
   if(!user||state?.enabled&&!row.mfa_verified){await db.prepare('DELETE FROM sessions WHERE token=?').run(hash(row.token));return null}
  }
  return row;
 }
 store.session=session;
 async function touch(s){if(clock()-s.last_seen>=15000){await db.prepare('UPDATE sessions SET last_seen=? WHERE token=?').run(clock(),hash(s.token));s.last_seen=clock()}}
 function recent(s){if(s.reauth_at+proofLifetime<=clock())fail(428,'Bu işlem için kimliğinizi yeniden doğrulayın.')}
 async function authorize(req,mutation=false,rootOnly=false){const s=await session(req);if(!s)fail(401,'Oturum açmanız gerekiyor.');req.securitySession=s;const user=await db.prepare('SELECT id FROM cms_users WHERE email=?').get(s.email);if(s.role==='admin'&&!(await mfa(user?.id))?.enabled&&!new URL(req.url,'http://localhost').pathname.startsWith('/api/cms/security/')&&new URL(req.url,'http://localhost').pathname!=='/api/cms/logout')fail(403,'Devam etmeden önce hesabınız için 2FA kurulumunu tamamlayın.');if(rootOnly&&s.role!=='root')fail(403,'Bu bölüm yalnızca root kullanıcısına açıktır.');if(mutation){checkOrigin(req);if(!constantEqual(req.headers['x-csrf-token']||'',s.csrf))fail(403,'Oturum doğrulaması başarısız. Yeniden giriş yapın.');await touch(s)}return s}
 async function issueSession(req,res,user,{verified=false,factorHash='',created=clock(),lastSeen=clock(),remember=false}={}){
  const token=randomBytes(32).toString('hex'),csrf=randomBytes(32).toString('hex'),info=identity(req),expires=created+lifetime,deviceToken=remember?randomBytes(32).toString('hex'):null;
  await db.transaction(async()=>{
   const current=await db.prepare('SELECT * FROM cms_users WHERE id=?').get(user.id);
   if(!current||current.email!==user.email||current.role!==user.role||!constantEqual(current.password,user.password)||expires<=clock())fail(401,'Hesap bilgileri değişti. Yeniden giriş yapın.');
   const state=await mfa(user.id);if(state?.enabled&&(!verified||!factorHash||!constantEqual(hash(state.secret),factorHash)))fail(401,'2FA ayarları değişti. Yeniden giriş yapın.');
   await db.prepare('INSERT INTO sessions(token,csrf,expires,email,role,created_at,last_seen,reauth_at,mfa_verified,ip,agent) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(hash(token),csrf,expires,user.email,user.role,created,lastSeen,clock(),verified?1:0,info.ip,info.agent);
   if(deviceToken){await db.prepare('INSERT INTO security_devices(token,user_id,password_hash,factor_hash,ip,agent,expires) VALUES(?,?,?,?,?,?,?)').run(hash(deviceToken),user.id,hash(user.password),factorHash,info.ip,hash(info.agent),clock()+600000);await db.prepare('DELETE FROM security_devices WHERE user_id=? AND token NOT IN (SELECT token FROM security_devices WHERE user_id=? ORDER BY expires DESC LIMIT 20)').run(user.id,user.id)}
  });
  res.setHeader('Set-Cookie',[sessionCookie(token,Math.max(0,Math.floor((expires-clock())/1000))),challengeCookie('',0),...(deviceToken?[deviceCookie(deviceToken,600,user.id)]:[])]);
  return {authenticated:true,csrf,email:user.email,role:user.role,mfaEnrollmentRequired:user.role==='admin'&&!(await mfa(user.id))?.enabled};
 }
 async function login(req,res,{email,password}={}){
  checkOrigin(req);if(typeof email!=='string'||email.length>254||typeof password!=='string'||password.length>256)fail(400,'Geçersiz giriş bilgileri.');email=email.trim().toLowerCase();
  await checkRate(req,email,'login');if(hashing>=2){res.setHeader('Retry-After','2');fail(429,'Giriş işlemi sürüyor. Biraz sonra tekrar deneyin.')}
  let user,valid=false;hashing++;try{user=await db.prepare('SELECT * FROM cms_users WHERE email=?').get(email);valid=await checkPassword(password,user?.password)}finally{hashing--}
  if(!user||!valid){await failedAttempt(req,email,'login');await audit(req,'auth.password_failed','failure',email);fail(401,'E-posta veya şifre hatalı.')}
  await clearRate(req,email,'login');
  const old=await rawSession(req);if(old)await db.prepare('DELETE FROM sessions WHERE token=?').run(hash(old.token));
  const state=await mfa(user.id);
  if(state?.enabled){
   const device=await trustedDevice(req,user,state),info=identity(req);
   if(device){const result=await issueSession(req,res,user,{verified:true,factorHash:hash(state.secret)});res.setHeader('Set-Cookie',[...res.getHeader('Set-Cookie'),deviceCookie(device.rawToken,Math.max(1,Math.floor((device.expires-clock())/1000)),user.id)]);await audit(req,'auth.device_login','success',email);return result}
   const token=randomBytes(32).toString('hex');await db.transaction(async()=>{await db.prepare('DELETE FROM security_challenges WHERE user_id=?').run(user.id);await db.prepare('INSERT INTO security_challenges(token,user_id,password_hash,expires,ip,agent,tries) VALUES(?,?,?,?,?,?,0)').run(hash(token),user.id,hash(user.password),clock()+300000,info.ip,hash(info.agent))});res.setHeader('Set-Cookie',[challengeCookie(token,300),sessionCookie('',0)]);await audit(req,'auth.mfa_challenge','success',email);return {authenticated:false,mfaRequired:true}}
  const result=await issueSession(req,res,user);await audit(req,'auth.login','success',email);return result;
 }
 async function finishLogin(req,res,code,type='totp'){
  checkOrigin(req);const token=/\bsw_mfa=([a-f0-9]{64})\b/.exec(req.headers.cookie||'')?.[1];if(!token)fail(401,'Doğrulama süresi doldu. Şifrenizle yeniden giriş yapın.');
  const result=await db.transaction(async()=>{
   const row=await db.prepare('SELECT * FROM security_challenges WHERE token=?').get(hash(token)),info=identity(req);
   if(!row||row.expires<=clock()||row.tries>=5||row.ip!==info.ip||!constantEqual(row.agent,hash(info.agent)))return {expired:true};
   const user=await db.prepare('SELECT * FROM cms_users WHERE id=?').get(row.user_id);if(!user||!constantEqual(row.password_hash,hash(user.password)))return {expired:true};
   await checkRate(req,user.email,'mfa');const verified=await verifyFactor(user,code,type);
   if(!verified){await db.prepare('UPDATE security_challenges SET tries=tries+1 WHERE token=?').run(hash(token));await failedAttempt(req,user.email,'mfa');await audit(req,'auth.mfa_failed','failure',user.email);return {wrong:true}}
   await db.prepare('DELETE FROM security_challenges WHERE token=?').run(hash(token));await clearRate(req,user.email,'mfa');return {user,method:verified,factorHash:hash((await mfa(user.id)).secret)};
  });
  if(result.expired)fail(401,'Doğrulama süresi doldu. Şifrenizle yeniden giriş yapın.');if(result.wrong)fail(400,'Doğrulama kodu geçersiz veya daha önce kullanılmış.');
  const auth=await issueSession(req,res,result.user,{verified:true,factorHash:result.factorHash,remember:true});await audit(req,result.method==='recovery'?'auth.recovery_login':'auth.login','success',result.user.email);return auth;
 }
 async function reauthenticate(req,res,s,{password,code,type='totp'}){
  const user=await db.prepare('SELECT * FROM cms_users WHERE email=?').get(s.email);await checkRate(req,s.email,'reauth');
  if(typeof password!=='string'||password.length>256)fail(400,'Geçersiz doğrulama bilgileri.');if(hashing>=2)fail(429,'Doğrulama işlemi sürüyor. Biraz sonra tekrar deneyin.');
  hashing++;let valid;try{valid=await checkPassword(password,user?.password)}finally{hashing--}
  let verified=false,usedMfa=false,factorHash='';
  if(valid&&user){await db.transaction(async()=>{const state=await mfa(user.id);usedMfa=Boolean(state?.enabled);verified=usedMfa?await verifyFactor(user,code,type):true;if(usedMfa&&verified)factorHash=hash(state.secret)})}
  if(!valid||!verified){await failedAttempt(req,s.email,'reauth');await audit(req,'auth.reauth_failed','failure',s.email);fail(400,'Kimlik doğrulanamadı. Şifrenizi ve gerekiyorsa doğrulama kodunuzu kontrol edin.')}
  await db.prepare('DELETE FROM sessions WHERE token=?').run(hash(s.token));await clearRate(req,s.email,'reauth');const result=await issueSession(req,res,user,{verified:usedMfa,remember:usedMfa,factorHash,created:s.created_at,lastSeen:clock()});await audit(req,'auth.reauthenticated','success',s.email);return result;
 }
 async function status(req,s){const user=await db.prepare('SELECT id FROM cms_users WHERE email=?').get(s.email),state=user&&await mfa(user.id);return {authenticated:true,csrf:s.csrf,email:s.email,role:s.role,serverTime:clock(),idleExpires:s.last_seen+(s.role==='root'?rootIdle:adminIdle),expires:s.expires,reauthUntil:s.reauth_at+proofLifetime,mfaEnabled:Boolean(state?.enabled),mfaRequired:true,mfaEnrollmentRequired:s.role==='admin'&&!state?.enabled,recoveryRemaining:state?JSON.parse(state.recovery).length:0}}
 async function handle(req,res,path,method,readBody,send){
  if(!path.startsWith('/api/cms/security/'))return false;
  if(path==='/api/cms/security/mfa/login'&&method==='POST'){const b=await readBody(req);send(res,200,await finishLogin(req,res,b.code,b.type));return true}
  const mutation=!['GET','HEAD'].includes(method),s=await authorize(req,mutation),user=await db.prepare('SELECT * FROM cms_users WHERE email=?').get(s.email);
  if(path==='/api/cms/security/status'&&method==='GET'){send(res,200,await status(req,s));return true}
  if(path==='/api/cms/security/activity'&&method==='POST'){await db.prepare('UPDATE sessions SET last_seen=? WHERE token=?').run(clock(),hash(s.token));s.last_seen=clock();send(res,200,await status(req,s));return true}
  if(path==='/api/cms/security/reauth'&&method==='POST'){send(res,200,await reauthenticate(req,res,s,await readBody(req)));return true}
  const ownMfa=await mfa(user.id),enrolling=s.role==='admin'&&!ownMfa?.enabled;
  if(s.role==='admin'&&!(enrolling&&['/api/cms/security/mfa/setup','/api/cms/security/mfa/confirm'].includes(path))){await audit(req,'authorization.denied','blocked',s.email,{path});fail(403,'Güvenlik ayarlarınızı root kullanıcısı yönetir.');}
  if(path==='/api/cms/security/users'&&method==='GET'){
   const rows=await db.prepare("SELECT u.id,u.email,m.enabled,m.recovery FROM cms_users u LEFT JOIN security_mfa m ON m.user_id=u.id WHERE u.role='admin' ORDER BY u.email").all();send(res,200,{items:rows.map(row=>({id:row.id,email:row.email,mfaEnabled:Boolean(row.enabled),recoveryRemaining:JSON.parse(row.recovery||'[]').length}))});return true;
  }
  const userAction=/^\/api\/cms\/security\/users\/(\d+)\/(reset|revoke)$/.exec(path);
  if(userAction&&method==='POST'){
   recent(s);const target=await db.prepare("SELECT id,email FROM cms_users WHERE id=? AND role='admin'").get(Number(userAction[1]));if(!target)fail(404,'Admin hesabı bulunamadı.');const b=await readBody(req);if(b.email!==target.email)fail(400,'Hesap doğrulanamadı.');
   await db.transaction(async()=>{if(userAction[2]==='reset')await db.prepare("UPDATE security_mfa SET enabled=0,secret=NULL,pending_secret=NULL,pending_until=0,recovery='[]',last_counter=-1 WHERE user_id=?").run(target.id);await db.prepare('DELETE FROM security_devices WHERE user_id=?').run(target.id);await db.prepare('DELETE FROM security_challenges WHERE user_id=?').run(target.id);await db.prepare('DELETE FROM sessions WHERE email=?').run(target.email)});
   await audit(req,userAction[2]==='reset'?'mfa.admin_reset':'session.admin_revoked','success',s.email,{target:target.email});send(res,200,{ok:true});return true;
  }
  if(path==='/api/cms/security/sessions'&&method==='GET'){
   const rows=s.role==='root'?await db.prepare('SELECT token,email,role,created_at,last_seen,expires,ip,agent FROM sessions WHERE expires>? ORDER BY last_seen DESC LIMIT 200').all(clock()):await db.prepare('SELECT token,email,role,created_at,last_seen,expires,ip,agent FROM sessions WHERE expires>? AND email=? ORDER BY last_seen DESC LIMIT 200').all(clock(),s.email);
   send(res,200,{items:rows.filter(row=>row.last_seen+(row.role==='root'?rootIdle:adminIdle)>clock()).map(row=>({...row,id:row.token,token:undefined,current:constantEqual(row.token,hash(s.token))}))});return true;
  }
  if(path==='/api/cms/security/sessions/revoke'&&method==='POST'){
   recent(s);const b=await readBody(req);let count=0;
   if(b.others===true){if(s.role==='root')await db.exec('DELETE FROM security_devices');else await db.prepare('DELETE FROM security_devices WHERE user_id=?').run(user.id);const rows=s.role==='root'?await db.prepare('SELECT token,email FROM sessions WHERE token<>?').all(hash(s.token)):await db.prepare('SELECT token,email FROM sessions WHERE email=? AND token<>?').all(s.email,hash(s.token));for(const row of rows){await db.prepare('DELETE FROM sessions WHERE token=?').run(row.token);await db.prepare('DELETE FROM security_devices WHERE user_id IN (SELECT id FROM cms_users WHERE email=?)').run(row.email);count++}}
   else{if(typeof b.id!=='string'||! /^[a-f0-9]{64}$/.test(b.id))fail(400,'Geçersiz oturum.');const target=await db.prepare('SELECT email FROM sessions WHERE token=?').get(b.id);if(!target||s.role!=='root'&&target.email!==s.email)fail(404,'Oturum bulunamadı.');if(constantEqual(b.id,hash(s.token)))fail(400,'Bu oturum için Çıkış düğmesini kullanın.');count=(await db.prepare('DELETE FROM sessions WHERE token=?').run(b.id)).changes;await db.prepare('DELETE FROM security_devices WHERE user_id IN (SELECT id FROM cms_users WHERE email=?)').run(target.email)}
   await audit(req,'session.revoked','success',s.email,{target:b.others?'others':b.id});send(res,200,{revoked:count});return true;
  }
  if(s.role!=='root'&&!path.startsWith('/api/cms/security/mfa/')){await audit(req,'authorization.denied','blocked',s.email,{path});fail(403,'Bu bölüm yalnızca root kullanıcısına açıktır.');}
  if(path==='/api/cms/security/events'&&method==='GET'){
   const url=new URL(req.url,'http://localhost'),before=Number(url.searchParams.get('before'))||Number.MAX_SAFE_INTEGER,filter=String(url.searchParams.get('filter')||'').slice(0,80),needle='%'+filter+'%',clauses=['id<?','(LOWER(actor) LIKE LOWER(?) OR LOWER(action) LIKE LOWER(?) OR ip LIKE ?)'],params=[before,needle,needle,needle];
   const category=url.searchParams.get('category')||'',result=url.searchParams.get('result')||'',actor=url.searchParams.get('actor')||'',ip=url.searchParams.get('ip')||'';
   const groups={auth:['auth.'],mfa:['mfa.'],session:['session.'],content:['content.','history.'],settings:['mail.','google.','user.','media.'],denied:['authorization.']};
   if(Object.hasOwn(groups,category)){clauses.push('('+groups[category].map(()=> 'action LIKE ?').join(' OR ')+')');params.push(...groups[category].map(prefix=>prefix+'%'))}
   if(['success','failure','blocked'].includes(result)){clauses.push('result=?');params.push(result)}
   const action=url.searchParams.get('action');if(action){clauses.push('action=?');params.push(action.slice(0,80))}
   if(actor){clauses.push('LOWER(actor) LIKE LOWER(?)');params.push('%'+actor.slice(0,254)+'%')}
   if(ip){clauses.push('ip=?');params.push(ip.slice(0,64))}
   for(const [name,operator] of [['from','>='],['to','<=']]){const raw=url.searchParams.get(name),stamp=raw&&Number(raw);if(stamp&&Number.isFinite(stamp)){clauses.push('created'+operator+'?');params.push(stamp)}}
   const rows=await db.prepare('SELECT id,created,actor,action,result,ip,agent,detail FROM security_events WHERE '+clauses.join(' AND ')+' ORDER BY id DESC LIMIT 51').all(...params);send(res,200,{items:rows.slice(0,50),hasMore:rows.length>50});return true;
  }
  if(path==='/api/cms/security/mfa/setup'&&method==='POST'){
   recent(s);const state=await mfa(user.id);if(state?.enabled&&!existsSync(join(store.dir,'security.key')))fail(503,'2FA anahtarını yedekten geri yükleyin veya sunucudan güvenli 2FA sıfırlaması yapın.');
   const secret=base32(randomBytes(20)),encrypted=encryptSecret(secret,key(true));await db.prepare("INSERT INTO security_mfa(user_id,pending_secret,pending_until) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET pending_secret=excluded.pending_secret,pending_until=excluded.pending_until").run(user.id,encrypted,clock()+600000);
   await audit(req,'mfa.setup_started','success',s.email);send(res,200,{secret,uri:'otpauth://totp/'+encodeURIComponent('ScadaWatt:'+s.email)+'?secret='+secret+'&issuer=ScadaWatt&algorithm=SHA1&digits=6&period=30'});return true;
  }
  if(path==='/api/cms/security/mfa/confirm'&&method==='POST'){
   recent(s);const b=await readBody(req);await checkRate(req,s.email,'setup');const codes=newRecoveryCodes();
   const valid=await db.transaction(async()=>{const state=await mfa(user.id);if(!state?.pending_secret||state.pending_until<=clock())return false;const secret=decryptSecret(state.pending_secret,key()),counter=matchingCounter(secret,b.code,clock());if(counter===null){await failedAttempt(req,s.email,'setup');return false}await db.prepare("UPDATE security_mfa SET enabled=1,secret=pending_secret,pending_secret=NULL,pending_until=0,recovery=?,last_counter=? WHERE user_id=?").run(JSON.stringify(codes.map(recoveryHash)),counter,user.id);await db.prepare('DELETE FROM sessions WHERE email=? AND token<>?').run(s.email,hash(s.token));await db.prepare('DELETE FROM security_devices WHERE user_id=?').run(user.id);await db.prepare('UPDATE sessions SET mfa_verified=1 WHERE token=?').run(hash(s.token));await db.prepare('DELETE FROM security_challenges WHERE user_id=?').run(user.id);return hash(state.pending_secret)});
   if(!valid){await audit(req,'mfa.setup_failed','failure',s.email);fail(400,'Kod geçersiz veya kurulum süresi dolmuş. Yeni kodla tekrar deneyin.')}
   await rememberDevice(req,res,user,valid);await clearRate(req,s.email,'setup');await audit(req,'mfa.enabled','success',s.email);send(res,200,{enabled:true,recoveryCodes:codes});return true;
  }
  if(path==='/api/cms/security/mfa/recovery'&&method==='POST'){
   recent(s);if(!(await mfa(user.id))?.enabled)fail(400,'Önce 2FA kurulumunu tamamlayın.');const codes=newRecoveryCodes();await db.prepare('DELETE FROM security_devices WHERE user_id=?').run(user.id);await db.prepare('UPDATE security_mfa SET recovery=? WHERE user_id=?').run(JSON.stringify(codes.map(recoveryHash)),user.id);await audit(req,'mfa.recovery_regenerated','success',s.email);send(res,200,{recoveryCodes:codes});return true;
  }
  fail(404,'Güvenlik işlemi bulunamadı.');
 }
 async function auditRequest(req,res){
  const path=new URL(req.url,'http://localhost').pathname;if(!path.startsWith('/api/cms/')||path.startsWith('/api/cms/security/')||path==='/api/cms/login'||['GET','HEAD'].includes(req.method))return;
  const actor=req.securitySession?.email||'';
  if(res.statusCode===403){await audit(req,'authorization.denied','blocked',actor,{path});return}
  if(res.statusCode<200||res.statusCode>=300)return;
  const labels=[[/\/logout$/,'auth.logout'],[/\/publish$/,'content.published'],[/\/draft$/,'content.draft_saved'],[/\/approvals\/\d+$/,'content.approval_reviewed'],[/\/approvals$/,'content.approval_requested'],[/\/users/,'user.changed'],[/\/mail/,'mail.settings_changed'],[/\/google/,'google.settings_changed'],[/\/media/,'media.changed'],[/\/history/,'history.changed']];
  const label=labels.find(([pattern])=>pattern.test(path))?.[1];if(label)await audit(req,label,'success',actor,{path,...req.securityDetail});
 }
 const purgeTimer=setInterval(()=>void purge().catch(()=>console.error('Güvenlik kayıtları temizlenemedi.')),3600000);purgeTimer.unref();
 const observe=(req,res)=>{const work=auditRequest(req,res).catch(()=>console.error('Güvenlik işlem kaydı yazılamadı.'));pendingAudits.add(work);void work.finally(()=>pendingAudits.delete(work));};
 return {login,logout,session,authorize,touch,recent,handle,status,audit,auditRequest,observe,identity,purge,close:async()=>{clearInterval(purgeTimer);await Promise.allSettled([...pendingAudits])}};
}
