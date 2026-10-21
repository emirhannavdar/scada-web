import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createCmsApp} from './app.mjs';
import {openStore} from './store.mjs';
import {createGoogleReviewsService} from './google-reviews.mjs';
import {COMMUNITY_FIELD,defaultCommunity} from '../shared/community.mjs';
const apiKey='AIzaFakeTestKeyNotARealCredential123456789';
const remote={displayName:{text:'Test business'},googleMapsUri:'https://maps.google.com/?cid=123',reviews:[{name:'places/ABC/reviews/one',rating:5,text:{text:'Public Google review',languageCode:'tr'},originalText:{text:'Public Google review',languageCode:'tr'},authorAttribution:{displayName:'Google author',uri:'https://maps.google.com/author/one',photoUri:'https://example.test/photo.png'},googleMapsUri:'https://maps.google.com/review/one'}],attributions:[{provider:'Example provider',providerUri:'https://example.test/'}]};
test('private API key, root-only setup and published device configuration gate actual Google requests',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'sw-google-'));let calls=0;
 const app=createCmsApp({dataDir:dir,googleReviewsFetch:async(url,options)=>{calls++;assert.match(url,/places.googleapis.com\/v1\/places\/ChIJtest/);assert.equal(options.headers['X-Goog-Api-Key'],apiKey);assert.equal(options.headers['X-Goog-FieldMask'],'displayName,reviews,googleMapsUri,attributions');return {ok:true,json:async()=>remote}}});
 await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.server.address().port;let cookie='',csrf='';
 const request=async(path,method='GET',data)=>{const r=await fetch(base+path,{method,headers:{Origin:base,Cookie:cookie,'X-CSRF-Token':csrf,'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});return {status:r.status,headers:r.headers,data:await r.json()}};
 const login=async(email,password)=>{const r=await request('/api/cms/login','POST',{email,password});cookie=r.headers.get('set-cookie').split(';')[0];csrf=r.data.csrf;assert.equal(r.status,200)};
 try{
  assert.equal((await request('/api/cms/google-reviews')).status,401);
  await app.store.createAdmin('root@example.com','Root-Google-Password-4901');await login('root@example.com','Root-Google-Password-4901');
  let r=await request('/api/cms/google-reviews','PUT',{enabled:true,placeId:'ChIJtest',dailyLimit:1,apiKey});assert.equal(r.status,200);assert.equal(r.data.hasKey,true);assert.ok(!JSON.stringify(r.data).includes(apiKey));
  assert.ok(!app.store.db.prepare('SELECT body FROM google_reviews_settings').get().body.includes(apiKey));
  r=await request('/api/google-reviews');assert.equal(r.data.enabled,false);assert.equal(calls,0);
  const d=structuredClone(defaultCommunity);d.reviews.google.enabled=true;d.reviews.google.url='https://maps.app.goo.gl/test';const raw=JSON.stringify(d);
  let state=app.store.save(0,{[COMMUNITY_FIELD]:{tr:raw,en:raw}},undefined,undefined,'desktop');
  assert.equal((await request('/api/google-reviews')).data.enabled,false);
  app.store.publish(state.revision,'Test','root@example.com','desktop');
  r=await request('/api/google-reviews?device=desktop&lang=en');assert.equal(r.status,200);assert.equal(r.data.reviews[0].text,'Public Google review');assert.equal(r.data.reviews[0].name,'Google author');assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(calls,1);assert.ok(!JSON.stringify(r.data).includes(apiKey));
  assert.equal((await request('/api/google-reviews?device=mobile')).data.enabled,false);
  assert.equal((await request('/api/google-reviews?device=desktop')).status,429);assert.equal(calls,1);
  assert.ok(!JSON.stringify((await request('/api/content')).data).includes(apiKey));
  await app.store.upsertUser('admin@example.com','Admin-Google-Password-4901','admin');await login('admin@example.com','Admin-Google-Password-4901');assert.equal((await request('/api/cms/google-reviews')).status,403);assert.equal((await request('/api/cms/google-reviews/test','POST',{})).status,403);
 }finally{await new Promise(r=>app.server.close(r));app.store.close();rmSync(dir,{recursive:true,force:true})}
});
test('in-flight requests coalesce without storing Google review content and provider errors never expose keys',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'sw-google-unit-')),store=openStore(dir);let resolve,calls=0;const gate=new Promise(r=>resolve=r);
 try{
  const service=createGoogleReviewsService(store,{fetcher:async()=>{calls++;await gate;return {ok:true,json:async()=>remote}}});service.save({enabled:true,placeId:'ChIJtest',dailyLimit:10,apiKey});
  const first=service.load(),second=service.load();resolve();await Promise.all([first,second]);assert.equal(calls,1);
  assert.deepEqual(store.db.prepare('SELECT calls FROM google_reviews_usage').get().calls,1);
  const denied=createGoogleReviewsService(store,{fetcher:async()=>({ok:false,status:403,json:async()=>({error:apiKey})})});await assert.rejects(denied.load(),e=>e.status===502&&!e.message.includes(apiKey)&&e.message.includes('reddetti'));
 }finally{store.close();rmSync(dir,{recursive:true,force:true})}
});
