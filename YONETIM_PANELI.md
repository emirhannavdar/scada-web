# ScadaWatt içerik yönetimi — V66

## Çalıştırma

Bu ZIP bütün kaynakları ve hazır derlemeyi içerir. İlk açılışta npm ci veya build gerekmez. Node.js 24+ gerekir.

```powershell
npm.cmd start
```

Site http://127.0.0.1:5188/ ve yönetim http://127.0.0.1:5188/admin adresindedir. Sunucu aynı yerel ağa açıktır; terminalde bilgisayarınızın yerel IP bağlantıları da gösterilir.

Eski V65 klasörünü silmeyin. Aynı üst klasördeki scadawatt-v65/data içindeki mevcut hesap ve içerikler ilk açılışta otomatik kopyalanır; kaynak veriler korunur. Özel veri yolu tanımlıysa değiştirilmez. Eski hesabınız bulunursa yeniden cms:setup yapmayın. Başlangıç ve geliştirme ayrıntıları README.md dosyasındadır.

## V66: kelime seçimi, tüm sayfalarda taşıma ve kesintisiz önizleme

- **Kelime seç:** Üst araç çubuğunda bu düğmeyi açıp kelimeye tıklayın. Birkaç kelime için metni fareyle seçip bırakabilirsiniz. Sağdaki Tasarım / yerleşim bölümünden renk, arka plan, boyut, kalınlık, italik ve alt çizgi değiştirin. Seçim sağ panelde tırnak içinde görünür. Düğmeye yeniden basmak normal öğe seçimine döner.
- Kelime biçimleri seçili cihaz ve dil içindir. TR ve EN ayrı biçimlendirilebilir. Seçilen metin değişip eski kelime artık aynı konumda değilse biçim yanlış yere uygulanmaz; kelimeyi yeniden seçin. Resmin veya 3D dokunun içine gömülü yazı için kaynak görsel/model değiştirilir.
- **Normal öğe seçimi:** Bir yazı, görsel, kart veya kapsayıcıya tıklayın. Sürükle / taşı tutamacı Hakkımızda, İletişim ve diğer bütün React sayfalarında kullanılabilir. İç içe main/aside/form yapıları da desteklenir. Kelime seçiliyken taşıma kapalıdır; önce normal öğe seçimine dönün.
- **Önizleme alanı:** Masaüstü artık sabit 1280 px içine küçültülmez, kullanılabilir alanı doldurur. Sağ panel açılınca kalan alana uyum sağlar. Mobilde telefon düzeni bozulmadan büyütülür; gerçek mobil genişlik 390 px kalır.
- **Yeniden yükleme:** Cihaz geçişi, editörün sayfa seçicisi, içerideki bağlantılar ve klasik Yönetim/görsel editör geçişi aynı önizleme belgesini korur. Model ve GPU hazırlığı tekrarlanmaz. İlk kez saha açılıyorsa gerçek hazırlık tamamlanana kadar yükleme ekranı kalır. Sunucudan yenile gibi bilinçli kurtarma işlemleri veya tam tarayıcı yenilemesi yeni belge oluşturur.
- Taslak / yayın / geçmiş / geri alma akışı kelime biçimleri için de geçerlidir.

## Mobil ve masaüstü birbirinden bağımsızdır (V66)

Üstteki bilgisayar/telefon düğmesi **hangi görünümü düzenlediğinizi** seçer. Yalnız önizleme boyutunu değiştirmez. Metin, Türkçe/İngilizce, görsel, donanım/çözüm/paket ekleme-silme, sıralama, renk paleti ve tüm tasarım ayarları seçilen görünümün kaydına yazılır. Diğer görünüm değişmez.

Görünüm değiştirirken kaydedilmemiş taslak önce kaydedilir. Açık kayıt formu varsa önce Listeye uygula kullanın. İki görünümün taslağı ve yayını ayrıdır. **Yayınla yalnız seçili görünümü yayınlar.** Diğer görünümün taslağını istemeden yayınlamaz. İnceleme, tek tek geri alma, toplu geri alma ve geçmişten taslağa dönme seçilen görünüme uygulanır. Klasik Yönetim panelinin alt araç çubuğunda da Görünüm seçimi vardır.

