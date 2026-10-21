# V40 tasarım ve doğrulama

## Çözümler

Sol taraftaki şematik cihaz/veri akışı kaldırıldı. Büyük başlık, dikey çözüm dizini ve sağda gerçek uygulama ekranını kullanan bir editoryal sunum oluşturuldu. Açıklama ve kapsam maddeleri site içerik kaynağından okunur. Görsellerin neyi gösterdiği ayrı altyazıyla belirtilir. Yeni bir canlı veri veya sahaya komut özelliği eklenmez.

## Donanım

Üç gerçek ürün fotoğrafı korunur. Başlangıçta üçlü görünüm, seçimde ise fotoğraf ve metin için farklı yerleşim vardır: S3000i sağa, S4000MC yukarı, LOMR-07H sola taşınır. Fotoğrafın çapraz açısı geçiş boyunca değişir ve sonunda sabit kalır. Kullanılan perspektif gerçek fotoğraf üzerindeki CSS dönüşümüdür; yeni bir 3B ürün modeli değildir. Çerçeve yüksekliği masaüstünde sabittir; seçim sayfa boyunu değiştirmez.

Fotoğrafların üzerindeki başlangıç hedefleri seçimden sonra pasif hale gelir. Seçili açıklama üzerine geçmek seçimi bozmaz. Alt düğmelerden başka bir ürüne geçilir. Tüm ürünler veya Escape ile başlangıç görünümüne dönülür. Dokunmatik seçim, klavye odağı ve hareket azaltma tercihi desteklenir. Dar görünümde ürün ortalanır ve metin alta alınır.

## Performans ve test kapsamı

Sadece bu iki sunum bölümünün React/CSS kodu ve içerik eşleştirmesi değiştirildi. Yolculuğa ait 32 kaynak dosyası V39 ile bayt düzeyinde aynı kaldı. Model listesi ve model dosyaları değişmedi. Yeni WebGL bağlamı, model, yazı tipi, doku, kütüphane veya sürekli render döngüsü eklenmedi. Gerçek ürün ve uygulama fotoğrafları mevcut yerel dosyalardır.

14 arayüz testi: rota/içerik tutarlılığı, üç ürün yönü, seçim sırasında içerik erişimi, Escape ile dönüş, gerçek fotoğraflar, doğru ürün bağlantısı, çözüm seçimi ve klavye gezinmesi; mevcut menü, iletişim ve arayüz testleri. TypeScript ve Vite üretim derlemesi başarılıdır.

Bu ortamda görsel tarayıcı/GPU testi yapılamadı. Otomatik kontroller etkileşim ve derlemeyi doğrular; görsel yerleşimin son değerlendirmesi yerel tarayıcıdadır. Port 5188, komutlar README.md içindedir.
