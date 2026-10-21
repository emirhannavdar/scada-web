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
export let vision = "Milyarlarca veriyi saniyeler içinde analiz ederek kayıpları kazanca çevirmek.";

export const aboutPoints = [
  "Santrallerinizdeki tüm ekipmanları tek bir platformdan uzaktan izleme ve kontrol",
  "Üretim ve tüketimi analiz ederek verimliliği artırma, kayıpları en aza indirme",
  "Reaktif güç ve kompanzasyon takibiyle enerji kalitesini kontrol etme, cezaları önleme",
  "Saatlik veriler üzerinden fatura doğrulama",
  "Piyasa fiyatları ve PTF kontrolleriyle santrali optimum seviyede yönetme",
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
 {slug:'enerji-yonetimi',title:'Enerji Yönetimi',short:'Üretim, tüketim ve enerji kalitesi verilerini birlikte değerlendirin.',body:['ScadaWatt, ölçüm verilerini izleme, raporlama ve kontrol ihtiyaçlarıyla bir araya getirir. Üretim ve tüketim görünürlüğü, limit takibi ve reaktif güç değerlendirmesi enerji yönetiminin farklı parçalarıdır.','Uygulanacak kapsam, saha cihazları ve seçilen hizmetlere göre birlikte değerlendirilir.'],points:['Üretim ve tüketim takibi','Enerji kalitesi ve reaktif güç','Limit takibi ve raporlama']},
 {slug:'uzaktan-izleme',title:'Uzaktan İzleme',short:'Ölçümleri, cihaz durumlarını ve alarmları yazılım üzerinden takip edin.',body:['Saha cihazlarından gelen veriler, veri toplama ve haberleşme teknolojileri üzerinden ScadaWatt yazılımına taşınır. İzleme ve raporlama ihtiyaçları cihaz ve saha kapsamına göre belirlenir.'],points:['Cihaz verileri','Alarm ve bildirim','Web ve mobil görünüm']},
 {slug:'yenilenebilir-enerji',title:'Yenilenebilir Enerji',short:'Üretim sistemlerinde veri toplama ve yazılım teknolojileri.',body:['Yenilenebilir enerji üretiminde ölçüm, performans analizi ve kontrol verileri önemlidir. ScadaWatt’ın GES izleme ürünü, üretim verilerini yazılım üzerinden değerlendirmeye odaklanır.','Diğer kaynaklar için cihaz uyumluluğu ve uygulanabilecek kapsam proje özelinde değerlendirilmelidir.'],points:['Üretim verileri','Performans takibi','Saha cihazlarıyla haberleşme']},
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
    short: "Evirici ve saha limitlerini anlık takip edin, ceza risklerini ortadan kaldırın.",
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
      "Reaktif güç değerleri sürekli izlenir. Limit aşımlarında ScadaWatt kompanzasyon sistemini kontrol ederek ceza risklerinin oluşmasını engeller.",
      "Saatlik veriler üzerinden fatura doğrulaması yapılarak hatalı faturaların önüne geçilir.",
    ],
    points: ["Reaktif güç izleme", "Otomatik kompanzasyon kontrolü", "Saatlik fatura doğrulama"],
  },
  {
    slug: "zero-injection",
    title: "Zero Injection",
    short: "Tüketim kadar üretim: şebeke yönüne enerji gitmez.",
    body: [
      "Zero Injection modülü ile eviriciler dinamik olarak PID kontrol edilir, tüketim değerleriniz ölçülür ve tüketim kadar üretim yapılır.",
      "Böylece şebeke yönüne enerji gitmemesi sağlanır. Tüm süreç ScadaWatt ekranları ve raporlarıyla izlenir ve yönetilir.",
    ],
    points: ["Dinamik PID evirici kontrolü", "Anlık tüketim ölçümü", "Şebekeye sıfır enjeksiyon"],
  },
  {
    slug: "planli-uretim-durdurma",
    title: "Planlı Üretim Durdurma",
    short: "Yük atma süreçlerini otonom hale getirin.",
    body: [
      "Planlı üretim durdurma modülü ile yük atma süreçleri otonom hale gelir; talimatlar manuel müdahaleye gerek kalmadan sahaya uygulanır.",
      "PRO pakette acil durdurma eylemi ve sahaya fiziksel müdahale imkânı da bulunur.",
    ],
    points: ["Otonom yük atma", "Acil durdurma eylemi (PRO)", "Sahaya fiziksel müdahale (PRO)"],
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
      "S3000i, ekosistemimizin veri toplama ve işleme konusunda temel unsurudur. Farklı sensörlerden ve saha cihazlarından aldığı verileri analiz eder, depolar ve ScadaWatt platformuna iletir.",
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
      "LOMR-07H, şebeke arızası durumunda rölelerini tetikler. Röle çıkışları kumanda panoları da kullanılarak tesis ile şebeke arasındaki bağlantının güvenli şekilde yönetilmesini sağlar.",
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
    features: ["Standart paketteki tüm hizmetler", "Evirici limit yönetimi", "Acil durdurma eylemi", "Sahaya fiziksel müdahale"],
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
  ["Sahaya fiziksel müdahale", false, false, true],
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
      "value": "700 Mhz"
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
      "value": "700 Mhz"
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
 {id:'live',title:'Canlı izleme',text:'Sahaların haberleşme ve durum bilgilerini birlikte inceleyin. Bu görüntü, gönderilen uygulama ekranının sabit bir kaydıdır.'},
 {id:'inverters',title:'Eviriciler',text:'Toplam üretimin kaynağına inin. Eviricileri ayrı ayrı görmek, saha seviyesindeki bilgiyi cihaz seviyesinde okumayı sağlar.'},
 {id:'production',title:'Üretimler',text:'Üretim kayıtlarını dönemlere göre inceleyin. Anlık güç ile zaman içinde biriken enerji farklı büyüklüklerdir.'},
 {id:'alarms',title:'Alarm arşivi',text:'Aktif ve geçmiş alarmları birlikte görün. Bir uyarıyı anlamak için olayın zamanı, kaynağı ve durumu birlikte değerlendirilir.'},
 {id:'limits',title:'Limit yönetimi',text:'Evirici ve saha limitlerini izleyin. Kontrol olanakları, kurulumun ve seçilen hizmetin kapsamına bağlıdır.'},
 {id:'site-devices',title:'Saha cihazları',text:'Saha içindeki cihazları ve bağlantı bilgilerini inceleyin. Her ölçümün hangi kaynaktan geldiğini bilmek, doğru yorumun başlangıcıdır.'},
 {id:'site-alarms',title:'Saha olayları',text:'Seçilen sahanın durum ve olay kayıtlarına odaklanın. Genel görünümden sahaya, sahadan ayrıntıya ilerleyin.'},
 {id:'overview',title:'Bölgesel görünüm',text:'Farklı bölgelerdeki sahaları bir araya getiren gerçek ScadaWatt ekranı. Görseldeki değerler çekim anına aittir.'},
] as const;
export const fieldJourney = [
 {short:'Saha',eyebrow:'01 / ÜRETİMİN BAŞLADIĞI YER',title:'Verinin izinden.',body:'Sahaya doğru alçalıyoruz. Panel sıralarının hemen üzerinden geçiyor, aşağıdaki çalışan ekibi ve toprak yolları izleyerek eviriciye ilerliyoruz.',detail:'Saha ve çevre yapıları, gönderilen fotoğraftan ilhamla modellenmiştir. Birebir tesis veya coğrafi konum iddiası yoktur.',tag:'GÜNDÜZ / SAHA'},
 {short:'Evirici',eyebrow:'02 / ENERJİNİN DÖNÜŞÜMÜ',title:'Eviricinin yanındayız.',body:'Panellerin ürettiği doğru akım, eviricide alternatif akıma dönüştürülür. Ölçümler, üretimi anlamanın kaynaklarından biridir.',detail:'Evirici dışarıdan gösterilir. Kamera gövdeye girmez; kapak açılmaz.',tag:'EVİRİCİ / DIŞ GÖRÜNÜM'},
 {short:'Köşk',eyebrow:'03 / SAHANIN KONTROL NOKTASI',title:'Köşke ilerliyoruz.',body:'Paneller arasındaki toprak yolda yer alan köşke yaklaşıyoruz. Önce yapıyı dışarıdan görüyor, ardından açılan servis kapılarından pano alanına ilerliyoruz.',detail:'Köşk referans fotoğraflarındaki gövde, çatı saçağı, metal kapılar ve havalandırma detaylarından esinlenerek modellenmiştir. Evirici ziyareti sonrasında kamera doğrudan köşke yönelir. Sahnenin bu bölümünde evirici ile köşk arasında kablo gösterilmez.',tag:'KÖŞK / PANO ALANI'},
 {short:'ScadaWatt',eyebrow:'04 / VERİNİN TOPLANDIĞI YER',title:'Panonun içindeki teknoloji.',body:'S3000i, köşkün içindeki panoda yer alıyor. Farklı kaynaklardan gelen verileri topluyor, işliyor ve depoluyor. Şimdi bu veriyi uzaktaki ekrana taşıyan yolculuğa devam ediyoruz.',detail:'S3000i dış görünümü gerçek ürün fotoğrafından esinlenmiştir. Cihazın kendi gövdesine girilmez veya kapağı açılmaz. Kamera köşkten çıktıktan sonra servis kapıları kapanır; sahadan sonra küresel kablo çizilmez.',tag:'SCADAWATT / S3000i'},
 {short:'Dünya',eyebrow:'05 / DAHA GENİŞ BİR BAKIŞ',title:'Mesafenin ötesinde.',body:'Türkiye’deki sahadan yükseliyoruz. Dünya üzerinde tek bir kısa yay boyunca ABD’deki operatöre doğru ilerliyoruz.',detail:'Dünya sabit kalır; kamera 39° Kuzey / 35,5° Doğu ile 38° Kuzey / 97° Batı arasındaki kısa yayı izler. Bunlar ülke sınırları içindeki temsili noktalardır; gerçek müşteri veya internet rotası gösterilmez.',tag:'YÖRÜNGE / GÜNDÜZDEN GECEYE'},
 {short:'Ülke',eyebrow:'06 / GECE TARAFINDA',title:'Başka bir yerde.',body:'Gece tarafında otoyollar, yerleşimler ve bölgesel ışık ağı beliriyor. Yolculuk, operatörün bulunduğu yaşam alanına doğru daralıyor.',detail:'ABD’deki şehir ve ev temsili olarak modellenmiştir. Konum, ana kara sınırları içinde seçilmiştir; belirli bir müşterinin gerçek adresi gösterilmez.',tag:'GECE / BÖLGESEL ÖLÇEK'},
 {short:'Şehir',eyebrow:'07 / ŞEHRİN IŞIKLARI',title:'Şehre yaklaşıyoruz.',body:'Işıklı caddeler, park cepleri, araçlar ve farklı yapı ölçekleri belirginleşiyor. Aynı saha bilgisi, çok uzaktaki bir ekranda okunabilir.',detail:'Şehir, farklı yükseklikteki binalar, park alanları, araçlar ve cadde ışıklarıyla oluşturulmuş özgün bir 3B yerleşimdir.',tag:'GECE / ŞEHİR'},
 {short:'Mahalle',eyebrow:'08 / DAHA YAKINDAN',title:'Bir mahalle. Bir bina.',body:'Şehirden mahalle ölçeğine iniyoruz: yol, park, apartman ve küçük yaşam cepleri arasından aydınlık pencereye ilerliyoruz.',detail:'Yaklaşma rotası hedef binanın önündeki açık koridoru takip eder; bina içinden rastgele kesilerek geçmez.',tag:'MAHALLE / OFİS BİNASI'},
 {short:'Ev',eyebrow:'09 / OPERATÖRÜN YANINDAYIZ',title:'Saha, ekranında.',body:'Pencerenin ardında çalışan bir operatör. Kamera omzunun yanından masadaki monitöre yaklaşıyor.',detail:'İnsan, çalışma masası ve koltuk/TV içeren ev ortamı modellenmiştir. Monitördeki görüntü gönderilen gerçek ScadaWatt arayüzüdür; canlı bağlantı değildir.',tag:'ÜST KAT / OPERATÖR MASASI'},
 {short:'Ekran',eyebrow:'10 / SCADAWATT ARAYÜZÜ',title:'Artık bütününü görün.',body:'Sahaları karşılaştırın, üretim eğrilerini inceleyin. Yolculuğun sonunda gerçek ScadaWatt ekranındasınız.',detail:'Monitörde ScadaWatt genel görünümü sabit olarak gösterilir. Kamera monitöre ulaştığında yolculuk tamamlanır; aşağı kaydırarak donanımları, çözümleri ve uygulama görsellerini inceleyebilirsiniz. Bu tanıtım sahaya komut göndermez.',tag:'SCADAWATT / GERÇEK ARAYÜZ'},
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
 headline:'Akıllı enerji yönetimiyle mükemmel çözümler sunuyoruz.',
 introduction:'ScadaWatt, güneş enerji santralleriniz için uzaktan izleme ve kontrol sistemleri geliştiren elektronik temelli bir yazılım ve AR-GE şirketidir.',
 experience:'Markamızın çıkış ürünü olan ScadaWatt izleme otomasyonu, güneş enerjisi sektöründe kazandığımız tecrübeyi somut çözümlere dönüştürmektedir.',
 tailored:'Ek modüllerimiz sayesinde müşterilerimizin özel ihtiyaçlarını ürüne dönüştürerek, tamamen kişiselleştirilmiş çözümler sunuyoruz.',
 invitation:'ScadaWatt ekosisteminde yerinizi alarak, santrallerinizde enerji yönetimini en üst seviyeye taşımaya hazır mısınız?',
 image:'/assets/about-mobile.png',
 pillars:[
  {title:'Yazılım',body:'Sahadan gelen verileri izleme, analiz ve raporlama ekranlarında bir araya getiriyoruz.'},
  {title:'Elektronik',body:'Veri toplama ve haberleşme donanımlarıyla saha cihazları ile yazılım arasındaki bağlantıyı kuruyoruz.'},
  {title:'AR-GE',body:'Saha deneyimini ve müşterilerimizin özel ihtiyaçlarını ek modüller ve kişiselleştirilmiş çözümlerle değerlendiriyoruz.'}
 ]
};

