export const communityContent={definition:'{}'};
export const configuratorContent={definition:'{}'};
export const images={web:"/assets/web.webp",app:"/assets/app.webp",logo:"/assets/scadawatt-mini-logo.png",wordmark:"/assets/scadawatt-logo.png"};

export const contact = {
  address: "Yeni Batı Mah. 2399 Sok. No: 2 Yenimahalle / Ankara",
  phone: "0312 255 55 86",
  phoneHref: "tel:+903122555586",
  email: "info@scadawatt.com",
  mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d412.77193959823535!2d32.687390142726436!3d39.97714719108156!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14d3364c5761c97f:0xba3ff258fc66f49f!2sYeni Batı, 2399. Sk. No:2, 06370 Yenimahalle/Ankara!5e0!3m2!1str!2str!4v1724585418339!5m2!1str!2str",
  mapHref: "https://www.google.com/maps?cid=13420711878593016991",
};

export let slogan = "Bugün Ne Kaybettiğinizi Biliyor musunuz?";
export let vision = "Sahadaki her ölçümü anlamlı bilgiye dönüştürerek kayıpları kazanca çevirmek.";

export const aboutPoints = [
  "Santrallerinizdeki tüm ekipmanları tek bir platformdan uzaktan izleme ve kontrol",
  "Üretim ve tüketimi analiz ederek verimliliği artırma, kayıpları en aza indirme",
  "Reaktif güç ve kompanzasyon takibiyle enerji kalitesini kontrol etme, ceza riskini azaltma",
  "Saatlik veriler üzerinden fatura doğrulama",
  "Piyasa takas fiyatını (PTF) üretim verisiyle birlikte izleyerek santrali daha bilinçli yönetme",
];

export type Solution = {
  slug: string;
  title: string;
  short: string;
  body: string[];
  points: string[];
  featured?: boolean;
  image?: string;
  headline?: string;
  caption?: string;
};

export const solutions: Solution[] = [
 {slug:'enerji-yonetimi',title:'Enerji Yönetimi',short:'Üretim, tüketim ve enerji kalitesi verilerini birlikte değerlendirin.',body:["ScadaWatt üretim, tüketim, limit ve reaktif güç verilerini aynı platformda toplar. OSOS sayaç verisi, saatlik mahsuplaşma takibi ve piyasa takas fiyatlarıyla (PTF) enerjinin hem teknik hem ticari tarafını birlikte görürsünüz.","Saatlik mahsuplaşma takibi sunan altyapımız, 15 dakikalık uzlaştırma dönemine geçişe uygun şekilde hazırlanmaktadır."],points:['Üretim ve tüketim takibi','Enerji kalitesi ve reaktif güç','Limit takibi ve raporlama']},
 {slug:'uzaktan-izleme',title:'Uzaktan İzleme',short:'Ölçümleri, cihaz durumlarını ve alarmları yazılım üzerinden takip edin.',body:["Evirici, analizör, sayaç ve sensör verileri ScadaWatt veri toplama cihazı üzerinden platforma aktarılır. Cihaz durumları, haberleşme kesintileri ve alarmlar web panelinden ve mobil uygulamadan takip edilir."],points:['Cihaz verileri','Alarm ve bildirim','Web ve mobil görünüm']},
 {slug:'yenilenebilir-enerji',title:'Yenilenebilir Enerji',short:'Üretim sistemlerinde veri toplama ve yazılım teknolojileri.',body:["Güneş enerji santrallerinde üretimi doğru ölçmek, performansı izlemek ve gerektiğinde sahaya müdahale edebilmek gerekir. ScadaWatt bu üç ihtiyacı tek platformda karşılar.",'Diğer kaynaklar için cihaz uyumluluğu ve uygulanabilecek kapsam proje özelinde değerlendirilmelidir.'],points:['Üretim verileri','Performans takibi','Saha cihazlarıyla haberleşme']},
  {
    slug: "ges-izleme",
    title: "GES Uzaktan İzleme",
    short: "Santralinizdeki tüm ekipmanları tek platformdan, gerçek zamanlı izleyin.",
    body: [
      "Evirici, enerji analizörü, elektrik sayacı ve sensörlerden gelen veriler S3000i veri toplama cihazı üzerinden ScadaWatt platformuna aktarılır.",
      "Farklı cihazlardan alınan veriler eş zamanlı karşılaştırılır ve en doğru üretim raporu oluşturulur. MPPT-dize ve evirici performans analizleriyle kayıp noktaları görünür hale gelir.",
    ],
    points: ["Çok noktadan üretim verisi", "MPPT-dize performans analizi", "Evirici performans analizi", "Gün sonu üretim raporları"],
  },
  {
    slug: "limit-yonetimi",
    title: "Limit Yönetimi",
    short: "Evirici ve saha limitlerini anlık takip edin, ceza riskini azaltın.",
    body: [
      "Evirici ve saha limitleriniz anlık olarak takip edilir. Operasyonel hatalar nedeniyle oluşabilecek limit aşımları ve ceza riskleri önceden yakalanır.",
      "PRO pakette limitler yalnızca görüntülenmez; ScadaWatt üzerinden doğrudan yönetilir.",
    ],
    points: ["Evirici limit görüntüleme", "Evirici limit yönetimi (PRO)", "Limit aşım uyarıları"],
  },
  {
    slug: "kompanzasyon",
    title: "Kompanzasyon Takibi ve Kontrolü",
    short: "Reaktif güç sürekli izlenir; limit aşımlarında kompanzasyon otomatik kontrol edilir.",
    body: [
      "Reaktif güç değerleri sürekli izlenir. Limit aşımlarında ScadaWatt kompanzasyon sistemini kontrol ederek reaktif ceza riskini azaltır.",
      "Saatlik veriler üzerinden fatura doğrulaması yapılır; hatalı faturalar kolayca fark edilir.",
    ],
    points: ["Reaktif güç izleme", "Otomatik kompanzasyon kontrolü", "Saatlik fatura doğrulama"],
  },
  {
    slug: "zero-injection",
    title: "Zero Injection",
    short: "Tüketim kadar üretim: şebeke yönüne enerji gitmez.",
    body: [
      "Zero Injection modülü tesisin anlık tüketimini ölçer ve evirici gücünü buna göre sürekli ayarlar; üretim tüketimi aşmaz.",
      "Böylece şebeke yönüne enerji gitmemesi sağlanır. Tüm süreç ScadaWatt ekranları ve raporlarıyla izlenir ve yönetilir.",
    ],
    points: ["Dinamik evirici güç kontrolü", "Anlık tüketim ölçümü", "Şebekeye sıfır enjeksiyon"],
  },
  {
    slug: "planli-uretim-durdurma",
    title: "Planlı Yük Atma",
    short: "Planlı yük atma talimatlarını sahaya otomatik uygulayın.",
    body: [
      "Planlı yük atma talimatları ScadaWatt üzerinden tanımlanır ve belirlenen saatte sahaya otomatik uygulanır; ekibin sahaya gitmesine gerek kalmaz.",
      "PRO pakette acil durdurma eylemi ve hücrenin uzaktan açılıp kapatılması da bulunur.",
    ],
    points: ["Otomatik yük atma", "Acil durdurma eylemi (PRO)", "Uzaktan hücre açma / kapama (PRO)"],
  },
  {
    slug: "bildirimler",
    title: "Anlık Bildirimler",
    short: "Alarm, limit aşımı ve gün sonu üretim bilgisi; SMS, e-posta, iOS ve Android.",
    body: [
      "Gün sonu üretim bilgileri, anlık alarm durumları ve limit aşım uyarıları gibi tüm kritik olaylar anında iletilir.",
      "Bildirimler SMS, e-posta ve iOS / Android uygulama kanallarından alınabilir.",
    ],
    points: ["SMS", "E-posta", "iOS", "Android"],
  },
];

