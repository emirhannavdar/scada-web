import {createFileRoute} from '@tanstack/react-router';
import {CompanyPrivacyPolicy} from '@/components/site/CompanyPrivacyPolicy';
import {seo} from '@/lib/seo';
export const Route=createFileRoute('/privacy-policy')({
 head:()=>seo('Gizlilik Politikası','ScadaWatt gizlilik politikası: kişisel bilgiler, saha verileri, haberleşme güvenliği ve bilgi işleme amaçları.'),
 component:CompanyPrivacyPolicy,
});
