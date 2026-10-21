import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createCmsApp} from './app.mjs';
import {COMMUNITY_FIELD,defaultCommunity} from '../shared/community.mjs';
async function fixture(){
 const dir=mkdtempSync(join(tmpdir(),'sw-mail-')),sent=[];let fail=false;
 const app=createCmsApp({dataDir:dir,mailTransportFactory:options=>({verify:async()=>true,close(){},sendMail:async message=>{assert.equal(options.requireTLS,true);if(fail)throw Object.assign(Error('Timeout'),{code:'ETIMEDOUT',command:'DATA'});sent.push(message);return {accepted:[message.to],rejected:[]}}})});
 await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.server.address().port;let cookie='',csrf='';
 async function call(path,method='GET',data,extra={}){const response=await fetch(base+path,{method,headers:{Origin:base,'Content-Type':'application/json','X-ScadaWatt-Request':'contact',Cookie:cookie,'X-CSRF-Token':csrf,...extra},...(data?{body:JSON.stringify(data)}:{})});return {response,json:await response.json()}}
 async function login(email,password){const r=await call('/api/cms/login','POST',{email,password});assert.equal(r.response.status,200);cookie=r.response.headers.get('set-cookie').split(';')[0];csrf=r.json.csrf}
 await app.store.createAdmin('root@example.com','Long-Root-Password-4901');
 return {...app,dir,base,sent,call,login,setFailure:value=>{fail=value},close:async()=>{await new Promise(r=>app.server.close(r));app.store.close();rmSync(dir,{recursive:true,force:true})}};
}
const settings={enabled:true,host:'smtp.example.com',port:587,secure:false,username:'web@example.com',password:'Private-Smtp-Secret-4901',fromEmail:'web@example.com',fromName:'ScadaWatt',toEmail:'requests@example.com'};
const enquiry=()=>({type:'demo',name:'Ali Veli',email:'ali@example.com',interests:['S3000i','Uzaktan İzleme'],message:'Sahalarım için görüşme istiyorum.',consent:true,requestId:randomUUID()});
test('root SMTP settings are private; form sends to configured recipient once and validates failures',async()=>{
 const f=await fixture();try{
  assert.equal((await f.call('/api/cms/mail-settings')).response.status,401);
  await f.login('root@example.com','Long-Root-Password-4901');
  let r=await f.call('/api/cms/mail-settings','PUT',settings);assert.equal(r.response.status,200);assert.equal(r.json.hasPassword,true);assert.ok(!JSON.stringify(r.json).includes(settings.password));
  const encrypted=f.store.db.prepare('SELECT body FROM mail_settings WHERE id=1').get().body;assert.ok(!encrypted.includes(settings.password));assert.equal(readFileSync(join(f.dir,'mail.key')).length,32);
  const pub=await f.call('/api/content');assert.ok(!JSON.stringify(pub.json).includes('smtp.example.com'));assert.ok(!JSON.stringify(pub.json).includes(settings.toEmail));
  assert.equal((await f.call('/api/cms/mail-settings/verify','POST',{})).response.status,200);
  await f.store.upsertUser('admin@example.com','Long-Admin-Password-4901','admin');await f.login('admin@example.com','Long-Admin-Password-4901');
  assert.equal((await f.call('/api/cms/mail-settings')).response.status,403);
  assert.equal((await f.call('/api/cms/mail-settings','PUT',settings)).response.status,403);
  const body=enquiry();r=await f.call('/api/contact','POST',body);assert.equal(r.response.status,200,JSON.stringify(r.json));assert.equal(f.sent.length,1);assert.equal(f.sent[0].to,settings.toEmail);assert.equal(f.sent[0].replyTo.address,body.email);assert.match(f.sent[0].text,/S3000i, Uzaktan İzleme/);
  r=await f.call('/api/contact','POST',body);assert.equal(r.response.status,200);assert.equal(f.sent.length,1);
  assert.equal((await f.call('/api/contact','POST',{...body,message:'Farklı bir talep metni.'})).response.status,409);
  assert.equal((await f.call('/api/contact','POST',{...enquiry(),email:'not-valid'})).response.status,400);
  assert.equal((await f.call('/api/contact','POST',{...enquiry(),consent:false})).response.status,400);
  assert.equal((await f.call('/api/contact','POST',{...enquiry(),website:'bot'})).response.status,400);
  assert.equal((await f.call('/api/contact','POST',enquiry(),{Origin:'https://evil.example'})).response.status,403);
  f.setFailure(true);const uncertain=enquiry();assert.equal((await f.call('/api/contact','POST',uncertain)).response.status,502);assert.equal((await f.call('/api/contact','POST',uncertain)).response.status,409);assert.equal(f.sent.length,1);
  await f.login('root@example.com','Long-Root-Password-4901');await f.call('/api/cms/mail-settings','PUT',{...settings,enabled:false,password:''});assert.equal((await f.call('/api/contact','POST',enquiry())).response.status,503);
 }finally{await f.close()}
});
test('FAQ/reviews stay in device drafts and require valid Google links, image references and permissions',async()=>{
 const f=await fixture();try{
  const d=structuredClone(defaultCommunity);d.faq.items[0].question={tr:'Yeni soru?',en:'New question?'};d.reviews.items=[{id:'review-1',name:'İzinli müşteri',company:'Örnek',quote:{tr:'Onaylı yorum',en:'Approved review'},image:'',enabled:true,consentConfirmed:true}];
  const raw=JSON.stringify(d);let state=f.store.save(0,{[COMMUNITY_FIELD]:{tr:raw,en:raw}},undefined,undefined,'mobile');assert.equal(f.store.state('desktop').values[COMMUNITY_FIELD],undefined);assert.equal(f.store.state('mobile').published[COMMUNITY_FIELD],undefined);
  f.store.publish(state.revision,'Test','root@example.com','mobile');assert.equal(JSON.parse(f.store.state('mobile').published[COMMUNITY_FIELD].tr).faq.items[0].question.tr,'Yeni soru?');
  for(const mutate of [d=>{d.reviews.items[0].consentConfirmed=false},d=>{d.reviews.items[0].image='/uploads/does-not-exist.png'},d=>{d.reviews.google.url='https://evil.example/'},d=>{d.faq.items[1].id=d.faq.items[0].id}]){
   const bad=structuredClone(d);mutate(bad);const text=JSON.stringify(bad);assert.throws(()=>f.store.save(f.store.state('mobile').revision,{[COMMUNITY_FIELD]:{tr:text,en:text}},undefined,undefined,'mobile'));
  }
 }finally{await f.close()}
});