export type Product = {
  slug: string;
  code: string;
  name: string;
  image: string;
  tagline: string;
  summary: string;
  role: string;
  hotspots: { x: number; y: number; label: string }[];
};

export const products: Product[] = [
  {
    slug: "s3000i",
    code: "S3000i",
    name: "ScadaWatt S3000i",
    image: "/assets/s3000i.webp",
    tagline: "Ekosistemin veri toplama ve işleme merkezi",
    summary:
      "S3000i, ScadaWatt ekosisteminin sahadaki merkezidir. Evirici, analizör, sayaç ve sensörlerden veriyi okur, sahada işler ve saklar, ardından ScadaWatt platformuna iletir. İnternet bağlantısı kesildiğinde kayda devam eder.",
    role: "Veri toplama · İşleme · Depolama",
    hotspots: [
      { x: 30, y: 40, label: "Saha cihazlarıyla haberleşme" },
      { x: 65, y: 55, label: "Yerel veri işleme ve depolama" },
      { x: 50, y: 75, label: "Platforma veri iletimi" },
    ],
  },
  {
    slug: "s4000mc",
    code: "S4000MC",
    name: "ScadaWatt S4000MC",
    image: "/assets/s4000mc.webp",
    tagline: "Karmaşık ve özel ihtiyaçlar için çok amaçlı cihaz",
    summary:
      "S4000MC, daha karmaşık ve özel ihtiyaçlara yönelik tasarlanmış çok amaçlı bir cihazdır. Verileri toplamak ve işlemek için S3000i ile birlikte çalışarak kontrol senaryolarını genişletir.",
    role: "Çok amaçlı kontrol · Özel senaryolar",
    hotspots: [
      { x: 35, y: 45, label: "Çok amaçlı kontrol" },
      { x: 62, y: 60, label: "S3000i ile entegre çalışma" },
    ],
  },
  {
    slug: "lomr-07h",
    code: "LOMR-07H",
    name: "ScadaWatt LOMR-07H",
    image: "/assets/lomr.webp",
    tagline: "Şebeke arızasında tesis koruması",
    summary:
      "LOMR-07H şebekenin gerilim ve frekansını sürekli ölçer. Arıza algıladığında röle çıkışlarını tetikler ve kumanda panosu üzerinden tesisin şebeke bağlantısının güvenli şekilde ayrılmasını sağlar. RS485 Modbus ile ScadaWatt'a bağlanır.",
    role: "Şebeke arıza algılama · Röle tetikleme",
    hotspots: [
      { x: 40, y: 42, label: "Şebeke arızası algılama" },
      { x: 60, y: 65, label: "Röle çıkışları" },
    ],
  },
];

export type Plan = { id?:string; name: string; term: string; recommended?: boolean; features: string[] };

