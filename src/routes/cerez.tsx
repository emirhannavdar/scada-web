import {createFileRoute} from '@tanstack/react-router';
import {PrivacyDetails} from '@/components/site/PrivacyDetails';
import {seo} from '@/lib/seo';
export const Route=createFileRoute('/cerez')({head:()=>seo('Çerez Politikası','ScadaWatt web sitesi çerez politikası: tarayıcı depolaması, iletişim taslağı ve harita kullanımı.'),component:()=> <PrivacyDetails cookies={true}/> });
