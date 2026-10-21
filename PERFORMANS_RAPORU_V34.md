# V34 performans raporu

## Darboğazlar ve düzeltmeler

Arazi ve oda, model geldikten sonra tarayıcıda yüz binlerce verteks işlenerek hazırlanıyordu. Bu hesaplamalar artık paketlenmiş GLB geometrisinde hazırdır. Oda geometri verisi indekslenerek tekrarlı verteksler azaltıldı. Arazi yüzeyi ve doku atamaları korunur.

Taranmış yolun tam ayrıntısı bütün yol parçalarında çiziliyordu. Yakın parçalar özgün ayrıntıyı, 35 metreden uzak parçalar LOD geometrisini kullanır. Aynı parça tek ayrıntı düzeyinde çizilir. LOD kaynak geometride sınırlar kilitlenerek yaklaşık 0,001 göreli hata sınırıyla üretildi. Görsel kontrol gerçek GPU üzerinde ayrıca gerekir.

V33 ile aynı p=0.45 kamera konumundaki CPU sahne bütçesi **6.565.483 → 2.663.405 üçgen** (yaklaşık %59 azalma). Şehir p=0.85 bütçesi 48 çizim / 374.050 üçgen; oda p=0.96 bütçesi 46 çizim / 374.542 üçgen. Bunlar gerçek FPS veya GPU süresi değildir. Render motorunun kendi frustum elemesi gerçek çizimleri ayrıca azaltabilir.

Ağ istekleri iki paralel indirme ve sınırlı bekleme kuyruğu kullanır. Parse ve kurulum sırayla yürür. Dokular görünür modele eklenmeden önce tek tek hazırlanır. Gece shader hazırlığı gece sahnesinin ışık/sis durumunda yapılır. Safari kaydırmasını engelleyen wheel dinleyicisi yalnızca monitör evresinde etkinleştirilir.

## İndirme ve bellek

Tüm GLB dosyaları **64.930.028 bayt**; aktif model dosyaları **64.144.192 bayt**. V33 toplamı 66.336.044 bayttı. Bu sürümün asıl kazancı geometri tekrarları ve tarayıcıdaki senkron hazırlık işlerinin azaltılmasıdır.

Bazı dokuların kayıpsız WebP yeniden kodlamasında çözülmüş RGBA verisi karşılaştırıldı. TEXTURE_METRICS_V34.json görüntü ölçülerini ve doğrulama hash'lerini içerir. Dokuların çözünürlüğü düşürülmedi. Dolayısıyla açılmış doku belleği yaklaşık **394 MiB** olarak kalır; bu toplam GPU belleği değildir. Yüksek ayrıntılı bütün sahneler düşük bellekli cihazlarda hâlâ ağır olabilir.

## Doğrulama sınırı

Bu ortamda gerçek tarayıcı/GPU görsel kontrolü ve FPS testi yapılamadı. 2–3 saniyelik ilk açılış ve hiç takılmama garantisi verilmez. İlk ekran bütün modelleri beklemez; dosyalar arka planda tamamlanır. Ağ yavaşsa hızlı kaydırmada geçici sahne görünümü oluşabilir.

Üretim karşılaştırması: npm ci → npm run build → npm run preview, http://127.0.0.1:5188. Eski projenin üzerine kopyalamadan yeni klasör kullanın. npm test -- --maxWorkers=1 ve node scripts/check-model-assets.mjs kontrolleri uygulanır.

Son kontrol: 21 test dosyası / 62 test geçti. TypeScript kontrolü ve Vite üretim derlemesi başarılı. 13 GLB dosyasının hash ve buffer sınır kontrolleri başarılı.
