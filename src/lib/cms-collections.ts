export type CollectionKind='products'|'solutions'|'plans';
export type CollectionItem={slug?:string;id?:string;code?:string;name?:string;title?:string;image?:string;en:Record<string,unknown>;[key:string]:unknown};
export type CmsCollections=Record<CollectionKind,CollectionItem[]>;
export const collectionLabels={products:'Donanımlar',solutions:'Çözümler',plans:'Paketler'};
export const managedRoots=new Set(['products','productSpecifications','solutions','plans','comparison','applicationStories']);
export function collectionChangeCount(current:CmsCollections|null,published:CmsCollections|undefined){if(!current||!published)return 0;let count=0;for(const kind of ['products','solutions','plans'] as const){const before=new Map(published[kind].map(v=>[v.slug||v.id,JSON.stringify(v)]));for(const item of current[kind]){const id=item.slug||item.id;if(before.get(id)!==JSON.stringify(item))count++;before.delete(id)}count+=before.size}return count}
