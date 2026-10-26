import {cmsText} from './cms-state';
import {isValidElement,useSyncExternalStore} from 'react';
import english from '@/content/en.json';
export type Language='tr'|'en';
const dictionary:Record<string,string>=english;
const listeners=new Set<()=>void>();
function storedLanguage():Language{try{return localStorage.getItem('scadawatt-language')==='en'?'en':'tr'}catch{return 'tr'}}
let language:Language=storedLanguage();
const subscribe=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener)}};
export const getLanguage=()=>language;
export const subscribeLocale=subscribe;
const translatedCache=new Map<string,string>();
export function setLanguage(next:Language){if(next===language)return;language=next;try{localStorage.setItem('scadawatt-language',next)}catch{}if(typeof document!=='undefined')document.documentElement.lang=next;listeners.forEach(listener=>listener());}
let contentRevision=0;
export function refreshCmsContent(){contentRevision++;listeners.forEach(listener=>listener());}
export function useLocale(){useSyncExternalStore(subscribe,()=>language+':'+contentRevision,()=> 'tr:0');return language;}
const fragments=Object.keys(dictionary).filter(k=>k.length>2&&dictionary[k]!==k).sort((a,b)=>b.length-a.length);
/** Translate display copy only. IDs, routes, units and data are never rewritten. */
export function translate<T>(value:T):T{
 if(value==null||isValidElement(value))return value;
 if(Array.isArray(value))return value.map(item=>translate(item)) as T;
 if(typeof value!=='string')return value;
 const override=cmsText(value,language);if(override!==undefined)return override as T;
 if(language==='tr')return value;
 const cached=translatedCache.get(value);if(cached!==undefined)return cached as T;
 const key=value.trim().replace(/\s+/g,' ');let result=dictionary[key];
 if(result===undefined){result=key;for(const source of fragments){if(result.includes(source)){result=result.split(source).join(dictionary[source]!);break;}}}
 const leading=/^\s/.test(value)?' ':'';const trailing=/\s$/.test(value)?' ':'';
 const output=leading+result+trailing;if(translatedCache.size>2000)translatedCache.clear();translatedCache.set(value,output);return output as T;
}
