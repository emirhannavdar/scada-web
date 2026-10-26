import {cpSync,mkdirSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {spawn} from 'node:child_process';
const dir=resolve(process.env.CMS_DATA_DIR||'data'),destination=resolve('backups',new Date().toISOString().replace(/[:.]/g,'-'));
try{
 if(!process.env.DATABASE_URL)throw Error('DATABASE_URL eksik.');
 const url=new URL(process.env.DATABASE_URL),password=decodeURIComponent(url.password);url.password='';
 let binary=process.env.PG_DUMP_PATH||'pg_dump';
 if(process.platform==='win32'&&!process.env.PG_DUMP_PATH)for(const version of [18,17,16,15,14]){const candidate=join(process.env.ProgramFiles||'C:/Program Files','PostgreSQL',String(version),'bin','pg_dump.exe');if(existsSync(candidate)){binary=candidate;break}}
 mkdirSync(destination,{recursive:true,mode:0o700});
 await new Promise((ok,fail)=>{const child=spawn(binary,['--format=custom','--no-owner','--no-acl','--schema=scadawatt','--file='+join(destination,'scadawatt.dump'),'--dbname='+url.href],{env:{...process.env,PGPASSWORD:password},stdio:['ignore','ignore','pipe']});child.stderr.resume();child.on('error',()=>fail(Error('pg_dump bulunamadı. PostgreSQL bin klasörünü PATH’e veya PG_DUMP_PATH ayarına ekleyin.')));child.on('close',code=>code===0?ok():fail(Error('PostgreSQL yedeklemesi başarısız. Bağlantıyı ve pg_dump sürümünü kontrol edin.')))});
 if(existsSync(join(dir,'uploads')))cpSync(join(dir,'uploads'),join(destination,'uploads'),{recursive:true});
 for(const name of ['mail.key','google.key','security.key'])if(existsSync(join(dir,name)))cpSync(join(dir,name),join(destination,name));
 console.log('PostgreSQL yedeği, görseller ve şifreleme anahtarları: '+destination);
}catch(error){console.error(error.message);process.exitCode=1}