export const plans: Plan[] = [
  {
    name: "NANO",
    term: "Ömür boyu kullanım",
    features: ["Aynı sahada tek marka evirici", "Gün sonu üretim mailleri", "Alarm mailleri", "Sadece eviricilerle haberleşme"],
  },
  {
    name: "STANDART",
    term: "Yıllık abonelik",
    features: [
      "Aynı sahada birçok marka evirici",
      "Gün sonu üretim raporu (Mail, SMS)",
      "Alarm bilgisi (Mail, SMS)",
      "MPPT-dize performans analizi",
      "Evirici performans analizi",
      "Evirici limit görüntüleme",
      "Tüm cihazlarla haberleşme",
    ],
  },
  {
    name: "PRO",
    term: "Yıllık abonelik",
    features: ["Standart paketteki tüm hizmetler", "Evirici limit yönetimi", "Acil durdurma eylemi", "Uzaktan hücre açma / kapama"],
  },
];

/** Karşılaştırma tablosu: [özellik, NANO, STANDART, PRO] */
export const comparison: [string, boolean | string, boolean | string, boolean | string][] = [
  ["Evirici markası", "Tek marka", "Çoklu marka", "Çoklu marka"],
  ["Gün sonu üretim bildirimi", "Mail", "Mail, SMS", "Mail, SMS"],
  ["Alarm bildirimi", "Mail", "Mail, SMS", "Mail, SMS"],
  ["Haberleşme", "Sadece evirici", "Tüm cihazlar", "Tüm cihazlar"],
  ["MPPT-dize performans analizi", false, true, true],
  ["Evirici performans analizi", false, true, true],
  ["Evirici limit görüntüleme", false, true, true],
  ["Evirici limit yönetimi", false, false, true],
  ["Acil durdurma eylemi", false, false, true],
  ["Uzaktan hücre açma / kapama", false, false, true],
];

export const nav = [
  { to: "/cozumler", label: "Çözümler" },
  { to: "/urunler", label: "Ürünler" },
  { to: "/scada-yazilimi", label: "SCADA Yazılımı" },
  { to: "/paketler", label: "Paketler" },
  { to: "/hakkimizda", label: "Hakkımızda" },
] as const;

// Önceki ScadaWatt kaynak taramasından alınan ürün tabloları; ICERIK_KAYNAKLARI.md.
export const productSpecifications:Record<string,{name:string;value:string}[]>={
  "s3000i": [
    {
      "name": "Besleme Gerilimi",
      "value": "12-30 VDC"
    },
    {
      "name": "Dahili Dijital Giriş",
      "value": "3 Adet"
    },
    {
      "name": "Haberleşme Arayüzü",
      "value": "RS485, RJ45 Ethernet"
    },
    {
      "name": "CPU",
      "value": "4 Çekirdek"
    },
    {
      "name": "Çekirdek Saat Hızı",
      "value": "700 MHz"
    },
    {
      "name": "Dahili Gerçek Zamanlı Saat",
      "value": "Evet"
    },
    {
      "name": "Hafıza",
      "value": "12GB Dahili"
    },
    {
      "name": "Ağırlık",
      "value": "0.3 kg"
    },
    {
      "name": "Ebatlar",
      "value": "110x120x46mm"
    },
    {
      "name": "Çalışma Sıcaklığı",
      "value": "-20°C ~ +60°C"
    }
  ],
  "s4000mc": [
    {
      "name": "Besleme Gerilimi",
      "value": "12-30 VDC"
    },
    {
      "name": "Dahili Dijital Giriş",
      "value": "3 Adet"
    },
    {
      "name": "Haberleşme Arayüzü",
      "value": "RS485, RJ45 Ethernet"
    },
    {
      "name": "CPU",
      "value": "4 Çekirdek"
    },
    {
      "name": "Çekirdek Saat Hızı",
      "value": "700 MHz"
    },
    {
      "name": "Dahili Gerçek Zamanlı Saat",
      "value": "Evet"
    }
  ],
  "lomr-07h": [
    {
      "name": "Çalışma Sıcaklığı",
      "value": "-40°C ~ 85°C"
    },
    {
      "name": "Koruma Sınıfı",
      "value": "IP30"
    },
    {
      "name": "Besleme Gerilimi",
      "value": "7-32 V"
    },
    {
      "name": "Montaj",
      "value": "DIN"
    },
    {
      "name": "Boyutlar",
      "value": "88 x 105 x 53 mm"
    },
    {
      "name": "Faz-Faz Ölçüm Aralığı",
      "value": "0-680 VAC"
    },
    {
      "name": "Faz-Nötr Ölçüm Aralığı",
      "value": "0-400 VAC"
    },
    {
      "name": "Frekans Ölçüm Aralığı",
      "value": "40-60 Hz"
    },
    {
      "name": "Haberleşme",
      "value": "RS485 Modbus"
    },
    {
      "name": "Röle Çıkışı",
      "value": "3 Adet 8A/250 VAC"
    }
  ]
};