Önceki sürümdeki içerik başlangıçta iki görünümde korunur. Bundan sonraki düzenlemeler ayrıdır. Aynı değişikliği iki yerde de istiyorsanız iki görünümde ayrı uygulayın. Görsel kütüphanesi ortak dosya deposudur; bir dosyayı seçmek yalnız seçili görünümü etkiler. Kullanılan bir görseli kütüphaneden silmek, kayıtlı sayfa veya geçmişteki dosyayı bozmaz.

Ziyaretçide 760 px ve altı mobil, 761 px ve üstü masaüstü içerik gösterilir. Tarayıcı boyutu bu sınırı geçince içerik ve tasarım sayfa yeniden yüklenmeden değişir.

## Tasarım ve sürükleyerek yerleştirme

Bir yazıya veya görsele tıklayın; **Tasarım / yerleşim** sekmesinden font, genişlik, boşluk, renk, görsel yüksekliği ve kırpma ayarlarını değiştirin. Üstteki cihaz düğmesi tasarımın hangi görünüme kaydedileceğini de seçer. Sağ panelde ikinci, bağımsız cihaz anahtarı yoktur.

- **Sürükle / taşı:** Seçilen öğenin üstündeki tutamacı sürükleyin. Dört piksellik adımlarla, masaüstünde ±120 px ve mobilde ±40 px konum ayarlanır; sayfa sınırları dikkate alınır. Tutamaç odaktayken yön tuşlarıyla da taşıyabilirsiniz. Sürükleme sırasında Escape veya dokunma iptali konumu geri alır.
- **Üst kapsayıcıyı seç:** Metin yerine kart veya bölümü seçer. 3D alanın/navigasyonun temel geometrisi kilitlidir. Sürükleme öğeyi başka bir kapsayıcıya taşımaz.
- **Bölüm sırası:** Donanım, çözüm, çözüm seçici ve iletişim bölümlerini gerçek sayfa akışında yukarı/aşağı taşıyın. 3D yolculuk ilk sırada kalır.
- **Renk paleti:** Seçilen cihaz için aydınlık ve koyu tema renklerini ayrı ayarlayın. Palet 2D sayfayı etkiler; 3D ışıklandırmayı değiştirmez.
- Ayarın yanındaki sıfırlama düğmesi o özelliği mevcut tasarıma döndürür. Öğenin tamamı, palet ve bölüm sırası ayrıca sıfırlanabilir.
- Önizleme sağ panelin yanında ölçeklenir. Masaüstü görünümü kalan alanı doldurur; panel açıldığında daralır. Mobilde 390 px telefon genişliği korunur, yükseklik dikkate alınarak büyütülür.
- Metin ve görsel dahil taslak düzenlemeleri önizlemeye canlı uygulanır. Taslağı kaydetmek 3D sahneyi yeniden başlatmaz. Kaydetme ve yayınlama ayrıdır.

## Saha önbelleği ve ana sayfaya dönüş

İlk açılışta bütün saha, insanlar, operatör ve GPU hazırlığı tamamlanmadan yükleme ekranı kalkmaz. Hazırlanan tek 3D sahne aynı sekmedeki sayfa geçişlerinde korunur. Ana sayfadan ayrılınca çizim durur; geri dönünce aynı canvas ve model kaynakları kullanılır. Tekrar model çözümleme veya tam yükleme ekranı gerekmez.

Model dosyalarının mevcut HTTP önbelleği de korunur. Sekmeyi kapatmak, tam yenileme yapmak veya tarayıcının grafik bağlamını bellek nedeniyle bırakması yeni GPU hazırlığı gerektirebilir; dosyalar tarayıcı önbelleğinde ise yeniden indirilmez. Bilgisayar kapanmasını bekleyen bir garanti verilmez: tarayıcı önbelleği kendisi yönetir. İlk yüklemeyi tamamlamadan çıkan kişiye, dönüşte sahne gerçekten hazır olana kadar yükleme gösterilmeye devam eder.

