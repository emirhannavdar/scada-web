import {createFileRoute} from '@tanstack/react-router';
import {PrivacyDetails} from '@/components/site/PrivacyDetails';
import {seo} from '@/lib/seo';
export const Route=createFileRoute('/cerez')({head:()=>seo('Çerez Politikası','ScadaWatt web sitesinde çerezler, tarayıcı depolaması, oturum bilgileri ve üçüncü taraf harita hizmetlerinin kullanımı hakkında bilgi alın.'),component:()=> <PrivacyDetails cookies={true}/> });