// User-supplied real screenshots and example field; no live telemetry.
export const screenGallery = [
 {id:'overview-detail',title:'Genel görünüm',text:'Sahaları aynı ekranda karşılaştırın. Güç eğrisi ve dönemsel üretim, tek bir sayının arkasındaki değişimi gösterir.'},
 {id:'live',title:'Canlı izleme',text:"Tüm sahaların haberleşme ve çalışma durumunu tek ekranda izleyin. Bağlantısı kopan ya da arıza veren saha hemen öne çıkar."},
 {id:'inverters',title:'Eviriciler',text:"Saha üretiminin kaynağına inin. Her eviricinin gücünü, durumunu ve üretimini ayrı ayrı görün."},
 {id:'production',title:'Üretimler',text:"Üretim kayıtlarını gün, ay ve yıl bazında inceleyin; dönemleri ve sahaları karşılaştırın."},
 {id:'alarms',title:'Alarm arşivi',text:"Aktif ve geçmiş alarmları tek listede görün. Her alarmın ne zaman başladığı, hangi cihazdan geldiği ve ne zaman kapandığı kayıt altındadır."},
 {id:'limits',title:'Limit yönetimi',text:'Evirici ve saha limitlerini izleyin. Kontrol olanakları, kurulumun ve seçilen hizmetin kapsamına bağlıdır.'},
 {id:'site-devices',title:'Saha cihazları',text:'Saha içindeki cihazları ve bağlantı bilgilerini inceleyin. Her ölçümün hangi kaynaktan geldiğini bilmek, doğru yorumun başlangıcıdır.'},
 {id:'site-alarms',title:'Saha olayları',text:'Seçilen sahanın durum ve olay kayıtlarına odaklanın. Genel görünümden sahaya, sahadan ayrıntıya ilerleyin.'},
 {id:'overview',title:'Bölgesel görünüm',text:"Farklı bölgelerdeki sahalarınızı tek ekranda toplayın. Görseldeki değerler ekran görüntüsünün alındığı ana aittir."},
] as const;
export const fieldJourney = [
 {short:'Saha',eyebrow:'01 / ÜRETİMİN BAŞLADIĞI YER',title:"Her şey sahada başlar.",body:"Bir santralin ne kadar ürettiği kadar, ne üretmediği de önemlidir. ScadaWatt sahadaki her cihazı izleyerek bu sorunun cevabını verir.",detail:"Panellerin ürettiği enerji sahadaki eviriciler, analizörler, sayaçlar ve sensörler tarafından ölçülür. ScadaWatt'ın izleme süreci bu ölçümlerle başlar.",tag:'GÜNDÜZ / SAHA'},
 {short:'Evirici',eyebrow:'02 / ENERJİNİN DÖNÜŞÜMÜ',title:"Eviricileriniz hep gözünüzün önünde.",body:"Panellerden gelen enerji eviricide şebekeye hazır hale gelir. ScadaWatt her eviricinin ne kadar ürettiğini, hangi durumda olduğunu ve arıza verip vermediğini sürekli izler. Gerektiğinde üretim limitini de eviriciye kendisi iletir.",detail:"ScadaWatt eviricilerle Modbus RTU/TCP ve SunSpec üzerinden haberleşir; anlık güç, üretim, durum ve arıza bilgilerini okur. MPPT-dize verisi sunan eviricilerde performans dize bazında da izlenir.",tag:'EVİRİCİ / DIŞ GÖRÜNÜM'},
 {short:'Köşk',eyebrow:'03 / SAHANIN KONTROL NOKTASI',title:"Sahanın kontrol noktası.",body:"Evirici, analizör, sayaç, sensör... Sahadaki bütün veri kaynakları ScadaWatt ile buluşur.",detail:"Köşkteki panoda ScadaWatt veri toplama cihazı, RS485 ve Ethernet hatları üzerinden sahadaki cihazlara bağlanır. LOMR-07H şebeke izleme rölesi de bu noktada şebekeyi izler ve arıza anında tesisi korur.",tag:'KÖŞK / PANO ALANI'},
 {short:'ScadaWatt',eyebrow:'04 / VERİNİN TOPLANDIĞI YER',title:"Veri burada toplanır.",body:"ScadaWatt farklı marka ve modeldeki cihazlarla aynı anda haberleşir. Veriyi sahada işler. İnternet bağlantısı kesilse bile kaydetmeye devam eder, bağlantı geri geldiğinde eksik kalan veriyi tamamlar.",detail:"Okunan veriler sahada işlenip kaydedilir, ardından ScadaWatt platformuna gönderilir. Zero injection, planlı yük atma ve kompanzasyon gibi kontrol senaryoları da sahadaki bu cihaz üzerinden yürütülür.",tag:'SCADAWATT / S3000i'},
 {short:'Dünya',eyebrow:'05 / DAHA GENİŞ BİR BAKIŞ',title:"Mesafenin önemi yok.",body:"Sahadan çıkan veri, güvenli bir bağlantıyla birkaç saniye içinde ScadaWatt platformuna ulaşır.",detail:"Sahadan gelen veri platformda saklanır; saatlik ve günlük üretim, mahsuplaşma ve raporlar burada hesaplanır. OSOS sayaç verisi ve piyasa takas fiyatları (PTF) da aynı platformda birleşir.",tag:'YÖRÜNGE / GÜNDÜZDEN GECEYE'},
 {short:'Ülke',eyebrow:'06 / GECE TARAFINDA',title:"Hangi ülkede olursanız olun.",body:"Sahanız başka bir şehirde, hatta başka bir kıtada olabilir. Mesafeler takibe engel değil.",detail:"ScadaWatt'a internet bağlantısı olan her yerden erişebilirsiniz. Sahanın bulunduğu yer ile sizin bulunduğunuz yer arasındaki mesafe izlemeyi etkilemez.",tag:'GECE / BÖLGESEL ÖLÇEK'},
 {short:'Şehir',eyebrow:'07 / ŞEHRİN IŞIKLARI',title:"Ekibinizle aynı ekrana bakın.",body:"Yönetim, işletme ve bakım ekipleri farklı şehirlerde olsa da aynı veriyi görür. Herkes kendi yetkisi kadarına erişir, kararlar ortak bir tablo üzerinden alınır.",detail:"Kullanıcılar şirket ve saha bazında yetkilendirilir. Yatırımcı, EPC firması ve bakım ekibi aynı santrali kendi yetkileri ölçüsünde izler.",tag:'GECE / ŞEHİR'},
 {short:'Mahalle',eyebrow:'08 / DAHA YAKINDAN',title:"Ofiste ya da yolda.",body:"ScadaWatt'a hem web panelinden hem mobil uygulamadan ulaşabilirsiniz. Bilgisayar başında olmanız gerekmez.",detail:"Web paneli ile iOS ve Android mobil uygulama aynı veriyi gösterir. Saha durumu, canlı üretim ve alarmlar her iki tarafta da görülebilir.",tag:'MAHALLE / OFİS BİNASI'},
 {short:'Ev',eyebrow:'09 / OPERATÖRÜN YANINDAYIZ',title:"Mesai bitince de haberiniz olur.",body:"Sahada bir sorun çıktığında ScadaWatt sizi SMS ve e-postayla hemen haberdar eder. Her akşam günün üretim özeti telefonunuza gelir.",detail:"Bildirimler, tekrar eden mesajları sınırlayan kurallarla gönderilir; aynı arıza için art arda mesaj yağmaz, önemli uyarılar gözden kaçmaz.",tag:'ÜST KAT / OPERATÖR MASASI'},
 {short:'Ekran',eyebrow:'10 / SCADAWATT ARAYÜZÜ',title:"Bütün tablo önünüzde.",body:"Sahalarınızı karşılaştırın, üretim eğrilerini inceleyin, kayıpları erkenden fark edin. Yolculuğun sonunda gördüğünüz ekran, ScadaWatt'ın kendisi.",detail:"Monitörde gördüğünüz, ScadaWatt'ın gerçek genel görünüm ekranıdır. Aşağı kaydırarak donanımları, çözümleri ve uygulama ekranlarını inceleyebilirsiniz.",tag:'SCADAWATT / GERÇEK ARAYÜZ'},
] as const;