## Sayfa üzerinde düzenleme

Girişten sonra varsayılan olarak görsel editör açılır. Üstte **Düzenle** seçiliyken bir yazıya veya görsele tıklayın. Turuncu çerçeve seçilebilir alanı gösterir. Sağ panelde Türkçe ve İngilizce değerlerini düzenleyin; **Uygula ve önizle** taslağı kaydeder; metin ve görseller önizlemede canlı güncellenir. Sahne seçimi ve hazırlanmış 3D kaynaklar korunur.

**Yayınla** ayrı bir onay ister; taslağı kaydetmek tek başına yayına geçirmez. Aynı yazı birden fazla alana bağlıysa sağdaki alan listesinden doğru konumu seçin. Ortak metinler kullanıldığı diğer yerlerde de değişebilir.

**Gezin** bağlantılara tıklamak, donanım seçmek veya animasyonu izlemek içindir. Sonra tekrar **Düzenle** seçin. Üstte sayfa seçimi, TR/EN ve mobil önizleme bulunur. Ana sayfadaki **Animasyon sahnesi** seçicisi görüntüyü sabitler ve o sahnenin metinlerini sağ panelde açar; “Kaydırarak gez” veya Gezin ile devam edilir.

Donanım, çözüm ve paket bölümünde beliren **+ Yeni kayıt** / **Bu kaydı düzenle** düğmeleri ilgili formu açar. Kayıtta **Listeye uygula**, ardından **Uygula ve önizle**, en son **Yayınla** kullanın. Yeni ekleme ve silmeler taslakta tutulur. Boş listelere üstteki **Donanım / çözüm / paket** düğmesinden kayıt eklenebilir.

Üstte **Yönetim** ayrıntılı klasik paneli açar. Kaydedilmemiş alan değişiklikleri önce taslağa kaydedilir. Görsel kütüphanesi, silme, geçmiş sürümler ve genel alanlar bu panelde korunur. Soldaki **Sayfa üzerinde düzenle** düğmesi görsel editöre döndürür.

## Nasıl kullanılır?

### İçerikler

Soldan bölüm seçin veya arama kutusuna değiştirmek istediğiniz metni yazın. Arama bütün bölümlerde çalışır. Alanlar sayfalara bölünür; sayfanın altındaki oklarla ilerlenir.

- Hakkımızda metinleri ve mobil uygulama görseli
- Ürün açıklamaları, fotoğrafları ve teknik özellikleri
- Çözümler, paketler ve paket karşılaştırması
- İletişim, adres, e-posta ve harita bağlantısı
- Site genelindeki ortak başlıklar, butonlar ve açıklamalar
- Uygulama ekranlarının sayfadaki görselleri

Metinlerin **TR ve EN** alanları ayrıdır. Türkçe metni değiştirirken İngilizce karşılığını da düzenleyin. Panel otomatik çeviri yapmaz. Kullanıcıların iletişim formuna yazdığı serbest metinler çevrilmez. Ortak arayüz metinleri aynı metnin kullanıldığı yerlerde ortak güncellenir.

### Donanım, çözüm ve paket ekleme / silme

Soldan **Donanım / çözüm / paket** bölümünü açın. İlgili sekmede yeni kayıt ekleyin, mevcut kaydı düzenleyin, silin veya oklarla sıralayın. Donanımda cihaz kodu, fotoğraf, TR/EN başlıklar, açıklamalar ve teknik özellik satırları bulunur. Çözümlerde ana sayfada gösterme seçeneği; paketlerde hizmet satırları ve karşılaştırma tablosu vardır.

