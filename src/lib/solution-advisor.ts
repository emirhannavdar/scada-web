import {translate as t} from '@/lib/i18n';
import {discoveryGoals,solutions,demoScenarios} from '@/content/site';
export function recommendSolutions(ids:readonly string[]){const wanted=new Set(ids);const slugs=[...new Set(discoveryGoals.filter(g=>wanted.has(g.id)).map(g=>g.solution))];return slugs.flatMap(slug=>{const solution=solutions.find(s=>s.slug===slug);return solution?[solution]:[]});}
export function demoSnapshot(id:string|null){const scenario=demoScenarios.find(s=>s.id===id);return {scenario,power:scenario?.power??780,quality:scenario?.quality??'GOOD',limit:900,reference:780,capacity:1000,alarmActive:Boolean(scenario),delta:scenario?Math.round((scenario.power-780)/780*1000)/10:0};}

export function buildAdvisorMessage(ids:readonly string[],control:boolean){
 const goals=discoveryGoals.filter(g=>ids.includes(g.id)),matches=recommendSolutions(ids);
 return [t('Merhaba ScadaWatt ekibi,'),'',t('Aşağıdaki ihtiyaçlarım için ScadaWatt çözümlerini değerlendirmek ve bir demo görüşmesi planlamak istiyorum.'),'',t('Önceliklerim:'),...goals.map(g=>'• '+t(g.label)),'',t('İlgilendiğim çözümler:'),...matches.map(s=>'• '+t(s.title)),'',t('Talep ettiğim kapsam:')+' '+t(control?'İzleme, analiz ve kontrol olanakları':'İzleme ve analiz'),'',t('Demoda, bu ihtiyaçların saha verileri, cihaz durumları ve raporlama ekranları üzerinden nasıl karşılandığını görmek isterim.'),t('Saha türü, cihazlar ve kurulum detaylarını görüşmede birlikte değerlendirebiliriz.'),t('Uygun bir demo planlamak için benimle iletişime geçmenizi rica ederim.')].join('\n');
}