/** Editorial selection uses supplied, existing application views; no fabricated live metrics. */
export const solutionPresentation:Record<string,{screenId:string;headline:string;caption:string}>={
 'enerji-yonetimi':{screenId:'overview-detail',headline:'Enerjinizin bütününü görün.',caption:'Üretim ve dönemsel eğriler · Gerçek uygulama görünümü'},
 'uzaktan-izleme':{screenId:'live',headline:'Saha uzakta. Bilgi yanınızda.',caption:'Cihaz ve saha durumları · Gerçek uygulama görünümü'},
 'yenilenebilir-enerji':{screenId:'production',headline:'Üretimi zaman içinde okuyun.',caption:'Dönemsel üretim kayıtları · Gerçek uygulama görünümü'},
 'limit-yonetimi':{screenId:'limits',headline:'Sınırları görünür kılın.',caption:'Evirici ve saha limitleri · Gerçek uygulama görünümü'},
 'kompanzasyon':{screenId:'overview-detail',headline:'Enerji kalitesine odaklanın.',caption:'ScadaWatt platformundan genel bir görünüm'},
 'zero-injection':{screenId:'inverters',headline:'Üretim ile tüketimi dengeleyin.',caption:'Evirici görünümü · Kontrol kapsamı projeye göre belirlenir'}
};

