import type {VisualWorkspace} from './cms-visual-model';
export type CheckIssue={severity:'error'|'warning';title:string;detail:string;path?:string};
export const PUBLIC_ROUTES=['/','/cozumler','/urunler','/scada-yazilimi','/saha-yapilandirici','/paketler','/hakkimizda','/iletisim','/privacy-policy','/cerez','/kullanim-kosullari'];
export function draftRoutes(workspace:VisualWorkspace){
 const routes=new Set(PUBLIC_ROUTES);for(const kind of ['products','solutions'] as const)for(const item of workspace.collections?.[kind]??[])if(item.slug)routes.add((kind==='products'?'/urunler/':'/cozumler/')+item.slug);return routes;
}
export function auditDraft(workspace:VisualWorkspace){
 const issues:CheckIssue[]=[],images=new Set<string>();
 const add=(severity:CheckIssue['severity'],title:string,detail:string,path?:string)=>issues.push({severity,title,detail,...(path?{path}:{})});
 for(const field of workspace.catalog.fields){
  if(field.retired)continue;
  const value=workspace.values[field.id]??field.default;
  for(const language of ['tr','en'] as const){const text=value[language];if(typeof text!=='string')continue;
   if(field.kind==='image'&&text.trim())images.add(text.trim());
   if(field.kind==='text'&&!text.trim()&&field.default[language])add('warning','Boş metin alanı',field.label+' ('+language.toUpperCase()+'). Bilerek gizlediyseniz sorun değildir.',field.page);
  }
 }
 for(const kind of ['products','solutions','plans'] as const){
  const seen=new Set<string>();
  for(const item of workspace.collections?.[kind]??[]){
   const key=String(item.slug||item.id||''),title=String(item.name||item.title||item.code||key),path=kind==='products'?'/urunler/'+key:kind==='solutions'?'/cozumler/'+key:'/paketler';
   if(!key||seen.has(key))add('error','Eksik veya tekrarlanan kayıt adresi',title||kind,path);seen.add(key);
   if(!String(item.name||item.title||'').trim())add('error','Kayıt başlığı boş',key,path);
   if(kind!=='plans'&&!String(item['summary']||item['short']||'').trim())add('warning','Kayıt açıklaması boş',title,path);
   if(kind!=='plans'){if(typeof item.image==='string'&&item.image.trim())images.add(item.image);else add('warning','Kayıt görseli eksik',title,path)}
  }
 }
 return {issues,images};
}
export function auditPage(doc:Document,routes:Set<string>,path:string):CheckIssue[]{
 const issues:CheckIssue[]=[],main=doc.querySelector('#main');if(!main)return [{severity:'warning',title:'Önizleme henüz hazır değil',detail:'Sayfa yüklendikten sonra kontrolü yeniden çalıştırın.',path}];
 const add=(severity:CheckIssue['severity'],title:string,detail:string)=>issues.push({severity,title,detail,...(path?{path}:{})});
 if(main.querySelectorAll('h1').length!==1)add('warning','Ana başlık kontrolü','Sayfada bir H1 beklenir; bulunan: '+main.querySelectorAll('h1').length);
 let previous=0;
 for(const heading of main.querySelectorAll('h1,h2,h3,h4,h5,h6')){const level=Number(heading.tagName[1]);if(!heading.textContent?.trim())add('warning','Boş başlık',heading.tagName);if(level<=2&&(heading.textContent?.length??0)>120)add('warning','Uzun başlık',heading.textContent!.slice(0,100)+'… Mobilde okunurluğunu kontrol edin.');if(level>previous+1)add('warning','Başlık seviyesi atlanmış','H'+previous+' → H'+level+': '+heading.textContent?.slice(0,90));previous=level;}
 if(!doc.title.trim())add('warning','Sayfa başlığı eksik','Tarayıcı başlığı boş.');
 if(!doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim())add('warning','Sayfa açıklaması eksik','Meta açıklaması boş.');
 const broken=new Set<string>();
 for(const link of main.querySelectorAll<HTMLAnchorElement>('a[href]')){
  const raw=link.getAttribute('href')!;if(/^(javascript|data):/i.test(raw)){add('error','Güvenli olmayan bağlantı',raw.slice(0,90));continue}if(!raw||/^(mailto:|tel:|#)/i.test(raw))continue;
  try{const url=new URL(raw,doc.baseURI),base=new URL(doc.baseURI);if(url.origin!==base.origin||/\.[a-z0-9]+$/i.test(url.pathname))continue;const target=url.pathname.replace(/\/$/,'')||'/';if(!routes.has(target)&&!['/gizlilik','/kvkk','/demo'].includes(target)&&!broken.has(target)){broken.add(target);add('error','İç bağlantı hedefi bulunamadı',target)}}catch{add('error','Geçersiz bağlantı',raw)}
 }
 for(const img of main.querySelectorAll<HTMLImageElement>('img')){if(!img.hasAttribute('alt'))add('warning','Görsel açıklaması eksik',img.getAttribute('src')||'Görsel');if(img.dataset['imageError']==='true')add('error','Görsel yüklenemedi',img.getAttribute('data-original-src')||img.alt);}
 const width=doc.documentElement.clientWidth,view=doc.defaultView;
 let small=0,overflow=0;
 for(const node of main.querySelectorAll<HTMLElement>('p,h1,h2,h3,h4,h5,h6,button,input,textarea,select')){
  if(node.closest('[hidden],[aria-hidden="true"],.drone-sticky,.flight-render'))continue;
  const rect=node.getBoundingClientRect();if(!rect.width||!rect.height)continue;
  if(width&&(rect.right>width+3||rect.left< -3))overflow++;
  const style=view?.getComputedStyle(node);if(style&&parseFloat(style.fontSize)<12&&style.visibility!=='hidden')small++;
 }
 if(overflow)add('warning','Ekran dışına taşan öğeler',overflow+' öğe. Mobil/masaüstü önizlemesinde yerleşimi kontrol edin.');
 if(small)add('warning','Küçük yazılar',small+' öğede yazı 12 px altında. Teknik etiketler için bilinçli bir seçim olabilir.');
 return issues;
}
/** Only same-origin images are probed; no remote URL, cookies or token is forwarded. */
export async function checkImages(images:Iterable<string>,origin:string,signal:AbortSignal,onProgress?:(done:number,total:number)=>void){
 const paths=[...new Set(Array.from(images).flatMap(raw=>{try{const url=new URL(raw,origin);return url.origin===new URL(origin).origin&&/^\/(assets|uploads)\//.test(url.pathname)?[url.pathname]:[]}catch{return []}}))];
 const issues:CheckIssue[]=[];let next=0,done=0;
 await Promise.all(Array.from({length:Math.min(4,paths.length)},async()=>{while(next<paths.length&&!signal.aborted){const path=paths[next++]!;try{const response=await fetch(path,{method:'HEAD',credentials:'same-origin',cache:'no-cache',signal:AbortSignal.any([signal,AbortSignal.timeout(5000)])});if(response.status===404)add('error','Görsel dosyası bulunamadı',path);else if(!response.ok)add('warning','Görsel doğrulanamadı',path+' (HTTP '+response.status+')')}catch{if(!signal.aborted)add('warning','Görsel bağlantısı yanıt vermedi',path)}finally{onProgress?.(++done,paths.length)}}}));
 function add(severity:CheckIssue['severity'],title:string,detail:string){issues.push({severity,title,detail})}
 return issues;
}
