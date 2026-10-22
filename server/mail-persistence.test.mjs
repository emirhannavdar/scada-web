import './postgres-test-env.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openStore} from './store.mjs';
import {createMailService} from './mail.mjs';
test('SMTP settings and encrypted password survive closing and reopening the application',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'sw-mail-persist-'));let store;
 try{
  store=await openStore(dir);const service=await createMailService(store);
  await service.save({enabled:true,host:'smtp.gmail.com',port:587,secure:false,username:'test@example.com',password:'abcdefghijklmnop',fromEmail:'test@example.com',fromName:'ScadaWatt',toEmail:'inbox@example.com'});
  await store.close();store=await openStore(dir);let submitted=false;
  const restarted=await createMailService(store,{transportFactory:options=>{assert.equal(options.auth.pass,'abcdefghijklmnop');return{verify:async()=>{submitted=true},close(){}}}});
  const settings=await restarted.read();assert.equal(settings.host,'smtp.gmail.com');assert.equal(settings.toEmail,'inbox@example.com');assert.equal(settings.hasPassword,true);assert.equal(settings.password,undefined);await restarted.verify();assert.equal(submitted,true);
 }finally{if(store)await store.close();rmSync(dir,{recursive:true,force:true})}
});
