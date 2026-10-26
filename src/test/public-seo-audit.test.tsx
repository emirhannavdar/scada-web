import {cleanup,render,waitFor} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {createMemoryHistory,createRouter,RouterProvider} from '@tanstack/react-router';
import {QueryClient} from '@tanstack/react-query';
import {routeTree} from '@/routeTree.gen';
import {products,solutions} from '@/content/site';
import {setLanguage} from '@/lib/i18n';
import {writeFileSync} from 'node:fs';
vi.mock('@/components/site/FlightCanvas',()=>({FlightCanvas:()=>null}));
vi.mock('@/components/site/DemoDashboard',()=>({DemoDashboard:()=>null}));
afterEach(()=>{cleanup();setLanguage('tr')});
const paths=['/','/cozumler','/urunler','/scada-yazilimi','/paketler','/hakkimizda','/iletisim','/privacy-policy','/cerez','/kullanim-kosullari','/saha-yapilandirici',...products.map(p=>'/urunler/'+p.slug),...solutions.map(s=>'/cozumler/'+s.slug)];
it('audits public routes for heading hierarchy, image alternatives and page metadata',async()=>{
 const findings:string[]=[],rows:unknown[]=[];
 const originalMedia=window.matchMedia;
 for(const language of ['tr','en'] as const)for(const mobile of [false,true]){
 setLanguage(language);window.matchMedia=query=>({...originalMedia(query),matches:mobile&&/max-width:\s*(760|767)px/.test(query)});
 for(const path of paths){
  const router=createRouter({routeTree,history:createMemoryHistory({initialEntries:[path]}),context:{queryClient:new QueryClient()},defaultPendingMinMs:0});
  await router.load();render(<RouterProvider router={router}/>);
  await waitFor(()=>expect(document.querySelector('#main h1')).not.toBeNull());
  const main=document.querySelector('#main')!;
  if(main.querySelectorAll('h1').length!==1)findings.push(path+': H1 sayısı '+main.querySelectorAll('h1').length);
  let previous=0;
  for(const h of main.querySelectorAll('h1,h2,h3,h4,h5,h6')){const level=Number(h.tagName[1]);if(level>previous+1)findings.push(path+': H'+previous+' → H'+level+' '+h.textContent);previous=level;}
  for(const img of main.querySelectorAll('img'))if(!img.hasAttribute('alt'))findings.push(path+': görsel alt eksik');
  const metas=router.state.matches.flatMap(m=>m.meta??[]);if(!metas.some(m=>m&&'title'in m))findings.push(path+': title eksik');if(!metas.some(m=>m&&'name'in m&&m.name==='description'&&'content'in m&&m.content))findings.push(path+': description eksik');
  rows.push({path,language,viewport:mobile?'mobile':'desktop',title:document.title,headings:Array.from(main.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h=>({level:h.tagName,text:h.textContent})),images:main.querySelectorAll('img').length});
  cleanup();
 }}
 window.matchMedia=originalMedia;writeFileSync('/tmp/seo127-routes.json',JSON.stringify({checks:rows.length,findings,rows},null,2));
 expect(findings).toEqual([]);
},60000);
