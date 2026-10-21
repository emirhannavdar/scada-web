import {products,solutions,plans,productSpecifications,comparison,discoveryGoals,type Product,type Solution,type Plan} from '@/content/site';
import type {CmsCollections,CollectionItem} from './cms-collections';
import type {CmsEntry} from './cms-state';
export function applyCmsCollections(collections:CmsCollections|undefined){const entries:CmsEntry[]=[];if(!collections)return entries;
 function collect(tr:unknown,en:unknown,prefix:string){if(typeof tr==='string')entries.push({id:prefix,target:'copy',kind:'text',tr,en:typeof en==='string'?en:tr});else if(Array.isArray(tr))tr.forEach((v,i)=>collect(v,Array.isArray(en)?en[i]:undefined,prefix+'.'+i));else if(tr&&typeof tr==='object')for(const [k,v] of Object.entries(tr))if(!['en','slug','id','code','image'].includes(k))collect(v,en&&typeof en==='object'?(en as Record<string,unknown>)[k]:undefined,prefix+'.'+k)}
 for(const [kind,items] of Object.entries(collections))items.forEach((item:CollectionItem,i:number)=>collect(item,item.en,kind+'.'+i));
 if(collections.products){for(const key of Object.keys(productSpecifications))delete productSpecifications[key];products.splice(0,products.length,...collections.products.map(({en,specifications,...p})=>{productSpecifications[p.slug!]=(specifications||[]) as {name:string;value:string}[];return p as Product}));}
 if(collections.solutions){solutions.splice(0,solutions.length,...collections.solutions.map(({en,...s})=>s as Solution));const available=new Set(solutions.map(s=>s.slug));for(let i=discoveryGoals.length-1;i>=0;i--)if(!available.has(discoveryGoals[i]!.solution))(discoveryGoals as unknown as unknown[]).splice(i,1)}
 if(collections.plans){const labels=comparison.map(row=>row[0]);plans.splice(0,plans.length,...collections.plans.map(({en,id,comparison:cells,...p})=>({...p,...(id?{id}:{})} as unknown as Plan)));comparison.splice(0,comparison.length,...labels.map((label,i)=>[label,...collections.plans.map(p=>(p['comparison'] as (string|boolean)[]|undefined)?.[i]??'—')] as typeof comparison[number]));}
 return entries;
}
