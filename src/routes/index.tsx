import {createFileRoute} from '@tanstack/react-router';
import {CinematicHome} from '@/components/site/CinematicHome';
import {seo} from '@/lib/seo';
export const Route=createFileRoute('/')({head:()=>seo('Yazılım, Elektronik ve Enerji Teknolojileri',"ScadaWatt; SCADA yazılımı, veri toplama, uzaktan izleme ve enerji yönetimi çözümleri geliştirir. Yazılım ve elektronik ürünlerimizi keşfedin."),component:CinematicHome});