Önce **Listeye uygula**, sonra **Taslağı kaydet → Önizle → Yayınla** kullanın. Silme de yayınlanana kadar yalnız taslakta kalır. Mevcut kayıtların sayfa adresleri değişmez. Yeni ürün/çözüm detay sayfası mevcut tasarımla otomatik oluşur. TR ve EN metinleri siz girersiniz; otomatik çeviri yapılmaz. Liste sınırları: 500 donanım, 100 çözüm, 100 paket. Yeni bir sayfa tasarımı veya 3D geometri değişikliği kod çalışması gerektirir.

### Görseller

İçerik alanındaki **Görseli değiştir** düğmesiyle mevcut yüklemelerden seçim yapın veya yeni görsel yükleyin. PNG, JPEG, WebP ve AVIF kabul edilir; SVG/HTML yüklenmez. Dosya başına en fazla 8 MB, toplam yeni yüklemelerde 512 MB sınırı vardır. PNG boyutları ayrıca denetlenir. Büyük görselleri yüklemeden önce uygun boyuta indirin; genellikle 1600–2400 piksel genişlik ve WebP tercih edilir. Panel sunucuda otomatik yeniden boyutlandırma yapmaz.

Görsel kütüphanesi **yeni yüklemeleri** listeler. Paketin mevcut görselleri ilgili alanlarda korunur. Yanlış görseli geri almak için alanın ilk görselini veya yayındaki değerini seçebilirsiniz. **Görseli sil** ile yüklemeyi kütüphaneden kaldırabilirsiniz. Taslakta, yayında veya geçmiş sürümlerde kullanılan dosya sayfalar bozulmasın diye sunucuda korunur. Hiçbir kayıtta kullanılmayan dosya diskten de silinir. 3D modelleri, dokular ve monitörün animasyon içindeki sabit ekranı bu editör tarafından değiştirilmez. Animasyonda görünen metinler ise sahne bazlı editörden değiştirilebilir.

### Taslak → Önizleme → Yayın

1. **Taslağı kaydet:** Sunucuda kalıcı olarak kaydeder. Ziyaretçiler etkilenmez.
2. Alt çubuktan sayfa seçip **Önizle:** Taslağı kaydeder ve aynı sekmede seçilen sayfayı açar. Oturumunuz doğrulanır. Alttaki bant bunun bir taslak olduğunu belirtir; **Yönetime dön** bağlantısıyla dönün. Önizleme mevcut taslağın o anki görüntüsüdür; yeni değişiklikler için yeniden önizleyin.
3. **Yayınla:** Değişiklik sayısını gösteren pencerede not yazıp onaylayın. Yeni sürüm oluşur. Ziyaretçiler sayfayı yenilediğinde güncel içerik gelir.

Taslak bağlantısı yetkisi olmayan ziyaretçiye taslak içeriğini göstermez. Admin ve önizleme arama motorlarına indekslenmemesi için işaretlenir.

**Yayın geçmişi:** Eski bir sürümü **Taslağa al**, önizle ve yayınla. Geri alma otomatik yayın yapmaz. Panel son 100 yayını listeler; veritabanı geçmişi tutulur. İki sekme aynı anda düzenlerse eski kayıt diğerini ezmez; çakışma mesajından sonra değişikliklerinizi değerlendirerek sunucudan yenileyin.

## Kalıcılık ve yedekleme

İlk çalışmada `data/` klasörü oluşur:

- `data/cms.sqlite`: Yönetici, oturumlar, taslak, yayın ve geçmiş
- `data/uploads/`: Yüklediğiniz görseller

Tarayıcı çerezinde yalnız oturum kimliği tutulur; içerikler tarayıcıya bağlı değildir. Başka bilgisayardan aynı sunucuya bağlanan ziyaretçi de aynı yayınlanan içeriği alır. ZIP’in başka kopyasında çalışan ayrı bir sunucu ise ayrı veritabanı kullanır.

**Yeni ZIP güncellemesinde kendi `data/` klasörünüzü silmeyin veya paketin üzerine boş veritabanı koymayın.** Bu teslimatta hesap, oturum, gerçek şifre ve çalışma veritabanı yoktur. Bu sürümde katalog `src/content/site.ts` ve mevcut sayfalardan üretilir. İleride kod şeması/alan yolları değişirse veritabanı geçişi ayrıca ele alınmalıdır.