/** Discovery content uses existing solution slugs. Stories are illustrative, never client references. */
export const discoveryGoals=[
 {id:'generation',label:'Üretim performansını izlemek',description:'Evirici ve üretim kayıtlarını birlikte değerlendirin.',solution:'ges-izleme'},
 {id:'remote',label:'Cihazlara uzaktan görünürlük',description:'Cihaz durumu, haberleşme ve alarmları takip edin.',solution:'uzaktan-izleme'},
 {id:'energy',label:'Enerji tüketimini anlamak',description:'Üretim, tüketim ve enerji kalitesine birlikte bakın.',solution:'enerji-yonetimi'},
 {id:'quality',label:'Reaktif gücü takip etmek',description:'Kompanzasyon ve reaktif güç gereksinimlerini değerlendirin.',solution:'kompanzasyon'},
 {id:'limits',label:'Operasyonel limitleri izlemek',description:'Saha ve evirici limitlerini görünür hale getirin.',solution:'limit-yonetimi'},
] as const;
export const demoScenarios=[
 {id:'connection',title:'Haberleşme kesintisi',summary:'Veri güncellenmezse son ölçüm ne olur?',power:780,quality:'STALE',events:['Cihazdan yeni veri alınamıyor.','Son bilinen değer korunur; güncel ölçüm olarak sunulmaz.','Haberleşme alarmı inceleme bekliyor.'],action:'Bağlantı, ağ ve cihaz erişimi kontrol edilmelidir.'},
 {id:'performance',title:'Üretim düşüşü',summary:'Referansla ölçüm arasındaki farkı görün.',power:520,quality:'GOOD',events:['Örnek üretim 780 kW referansının altına düştü.','Sapma görünür hale gelir; tek başına arıza nedeni kanıtlanmaz.','Evirici ve dize verileri birlikte incelenmelidir.'],action:'Işınım, hava koşulları ve cihaz verileri karşılaştırılmalıdır.'},
 {id:'limit',title:'Limit aşımı',summary:'Örnek operasyonel limit aşılırsa ne olur?',power:940,quality:'GOOD',events:['Örnek aktif güç 900 kW operasyonel limitini aştı.','Limit alarmı oluştu; sahaya kontrol komutu gönderilmedi.','Operatörün limit ve kurulum kapsamını incelemesi bekleniyor.'],action:'Kontrol yetkisi ve uygunluk proje kapsamında doğrulanmalıdır.'},
] as const;
export type ApplicationStory={id:string;kind:'illustrative';title:string;sector:string;need:string;approach:string;outcome:string;solution:string;screen:string};
export const applicationStories:ApplicationStory[]=[
 {id:'solar-visibility',kind:'illustrative',title:'Üretimin arkasındaki veriyi görmek.',sector:'Yenilenebilir enerji',need:'Dağınık evirici ölçümlerini saha seviyesinde anlamlandırmak.',approach:'S3000i ile veri toplama; evirici ve üretim kayıtlarını ScadaWatt üzerinden birlikte değerlendirme.',outcome:'Hedef: üretim değişimini cihaz verileriyle birlikte inceleyebilmek. Doğrulanmış tasarruf veya müşteri sonucu sunulmaz.',solution:'ges-izleme',screen:'overview-detail'},
 {id:'energy-quality',kind:'illustrative',title:'Enerji kalitesini görünür kılmak.',sector:'Enerji yönetimi',need:'Üretim, tüketim ve reaktif güç verilerini ayrı ekranlardan takip etmek.',approach:'Enerji yönetimi ve kompanzasyon izleme kapsamını saha cihazlarıyla birlikte değerlendirme.',outcome:'Hedef: reaktif güç ve enerji kullanımını birlikte yorumlamak. Cihaz uyumluluğu ve kontrol kapsamı proje bazında belirlenir.',solution:'enerji-yonetimi',screen:'limits'},
 {id:'remote-operation',kind:'illustrative',title:'Mesafeyi operasyonun dışına çıkarmak.',sector:'Uzaktan operasyon',need:'Sahada bulunmadan cihaz durumlarını ve geçmiş olayları incelemek.',approach:'Uzaktan izleme, alarm kayıtları ve web/mobil erişim yaklaşımını bir araya getirme.',outcome:'Hedef: durum ve olay bilgilerine ortak bir görünümden erişmek. Bu anlatım gerçek bir müşteri projesini temsil etmez.',solution:'uzaktan-izleme',screen:'alarms'},
];

export const aboutCompany={
 headline:"Santralinizi uzaktan, eksiksiz ve doğru veriyle yönetin.",
 introduction:'ScadaWatt, güneş enerji santralleriniz için uzaktan izleme ve kontrol sistemleri geliştiren elektronik temelli bir yazılım ve AR-GE şirketidir.',
 experience:"Markamızın ilk ürünü olan ScadaWatt izleme sistemi, güneş enerjisi sahalarında edindiğimiz deneyimin ürünüdür.",
 tailored:"Müşterilerimizin özel ihtiyaçlarını ek modüllerle ürüne dönüştürüyor, sahaya özel çözümler geliştiriyoruz.",
 invitation:"Santrallerinizi ScadaWatt ile izlemeye hazır mısınız? Sahanızı ve ihtiyacınızı konuşmak için bize ulaşın.",
 image:'/assets/about-mobile.png',
 pillars:[
  {title:'Yazılım',body:'Sahadan gelen verileri izleme, analiz ve raporlama ekranlarında bir araya getiriyoruz.'},
  {title:'Elektronik',body:'Veri toplama ve haberleşme donanımlarıyla saha cihazları ile yazılım arasındaki bağlantıyı kuruyoruz.'},
  {title:'AR-GE',body:'Saha deneyimini ve müşterilerimizin özel ihtiyaçlarını ek modüller ve kişiselleştirilmiş çözümlerle değerlendiriyoruz.'}
 ]
};

