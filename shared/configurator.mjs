export const CONFIGURATOR_FIELD='data.configuratorContent.definition';
const pair=(tr,en)=>({tr,en});
const option=(id,tr,en,solutions=[],hardware=[])=>({id,label:pair(tr,en),solutions,hardware});
export const defaultConfigurator={
 version:1,title:pair('Sahanızdan başlayalım.',"Let's start with your site."),intro:pair('Cihazlarınızı, bağlantılarınızı ve önceliklerinizi paylaşın. Görüşmeye net bir teknik özetle başlayın.','Describe your devices, connections and priorities. Start the conversation with a clear technical brief.'),
 resultTitle:pair('Görüşmenin çerçevesi hazır.','Your discussion brief is ready.'),resultIntro:pair('Aşağıdaki yapı, verdiğiniz bilgilere göre görüşülecek kapsamı özetler.','The following outlines the scope to discuss based on your inputs.'),
 submitLabel:pair('Bu özetle ekibe danışın','Discuss this brief with the team'),submitType:'bilgi',showSummary:true,showDiagram:true,showHardware:true,
 notice:pair('Bu bir ön değerlendirmedir. Kesin ürün seçimi, donanım adedi ve uyumluluk ScadaWatt ekibince doğrulanır.','This is a preliminary assessment. Final product selection, quantities and compatibility are confirmed by the ScadaWatt team.'),
 baseSolutions:[],baseHardware:['s3000i'],
 sections:[{id:'facility',title:pair('Tesisiniz','Your facility')},{id:'connections',title:pair('Bağlantılar','Connections')},{id:'priorities',title:pair('Öncelikler','Priorities')}],
 questions:[
 {id:'facilityType',section:'facility',label:pair('Tesis türü','Facility type'),help:pair('Tesisinizin türünü seçin.','Select your facility type.'),type:'single',enabled:true,required:true,defaultValue:'solar',options:[option('solar','Güneş enerjisi','Solar energy'),option('wind','Rüzgâr enerjisi','Wind energy',['yenilenebilir-enerji']),option('hybrid','Hibrit üretim','Hybrid generation',['yenilenebilir-enerji']),option('industrial','Endüstriyel tesis','Industrial facility',['enerji-yonetimi'])]},
 {id:'sites',section:'facility',label:pair('Saha sayısı','Number of sites'),help:pair('',''),type:'number',enabled:true,required:true,defaultValue:1,integer:true,min:1,max:999,maxLength:120,options:[]},
 {id:'inverters',section:'facility',label:pair('Toplam evirici sayısı','Total number of inverters'),help:pair('Evirici yoksa 0 girin.','Enter 0 if there are no inverters.'),type:'number',enabled:true,required:false,defaultValue:10,integer:true,min:0,max:100000,options:[]},
 {id:'brand',section:'facility',label:pair('Cihaz markası / modeli','Device make / model'),help:pair('Biliyorsanız ekleyin; zorunlu değil.','Add it if known; this is optional.'),type:'text',enabled:true,required:false,defaultValue:'',maxLength:120,options:[]},
 {id:'deviceLink',section:'connections',label:pair('Cihaz bağlantısı','Device connection'),help:pair('',''),type:'select',enabled:true,required:false,defaultValue:'unknown',options:[option('rs485','RS485','RS485'),option('ethernet','Ethernet','Ethernet'),option('mixed','RS485 + Ethernet','RS485 + Ethernet'),option('unknown','Henüz bilmiyorum','Not sure yet')]},
 {id:'internet',section:'connections',label:pair('İnternet erişimi','Internet access'),help:pair('',''),type:'select',enabled:true,required:false,defaultValue:'unknown',options:[option('wired','Kablolu internet','Wired internet'),option('cellular','Hücresel bağlantı','Cellular connection'),option('unknown','Henüz bilmiyorum','Not sure yet')]},
 {id:'meter',section:'connections',label:pair('Elektrik sayacı var.','An electricity meter is available.'),help:pair('',''),type:'checkbox',enabled:true,required:false,defaultValue:true,options:[option('yes','Var','Available')]},
 {id:'analyzer',section:'connections',label:pair('Enerji analizörü var.','An energy analyser is available.'),help:pair('',''),type:'checkbox',enabled:true,required:false,defaultValue:true,options:[option('yes','Var','Available')]},
 {id:'priorities',section:'priorities',label:pair('Öncelikleriniz','Your priorities'),help:pair('Bir veya birden fazla öncelik seçin.','Select one or more priorities.'),type:'multi',enabled:true,required:true,defaultValue:[],minChoices:1,maxChoices:10,options:[option('generation','Üretim performansını izlemek','Monitor generation performance',['ges-izleme']),option('remote','Cihazlara uzaktan görünürlük','Remote device visibility',['uzaktan-izleme']),option('energy','Enerji tüketimini anlamak','Understand energy consumption',['enerji-yonetimi']),option('quality','Reaktif gücü takip etmek','Monitor reactive power',['kompanzasyon']),option('limits','Operasyonel limitleri izlemek','Monitor operational limits',['limit-yonetimi'])]},
 {id:'control',section:'priorities',label:pair('İzlemenin yanında kontrol ihtiyacım da var.','I also need control functions.'),help:pair('Kontrol kapsamı ve emniyet koşulları teknik ekipçe değerlendirilir.','Control scope and safety requirements are reviewed by the technical team.'),type:'checkbox',enabled:true,required:false,defaultValue:false,options:[option('yes','Kontrol ihtiyacı','Control requirement',['limit-yonetimi'],['s4000mc'])]},
 ],
 flow:[{title:pair('Saha cihazları','Field devices'),detail:pair('Ölçüm kaynakları','Measurement sources')},{title:pair('Veri toplama','Data acquisition'),detail:pair('Donanım kapsamı incelenecek','Hardware scope to be reviewed')},{title:pair('Bağlantı','Connection'),detail:pair('Haberleşme altyapısı','Communication infrastructure')},{title:pair('ScadaWatt','ScadaWatt'),detail:pair('Web / mobil görünüm','Web / mobile interface')}]
};
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
export function validateConfigurator(value){
 const error=m=>{throw Error(m)};
 if(!object(value)||JSON.stringify(value).length>250000)error('Yapılandırıcı verisi geçersiz veya çok büyük.');
 const text=(v,label,required=true)=>{if(typeof v!=='string'||v.length>1500||(required&&!v.trim()))error(label+' geçersiz.');return v};
 const bilingual=(v,label,required=true)=>{if(!object(v))error(label+' TR/EN doldurulmalı.');text(v.tr,label,required);text(v.en,label,required)};
 const id=(v)=>{if(typeof v!=='string'||!/^[a-zA-Z][a-zA-Z0-9_-]{0,70}$/.test(v)||['constructor','prototype','__proto__'].includes(v))error('Geçersiz veya sakıncalı kimlik.')};
 const slugs=v=>{if(!Array.isArray(v)||v.length>100||v.some(x=>typeof x!=='string'||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x)||x.length>80))error('Çözüm / donanım eşleştirmesi geçersiz.')};
 if(value.version!==1)error('Yapılandırıcı sürümü desteklenmiyor.');
 for(const k of ['title','intro','resultTitle','resultIntro','submitLabel','notice'])bilingual(value[k],k,k!=='notice'&&k!=='intro'&&k!=='resultIntro');
 if(!['bilgi','demo','teklif'].includes(value.submitType))error('Talep türü geçersiz.');
 for(const k of ['showSummary','showDiagram','showHardware'])if(typeof value[k]!=='boolean')error('Görünüm seçeneği geçersiz.');
 slugs(value.baseSolutions);slugs(value.baseHardware);
 if(!Array.isArray(value.sections)||value.sections.length<1||value.sections.length>15)error('1–15 adım olmalı.');
 const sections=new Set();for(const s of value.sections){if(!object(s))error('Adım geçersiz.');id(s.id);if(sections.has(s.id))error('Adım kimliği tekrarlanıyor.');sections.add(s.id);bilingual(s.title,'Adım başlığı')}
 if(!Array.isArray(value.questions)||value.questions.length<1||value.questions.length>200)error('1–200 soru olmalı.');
 const seen=new Map();let enabled=0;
 for(const q of value.questions){
  if(!object(q))error('Soru geçersiz.');id(q.id);if(seen.has(q.id))error('Soru kimliği tekrarlanıyor.');if(!sections.has(q.section))error('Soru adımı bulunamadı.');
  bilingual(q.label,'Soru');bilingual(q.help,'Açıklama',false);
  if(!['single','select','multi','text','number','checkbox'].includes(q.type))error('Soru türü geçersiz.');
  if(typeof q.enabled!=='boolean'||typeof q.required!=='boolean')error('Soru seçenekleri geçersiz.');if(q.enabled)enabled++;
  if(!Array.isArray(q.options)||q.options.length>100)error('En fazla 100 cevap seçeneği olabilir.');
  if(['single','select','multi','checkbox'].includes(q.type)&&!q.options.length)error('Seçimli sorunun en az bir cevabı olmalı.');
  const options=new Set();for(const opt of q.options){if(!object(opt))error('Cevap geçersiz.');id(opt.id);if(options.has(opt.id))error('Cevap kimliği tekrarlanıyor.');options.add(opt.id);bilingual(opt.label,'Cevap');slugs(opt.solutions);slugs(opt.hardware)}
  for(const k of ['min','max','minLength','maxLength','minChoices','maxChoices'])if(q[k]!==undefined&&(!Number.isFinite(q[k])||Math.abs(q[k])>1000000000))error('Sayısal sınır geçersiz.');
  if(q.min!==undefined&&q.max!==undefined&&q.min>q.max)error('Alt sınır üst sınırdan büyük olamaz.');
  if(q.integer!==undefined&&typeof q.integer!=='boolean')error('Tam sayı ayarı geçersiz.');
  if(q.minLength!==undefined&&(!Number.isInteger(q.minLength)||q.minLength<0||q.minLength>4000||q.maxLength!==undefined&&q.minLength>q.maxLength))error('Minimum metin uzunluğu geçersiz.');
  for(const k of ['minChoices','maxChoices'])if(q[k]!==undefined&&(!Number.isInteger(q[k])||q[k]<0||q[k]>100))error('Seçim sınırı 0–100 tam sayı olmalı.');
  if(q.minChoices!==undefined&&q.type==='multi'&&q.minChoices>q.options.length)error('Minimum seçim mevcut cevap sayısını aşamaz.');
  if(q.maxLength!==undefined&&(!Number.isInteger(q.maxLength)||q.maxLength<1||q.maxLength>4000))error('Metin uzunluğu 1–4000 olmalı.');
  if(q.minChoices!==undefined&&q.maxChoices!==undefined&&q.minChoices>q.maxChoices)error('Seçim sınırları geçersiz.');
  if(!['string','number','boolean'].includes(typeof q.defaultValue)&&!(Array.isArray(q.defaultValue)&&q.defaultValue.every(x=>typeof x==='string')))error('Varsayılan cevap geçersiz.');
  if(q.when){if(!object(q.when)||!seen.has(q.when.question))error('Koşul yalnız önceki bir soruya bağlanabilir.');const parent=seen.get(q.when.question);if(!['single','select','multi','checkbox'].includes(parent.type)||!parent.options.some(o=>o.id===q.when.option))error('Koşul cevabı bulunamadı.');}
  if(q.type==='text'&&typeof q.defaultValue!=='string'||q.type==='checkbox'&&typeof q.defaultValue!=='boolean'||q.type==='number'&&q.defaultValue!==''&&(typeof q.defaultValue!=='number'||!Number.isFinite(q.defaultValue)))error('Varsayılan cevap türü uyumsuz.');
  if(['single','select'].includes(q.type)&&q.defaultValue!==''&&!options.has(q.defaultValue))error('Varsayılan cevap seçenekler arasında yok.');
  if(q.type==='multi'&&(!Array.isArray(q.defaultValue)||q.defaultValue.some(id=>!options.has(id))))error('Varsayılan seçimler geçersiz.');
  if(q.type==='checkbox'&&q.options.length!==1)error('Onay kutusunda tam bir cevap seçeneği olmalı.');
  if(q.type==='number'&&typeof q.defaultValue==='number'&&(q.min!==undefined&&q.defaultValue<q.min||q.max!==undefined&&q.defaultValue>q.max||q.integer&&!Number.isInteger(q.defaultValue)))error('Varsayılan sayı sınırlar içinde ve doğru türde olmalı.');
  if(q.type==='text'&&q.defaultValue!==''&&(q.defaultValue.length>(q.maxLength??4000)||q.defaultValue.length<(q.minLength??0)))error('Varsayılan metin uzunluğu sınırlar içinde olmalı.');
  seen.set(q.id,q);
 }
 if(!enabled)error('En az bir soru etkin olmalı.');
 if(!Array.isArray(value.flow)||value.flow.length>12)error('Akış en fazla 12 adım olabilir.');for(const node of value.flow){bilingual(node.title,'Akış başlığı');bilingual(node.detail,'Akış açıklaması',false)}
 return structuredClone(value);
}
export function parseConfigurator(raw){try{return validateConfigurator(typeof raw==='string'?JSON.parse(raw):raw)}catch{return structuredClone(defaultConfigurator)}}
