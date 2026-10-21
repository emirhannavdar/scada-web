# V31 performans ve veri raporu

## Dosya bazında doğrulanmış değişiklikler

| Ölçüm | V30 | V31 |
|---|---:|---:|
| Çalışma zamanında istenen model dosyaları | 253,11 MB | 36,17 MB |
| Şehir planındaki bina sayısı | 178 | 33 |
| Apartman | 87 | 5 |
| Müstakil ev/villa | 80 | 25 |
| Kule / kamu yapısı | 9 / 2 | 2 / 1 |
| Small Villa dış kabuğu | Orijinal 113.865 üçgen | 5.579 üçgen |
| Gaming Room | Orijinal 454.703 üçgen | 111.756 üçgen |
| Arazi | 838.969 üçgen | 295.777 üçgen |

Model aktarımı %85,71 azaldı. V30 karşılaştırması son teslim ZIP'inin gerçekten yüklediği dosyaların boyutlarından hesaplandı; V31 toplamı aktif manifestin 12 dosyasının boyutudur. Bunlar MB = 1.000.000 bayt, HTTP gzip/Brotli sıkıştırmasından önceki değerlerdir. Yol ayrıca çalışma zamanında daha düşük geometrili tekrar parçalarına dönüştürülür.

## Yeni ziyaretçinin indireceği veri

İlk, tamamen önbelleksiz ziyarette modeller 36,17 MB tutar. Dünya haritaları, fontlar, gerçek arayüz görüntüsü ve uygulama kodu buna eklenir; başlangıç toplamı sunucu sıkıştırmasına ve görünür içeriklere bağlı olarak yaklaşık 37–39 MB düzeyindedir. Bütün `dist` çıktısı yaklaşık 40 MB disk alanı tutar; bu değer tek sayfa ilk ağ aktarımı değildir.

SCADA ekranları seçildikçe yüklenir. İlk ekrandan sonra diğer sekiz görüntü başlangıçta topluca indirilmez. Tam ekran eski galeri kaldırıldığı için ikinci bir galeri aynı görüntüleri yüklemez.

Değişmeyen hash dosyaları sonraki ziyaretlerde HTTP önbelleğinden okunabilir; 36,17 MB model verisini her ziyarette yeniden indirmek gerekmez. Tarayıcı cache'i boşaltmışsa, gizli mod kullanılıyorsa veya kullanıcı depolamayı sınırlandırıyorsa yeniden indirme gerçekleşebilir. Eski sürümdeki cache kayıtlarını tarayıcı kendi politikasıyla temizler. Uygulama ayrıca CacheStorage / IndexedDB / localStorage içine model kopyası yazmaz.

## Ekran kartı / CPU yükü

- Eski apartman/villa çizimleri parent sahneden çıkarılır; yeni ve eski bina çizimleri üst üste bırakılmaz.
- Şehirde aynı modelin geometrisi ve malzemesi paylaşılır. Farklı iki konut ailesi, farklı rotasyon ve sınırlı renk tonlarıyla kullanılır.
- Modelde görünmeyen iç mobilyalar, yoğun çitler, kaynak altlığı ve gereksiz oda duvarları çıkarılır.
- Gece dinamik gölgeleri ve SSAO'nun ilave normal/derinlik geçişleri kaldırılır. Gece tek beauty render yapılır.
- Model/pano/texture hazırlığı yükleme ekranı bitmeden yapılır.
- Masaüstü piksel oranı en çok 1,25, küçük ekranlarda en çok 1,0'dır. Hareket sırasında uzun kare aralıkları görülürse kademeli olarak 0,65'e kadar düşebilir. Bu mekanizma çözünürlüğü azaltır; ölçülmüş bir GPU FPS garantisi değildir.
- Sayfa veya sahne görünür değilken çizim durur. Durağan görüntü tekrar tekrar çizilmez; ekran değişimi yeni bir kare ister. İşçi animasyonları gece bölümünde güncellenmez.
- Fare ekranla kesişme testi yalnızca iki üçgenlik gerçek ekran düzlemine yapılır; her mousemove olayında bütün şehir dünya matrisleri tekrar hesaplanmaz.
- SCADA ekranlarının GPU doku önbelleği en fazla üç görüntü tutar. Görüntülerin oranı korunur; kırpma veya zorla esnetme yapılmaz.
- Hash sürümlü dosyalar, 1 yıllık immutable HTTP cache politikasına uygundur. Sunucu örnekleri pakettedir.

Model dokularının çözülmüş GPU alanı, mipmap varsayımıyla yaklaşık **194,8 MiB** olarak hesaplanır. Bu tarayıcının diske yazacağı cache boyutu değildir. Geometri, render hedefleri, ekran dokuları ve sürücü kaynakları da GPU belleği kullanır; toplam bellek bu değerden büyüktür.

## Doğrulama sınırı ve yerel test

Testler gerçek GLTFLoader ile optimize dosyaların geometrisini, rig'ini, buffer aralıklarını, kamera çarpışmalarını, monitör köşelerini, menü etkileşimini ve içerik hash'lerini kontrol eder. Kod testleri tarayıcıdaki ışık/doku görünümünü veya ekran kartının FPS'ini ölçmez. Bu ortamda gerçek GPU tarayıcı testi yapılamadı.

Yerel performans değerlendirmesinde `npm.cmd run build` ardından `npm.cmd run preview` kullanın. Ağ panelinde cache kapatma kutusu işaretli değilken ilk açılış ve tekrar açılışı ayrı ölçün. Performance panelinde şehir/oda kısmını kaydırırken kare sürelerini inceleyin. Geliştirme sunucusunun modül ve geliştirme iş yükü, üretim önizlemesinden farklıdır.

Canlı yayın ilk indirme süresini ağ/CDN üzerinden etkiler. Kaydırma sırasında çizimin büyük kısmını ziyaretçinin ekran kartı ve CPU'su yapar; siteyi yayınlamak tek başına FPS'i düşürmez veya yükseltmez. Bu sürüm önemli yükleri azaltır, ancak her cihaz için mutlak sıfır donma sözü vermez.
