import {OrderedPageSections} from '@/components/site/OrderedPageSections';
import {createFileRoute} from '@tanstack/react-router';
import {SiteConfigurator} from '@/components/experiences/SiteConfigurator';
import {seo} from '@/lib/seo';
export const Route=createFileRoute('/saha-yapilandirici')({head:()=>seo('Saha Yapılandırıcısı','Saha cihazlarınızı, bağlantılarınızı ve önceliklerinizi belirleyin; ScadaWatt ekibiyle görüşmek için teknik bir ön değerlendirme hazırlayın.'),component:()=> <OrderedPageSections path="/saha-yapilandirici"><SiteConfigurator/></OrderedPageSections>});
