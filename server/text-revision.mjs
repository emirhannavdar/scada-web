/** Text-only revision. Does not write runtime data, layouts, images or permissions. */
import {readFileSync} from 'node:fs';
export const textRevision=JSON.parse(readFileSync(new URL('../shared/text-revision.json',import.meta.url),'utf8'));
const byId=new Map(textRevision.changes.map(change=>[change.id,change]));
const enPairs=new Map();
for(const change of textRevision.changes){const old=change.old.en,next=change.value.en;if(typeof old==='string'&&old!==next){if(enPairs.has(old)&&enPairs.get(old)!==next)throw Error('Ambiguous English text revision');enPairs.set(old,next);}}
export function reviseTextValues(values){const result={...values};for(const [id,pair]of Object.entries(values)){const change=byId.get(id);if(!change||!pair||typeof pair!=='object')continue;const next={...pair};for(const lang of ['tr','en'])if(typeof change.old[lang]==='string'&&pair[lang]===change.old[lang])next[lang]=change.value[lang];result[id]=next;}return result;}
export function reviseCollectionTexts(value,english=false){if(typeof value==='string')return english?(enPairs.get(value)??value):(textRevision.tr[value]??value);if(Array.isArray(value))return value.map(item=>reviseCollectionTexts(item,english));if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,['slug','id','code','image','screenId','to'].includes(key)?item:reviseCollectionTexts(item,english||key==='en')]));return value;}
