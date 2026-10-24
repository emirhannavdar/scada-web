import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderPage,sitemap} from './seo.mjs';
import catalog from './catalog.json' with {type:'json'};
const store={state:async()=>({}),payload:()=>({collections:catalog.baseCollections,entries:[]})};
test('public metadata is unique, descriptive and stable when rendered twice',async()=>{
 const xml=await sitemap(store),paths=[...xml.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map(m=>m[1]);
 const seen=new Set();
 for(const path of paths){
  const first=await renderPage('<html><head><title>Old</title><link rel="canonical" href="https://old.test"><meta name="twitter:title" content="Old"></head></html>',path,store,false,{headers:{host:'scadawatt.com'}});
  assert.equal(first.status,200,path);
  const html=(await renderPage(first.html,path,store,false,{headers:{host:'scadawatt.com'}})).html;
  const title=html.match(/<title>(.*?)<\/title>/)[1];assert(!seen.has(title),'Duplicate title '+title);seen.add(title);
  assert.equal((html.match(/rel="canonical"/g)||[]).length,1,path);
  for(const name of ['description','twitter:title','twitter:description','twitter:image'])assert.equal((html.match(new RegExp('name="'+name+'"','g'))||[]).length,1,path+' '+name);
  assert.equal((html.match(/id="site-schema"/g)||[]).length,1,path);
  assert.match(html,/"@type":"WebSite"/);
 }
 assert(paths.length>=20);
});
