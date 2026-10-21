import {createFileRoute} from '@tanstack/react-router';
import {CinematicHome} from '@/components/site/CinematicHome';
import {seo} from '@/lib/seo';
export const Route=createFileRoute('/')({head:()=>seo('Yazılım, Elektronik ve Enerji Teknolojileri',"ScadaWatt: güneş enerji santralleri için uzaktan izleme, SCADA, veri toplama ve enerji yönetimi çözümleri."),component:CinematicHome});
