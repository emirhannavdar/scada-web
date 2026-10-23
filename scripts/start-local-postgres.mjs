import net from 'node:net';
import {existsSync,readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
export function localTarget(env=process.env,platform=process.platform){
 if(platform!=='win32'||env.PG_AUTOSTART==='0'||!env.DATABASE_URL)return null;
 let url;try{url=new URL(env.DATABASE_URL)}catch{throw Error('DATABASE_URL geçerli değil. .env ayarını kontrol edin.')}
 if(!['postgres:','postgresql:'].includes(url.protocol)||!['localhost','127.0.0.1','[::1]','::1'].includes(url.hostname))return null;
 return {host:url.hostname.replace(/^\[|\]$/g,''),port:Number(url.port||5432)};
}
async function reachable({host,port}){return new Promise(resolve=>{const socket=net.connect({host,port});let done=false;const finish=value=>{if(done)return;done=true;socket.destroy();resolve(value)};socket.setTimeout(1000,()=>finish(false));socket.on('connect',()=>finish(true));socket.on('error',()=>finish(false))})}
function run(file,args){return new Promise(resolve=>{let settled=false;const child=spawn(file,args,{windowsHide:true,stdio:'ignore'}),timer=setTimeout(()=>{child.kill();finish(-1)},45000);function finish(code){if(settled)return;settled=true;clearTimeout(timer);resolve(code)}child.once('error',()=>finish(-1));child.once('exit',code=>finish(code??-1))})}
export async function startLocalPostgres({env=process.env,platform=process.platform,probe=reachable,execute=run,exists=existsSync,read=readFileSync}={}){
 const target=localTarget(env,platform);if(!target)return;
 if(await probe(target)){console.log('PostgreSQL zaten çalışıyor.');return}
 const roots=[env.ProgramFiles||'C:/Program Files','C:/Program Files'],candidates=[];
 if(env.PG_CTL_PATH&&env.PG_DATA_DIR)candidates.push({binary:resolve(env.PG_CTL_PATH),data:resolve(env.PG_DATA_DIR)});
 else if(env.PG_CTL_PATH||env.PG_DATA_DIR)throw Error('Özel kurulum için PG_CTL_PATH ve PG_DATA_DIR ayarlarını birlikte girin.');
 else for(const version of [18,17,16,15,14])for(const root of roots)candidates.push({binary:join(root,'PostgreSQL',String(version),'bin','pg_ctl.exe'),data:join(root,'PostgreSQL',String(version),'data'),version});
 const candidate=candidates.find(item=>exists(item.binary)&&exists(join(item.data,'PG_VERSION'))&&(!item.version||String(read(join(item.data,'PG_VERSION'),'utf8')).trim()===String(item.version)));
 if(!candidate)throw Error('Yerel PostgreSQL kurulumu bulunamadı. .env içine PG_CTL_PATH ve PG_DATA_DIR yollarını girin.');
 const log=join(env.TEMP||tmpdir(),'scadawatt-postgres.log');
 // A running cluster may be on another port: never restart it or change its configuration.
 if(await execute(candidate.binary,['status','-D',candidate.data])===0)throw Error('PostgreSQL çalışıyor ancak DATABASE_URL adresine erişilemiyor. .env içindeki host/port ile PostgreSQL portunu kontrol edin.');
 console.log('Yerel PostgreSQL başlatılıyor…');
 const result=await execute(candidate.binary,['start','-D',candidate.data,'-l',log,'-w','-t','30']);
 if(await probe(target)){console.log('PostgreSQL hazır. Site açılıyor.');return}
 throw Error('PostgreSQL otomatik başlatılamadı'+(result===0?' veya farklı portta çalışıyor':'')+'. Kayıt dosyası: '+log+'. Veri klasörü izinlerini kontrol edin.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{await startLocalPostgres()}catch(error){console.error(error.message);process.exitCode=1}}