/** Server-authorised content is applied once, before routes load. Geometry is untouched. */
export function applyRuntimeFields(entries:{path?:string[];tr:string|boolean}[]){
 const roots:Record<string,unknown>={images,contact,fieldJourney,aboutPoints,solutions,products,plans,comparison,nav,productSpecifications,screenGallery,solutionPresentation,discoveryGoals,applicationStories,aboutCompany};
 for(const entry of entries){const path=entry.path;if(!path?.length||path.some(k=>['__proto__','prototype','constructor'].includes(k)))continue;
  if(path.length===1){if(path[0]==='slogan')slogan=String(entry.tr);if(path[0]==='vision')vision=String(entry.tr);continue}
  let current=roots[path[0]!] as Record<string,unknown>|undefined;
  for(const part of path.slice(1,-1)){current=current?.[part] as Record<string,unknown>|undefined}
  const key=path.at(-1)!;if(current&&Object.hasOwn(current,key))current[key]=entry.tr;
 }
}

/** Preserve exported root identities while replacing device-specific content on resize. */
const runtimeRoots={images,contact,fieldJourney,aboutPoints,solutions,products,plans,comparison,nav,productSpecifications,screenGallery,solutionPresentation,discoveryGoals,applicationStories,aboutCompany};
const initialRuntime=structuredClone(runtimeRoots),initialSlogan=slogan,initialVision=vision;
export function resetRuntimeContent(){for(const [key,target] of Object.entries(runtimeRoots)){const source=structuredClone(initialRuntime[key as keyof typeof initialRuntime]);if(Array.isArray(target))(target as unknown[]).splice(0,target.length,...source as unknown[]);else{for(const name of Object.keys(target))delete (target as Record<string,unknown>)[name];Object.assign(target,source)}}slogan=initialSlogan;vision=initialVision;}
