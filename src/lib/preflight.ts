import type {VisualWorkspace} from './cms-visual-model';
export type CheckIssue={severity:'error'|'warning';title:string;detail:string;path?:string;fieldId?:string;selector?:string;language?:string;location?:string;asset?:string;stage?:number};
export const PUBLIC_ROUTES=['/','/cozumler','/urunler','/scada-yazilimi','/saha-yapilandirici','/paketler','/hakkimizda','/iletisim','/privacy-policy','/cerez','/kullanim-kosullari'];
export function draftRoutes(workspace:VisualWorkspace){
 const routes=new Set(PUBLIC_ROUTES);for(const kind of ['products','solutions'] as const)for(const item of workspace.collections?.[kind]??[])if(item.slug)routes.add((kind==='products'?'/urunler/':'/cozumler/')+item.slug);return routes;
}
export function auditDraft(workspace:VisualWorkspace){
 const issues:CheckIssue[]=[],images=new Set<string>(),imageLocations:Record<string,Partial<CheckIssue>[]>={};let context:Partial<CheckIssue>={};
 const image=(url:string)=>{images.add(url);(imageLocations[url]??=[]).push({...context})};
 const add=(severity:CheckIssue['severity'],title:string,detail:string,path?:string)=>issues.push({...context,severity,title,detail,...(path?{path}:{})});
 for(const field of workspace.catalog.fields){
  if(field.retired)continue;
  const value=workspace.values[field.id]??field.default;
  for(const language of ['tr','en'] as const){const text=value[language];if(typeof text!=='string')continue;context={fieldId:field.id,language:language.toUpperCase(),location:field.location||field.group+' › '+field.label,...(field.page?{path:field.page}:{}),...(field.stage!==undefined?{stage:field.stage}:{})};
   if(field.kind==='image'&&text.trim())image(text.trim());
   if(field.kind==='text'&&!text.trim()&&field.default[language])add('warning','Boş metin alanı',field.label+' ('+language.toUpperCase()+'). Bilerek gizlediyseniz sorun değildir.',field.page);
  }
 }
 for(const kind of ['products','solutions','plans'] as const){
  const seen=new Set<string>();
  for(const item of workspace.collections?.[kind]??[]){
   const key=String(item.slug||item.id||''),title=String(item.name||item.title||item.code||key),path=kind==='products'?'/urunler/'+key:kind==='solutions'?'/cozumler/'+key:'/paketler';
   context={location:(kind==='products'?'Donanımlar':kind==='solutions'?'Çözümler':'Paketler')+' › '+title,path};
   if(!key||seen.has(key))add('error','Eksik veya tekrarlanan kayıt adresi',title||kind,path);seen.add(key);
   if(!String(item.name||item.title||'').trim())add('error','Kayıt başlığı boş',key,path);
   if(kind!=='plans'&&!String(item['summary']||item['short']||'').trim())add('warning','Kayıt açıklaması boş',title,path);
   if(kind!=='plans'){if(typeof item.image==='string'&&item.image.trim())image(item.image);else add('warning','Kayıt görseli eksik',title,path)}
  }
 }
 return {issues,images,imageLocations};
}
export function auditPage(doc:Document,routes:Set<string>,path:string):CheckIssue[]{
 const issues:CheckIssue[]=[],main=doc.querySelector('#main');if(!main)return [{severity:'warning',title:'Önizleme henüz hazır değil',detail:'Sayfa yüklendikten sonra kontrolü yeniden çalıştırın.',path}];
 const add=(severity:CheckIssue['severity'],title:string,detail:string,node?:Element)=>issues.push({severity,title,detail,path,location:node?(node.closest('section')?.querySelector('h1,h2,h3')?.textContent?.trim().slice(0,90)||node.tagName.toLowerCase()):'Sayfa bilgileri',...(node?{selector:elementSelector(node)}:{})});
 if(main.querySelectorAll('h1').length!==1)add('warning','Ana başlık kontrolü','Sayfada bir H1 beklenir; bulunan: '+main.querySelectorAll('h1').length);
 let previous=0;
 for(const heading of main.querySelectorAll('h1,h2,h3,h4,h5,h6')){const level=Number(heading.tagName[1]);if(!heading.textContent?.trim())add('warning','Boş başlık',heading.tagName,heading);if(level<=2&&(heading.textContent?.length??0)>120)add('warning','Uzun başlık',heading.textContent!.slice(0,100)+'… Mobilde okunurluğunu kontrol edin.',heading);if(level>previous+1)add('warning','Başlık seviyesi atlanmış','H'+previous+' → H'+level+': '+heading.textContent?.slice(0,90),heading);previous=level;}
 if(!doc.title.trim())add('warning','Sayfa başlığı eksik','Tarayıcı başlığı boş.');
 if(!doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim())add('warning','Sayfa açıklaması eksik','Meta açıklaması boş.');
 const broken=new Set<string>();
 for(const link of main.querySelectorAll<HTMLAnchorElement>('a[href]')){
  const raw=link.getAttribute('href')!;if(/^(javascript|data):/i.test(raw)){add('error','Güvenli olmayan bağlantı',raw.slice(0,90),link);continue}if(!raw||/^(mailto:|tel:|#)/i.test(raw))continue;
  try{const url=new URL(raw,doc.baseURI),base=new URL(doc.baseURI);if(url.origin!==base.origin||/\.[a-z0-9]+$/i.test(url.pathname))continue;const target=url.pathname.replace(/\/$/,'')||'/';if(!routes.has(target)&&!['/gizlilik','/kvkk','/demo'].includes(target)&&!broken.has(target)){broken.add(target);add('error','İç bağlantı hedefi bulunamadı',target,link)}}catch{add('error','Geçersiz bağlantı',raw,link)}
 }
 for(const img of main.querySelectorAll<HTMLImageElement>('img')){if(!img.hasAttribute('alt'))add('warning','Görsel açıklaması eksik',img.getAttribute('src')||'Görsel',img);if(img.dataset['imageError']==='true')add('error','Görsel yüklenemedi',img.getAttribute('data-original-src')||img.alt,img);}
 const width=doc.documentElement.clientWidth,view=doc.defaultView;
 let small=0,overflow=0;
 for(const node of main.querySelectorAll<HTMLElement>('p,h1,h2,h3,h4,h5,h6,button,input,textarea,select')){
  if(node.closest('[hidden],[aria-hidden="true"],.drone-sticky,.flight-render'))continue;
  const rect=node.getBoundingClientRect();if(!rect.width||!rect.height)continue;
  if(width&&(rect.right>width+3||rect.left< -3)&&overflow++<30)add('warning','Ekran dışına taşan öğeler',(node.textContent?.trim().slice(0,100)||node.tagName)+' · '+Math.round(rect.width)+' px genişlik',node);
  const style=view?.getComputedStyle(node);if(style&&parseFloat(style.fontSize)<12&&style.visibility!=='hidden'&&small++<30)add('warning','Küçük yazılar',(node.textContent?.trim().slice(0,100)||node.tagName)+' · '+style.fontSize,node);
 }


 return issues;
}
/** Only same-origin images are probed; no remote URL, cookies or token is forwarded. */
export async function checkImages(images:Iterable<string>,origin:string,signal:AbortSignal,onProgress?:(done:number,total:number)=>void){
 const paths=[...new Set(Array.from(images).flatMap(raw=>{try{const url=new URL(raw,origin);return url.origin===new URL(origin).origin&&/^\/(assets|uploads)\//.test(url.pathname)?[url.pathname]:[]}catch{return []}}))];
 const issues:CheckIssue[]=[];let next=0,done=0;
 await Promise.all(Array.from({length:Math.min(4,paths.length)},async()=>{while(next<paths.length&&!signal.aborted){const path=paths[next++]!;try{const response=await fetch(path,{method:'HEAD',credentials:'same-origin',cache:'no-cache',signal:AbortSignal.any([signal,AbortSignal.timeout(5000)])});if(response.status===404)add('error','Görsel dosyası bulunamadı',path);else if(!response.ok)add('warning','Görsel doğrulanamadı',path+' (HTTP '+response.status+')')}catch{if(!signal.aborted)add('warning','Görsel bağlantısı yanıt vermedi',path)}finally{onProgress?.(++done,paths.length)}}}));
 function add(severity:CheckIssue['severity'],title:string,detail:string){issues.push({severity,title,detail,asset:detail.split(' (HTTP')[0]!})}
 return issues;
}

function elementSelector(node:Element){const parts:string[]=[];let item:Element|null=node;while(item&&item.id!=='main'&&parts.length<18){const parent:Element|null=item.parentElement,index=parent?[...parent.children].filter(child=>child.tagName===item!.tagName).indexOf(item)+1:1;parts.unshift(item.tagName.toLowerCase()+':nth-of-type('+index+')');item=parent}return (item?.id==='main'?'#main > ':'')+parts.join(' > ')}
export function highlightIssue(doc:Document,issue:CheckIssue){
 let node:Element|null=null;
 if(issue.fieldId)node=[...doc.querySelectorAll('[data-cms-field]')].find(element=>element.getAttribute('data-cms-field')?.split(/\s+/).includes(issue.fieldId!))||null;
 if(!node&&issue.selector)try{node=doc.querySelector(issue.selector)}catch{}
 if(!node&&issue.asset)node=[...doc.querySelectorAll('img')].find(image=>[image.getAttribute('src'),image.getAttribute('data-original-src')].some(src=>{try{return src&&new URL(src,doc.baseURI).pathname===new URL(issue.asset!,doc.baseURI).pathname}catch{return false}}))||null;
 if(!node)return false;
 let style=doc.getElementById('cms-preflight-highlight-style');if(!style){style=doc.createElement('style');style.id='cms-preflight-highlight-style';style.textContent='[data-cms-preflight-issue="error"]{outline:4px solid #d83832!important;outline-offset:6px!important;box-shadow:0 0 0 10px #d8383222!important}[data-cms-preflight-issue="warning"]{outline:4px solid #e49b20!important;outline-offset:6px!important;box-shadow:0 0 0 10px #e49b2022!important}';doc.head.append(style)}
 doc.querySelectorAll('[data-cms-preflight-issue]').forEach(element=>element.removeAttribute('data-cms-preflight-issue'));node.setAttribute('data-cms-preflight-issue',issue.severity);node.scrollIntoView?.({block:'center',behavior:'smooth'});return true;
}
