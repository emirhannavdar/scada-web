import type {SiteDesign} from './cms-design';
import {managedRoots,type CmsCollections,type CollectionKind} from './cms-collections';
export type VisualValue={tr:string|boolean;en:string|boolean};
export type VisualField={id:string;target:string;path?:string[];source?:string;group:string;label:string;kind:string;retired?:boolean;location?:string;page?:string;stage?:number;default:VisualValue};
export type VisualWorkspace={device?:'desktop'|'mobile';revision:number;version:number;updated:string;values:Record<string,VisualValue>;published:Record<string,VisualValue>;collections?:CmsCollections;publishedCollections?:CmsCollections;design?:SiteDesign;publishedDesign?:SiteDesign;catalog:{fields:VisualField[];comparisonLabels?:string[]}};
export type VisualTarget={id:string;label:string;group:string;kind:string;value:VisualValue;match:string[];stage?:number;page?:string;collection?:CollectionKind;record?:string;path?:string[]};
export const normalizeVisual=(value:string)=>value.normalize('NFC').replace(/[\u200B-\u200D\uFEFF\u00AD]/g,'').trim().replace(/\s+/g,' ');
export const visualCollectionNames={products:'Donanımlar',solutions:'Çözümler',plans:'Paketler'};
const labels:Record<string,string>={name:'Ad',title:'Başlık',tagline:'Kısa başlık',summary:'Açıklama',role:'Görevi',short:'Kısa açıklama',headline:'Ana başlık',caption:'Görsel açıklaması',body:'Açıklama',points:'Öne çıkan özellik',features:'Hizmet',term:'Süre',specifications:'Teknik özellik',value:'Değer',image:'Görsel'};
export function visualTargets(workspace:VisualWorkspace,baseline?:VisualWorkspace):VisualTarget[]{
 const targets:VisualTarget[]=[];
 for(const field of workspace.catalog.fields){if(field.retired||(managedRoots.has(field.path?.[0]||'')&&!(field.path?.[0]==='comparison'&&field.path?.[2]==='0'))||!['text','image','email','tel','url','map'].includes(field.kind))continue;const value=workspace.values[field.id]??field.default;targets.push({id:field.id,label:field.label,group:field.group,kind:field.kind,value,match:[field.default.tr,field.default.en,value.tr,value.en,field.source].filter((v):v is string=>typeof v==='string').map(normalizeVisual),...(field.stage!==undefined?{stage:field.stage}:{}),...(field.page?{page:field.page}:{})});}
 for(const kind of ['products','solutions','plans'] as const)for(const item of workspace.collections?.[kind]??[]){const record=item.slug||item.id||'',name=String(item.code||item.title||item.name||record);
  function walk(tr:unknown,en:unknown,path:string[]){if(typeof tr==='boolean'&&path[0]==='comparison'){targets.push({id:`@${kind}/${record}/${path.join('/')}`,label:`${name} / ${workspace.catalog.comparisonLabels?.[Number(path[1])]||'Karşılaştırma'}`,group:visualCollectionNames[kind],kind:'boolean',value:{tr,en:typeof en==='boolean'?en:tr},match:[],collection:kind,record,path});return}if(typeof tr==='string'){const key=path.at(-1)!;targets.push({id:`@${kind}/${record}/${path.join('/')}`,label:`${name} / ${path.map(p=>/^\d+$/.test(p)?String(Number(p)+1):labels[p]||p).join(' / ')}`,group:visualCollectionNames[kind],kind:key==='image'?'image':key==='code'?'code':'text',value:{tr,en:typeof en==='string'?en:tr},match:[tr,typeof en==='string'?en:tr].map(normalizeVisual),collection:kind,record,path});}else if(Array.isArray(tr))tr.forEach((v,i)=>walk(v,Array.isArray(en)?en[i]:undefined,[...path,String(i)]));else if(tr&&typeof tr==='object')for(const [key,value] of Object.entries(tr))if(!['en','id','slug','hotspots','recommended','featured'].includes(key))walk(value,en&&typeof en==='object'?(en as Record<string,unknown>)[key]:undefined,[...path,key]);}
  walk(item,item.en,[]);
 }
 if(baseline){const old=new Map(visualTargets(baseline).map(t=>[t.id,t]));for(const target of targets)target.match=[...new Set([...target.match,...(old.get(target.id)?.match??[])])];}
 return targets;
}
export function updateVisualTarget(workspace:VisualWorkspace,target:VisualTarget,value:VisualValue):VisualWorkspace{
 if(!target.collection){const field=workspace.catalog.fields.find(f=>f.id===target.id);if(!field)throw Error('İçerik alanı bulunamadı.');const values={...workspace.values};if(value.tr===field.default.tr&&value.en===field.default.en)delete values[target.id];else values[target.id]=value;return {...workspace,values};}
 const collections=structuredClone(workspace.collections!);const item=collections[target.collection].find(i=>(i.slug||i.id)===target.record);if(!item||!target.path?.length)throw Error('Kayıt bulunamadı.');
 function assign(root:Record<string,unknown>,path:string[],next:unknown){let object:any=root;for(const key of path.slice(0,-1)){object[key]??={};object=object[key];}object[path.at(-1)!]=next;}
 assign(item,target.path,value.tr);assign(item.en,target.path,value.en);return {...workspace,collections};
}
export function visualPath(path:string){const url=new URL(path,location.origin);if(url.origin!==location.origin||url.pathname.startsWith('/admin'))return '/?cms-preview=1&cms-edit=1';url.searchParams.set('cms-preview','1');url.searchParams.set('cms-edit','1');const device=new URLSearchParams(location.search).get('cms-device');if(device)url.searchParams.set('cms-device',device);return url.pathname+url.search+url.hash;}
const visualIndexes=new WeakMap<VisualTarget[],Map<string,VisualTarget[]>>();
const unquote=(value:string)=>value.replace(/^[“”‘’"'«»]+|[“”‘’"'«»]+$/g,'');
export function visualFieldMatches(targets:VisualTarget[],text:string,context?:{collection?:string;record?:string;stage?:number;path?:string}){
 const normalized=unquote(normalizeVisual(text));if(!normalized)return [];
 let index=visualIndexes.get(targets);if(!index){index=new Map();for(const target of targets){if(['map','url','tel'].includes(target.kind))continue;for(const value of new Set(target.match.map(v=>unquote(normalizeVisual(v))))){if(!value)continue;const matches=index.get(value)||[];matches.push(target);index.set(value,matches)}}visualIndexes.set(targets,index);}
 return (index.get(normalized)||[]).filter(t=>(!context?.collection||!t.collection||t.collection===context.collection)&&(!context?.record||!t.record||t.record===context.record)&&(context?.stage===undefined||t.stage===undefined||t.stage===context.stage)).sort((a,b)=>{const score=(t:VisualTarget)=>(t.collection===context?.collection&&t.collection?4:0)+(t.page===context?.path?2:0)+(t.stage===context?.stage&&t.stage!==undefined?1:0);return score(b)-score(a)});
}
