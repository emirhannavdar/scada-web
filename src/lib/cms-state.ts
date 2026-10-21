export type CmsEntry={id:string;target:'data'|'copy'|'asset';kind:string;path?:string[];source?:string;tr:string|boolean;en:string|boolean};
const copy=new Map<string,{tr:string;en:string}>(),media=new Map<string,string>();
export function setCmsEntries(entries:CmsEntry[]){copy.clear();media.clear();for(const e of entries){if(e.kind==='text'&&typeof e.tr==='string'&&typeof e.en==='string'){const value={tr:e.tr,en:e.en};if(e.source)copy.set(e.source,value);copy.set(e.tr.trim().replace(/\s+/g,' '),value)}if(e.target==='asset'&&e.source&&typeof e.tr==='string')media.set(e.source,e.tr)}}
export function cmsText(source:string,language:'tr'|'en'){return copy.get(source.trim().replace(/\s+/g,' '))?.[language]}
export function cmsAsset(source:string|undefined){return source?media.get(source)||source:source}
