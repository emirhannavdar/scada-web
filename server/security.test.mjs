import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {createCmsApp} from './app.mjs';
import {base32,totp,matchingCounter,encryptSecret,decryptSecret,proxyPolicy,clientIp,recoveryHash} from './security-core.mjs';
const password='Test-Root-Password-2026!';
async function fixture(){
 const dir=mkdtempSync(join(tmpdir(),'scadawatt-security-'));let now=Date.now();
 const app=await createCmsApp({dataDir:dir,securityClock:()=>now});await app.store.createAdmin('root@example.test',password);await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+app.server.address().port,jar=new Map();let csrf='';
 async function call(path,{method='GET',body,headers={},cookie,token=csrf}={}){
  const response=await fetch(base+path,{method,headers:{Origin:base,'User-Agent':'Security Test','X-Real-IP':'203.0.113.10',...(method!=='GET'?{'Content-Type':'application/json','X-CSRF-Token':token}:{}),Cookie:cookie??[...jar].map(([k,v])=>k+'='+v).join('; '),...headers},...(body!==undefined?{body:JSON.stringify(body)}:{})});
  for(const value of response.headers.getSetCookie()){const pair=value.split(';')[0],i=pair.indexOf('=');if(/Max-Age=0(?:;|$)/.test(value))jar.delete(pair.slice(0,i));else jar.set(pair.slice(0,i),pair.slice(i+1))}
  const data=await response.json();if(data.authenticated&&data.csrf)csrf=data.csrf;return {response,data};
 }
 const login=(email='root@example.test',pw=password,headers={})=>call('/api/cms/login',{method:'POST',body:{email,password:pw},headers});
 async function enroll(){await login();const setup=await call('/api/cms/security/mfa/setup',{method:'POST',body:{}});assert.equal(setup.response.status,200);const confirm=await call('/api/cms/security/mfa/confirm',{method:'POST',body:{code:totp(setup.data.secret,Math.floor(now/30000))}});assert.equal(confirm.response.status,200);return {...setup.data,...confirm.data}}
 return {...app,dir,call,login,enroll,jar,now:()=>now,advance:ms=>{now+=ms},close:async()=>{await new Promise(resolve=>app.server.close(resolve));await app.store.close();rmSync(dir,{recursive:true,force:true})}};
}
test('TOTP matches the RFC vector, rejects replay, and authenticated encryption detects changes',()=>{
 const secret=base32(Buffer.from('12345678901234567890'));assert.equal(totp(secret,1),'287082');assert.equal(totp(secret,37037036),'081804');assert.equal(matchingCounter(secret,'287082',59000),1);assert.equal(matchingCounter(secret,'287082',59000,1),null);assert.equal(matchingCounter(secret,'123',59000),null);
 const key=randomBytes(32),encrypted=encryptSecret(secret,key);assert.equal(decryptSecret(encrypted,key),secret);assert.throws(()=>decryptSecret(encrypted,randomBytes(32)));
});
test('proxy addresses are trusted only behind explicitly trusted peers, including IPv6',()=>{
 const req=(peer,forwarded,real)=>({socket:{remoteAddress:peer},headers:{...(forwarded?{'x-forwarded-for':forwarded}:{}),...(real?{'x-real-ip':real}:{})}});
 assert.equal(clientIp(req('198.51.100.1','1.2.3.4')), '198.51.100.1');assert.equal(clientIp(req('::ffff:127.0.0.1','1.1.1.1, 203.0.113.2')),'203.0.113.2');assert.equal(clientIp(req('127.0.0.1',undefined,'203.0.113.9')),'203.0.113.9');
 assert.equal(clientIp(req('10.0.0.2','198.51.100.9, 10.0.0.3'),proxyPolicy('10.0.0.0/24')),'198.51.100.9');assert.equal(clientIp(req('::1','bad value')),'::1');assert.throws(()=>proxyPolicy('0.0.0.0/99'));
});
test('existing users migrate without MFA lockout; successful logins ignore old global counters',async()=>{
 const f=await fixture();try{
  await f.store.db.prepare("INSERT INTO attempts(key,count,until_at) VALUES('login:all',100,?)").run(f.now()+900000);
  for(let i=0;i<3;i++)assert.equal((await f.login()).response.status,200);
  assert.equal((await f.store.db.prepare('SELECT count(*) AS n FROM security_attempts').get()).n,0);
  const state=await f.call('/api/cms/security/status');assert.equal(state.data.mfaEnabled,false);assert.equal(state.data.role,'root');assert.equal(state.data.mfaRequired,true);
  assert.equal((await f.call('/api/cms/security/mfa/setup',{method:'POST',body:{},token:'wrong'})).response.status,403);
 }finally{await f.close()}
});
test('password failures are account-scoped and expire without locking unrelated users',async()=>{
 const f=await fixture();try{
  const failed=await f.login('root@example.test','incorrect password');assert.equal(failed.response.status,401);
  const rows=await f.store.db.prepare('SELECT * FROM security_attempts').all();assert.equal(rows.length,2);assert(rows.every(row=>row.count===1));
  const account=rows.find(row=>row.key.startsWith('login:account:'));await f.store.db.prepare('UPDATE security_attempts SET count=10 WHERE key=?').run(account.key);
  assert.equal((await f.login('root@example.test',password,{'X-Real-IP':'203.0.113.11'})).response.status,429);
  await f.store.upsertUser('admin@example.test','Test-Editor-Password!','admin');assert.equal((await f.login('admin@example.test','Test-Editor-Password!')).response.status,200);
  f.advance(900001);assert.equal((await f.login()).response.status,200);
 }finally{await f.close()}
});
test('MFA stays inactive until confirmation, then requires a non-replayed code and encrypts its seed',async()=>{
 const f=await fixture();try{
  await f.login();const previousCookie='sw_admin='+f.jar.get('sw_admin');await f.call('/api/cms/login',{method:'POST',cookie:'',body:{email:'root@example.test',password}});const first=await f.call('/api/cms/security/mfa/setup',{method:'POST',body:{}});assert.equal((await f.call('/api/cms/security/status')).data.mfaEnabled,false);
  assert.equal((await f.call('/api/cms/security/mfa/confirm',{method:'POST',body:{code:'bad'}})).response.status,400);
  const confirmed=await f.call('/api/cms/security/mfa/confirm',{method:'POST',body:{code:totp(first.data.secret,Math.floor(f.now()/30000))}});assert.equal(confirmed.response.status,200);assert.equal(confirmed.data.recoveryCodes.length,10);assert.equal((await f.call('/api/cms/security/status',{cookie:previousCookie})).response.status,401);
  assert(existsSync(join(f.dir,'security.key')));assert.equal(readFileSync(join(f.dir,'security.key')).length,32);
  const row=await f.store.db.prepare('SELECT * FROM security_mfa').get();assert(!row.secret.includes(first.data.secret));assert(!row.recovery.includes(confirmed.data.recoveryCodes[0]));
  const partial=await f.login();assert.equal(partial.data.authenticated,false);assert.equal(partial.data.mfaRequired,true);assert(!f.jar.has('sw_admin'));assert.equal((await f.call('/api/cms/workspace')).response.status,401);
  assert.equal((await f.call('/api/cms/security/mfa/login',{method:'POST',body:{code:totp(first.data.secret,Math.floor(f.now()/30000))}})).response.status,400);
  f.advance(30000);const verified=await f.call('/api/cms/security/mfa/login',{method:'POST',body:{code:totp(first.data.secret,Math.floor(f.now()/30000))}});assert.equal(verified.response.status,200);assert.equal(verified.data.authenticated,true);
  assert.equal((await f.call('/api/cms/security/status')).data.mfaEnabled,true);
 }finally{await f.close()}
});
test('recovery codes are single-use and challenge validation cannot be bypassed',async()=>{
 const f=await fixture();try{
  const enrolled=await f.enroll();await f.login();assert.equal((await f.call('/api/cms/security/mfa/login',{method:'POST',body:{code:enrolled.recoveryCodes[0]}})).response.status,200);
  assert.equal((await f.call('/api/cms/security/status')).data.recoveryRemaining,9);
  await f.login();assert.equal((await f.call('/api/cms/security/mfa/login',{method:'POST',body:{code:enrolled.recoveryCodes[0]}})).response.status,400);
  f.advance(300001);assert.equal((await f.call('/api/cms/security/mfa/login',{method:'POST',body:{code:enrolled.recoveryCodes[1]}})).response.status,401);
  const row=await f.store.db.prepare('SELECT recovery FROM security_mfa').get();assert.equal(JSON.parse(row.recovery).includes(recoveryHash(enrolled.recoveryCodes[1])),true);
  await f.login();await f.store.upsertUser('root@example.test','Changed-Root-Password!','root');assert.equal((await f.call('/api/cms/security/mfa/login',{method:'POST',body:{code:enrolled.recoveryCodes[1]}})).response.status,401);
 }finally{await f.close()}
});
test('root inactivity expires sessions; recent authentication is required and rotates the token',async()=>{
 const f=await fixture();try{
  await f.login();const old='sw_admin='+f.jar.get('sw_admin');f.advance(300001);
  assert.equal((await f.call('/api/cms/security/mfa/setup',{method:'POST',body:{}})).response.status,428);
  const renewed=await f.call('/api/cms/security/reauth',{method:'POST',body:{password}});assert.equal(renewed.response.status,200);assert.notEqual(old,'sw_admin='+f.jar.get('sw_admin'));
  assert.equal((await f.call('/api/cms/security/status',{cookie:old})).response.status,401);
  f.advance(14*60000);assert.equal((await f.call('/api/cms/security/status')).response.status,200);
  await f.call('/api/cms/security/activity',{method:'POST',body:{}});f.advance(14*60000);assert.equal((await f.call('/api/cms/security/status')).response.status,200);
  f.advance(60001);assert.equal((await f.call('/api/cms/security/status')).response.status,401);
 }finally{await f.close()}
});
test('admins cannot access root MFA/audit or other users sessions; root can revoke sessions',async()=>{
 const f=await fixture();try{
  await f.login();const rootCookie='sw_admin='+f.jar.get('sw_admin');const rootSessions=(await f.call('/api/cms/security/sessions')).data.items;assert.equal(rootSessions.length,1);assert(!('token'in rootSessions[0]));
  await f.store.upsertUser('admin@example.test','Test-Editor-Password!','admin');await f.call('/api/cms/login',{method:'POST',cookie:'',body:{email:'admin@example.test',password:'Test-Editor-Password!'}});
  for(const path of ['events','mfa/setup'])assert.equal((await f.call('/api/cms/security/'+path,path==='events'?{}:{method:'POST',body:{}})).response.status,403);
  const sessions=await f.call('/api/cms/security/sessions');assert(sessions.data.items.every(row=>row.email==='admin@example.test'));
  assert.equal((await f.call('/api/cms/security/sessions/revoke',{method:'POST',body:{id:rootSessions[0].id}})).response.status,404);
  await f.call('/api/cms/login',{method:'POST',cookie:'',body:{email:'root@example.test',password}});const all=(await f.call('/api/cms/security/sessions')).data.items;const admin=all.find(row=>row.role==='admin');assert(admin);assert.equal((await f.call('/api/cms/security/sessions/revoke',{method:'POST',body:{id:admin.id}})).response.status,200);
  assert.equal((await f.call('/api/cms/security/status',{cookie:rootCookie})).response.status,200);
 }finally{await f.close()}
});
test('security history records content operations without passwords, OTPs, seeds or raw tokens',async()=>{
 const f=await fixture();try{
  const enrolled=await f.enroll(),token=f.jar.get('sw_admin'),w=await f.call('/api/cms/workspace?device=desktop');assert.equal(w.response.status,200);
  const save=await f.call('/api/cms/draft',{method:'PUT',body:{device:'desktop',revision:w.data.revision,values:w.data.values,collections:w.data.collections,design:w.data.design}});assert.equal(save.response.status,200);
  await new Promise(resolve=>setTimeout(resolve,50));const log=await f.call('/api/cms/security/events');assert.equal(log.response.status,200);assert(log.data.items.some(row=>row.action==='content.draft_saved'));assert(log.data.items.some(row=>row.action==='mfa.enabled'));
  const serialized=JSON.stringify(log.data);for(const secret of [password,enrolled.secret,...enrolled.recoveryCodes,token])assert(!serialized.includes(secret));
 }finally{await f.close()}
});
