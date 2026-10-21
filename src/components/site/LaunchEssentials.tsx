import {PAGE_SECTIONS} from '../../../shared/page-sections.mjs';
import {CommunitySections} from './CommunitySections';
import {Link,useRouterState} from '@tanstack/react-router';
import {useEffect} from 'react';
import {Phone} from 'lucide-react';
import {contact,solutions,products,images} from '@/content/site';
import {translate as t,useLocale} from '@/lib/i18n';
import './launch.css';
export function LaunchEssentials(){
 const language=useLocale(),path=useRouterState({select:s=>s.location.pathname});
 useEffect(()=>{
  const canonical=document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const base=document.querySelector('meta[name="sw-origin"]')?.getAttribute('content')||(canonical?new URL(canonical.href).origin:location.origin);
  const roots=['/','/cozumler','/urunler','/scada-yazilimi','/saha-yapilandirici','/paketler','/hakkimizda','/iletisim','/gizlilik','/cerez','/kullanim-kosullari'];
  const valid=roots.includes(path)||products.some(p=>path==='/urunler/'+p.slug)||solutions.some(s=>path==='/cozumler/'+s.slug);
  const preview=new URLSearchParams(location.search).has('cms-preview');
  const robots=document.querySelector<HTMLMetaElement>('meta[name="robots"]');
  if(robots)robots.content=valid&&!preview&&document.querySelector('meta[name="sw-indexable"]')?.getAttribute('content')==='1'?'index,follow':'noindex,nofollow';
  if(!valid&&path!=='/kvkk')document.title=t('Sayfa bulunamadı.')+' | ScadaWatt';
  if(valid){const link=canonical||document.createElement('link');link.rel='canonical';link.href=base+path;if(!canonical)document.head.append(link)}else canonical?.remove();
  const product=products.find(p=>path==='/urunler/'+p.slug);
  const image=document.querySelector<HTMLMetaElement>('meta[property="og:image"]');
  if(image)image.content=new URL(product?.image||images.wordmark,base).href;
  for(const [property,content] of [['og:title',document.title],['og:description',document.querySelector('meta[name="description"]')?.getAttribute('content')||''],['og:url',base+path]] as const){
   let node=document.querySelector<HTMLMetaElement>('meta[property="'+property+'"]');if(!node){node=document.createElement('meta');node.setAttribute('property',property);document.head.append(node)}node.content=content;
  }
  const initial=document.getElementById('site-schema');if(initial){try{const graph=JSON.parse(initial.textContent||'[]');if(Array.isArray(graph))initial.textContent=JSON.stringify(graph.filter(item=>item['@type']!=='BreadcrumbList'));}catch{}};
  const element=document.getElementById('breadcrumb-schema');element?.remove();
  const parts=path.split('/').filter(Boolean);
  if(parts.length===2&&['urunler','cozumler'].includes(parts[0]!)){
   const item=parts[0]==='urunler'?products.find(x=>x.slug===parts[1]):solutions.find(x=>x.slug===parts[1]);
   if(item){const script=document.createElement('script');script.id='breadcrumb-schema';script.type='application/ld+json';script.textContent=JSON.stringify({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{ '@type':'ListItem',position:1,name:t('Ana sayfa'),item:base+'/'},{'@type':'ListItem',position:2,name:t(parts[0]==='urunler'?'Donanımlar':'Çözümler'),item:base+'/'+parts[0]},{'@type':'ListItem',position:3,name:t('name' in item?item.name:item.title),item:base+path}]});document.head.append(script);}
  }
  return()=>document.getElementById('breadcrumb-schema')?.remove();
 },[path,language]);
 return <>{!PAGE_SECTIONS[path.replace(/\/$/,'')||'/']&&<CommunitySections path={path}/>}{path!=='/'&&path!=='/iletisim'&&<a className="mobile-contact-call" href={contact.phoneHref} aria-label={t('ScadaWatt ekibini arayın')}><Phone size={18}/><span>{t('Bizi arayın')}</span></a>}</>;
}
