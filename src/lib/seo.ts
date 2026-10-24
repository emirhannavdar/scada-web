import {translate} from './i18n';
export function seo(title: string, description: string) {
  const t = `${title} | ScadaWatt`;
  return {
    meta: [
      { title: t },
      { name: "description", content: description },
      { property: "og:title", content: t },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}

/** Translate the page title before adding the brand suffix. */
export function localizedSeoTitle(title:string){
 const suffix=' | ScadaWatt';
 return title.endsWith(suffix)?translate(title.slice(0,-suffix.length))+suffix:translate(title);
}
export function applySeoMetadata(title:string,description:string){
 document.title=localizedSeoTitle(title);
 const set=(attribute:'name'|'property',key:string,value:string)=>{
  let node=document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if(!node){node=document.createElement('meta');node.setAttribute(attribute,key);document.head.append(node)}
  node.content=value;
 };
 const text=translate(description);
 set('name','description',text);
 for(const [attribute,key,value] of [
  ['property','og:title',document.title],['property','og:description',text],['property','og:type','website'],
  ['name','twitter:title',document.title],['name','twitter:description',text],['name','twitter:card','summary_large_image'],
 ] as const)set(attribute,key,value);
}