Yedek alın:

```powershell
npm.cmd run cms:backup
```

`backups/` altında tarihli klasöre tutarlı SQLite yedeği ve yüklemeler kopyalanır. Yedekler yönetici şifre özeti ve oturum bilgisi içerir; web köküne koymayın veya herkese göndermeyin. Geri yüklemek için sunucuyu durdurun, mevcut `data/` klasörünü ayrıca yedekleyin, yedekteki `cms.sqlite` ve `uploads/` öğelerini boş bir `data/` klasörüne kopyalayın, sonra sunucuyu başlatın. Eski `-wal` ve `-shm` dosyalarını yeni veritabanıyla karıştırmayın.

## Canlı sunucu

Bu sürüm artık **yalnız statik dosya barındırmasıyla çalışmaz**. `dist/` klasörünü tek başına yüklemek CMS API’sini ve yükleme depolamasını sağlamaz. Node.js 24+ çalıştırabilen ve kalıcı disk sağlayan tek bir sunucu/container gerekir. SQLite dosyasını geçici/serverless diske koymayın ve birden fazla bağımsız sunucu kopyası arasında paylaşmayın. Daha büyük çok sunuculu kurulumda ortak veritabanı/depolama geçişi gerekir.

Sunucuda `npm ci`, `npm run build`, bir kez `npm run cms:setup`, ardından süreç yöneticisiyle `npm start` çalışır. Alan adı HTTPS ters vekil üzerinden aynı uygulamaya yönlenmelidir; `/api`, `/uploads`, `/admin` ve bütün site yolları aynı sunucuya gitmelidir.

Gerekirse `.env.example` dosyasını `.env` olarak kopyalayın. Üretim örneği:

```dotenv
CMS_HOST=127.0.0.1
CMS_PORT=5188
CMS_DATA_DIR=/kalici-disk/scadawatt-data
CMS_ORIGIN=https://www.sizin-alan-adiniz.com
CMS_COOKIE_SECURE=1
```

`CMS_ORIGIN` tarayıcıdaki tam kökenle eşleşmelidir (sonunda `/` olmadan). Yerelde HTTPS olmadığı için `CMS_COOKIE_SECURE=1` kullanmayın. Varsayılan yerel ayarlarda iki satırı da boş/yorumda bırakın. LAN için gerekirse `CMS_HOST=0.0.0.0` kullanılır; yerel ağ erişimi ayrıca bilgisayar/modem ayarlarına bağlıdır.

Şifreler scrypt ile tuzlanıp özetlenir; oturum çerezi HttpOnly/SameSite=Strict’tir. Yazma işlemlerinde köken ve CSRF denetimi; girişte deneme sınırı; kayıtlarda sürüm çakışması kontrolü vardır. Yayına alma altyapısı seçildikten sonra HTTPS, yedek politikası ve sunucu erişimleri o ortamda doğrulanmalıdır.

Referanslar: https://nodejs.org/docs/latest-v24.x/api/sqlite.html ; https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html ; https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html

## Doğrulama ve sınırlar

- `npm.cmd run test:cms`: Gerçek geçici SQLite ve HTTP istekleriyle giriş, yetki, CSRF, taslak/yayın ayrımı, kalıcılık, geri alma, görsel yükleme ve giriş sınırı.
- `npx.cmd vitest run src/test/cms-admin.test.tsx`: Panel ve içerik bağlama testleri.
- `npm.cmd run build`: Tür kontrolü ve üretim paketi.
- Bu ortamda tarayıcı ile görsel doğrulama yapılmadı.
- İletişim formunun mevcut e-posta taslağı davranışı korunur. CMS kurmak, ziyaretçi taleplerini otomatik e-postaya gönderen bir altyapı eklemez.

## Animasyondaki yazıyı hızlı bulma

