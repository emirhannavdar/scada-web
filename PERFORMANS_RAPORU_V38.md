# V38 doğrulama ve performans notları

## Ölçüm yöntemi

Gerçek üretim GLB dosyaları test yükleyicisiyle açılır; saha, operatör ve mobilyalar kurulur. Sahne ve kamera güncellenir, örnek bazlı görüş alanı elemesi uygulanır. Aşağıdaki çizim/üçgen sayımları GPU süresi veya FPS ölçümü değildir. Materyallerin derlenmesi ve tarayıcıdaki görsel sonuç bu ortamda incelenemedi.

| İlerleme | Çizim gönderimi | Üçgen |
|---|---:|---:|
| 0.81 | 23 | 16,310 |
| 0.85 | 23 | 13,956 |
| 0.875 | 23 | 12,850 |
| 0.9 | 23 | 11,388 |

Şehir yaklaşımı 25'ten az çizim gönderimi / 30.000'den az üçgen test sınırında kalır. Binaların silüeti ve pencereleri sabittir; uzak/yakın bina modeli değiştirilmez. Pencereler kutu hacmi yerine iki üçgenli yüzeylerdir. Görüş dışındaki örnekler çizilmez.

## Eklenenlerin maliyeti

- Şehir için yeni GLB veya dış doku yoktur. Mevcut GLB indirme listesi korunur.
- Sokak lambaları ve trafik sinyalleri gerçek zamanlı PointLight eklemez; açık renkli/emissive benzeri maliyetsiz yüzeylerdir. Ek gölge haritası yoktur.
- 24 araçta 3 tip vardır. Gövdeler ve farlar iki paylaşılan grup kullanır; trafik direkleri gövde grubundadır. Sinyal mercekleri tek ek çizim grubudur. Dinamik örnekler statik örnek sıkıştırmasından hariç tutulur; araç/ışık indeksleri bozulmaz.
- Trafik yalnız scroll ilerlemesi değişince güncellenir. Boşta çalışan sürekli trafik RAF/zamanlayıcı döngüsü eklenmez.
- Kontrol panosunun yeni ekipmanları malzemeye göre gruplanır. S3000i ve 3 donanım gösterimi GLB indirmez; kodla oluşturulmuş referans modelleri kullanır.
- Donanım galerisi görünür olmadan başlatılmaz; 3 model tek WebGL bağlamında ayrı viewportlarla çizilir. Yalnız görünürken ve hover/resize/kaydırma değiştiğinde çizim ister. Boyut değişmedikçe render tamponu yeniden boyutlandırılmaz. Hareket azaltma tercihi desteklenir.
- Önceki gerçek operatör ve ev modelleri korunur. Monitör, çerçeve içindeki mevcut uzaklığında kalır.

## Kontroller

69 otomatik test: üretim modelleri, saha/şehir/ev kamera güzergâhı, monitörün 9 köşeli ışın kontrolü, kalıcı bina kabuğu, boyutlar, mobilya yerleşimi, üçüncü sıra kutular, yola bakan evirici, renkli trafik indeksleri, kırmızı/yeşil davranışı ve ekran dışından monitör sayfası kaydırma. Trafik döngüsü sınırındaki süreklilik ayrıca doğrulanır.

TypeScript ve Vite üretim derlemesi; model dosya/boyut denetimi. Evrensel donmama veya belirli yükleme süresi garanti edilmez. Gerçek cihazdaki son karşılaştırma üretim önizlemesinde (npm.cmd run build / npm.cmd run preview, port 5188) yapılmalıdır.