export const privacyPolicy: {title:string;blocks:{type:string;text:string;number?:number}[]} = {
  "title": "SCADAWATT GİZLİLİK POLİTİKASI",
  "blocks": [
    {
      "type": "paragraph",
      "text": "Kişisel verilerinizin ne kadar önemli olduğunun farkındayız. Hizmetlerimizi kullandığınızda bize güvenirsiniz."
    },
    {
      "type": "paragraph",
      "text": "Bunun bilincindeyiz ve bilgilerinizi korumak için büyük çaba harcıyoruz."
    },
    {
      "type": "paragraph",
      "text": "Farkına varacaksınız ki ScadaWatt ekosisteminde sizden almak zorunda olduğumuz bilgiler haricinde kişisel bilgi almamaya çalışıyoruz. Aşağıda almak zorunda olduğumuz bilgilerin ve neden aldığımız hakkında birkaç bilgi paylaşacağız."
    },
    {
      "type": "heading",
      "text": "Hizmetlerimizi Kullanırken Oluşturduğunuz Bilgiler"
    },
    {
      "type": "subheading",
      "number": 1,
      "text": "IP Adresiniz"
    },
    {
      "type": "paragraph",
      "text": "İnternete bağlanabilen her modeme İnternet Servis Sağlayıcınız tarafından bir İnternet Protokolü (IP) adresi olarak adlandırılan bir numara zinciri atanır. Bu numara zincirleri coğrafi bloklar içerisinde atanır."
    },
    {
      "type": "paragraph",
      "text": "Bir IP adresini inceleyerek konumunuz yalnızca il-ilçe bazında ve yaklaşık olarak tespit edilebilir."
    },
    {
      "type": "paragraph",
      "text": "Ancak biz IP adresinizi yalnızca güvenlik algoritmalarımız gereği kullanıyoruz."
    },
    {
      "type": "paragraph",
      "text": "Örneğin; hatalı bir giriş yapıldığında sizi tanımak ve sizi sistemden uzaklaştırmamak için kullanacağız."
    },
    {
      "type": "paragraph",
      "text": "Ayrıca; sisteminize hatalı bir müdahalede bulunulduğunda hatayı yapan kişiyi kayıt altında tutmak ve gerekirse resmi devlet kurumlarına kanıt olarak bildirmek için kullanırız."
    },
    {
      "type": "subheading",
      "number": 2,
      "text": "İsim ve Soyisim"
    },
    {
      "type": "paragraph",
      "text": "Sizi tanımlayan bilgilerdir. Listeleme işlemlerinde sistem yöneticilerinize, gönderilecek SMS ve E-Posta metni içerisinde sizi selamlamak için kullanırız."
    },
    {
      "type": "subheading",
      "number": 3,
      "text": "Telefon ve E-Posta Adresiniz"
    },
    {
      "type": "paragraph",
      "text": "Bazı durumlarda size SMS veya E-Posta göndermek zorunda kalabiliriz. Alarm durumları ve gün sonu üretim raporları buna örnek olarak verilebilir. Bu yüzden sistemde telefon numaranız ve e-postanızı kendi isteğiniz doğrultusunda girebilir veya kaldırabilirsiniz."
    },
    {
      "type": "paragraph",
      "text": "Sildiğiniz telefon numaranız ve e-posta adresiniz sistemden geri dönüştürülemeyecek şekilde anında silinecektir. Kesinlikle başka kurumlarla paylaşılmayacaktır."
    },
    {
      "type": "paragraph",
      "text": "Bazen önemli bir duyuru yayınlamak zorunda kalabiliriz. Bu durumlarda da bizler size en hızlı yoldan ulaşmak için SMS veya e-posta gönderebilir, hatta doğrudan bir temsilcimiz tarafından arayabiliriz."
    },
    {
      "type": "subheading",
      "number": 4,
      "text": "Mobil Cihaz Bilgileriniz"
    },
    {
      "type": "paragraph",
      "text": "Kişisel bilgileriniz dışında üretim santrallerinizin güvenliğini de önemsiyoruz. Bu yüzden santral üretimini etkileyecek kadar önemli yetkilere sahip olan kullanıcılar için mobil cihazlarınızın bazı bilgilerini kaydederiz. Yapılan her işlemde de ‘aynı ve güvendiğiniz mobil cihaz’ olmasını takip ederiz. Hesap bilgilerinizi kaybetseniz bile farklı bir cihazdan giriş yaptığınız için siz ‘güvenilir cihaz’ olarak kaydetmediğiniz sürece hesabınıza erişim yetkisi vermeyeceğiz. Bu güvenlik algoritması için gerekli bilgiler şunlardır: i) Cihaz üreticisi ii) Cihaz modeli iii) Benzersiz tanımlayıcısı: Cihazınızın kimliğini benzersiz olarak belirlemek üzere kullanılabilecek bir karakter dizisidir. Güvenlik ve sahtekarlık tespiti için kullanılabilir. Bu benzersiz tanımlayıcılar (bazen UUID olarak anılır) cihaz üreticiniz tarafından bizimle paylaşılabilir. IMEI numaraları buna örnektir. Her cihaz için benzersizdir."
    },
    {
      "type": "subheading",
      "number": 5,
      "text": "Sahalardan Alınan Veriler"
    },
    {
      "type": "paragraph",
      "text": "ScadaWatt’a ait cihazlar, çeşitli yöntemlerle sahadan bilgiler toplar, kendi içerisinde geçici olarak kaydeder, kalıcı kaydetme ve analiz için Türkiye lokasyonlu yüksek güvenlikli veri merkezlerinde barınan sunucularımıza iletir."
    },
    {
      "type": "paragraph",
      "text": "Sahadan alınan veriler doğrultusunda santrallerinizin performans analizleri, alarm takipleri, üretim-tüketim karşılaştırmaları ve çevrimiçi canlı izleme imkanı sağlamaktayız."
    },
    {
      "type": "paragraph",
      "text": "Sahadan toplanıp saklanan veriler şunlardır: i) Tesis genel bilgileri ii) Evirici genel bilgileri iii) Evirici anlık üretim bilgileri iv) Evirici durum ve alarm bilgileri v) Elektrik şebekesi gerilim-frekans bilgileri vi) Tesisin üretilen-tüketilen akım bilgileri vii) Tesisin frekans senkronizasyon bilgileri viii) Tesisin konumu için hava durumu verileri ix) Personel devam takip sistemleri için zaman ve kişi bilgileri x) Tesiste kullanılan üretim ekipmanlarının (örneğin güneş panelleri) genel bilgileri."
    },
    {
      "type": "paragraph",
      "text": "Bu bilgilerin tamamı kullanıcı arayüzlerimizden görüntülenmeye müsait olup istenildiği hallerde kalıcı olarak temizlenebilmektedir. Ancak carilerimizin kazançlarını artırmak ve kamuyu korumak adına bu verilerin kaydedilmesi oldukça önemlidir."
    },
    {
      "type": "paragraph",
      "text": "Bu verilerin tutulmaması halinde yapay zekâ algoritmaları çalışamaz, performans analizleri ve uyarıları oluşturulamaz."
    },
    {
      "type": "subheading",
      "number": 6,
      "text": "Haberleşmelerin Güvenliği"
    },
    {
      "type": "paragraph",
      "text": "ScadaWatt cihazları kendi içlerinde bulunan bir özel ağ sayesinde yalnızca yerel ağdan veri toplayıp kendi veri merkezlerimize veri gönderebilecek yetkilere sahiptir. Bunu sağlayabilmek için sanal özel ağ (VPN) kullanırız."
    },
    {
      "type": "paragraph",
      "text": "ScadaWatt cihazları internet üzerinden herhangi bir siteye bağlantı kuramayacağı için virüs gibi tehlikelerden etkilenmezler. Bağlı bulunduğu ağı da tehlikeye atmazlar."
    },
    {
      "type": "paragraph",
      "text": "VPN ağımız UDP ve TCP bilgi transferi protokollerini, güvenli soket katmanı için SSL ve aktarım katmanı güvenliği için TLS 1.2, şifreleme ve doğrulama sertifikaları için ise 256-bit OpenSSL kullanır."
    },
    {
      "type": "paragraph",
      "text": "Bulut sistemlerimize giriş yapmak için kullanılan şifreleriniz asla ham haliyle kaydedilmez. Şifreleriniz RSA3-512 bitlik algoritma kullanılarak geri dönüştürülemeyecek şekilde yeniden şifrelenir ve saklanır."
    },
    {
      "type": "heading",
      "text": "ScadaWatt’ı, kullanıcılarımızı, carilerimizi ve kamuyu koruma"
    },
    {
      "type": "paragraph",
      "text": "Bilgileri hizmetlerimizin güvenliğini ve güvenilirliğini iyileştirmek için kullanırız. ScadaWatt’a, kullanıcılarımıza, carilerimize veya kamuya zarar verebilecek teknik sorunlar ve güvenlik risklerinin algılanması, önlenmesi ve bunlara yanıt verilmesi bu kapsamda yer alır. Algoritmalarımızla yukarıda yer alan verilerinizi kullanarak; sizi ve kamuya ait elektrik şebekesini korumak için elimizden geleni yaparız."
    },
    {
      "type": "heading",
      "text": "Yasal İşlem veya Uygulanabilir Resmi Talepler"
    },
    {
      "type": "paragraph",
      "text": "Kullanıcılarımızın ve carilerimizin bilgilerinin güvenliği ve gizliliğine gösterdiğimiz hassasiyet doğrultusunda; hukuk ekibimiz, hangi türde olursa olsun her talebi inceler ve bir talebin kapsamı aşırı geniş göründüğünde veya talep doğru süreci takip etmediğinde sıklıkla olumsuz yanıt verir."
    }
  ]
};

