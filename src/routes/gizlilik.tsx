import {createFileRoute} from '@tanstack/react-router';
import {PrivacyDetails} from '@/components/site/PrivacyDetails';
import {seo} from '@/lib/seo';
export const Route=createFileRoute('/gizlilik')({head:()=>seo('Gizlilik Politikası','ScadaWatt web sitesi gizlilik politikası: iletişim formu, tarayıcı depolaması ve Google hizmetleri.'),component:()=> <PrivacyDetails cookies={false}/> });
