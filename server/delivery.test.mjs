import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createServer} from 'node:net';
import {spawn} from 'node:child_process';
import {openStore} from './store.mjs';
import {prepareLocalData} from './prepare-data.mjs';
test('extracted delivery starts without node_modules and serves site, admin and assets',{skip:!process.env['SCADAWATT_DELIVERY_DIR']},async()=>{
 const root=process.env['SCADAWATT_DELIVERY_DIR'];assert.equal(existsSync(join(root,'node_modules')),false);
 for(const file of ['tsconfig.json','src/main.tsx','src/voyage.css','src/test/setup.ts','src/test/helpers/load-gltf.ts','server/catalog.json','dist/index.html'])assert.equal(existsSync(join(root,file)),true,file);
 const reserve=createServer();await new Promise(r=>reserve.listen(0,'127.0.0.1',r));const port=reserve.address().port;await new Promise(r=>reserve.close(r));
 const dir=mkdtempSync(join(tmpdir(),'sw-delivery-data-'));let logs='';const proc=spawn(process.execPath,['--env-file-if-exists=.env','server/index.mjs'],{cwd:root,env:{...process.env,CMS_DATA_DIR:dir,CMS_PORT:String(port),CMS_HOST:'127.0.0.1',CMS_ORIGIN:'',CMS_COOKIE_SECURE:'0'},stdio:['ignore','pipe','pipe']});
 try{await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Startup timeout: '+logs)),8000);const data=b=>{logs+=b.toString();if(logs.includes('ScadaWatt:')){clearTimeout(timeout);resolve()}};proc.stdout.on('data',data);proc.stderr.on('data',data);proc.on('exit',code=>{clearTimeout(timeout);reject(Error('Unexpected exit '+code+': '+logs))})});const base='http://127.0.0.1:'+port;
 const response=await fetch(base+'/'),html=await response.text();assert.equal(response.status,200);for(const match of html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)){const asset=await fetch(base+match[1]);assert.equal(asset.status,200,match[1])}assert.equal((await fetch(base+'/admin')).status,200);const session=await (await fetch(base+'/api/cms/session')).json();assert.equal(session.setupRequired,true);assert.equal((await fetch(base+'/assets/about-mobile.png',{headers:{Range:'bytes=0-15'}})).status,206);
 }finally{proc.kill('SIGTERM');await new Promise(resolve=>{if(proc.exitCode!==null)resolve();else proc.once('exit',resolve)});rmSync(dir,{recursive:true,force:true})}
});
test('copies an existing V65 account, content and images once using a SQLite backup',async()=>{
 const base=mkdtempSync(join(tmpdir(),'sw-migrate-')),previous=join(base,'scadawatt-v65','data'),current=join(base,'scadawatt-v66');mkdirSync(current,{recursive:true});const old=openStore(previous);let fresh;
 try{await old.createAdmin('previous@example.com','Delivery-Test-Password-5876');old.save(0,{'data.aboutCompany.headline':{tr:'Kayıtlı başlık',en:'Saved heading'}});old.save(old.state().revision,{'data.aboutCompany.headline':{tr:'Mobil kayıt',en:'Mobile content'}},undefined,undefined,'mobile');old.publish(old.state().revision,'Mobil yayın','previous@example.com','mobile');writeFileSync(join(previous,'uploads','example.png'),'test-image');const before=old.state();const target=await prepareLocalData(current,{configured:''});fresh=openStore(target);assert.equal(fresh.db.prepare('SELECT email FROM admin').get().email,'previous@example.com');assert.deepEqual(fresh.state().values,before.values);assert.deepEqual(fresh.state('desktop').values,before.values);assert.deepEqual(fresh.state('mobile').values,old.state('mobile').values);assert.deepEqual(fresh.state('mobile').published,old.state('mobile').published);assert.equal(readFileSync(join(target,'uploads','example.png'),'utf8'),'test-image');assert.deepEqual(old.state(),before);fresh.save(fresh.state().revision,{});await prepareLocalData(current,{configured:''});assert.deepEqual(fresh.state().values,{});assert.deepEqual(old.state(),before);
 }finally{fresh?.close();old.close();rmSync(base,{recursive:true,force:true})}
});