/** Server-authorised content is applied once, before routes load. Geometry is untouched. */
export function applyRuntimeFields(entries:{path?:string[];tr:string|boolean}[]){
 const roots:Record<string,unknown>={privacyPolicy,communityContent,configuratorContent,images,contact,fieldJourney,aboutPoints,solutions,products,plans,comparison,nav,productSpecifications,screenGallery,solutionPresentation,discoveryGoals,applicationStories,aboutCompany};
 for(const entry of entries){const path=entry.path;if(!path?.length||path.some(k=>[{},'prototype',undefined].includes(k)))continue;
  if(path.length===1){if(path[0]==='slogan')slogan=String(entry.tr);if(path[0]==='vision')vision=String(entry.tr);continue}
  let current=roots[path[0]!] as Record<string,unknown>|undefined;
  for(const part of path.slice(1,-1)){current=current?.[part] as Record<string,unknown>|undefined}
  const key=path.at(-1)!;if(current&&Object.hasOwn(current,key))current[key]=entry.tr;
 }
}

/** Preserve exported root identities while replacing device-specific content on resize. */
const runtimeRoots={privacyPolicy,communityContent,configuratorContent,images,contact,fieldJourney,aboutPoints,solutions,products,plans,comparison,nav,productSpecifications,screenGallery,solutionPresentation,discoveryGoals,applicationStories,aboutCompany};
const initialRuntime=structuredClone(runtimeRoots),initialSlogan=slogan,initialVision=vision;
export function resetRuntimeContent(){for(const [key,target] of Object.entries(runtimeRoots)){const source=structuredClone(initialRuntime[key as keyof typeof initialRuntime]);if(Array.isArray(target))(target as unknown[]).splice(0,target.length,...source as unknown[]);else{for(const name of Object.keys(target))delete (target as Record<string,unknown>)[name];Object.assign(target,source)}}slogan=initialSlogan;vision=initialVision;}