Panelde Animasyon / 3D yolculuk kartını seçin. Ardından 01 Saha, 02 Evirici, 03 Köşk, 04 ScadaWatt cihazı, 05 Dünya, 06 Ülke, 07 Şehir, 08 Mahalle, 09 Operatörün evi veya 10 Monitör adımını seçin. Yalnız bu sahnenin üç metin alanı açılır. Açılıştaki “Verinin izinden.” yazısı 01 Saha → Ana başlık alanındadır. Başlığın son sözcüğü mevcut italik tasarımda görünür.

Canlı metin önizlemesi yalnız yazıların örnek yerleşimidir; 3D render yapmaz. Sahnenin gerçek görüntüsünü görmek için alttan Ana sayfa → Önizle kullanın ve ilgili sahneye kaydırın. Ortak buton/etiketleri ayrı bağlantıdan düzenleyin. Aramaya gördüğünüz metni veya “şehir”, “operatör”, “simulasyon” gibi kelimeleri yazabilirsiniz. Arama başlık, konum ve TR/EN içeriklerde yapılır. Görsel filtresi ve yalnız yayından farklı alanlar filtresi de kullanılabilir.

V57 genel metinlerinde kaydedilmiş sahne metinleri yeni alanlara bağlanır; geçmişten bu sürümleri taslağa alırken de eşleme uygulanır.

## V66 seçim iyileştirmeleri

Çok satırlı başlıkta veya birden fazla metin parçası içeren paragrafta sağ panelde **Bu öğedeki düzenlenebilir alanlar** seçicisi açılır. İstediğiniz parçayı seçip TR/EN metnini düzenleyin. Formun boş giriş alanına tıklayınca etiketi; seçenek kutusuna tıklayınca seçenek yazıları düzenlenebilir. Bu işlemler formun teknik değerlerini değiştirmez. Tablo hücreleri ve cihaz kodları da seçilebilir. Cihaz kodunu değiştirirken sayfa adresi sabit tutulur. Sayısal canlı/temsili ölçümler otomatik veridir; görselin içine gömülü yazı için görseli değiştirin.

## Yayınlamadan önce değişiklikleri inceleme — V66

Üstte **Değişiklikleri gör** veya **Yayınla** düğmesini kullanın. Görsel editör ve klasik panel, mevcut taslağı yayındaki sürümle karşılaştırır. Eski metin kırmızı ve üzeri çizili; yeni metin yeşil görünür. TR/EN değerleri ayrı satırlarda, görseller eski/yeni önizlemeleriyle gösterilir. Yeni kayıtlar, silinecek kayıtlar, liste sıralamaları ve kayıt alanlarındaki değişiklikler de listelenir. Uzun listelerde arama ve sayfalama bulunur.

- **Geri al:** Yalnız seçilen alanı yayındaki değerine döndürür. Bir liste özelliğinde (teknik özellik, hizmet, karşılaştırma vb.) TR/EN satırları birlikte geri alınır. Diğer değişiklikler korunur.
- **Tümünü geri al:** İçerik taslağını tamamen yayındaki sürüme döndürür; yeni ekleme ve silmeler dahil. Onay ister. Yüklediğiniz kullanılmayan görseller kütüphanede kalır.
- **Taslağı kaydet:** Geri almaları kalıcı kaydeder; ziyaretçiler etkilenmez.
- **İncelemeyi kapat / Vazgeç:** Yalnız pencereyi kapatır. Taslağı silmez ve yayın yapmaz.
- **Onayla ve yayınla / Onayla:** Kalan değişiklikleri kaydedip yeni yayın oluşturur. Hiç değişiklik kalmadıysa yayın düğmesi kapanır.

Karşılaştırma yayındaki sürüme göredir; daha önce kaydedilmiş ama yayınlanmamış taslak değişikliklerini de kapsar. Sayfayı kaydetmeden kapatırsanız mevcut kaydedilmemiş değişiklik uyarısı geçerlidir.
