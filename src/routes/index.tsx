import {createFileRoute} from '@tanstack/react-router';
import {CinematicHome} from '@/components/site/CinematicHome';
import {seo} from '@/lib/seo';
export const Route=createFileRoute('/')({head:()=>seo('Yazılım, Elektronik ve Enerji Teknolojileri','ScadaWatt: sahadaki ölçümden yazılım ekranına veri toplama, SCADA ve enerji yönetimi teknolojileri.'),component:CinematicHome});
