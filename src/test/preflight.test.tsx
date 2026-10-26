import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {auditDraft,auditPage,checkImages,draftRoutes} from '@/lib/preflight';
import {PreflightPanel} from '@/components/admin/PreflightPanel';
import type {VisualWorkspace} from '@/lib/cms-visual-model';
const workspace:VisualWorkspace={device:'mobile',revision:1,version:1,updated:'',values:{},published:{},collections:{products:[{slug:'meter',name:'Sayaç',code:'M1',image:'/assets/meter.webp',summary:'Ölçüm cihazı',en:{}}],solutions:[],plans:[]},catalog:{fields:[{id:'copy.title',target:'copy',kind:'text',group:'Sayfa',label:'Başlık',page:'/',default:{tr:'Başlık',en:'Title'}}]}};
afterEach(()=>{cleanup();vi.unstubAllGlobals()});
it('checks current unsaved draft without changing it and keeps device scope',()=>{
 const draft=structuredClone(workspace);draft.values['copy.title']={tr:'',en:'Title'};draft.collections!.products.push({...draft.collections!.products[0]!,name:''});const before=JSON.stringify(draft);
 const {issues,images}=auditDraft(draft);expect(issues.some(i=>i.title==='Boş metin alanı')).toBe(true);expect(issues.some(i=>i.severity==='error')).toBe(true);expect(images.has('/assets/meter.webp')).toBe(true);expect(draftRoutes(draft).has('/urunler/meter')).toBe(true);expect(JSON.stringify(draft)).toBe(before);
});
it('finds missing heading levels, invalid internal links, image errors and mobile overflow',()=>{
 const doc=document.implementation.createHTMLDocument('Sayfa');doc.body.innerHTML='<main id="main"><h1>Başlık</h1><h3>Atlandı</h3><a href="/yanlis">Bozuk</a><a href="/urunler/meter">Doğru</a><img src="/assets/a.png"><p>Taşan</p></main>';
 Object.defineProperty(doc,'baseURI',{value:'https://example.test/'});Object.defineProperty(doc.documentElement,'clientWidth',{value:390});doc.querySelector('p')!.getBoundingClientRect=()=>({x:0,y:0,top:0,bottom:30,left:0,right:500,width:500,height:30,toJSON:()=>{}});
 const issues=auditPage(doc,draftRoutes(workspace),'/');expect(issues.some(i=>i.title==='Başlık seviyesi atlanmış')).toBe(true);expect(issues.filter(i=>i.title==='İç bağlantı hedefi bulunamadı')).toHaveLength(1);expect(issues.some(i=>i.title==='Görsel açıklaması eksik')).toBe(true);expect(issues.some(i=>i.title==='Ekran dışına taşan öğeler')).toBe(true);
});
it('probes same-origin assets using HEAD with a maximum of four simultaneous requests',async()=>{
 let active=0,peak=0;const urls:string[]=[];vi.stubGlobal('fetch',vi.fn(async(url:string,options:RequestInit)=>{expect(options.method).toBe('HEAD');urls.push(url);peak=Math.max(peak,++active);await new Promise(r=>setTimeout(r,5));active--;return {status:url.includes('missing')?404:200,ok:!url.includes('missing')}}));
 const issues=await checkImages(['/assets/missing.webp',...Array.from({length:8},(_,i)=>'/assets/'+i+'.webp'),'https://other.test/assets/photo.webp','/api/cms/users'],'https://example.test',new AbortController().signal);expect(peak).toBeLessThanOrEqual(4);expect(urls).toHaveLength(9);expect(issues).toHaveLength(1);expect(issues[0]!.severity).toBe('error');
});
it('opens a control panel without publishing or mutating draft data',async()=>{
 const fetch=vi.fn().mockResolvedValue({ok:true,status:200});vi.stubGlobal('fetch',fetch);const close=vi.fn();render(<PreflightPanel workspace={workspace} onClose={close}/>);expect(screen.getByRole('dialog')).toHaveTextContent('MOBİL');fireEvent.click(screen.getByRole('button',{name:'Kontrolü başlat'}));await screen.findByText('Kontrol edilen alanlarda sorun bulunamadı.');expect(fetch.mock.calls.every(call=>call[1].method==='HEAD')).toBe(true);fireEvent.keyDown(document,{key:'Escape'});expect(close).toHaveBeenCalledOnce();
});
