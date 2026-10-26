import {CommunitySections} from './CommunitySections';
import {sectionOrder} from '../../../shared/page-sections.mjs';
import {useHomePosition} from '@/lib/home-position';
import {useCmsDesign} from '@/lib/cms-design';
import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import {translate as _tx,useLocale as _useLocale} from '@/lib/i18n';
const DataVoyage = lazy(() => import('./DataVoyage').then(module => ({default:module.DataVoyage})));
import { MobileHomeHero } from './MobileHomeHero';
import { ProductTheatre } from './ProductExperience';
import { SolutionExperience } from './SolutionExperience';
import { Link } from '@tanstack/react-router';
import { ArrowUpRight } from 'lucide-react';
import { contact } from '@/content/site';
function SectionLabel({ children }: {
    children: React.ReactNode;
}) { _useLocale(); return <p className="film-label"><span />{_tx(children)}</p>; }
export function FinalConnection() { _useLocale(); return <section data-cms-section="contact" className="final-connection" id="iletisim"><div className="film-wrap"><SectionLabel>{_tx("B\u0130R SONRAK\u0130 ADIM")}</SectionLabel><div className="connection-heading"><h2>{_tx("Projenizi")}<br />{_tx("konu\u015Fal\u0131m.")}</h2><Link className="contact-orbit" to="/iletisim" search={{ tur: 'demo' }} aria-label={_tx("ScadaWatt demo talebi")}><ArrowUpRight size={65}/><span>{_tx("DEMO TALEP ED\u0130N")}</span></Link></div><div className="connection-bottom"><p>{_tx("Cihazlar\u0131n\u0131z, \u00F6l\u00E7\u00FCm noktalar\u0131n\u0131z ve yaz\u0131l\u0131m ihtiya\u00E7lar\u0131n\u0131z i\u00E7in")}<br />{_tx("ekibimizle g\u00F6r\u00FC\u015F\u00FCn.")}</p><div><a href={`mailto:${contact.email}`}>{_tx(contact.email)}<ArrowUpRight size={18}/></a><a href={contact.phoneHref}>{_tx(contact.phone)}<ArrowUpRight size={18}/></a></div></div><div className="film-plan-link"><span>{_tx("GES izleme \u00FCr\u00FCn\u00FCn\u00FCz i\u00E7in NANO / STANDART / PRO kapsamlar\u0131")}</span><Link to="/paketler">{_tx("\u0130zleme planlar\u0131n\u0131 kar\u015F\u0131la\u015Ft\u0131r\u0131n ")}<ArrowUpRight size={15}/></Link></div></div></section>; }
const Discovery=lazy(()=>import('./DiscoveryExperience'));
function DeferredDiscovery(){_useLocale();const ref=useRef<HTMLDivElement>(null),[ready,setReady]=useState(false);useEffect(()=>{if(!ref.current)return;if(typeof IntersectionObserver==='undefined'){setReady(true);return}const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setReady(true);observer.disconnect()}},{rootMargin:'600px'});observer.observe(ref.current);return()=>observer.disconnect()},[]);return <div data-cms-section="discovery" ref={ref} id="kesfet">{ready?<Suspense fallback={<div className="film-wrap discovery-placeholder">{_tx('Keşif araçları hazırlanıyor…')}</div>}><Discovery/></Suspense>:<div className="film-wrap discovery-placeholder"><a href="#kesfet" onClick={()=>setReady(true)}>{_tx('İhtiyacınıza uygun çözümü keşfedin.')} →</a></div>}</div>}
const homeComponents={hardware:ProductTheatre,solutions:SolutionExperience,discovery:DeferredDiscovery,contact:FinalConnection};
export function CinematicHome() { _useLocale();const design=useCmsDesign();const [mobile,setMobile]=useState(()=>typeof window!=='undefined'&&window.matchMedia('(max-width: 767px)').matches);useEffect(()=>{const query=window.matchMedia('(max-width: 767px)');const change=()=>setMobile(query.matches);query.addEventListener('change',change);change();return()=>query.removeEventListener('change',change)},[]);useHomePosition(mobile);return <div className="cinematic-home">{mobile?<MobileHomeHero/>:<Suspense fallback={<div style={{minHeight:'100svh'}}/>}><DataVoyage/></Suspense>}{sectionOrder(design,'/').map(id=>{if(id==='faq'||id==='reviews')return <CommunitySections key={id} path="/" only={id}/>;const Component=homeComponents[id as keyof typeof homeComponents];return Component?<Component key={id}/>:null})}</div>; }
