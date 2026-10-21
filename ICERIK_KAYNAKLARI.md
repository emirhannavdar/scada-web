# İçerik ve tasarım kaynakları

14 Ekim 2026.

- Şirket, plan, donanım ve çözüm içerikleri: https://scadawatt.com/ ve kullanıcının gönderdiği proje.
- Teknik tablolar: bu sohbetin önceki ScadaWatt resmi site taramasından alınan ürün kayıtları. S4000MC tablosunda yalnızca kaynakta bulunan altı özellik vardır; S3000i'nin hafıza/boyut değerleri bu ürüne kopyalanmamıştır. Güncel ürün revizyonu şirket tarafından kontrol edilmelidir.
- Ürün görselleri: kullanıcının bu sohbette sağladığı S3000i, S4000MC ve LOMR görsellerinin WebP sürümleri.
- Logo, web ve mobil tanıtım görselleri: ScadaWatt kurumsal sitesi. Görseller ZIP'e dahil edilmiştir; editöre özel asset servisi gerektirmez.
- Tasarım referansı: https://inductiveautomation.com/ . Ürün odaklı üst vitrin, katmanlı navigasyon ve platform sunumu ilham olarak ele alınmıştır. Referansın markası, müşterileri, ürün yetenekleri veya lisans iddiaları ScadaWatt'a aktarılmamıştır.
- Inter: SIL Open Font License. Lisans `public/assets/Inter-OFL.txt`; WOFF2 dosyaları yereldedir.

Ana sayfadaki eski anlık kapasite/üretim sayaçları kaldırılmıştır. Canlı kaynak bulunmadığı için değişen ekosistem değerleri sabit rakamlarla gösterilmez. İzleme planları mevcut GES ürününe aittir. Yenilenebilir enerji sayfası diğer enerji kaynaklarında hazır destek veya doğrulanmamış uyumluluk iddia etmez.

Sahte referans logoları, müşteri yorumları, indirme istatistikleri ve uygulama mağazası bağlantıları eklenmemiştir.

## Veri yolculuğu sürümü

Açılıştaki saha/cihaz/haberleşme/arayüz çizimi SVG ile kodlanmıştır. S3000i fotoğrafı gerçek ürün görselidir; diğer öğeler kavramsaldır. Vektör panel mevcut ScadaWatt ürün ekranının birebir kopyası olarak sunulmaz. Aktif güç / gerilim / frekans değerleri tanıtım için hazırlanmış örneklerdir. Canlı telemetri içermez.

Güneş paneli fotoğrafları ve eski veri topografyası bu sürümün açılışından ve paketinden kaldırılmıştır. Yeni raster görsel veya video üretilmemiştir.

## V5 — gönderilen gerçek saha ve arayüzler
Kullanıcı yüklemeleri: images.jpg, Genel Görünüm.png, Genel Görünüm 2.png, Eviriciler.png, Canlı İzleme 1.png, Alarm Arşivi.png, Limit Yönetimi.png, Üretimler.png, Saha Özellikleri 5.png ve Saha Özellikleri 10.png. `/assets/screens/` altında WebP türevleri kullanılır. İçerik sabittir, canlı okunmaz. Önceki SVG veri paketi ve demo değerleri ana sayfadan çıkarıldı.
SCADA akışının genel açıklaması: https://inductiveautomation.com/resources/article/what-is-scada
S3000i rolü ve şirket kapsamı: https://scadawatt.com/ ve https://www.scadawatt.com/product/S3000i (14 Ekim 2026 incelendi).

## V6 — referanstan 3B modele
Kullanıcı görseli `proje_atkaracalar.jpg` (1080 × 1080) panel sıraları, arazi ve servis yolları için referanstır; fotoğraf sahneye yerleştirilmez. Model özgün kod geometrisidir. Evirici ve cihaz içleri temsili olup gerçek devre olarak sunulmaz. S3000i dış gövdesi gönderilen ürün görselinden referans alır. Gerçek arayüz ekranı fiziksel 3B monitöre doku olarak bağlanır.
Görsel deneyim referansı https://faers.tech/ (14 Ekim 2026). Referans sitenin kodu veya görselleri kopyalanmadı.
Three.js resmi API belgeleri: https://threejs.org/docs/ . Model kodu `src/lib/flight/` altındadır.

## V7
Yeni saha fotoğrafı veya dış kaynak eklenmedi. Mat panel malzemeleri ve çevre özgün kod geometrisidir. Eski açıklayıcı cihaz kesitleri artık gösterilmez. Küresel ağ/dünya/ofis bağlantısı temsili anlatımdır; gerçek internet hattı veya ScadaWatt veri merkezi konumu iddiası içermez.

## V8 — Dünya dokuları ve gece sahnesi
Three.js resmi örnek varlıklarından indirilip yerelde paketlenen Dünya gündüz/gece dokuları:
- https://threejs.org/examples/textures/planets/earth_day_4096.jpg
- https://threejs.org/examples/textures/planets/earth_night_4096.jpg
Erişim: 14 Ekim 2026. Kaynak dosyaları `public/assets/earth/` içinde, özgün dosya adlarıyla korunur. Bu dokular ScadaWatt'a ait saha görseli olarak sunulmaz.
Gece yerleşimi, binalar ve insan özgün kod geometrisidir. Saha sonrasında fiziksel kablo, küresel veri topu veya gerçek internet rotası gösterilmez.
