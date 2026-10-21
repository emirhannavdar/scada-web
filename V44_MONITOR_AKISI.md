# V44 — monitör ekranları kaydırma animasyonunun devamı

V43’teki ayrı tekerlek / sayfa sayacı / bekleme mekanizması ana sayfadan çıkarıldı. DataVoyage, tek bir görsel zaman çizelgesini kullanır: %0–62 kamera yolculuğu; %62–100 sabit kamera ve dokuz monitör resmi. Her resim için belge yüksekliğine ek scroll alanı ayrılır. İleri/geri kaydırma aynı konumda aynı resmi verir. Sayfa sayısı içerikteki screenGallery’den okunur.

Dosyalar: src/components/site/DataVoyage.tsx, src/lib/voyage-timeline.ts, src/lib/journey-gate.ts, src/drone.css. Saha, şehir, dünya, operatör, ürün kataloğu ve kamera yolu korunmuştur. Ekranlar mevcut texture yükleyicisini ve üç dokuluk sınırlı önbelleğini kullanır. Yeni model veya WebGL bağlamı yoktur.

Normal akışta monitörün üzerine gelme şartı yoktur. Native kaydırma zaman çizelgesini ilerletir. Büyük sıçramada bölümün dışına çıkış, çizim yetişene kadar sınırda tutulur. Bir sonraki görsele geçiş için mevcut görselin render motorundan çizildi onayı beklenir; sabit 700 ms gecikmesi yoktur. Son kareden sonra sayfa serbesttir. Kısa viewport’ta sticky min-height kaldırılıp 100svh kullanılır.

Doğrulama: Tek büyük scroll hedefinde 0–8 resimlerinin sırasıyla çizilmesi, geç doku yüklemesinde sonraki resmin atlanmaması, son resimden sonra bölümün serbest kalması, geri kaydırmada doğru resme dönüş, kamera konumunun resimler boyunca sabit kalması ve yükleme bitmeden yolculuğun başlamaması test edilir. Gerçek model ve sahne bütçesi regresyonları da çalıştırılır.

Bu ortamda gerçek tarayıcı/GPU görsel kontrolü yapılamadı. Testlerde fiziksel model geometrisi ve uygulama olayları kullanıldı; GPU FPS iddiası yoktur.

Yerel çalıştırma: npm.cmd ci; npm.cmd run build; npm.cmd run preview. Adres http://127.0.0.1:5188. ZIP’i yeni klasöre çıkarın ve eski sunucuyu kapatın.

Sonuç: 29 dosyada 84 test geçti. TypeScript ve Vite üretim derlemesi başarılı.
