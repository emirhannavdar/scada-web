# ScadaWatt V128

## Eklenenler

- **Yayın kontrolü:** Admin ve root için sayfa düzenleyicinin üst çubuğunda. Root klasik yönetim menüsünde de erişilebilir. Açık taslağı, kayıt başlıklarını/açıklamalarını, tekrarlanan adresleri, görsel dosyalarını ve açık sayfanın iç bağlantılarını denetler. Boş bırakılan metinleri uyarı olarak gösterir; bilerek gizlenen alanları hata kabul etmez.
- **Mobil kontrol:** Açık önizlemede taşan öğeleri, 12 px altında kalan yazıları, uzun/boş başlıkları, başlık sırasını ve görsel alt niteliğini kontrol eder. “Mobil görünümde incele” ile mobil taslağa geçilebilir. Cihaz değiştirirken mevcut taslağı kaydetme davranışı korunur.
- **Değişiklik koruması:** Mevcut sekme kapatma/yenileme uyarıları korundu. Admin sayfasından uygulama içi bağlantı veya tarayıcı geçmişiyle ayrılmak için de onay istenir.
- **Görsel yükleme:** Donanım/görsel kütüphanesi ve müşteri resmi yüklemelerinde tarayıcı tarafında optimizasyon. Genel görseller en uzun kenarda 2560 px, müşteri resimleri 1280 px ile sınırlandırılır; büyütme yapılmaz. Küçük logolar olduğu gibi korunur. Uygun görseller WebP’ye çevrilir; şeffaflık ve en-boy oranı korunur. Sunucunun 8 MB yükleme ve dosya doğrulama kuralları devam eder.
- **İçerik hataları:** Güncel içerik servisine ulaşılamazsa küçük bir uyarı ve yeniden deneme düğmesi görünür. Tekrar denemek sayfayı/3D sahneyi baştan kurmaz; içerik yerinde güncellenir.
- **Görsel/model hataları:** Eksik görsel için açıklayıcı bir yer tutucu gösterilir. 3D görünüm ve sayfa hatalarında yeniden deneme düğmesi bulunur. 3D görünümün yeniden denenmesi sayfayı yeniler.
- **Bildirim dayanıklılığı:** Beklenen liste yapısında gelmeyen bir yanıtın editörü çökertmesi önlendi.

## Sınırlar

Yayın kontrolü seçili cihazın taslağını kullanır. Diğer sayfaların yerleşimlerini otomatik gezmez; onların taslak alanları ve görselleri kontrol edilir, yerleşim için ilgili sayfayı açıp kontrolü çalıştırın. Dış sunuculardaki görsellere HEAD isteği gönderilmez. Görsel kontrolünde aynı anda en fazla dört yerel istek çalışır; panel kapatıldığında iptal edilir.

Kontrol, yayınlama veya onay verme işlemi yapmaz. Admin doğrudan yayınlayamaz; root yönetim yetkileri ve onay süreci korunur. Bilerek yapılan küçük yazı/boş alan tercihleri uyarı olabilir. Araç gerçek cihaz hız testi ya da SEO puanı değildir.

## Doğrulama

38 arayüz kontrolü ve 4 izole sunucu testi geçti. Yeni kontroller, görsel optimizasyonu, kaydedilmemiş değişiklik koruması, hata sonrası içerik yenileme, admin/root arayüz ayrımı ve mobil/masaüstü taslak izolasyonu test edildi. Gerçek HTTP testleriyle onay öncesi taslağın yayına çıkmadığı ve önizlemenin yetki gerektirdiği doğrulandı. Üretim build’i hazırdır. Testler gerçek veritabanı yerine izole test verisi kullanır.

Önceki SEO ve menü düzeltmeleri bu pakete dahildir. Önceki SEO raporu bilgi amaçlı korunmuştur.
