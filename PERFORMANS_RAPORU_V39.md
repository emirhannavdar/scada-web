# V39 doğrulama

Saha taraması çevrimdışı, tüm meshler arasında ortak köşe bağlantılarıyla analiz edildi. Ana yüzeyden ayrık 155 bileşen / 4.981 köşe kaldırıldı. Ana yüzey tek bağlı bileşen olarak doğrulanır; kalan 835.984 üçgenin yüzey konumları/UV'leri korunur. Yeni tarama 24.413.340 bayttır. Önceki dosyadan yaklaşık 125 KB küçüktür; sadeleştirme kayıpsız olarak adlandırılmaz. Bileşen analizi tarayıcıda yapılmaz.

Yakın panel bağlantıları güncel planTables() yerleşimine dayanır. Kullanılmayan direk/bağlantı ızgarası üretilmez. Bekçi kulübesinin sınırları çit içinde kalır ve panel tablalarıyla çakışmaz. Pano, tek bir montajda yeniden kuruldu; eski/yeni şalterler üst üste çizilmez. Kablo borusunun dünya uzayındaki sınırı alt rakorla kesişir; görsel boşluk bırakılmaz.

Donanım alanındaki ek WebGL bağlamı kaldırıldı. Üç gerçek ürün fotoğrafı ve CSS yakınlaşması kullanılır. Şehirde 24 araç 12 yola dağılır; yeni model/doku/ışık/gölge haritası eklenmez. Araç güncellemeleri scroll ile sınırlıdır.

## Şehir yaklaşımı örnek sayımları

| İlerleme | Çizim gönderimi | Üçgen |
|---|---:|---:|
| 0.81 | 23 | 16,310 |
| 0.85 | 23 | 13,956 |
| 0.875 | 23 | 12,850 |
| 0.9 | 23 | 11,388 |

Bunlar üretim GLB'leriyle yapılan CPU geometri/gönderim sayımlarıdır; ekran kartı FPS ölçümü değildir. Önceki 25'ten az çizim ve 30.000'den az üçgen sınırı korunur.

## Kontroller

73 test / 25 test dosyası başarılı. Gerçek üretim GLB'leri, kamera yolları, cihaz/monitör görüşü, mobilyalar, tarama bileşenleri, panel bağlantıları, kulübe/çit/panel çakışması, boru/rakor birleşimi, cadde dağılımı ve üretim performans bütçesi doğrulandı. TypeScript/Vite derlemesi ve tüm model dosyalarının içerik özeti/yapı kontrolü geçti.

Bu ortamda tarayıcı/GPU görsel testi yapılamadı; tüm cihazlarda donmama garantisi verilemez. Son görsel karşılaştırma npm.cmd run build ve npm.cmd run preview ile port 5188'de yapılmalıdır.
