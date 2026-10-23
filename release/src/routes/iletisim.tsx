import {OrderedPageSections} from '@/components/site/OrderedPageSections';
import {translate as t,useLocale} from '@/lib/i18n';
import {createFileRoute} from '@tanstack/react-router';
import {ArrowUpRight,Mail,MapPin,Phone} from 'lucide-react';
import {z} from 'zod';
import {ContactForm} from '@/components/site/ContactForm';
import {contact} from '@/content/site';
import {seo} from '@/lib/seo';
import '@/components/site/contact-about.css';
const search=z.object({ilgi:z.string().max(150).optional(),ilgiler:z.array(z.string().max(150)).max(25).optional(),mesaj:z.string().max(4000).optional(),tur:z.enum(['demo','teklif','bilgi']).optional()});
export const Route=createFileRoute('/iletisim')({validateSearch:search,head:()=>seo('İletişim ve Demo Talebi','ScadaWatt ile iletişime geçin; demo, teklif veya bilgi talebinizi iletin. Ankara, Yenimahalle.'),component:Contact});
function Contact(){useLocale();const {ilgi,ilgiler,tur,mesaj}=Route.useSearch();return <div className="company-page contact-page"><div className="company-container"><header className="company-heading"><p className="company-kicker">{t('İletişim')}</p><h1>{t('Birlikte doğru çözümü bulalım.')}</h1><p>{t('İhtiyacınızı paylaşın. Demo, teklif veya bilgi talebinizi doğru kapsamla hazırlayın.')}</p></header><OrderedPageSections path="/iletisim"><div className="contact-layout"><aside className="contact-location"><p className="company-kicker">{t('ScadaWatt / Ankara')}</p><h2>{t('Bize ulaşın.')}</h2><a href={contact.mapHref} target="_blank" rel="noreferrer"><MapPin size={19}/><span>{contact.address}</span></a><a href={contact.phoneHref}><Phone size={19}/>{contact.phone}</a><a href={`mailto:${contact.email}`}><Mail size={19}/>{contact.email}</a><div className="contact-map"><iframe src={contact.mapEmbed} title={t('ScadaWatt ofis konumu')} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade"/></div><a className="contact-directions" href={contact.mapHref} target="_blank" rel="noreferrer">{t('Google Haritalar’da aç')}<ArrowUpRight size={17}/></a></aside><ContactForm key={JSON.stringify([ilgi,ilgiler,tur,mesaj])} defaultInterest={ilgi} defaultInterests={ilgiler} defaultType={tur} defaultMessage={mesaj}/></div></OrderedPageSections></div></div>}
