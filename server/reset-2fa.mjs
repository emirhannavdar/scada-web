import {createInterface} from 'node:readline/promises';
import {resolve} from 'node:path';
import {openStore} from './store.mjs';
const store=await openStore(resolve(process.env.CMS_DATA_DIR||'data'));
const input=createInterface({input:process.stdin,output:process.stdout});
try{
 const email=(await input.question('2FA sıfırlanacak hesap e-posta: ')).trim().toLowerCase();const root=await store.db.prepare('SELECT id,email FROM cms_users WHERE email=?').get(email);if(!root)throw Error('Kullanıcı bulunamadı.');
 console.log('Bu işlem hesabın 2FA ayarını sıfırlar ve tüm hesabın oturumlarını kapatır. İçerikler silinmez.');
 const confirm=await input.question('Onaylamak için RESET yazın: ');
 if(email!==root.email||confirm!=='RESET')throw Error('Sıfırlama iptal edildi.');
 await store.db.transaction(async()=>{
  await store.db.prepare("UPDATE security_mfa SET enabled=0,secret=NULL,pending_secret=NULL,pending_until=0,recovery='[]',last_counter=-1 WHERE user_id=?").run(root.id);
  await store.db.prepare('DELETE FROM security_devices WHERE user_id=?').run(root.id);
  await store.db.prepare('DELETE FROM sessions WHERE email=?').run(root.email);await store.db.prepare('DELETE FROM security_challenges WHERE user_id=?').run(root.id);
  await store.db.prepare("INSERT INTO security_events(created,actor,action,result,ip,agent,detail) VALUES(?,?,'mfa.reset_cli','success','','server','{}')").run(Date.now(),root.email);
 });
 console.log('2FA sıfırlandı. Hesabınızla giriş yapıp yeni Authenticator kurulumu yapın.');
}catch(error){console.error(error.message);process.exitCode=1}finally{input.close();await store.close()}
