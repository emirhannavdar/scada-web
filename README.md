# ScadaWatt V66 — Tam ve çalıştırmaya hazır proje

ZIP'in tamamını bir klasöre çıkarın. Node.js 24+ gerekir (bilgisayarınızda zaten kurulu).

## Normal çalıştırma

package.json bulunan klasörde:

```powershell
npm.cmd start
```

Bu ZIP hazır dist/ derlemesini, bütün kaynak kodları, modelleri, CSS'leri, TypeScript yapılandırmalarını ve sunucu dosyalarını içerir. **İlk açılış için npm ci veya build gerekmez.** İsterseniz BASLAT.cmd dosyasını çift tıklayabilirsiniz.

- Site: http://127.0.0.1:5188/
- Panel: http://127.0.0.1:5188/admin
- Aynı ağdan: http://BILGISAYARINIZIN-IP-ADRESI:5188/

Sunucu varsayılan olarak 0.0.0.0 üzerinden bağlantı kabul eder. Port 5188 kullanılır. Windows/modem ağ izinleri ayrıca geçerlidir.

## Önceki hesabınız ve içerikleriniz

İlk çalıştırmada kendi data/ veritabanı yoksa uygulama, aynı üst klasördeki scadawatt-v65, scadawatt-v64, scadawatt-v63, scadawatt-v62, scadawatt-v61, scadawatt-v60, scadawatt-v59, scadawatt-v58, scadawatt-v57.1 veya scadawatt-v57 içindeki mevcut yönetici hesabını, içerikleri ve yüklemeleri otomatik olarak yeni data/ klasörüne aktarır. ZIP'in ekstra bir üst klasöre çıkarılması için bir üst seviye de kontrol edilir. SQLite yedekleme yöntemi kullanılır; eski kayıtlar değiştirilmez. Özel CMS_DATA_DIR tanımlıysa o yol kullanılır ve otomatik kopyalama yapılmaz.

Önceki klasör farklı yerdeyse kendi data/ klasörünüzü bu proje klasörüne kopyalayabilirsiniz. Hiç yönetici hesabı yoksa bir kez npm.cmd run cms:setup çalıştırın. Yönetim panelinin içerik kullanımı YONETIM_PANELI.md içindedir.

## Kod geliştirecekseniz

```powershell
npm.cmd ci --include=dev
npm.cmd run build
npm.cmd start
```

Üretim tür kontrolü test dosyalarından ayrılmıştır. Test tür kontrolü: npm.cmd run test:types. Geliştirme sunucusu: npm.cmd run dev -- --host 0.0.0.0 (önce npm ci gerekir). Normal site kullanımı ve panelden içerik değiştirmek için bunlara gerek yoktur.

Hesap, şifre ve kullanıcı veritabanı bu ZIP'e dahil edilmez. Hazır derleme ile kaynaklar birlikte verildiğinden önceki paketten daha büyüktür. Canlı sunucu için Node ve kalıcı disk gerekir. V66: yönetimden donanım, çözüm ve paket ekleme/silme/sıralama; görsel silme; Uygulama hikâyeleri bölümünün kaldırılması ve yolculuğun doğrudan son kareye atlanması.

## Sayfa üzerinde görsel düzenleme (V66)

`/admin` girişi sonrasında site kendi tasarımıyla editörde açılır. Üstte **Düzenle** modundayken yazı veya fotoğrafa tıklayın; sağ panelden TR/EN içeriği değiştirin. **Uygula ve önizle** taslağa kaydeder. Ziyaretçilere geçmesi için ayrıca **Yayınla** ile onay verin.

- **Gezin** modunda bağlantılar, sekmeler ve animasyon normal kullanılır.
- Üstte sayfa, TR/EN dili ve masaüstü/mobil önizleme seçilebilir.
- **Animasyon sahnesi** seçimi doğrudan o sahneye gider ve düzenlerken görüntüyü sabitler. Metinleri sağdaki alan seçicisinden seçebilirsiniz.
- Donanım/çözüm/paket bölümüne gelince görünen düğmelerle yeni kayıt eklenebilir veya ilgili kayıt açılabilir. Üstteki liste yönetimi düğmesi de her zaman erişilebilirdir.
- **Yönetim** eski ayrıntılı paneli açar: görsel silme, yayın geçmişi ve bütün içerik alanları burada kalır. **Sayfa üzerinde düzenle** ile geri dönülür.

Görsel editör sayfa içeriğini düzenler; 3D model geometrisini veya sayfa tasarımını sürükleyerek değiştiren bir tasarım aracı değildir. Formlar yönetim önizlemesinde gönderilmez.

V66: Parçalı/çok satırlı başlıklar, tırnaklı metinler, ikonlu butonlar, form etiketleri ve seçenekleri için doğrudan seçim genişletildi. Paket karşılaştırma hücreleri ve cihaz kodları da görsel editörden düzenlenebilir. Düzenleme modunda tıklamayı engelleyen yazı/görsel stilleri geçersiz kılınır; Gezin modunda özgün davranış geri gelir. Protokol kimlikleri, URL anahtarları, otomatik sayaçlar ve fotoğrafın içine gömülü yazılar metin alanı değildir; fotoğraf değiştirme ve kayıt düzenleme araçları ayrıca kullanılabilir.

## Yayınlamadan önce değişiklikleri inceleme — V66

Üstte **Değişiklikleri gör** veya **Yayınla** düğmesini kullanın. Görsel editör ve klasik panel, mevcut taslağı yayındaki sürümle karşılaştırır. Eski metin kırmızı ve üzeri çizili; yeni metin yeşil görünür. TR/EN değerleri ayrı satırlarda, görseller eski/yeni önizlemeleriyle gösterilir. Yeni kayıtlar, silinecek kayıtlar, liste sıralamaları ve kayıt alanlarındaki değişiklikler de listelenir. Uzun listelerde arama ve sayfalama bulunur.

- **Geri al:** Yalnız seçilen alanı yayındaki değerine döndürür. Bir liste özelliğinde (teknik özellik, hizmet, karşılaştırma vb.) TR/EN satırları birlikte geri alınır. Diğer değişiklikler korunur.
- **Tümünü geri al:** İçerik taslağını tamamen yayındaki sürüme döndürür; yeni ekleme ve silmeler dahil. Onay ister. Yüklediğiniz kullanılmayan görseller kütüphanede kalır.
- **Taslağı kaydet:** Geri almaları kalıcı kaydeder; ziyaretçiler etkilenmez.
- **İncelemeyi kapat / Vazgeç:** Yalnız pencereyi kapatır. Taslağı silmez ve yayın yapmaz.
- **Onayla ve yayınla / Onayla:** Kalan değişiklikleri kaydedip yeni yayın oluşturur. Hiç değişiklik kalmadıysa yayın düğmesi kapanır.

Karşılaştırma yayındaki sürüme göredir; daha önce kaydedilmiş ama yayınlanmamış taslak değişikliklerini de kapsar. Sayfayı kaydetmeden kapatırsanız mevcut kaydedilmemiş değişiklik uyarısı geçerlidir.


## V66: bağımsız mobil/masaüstü ve hazır sahne

Adminin üstündeki telefon/bilgisayar düğmesi artık tüm içerik ve tasarım düzenlemelerinin hedefini seçer. Metin, görsel, kayıt listeleri, palet ve yerleşim yalnız seçilen görünüme kaydedilir ve yayınlanır. Sayfa üzerinde seçilen öğenin Sürükle / taşı tutamacı konumu ayarlar. Önceki içerikler başlangıçta iki görünümde korunur.

Sahne ilk kez tamamıyla hazırlanır; aynı sekmedeki site içi gezinmede tek hazır 3D dünya saklanır ve kullanılmadığı sırada çizilmez. Ana sayfaya dönünce yeniden oluşturulmaz. Tam yenileme / yeni sekme / grafik bağlamı kaybında hazırlık gerekir; model dosyalarının HTTP önbelleği ayrıca korunur. Tarayıcı, GPU belleği ve disk önbelleğinin ne kadar tutulacağını kendisi yönetir.

Ayrıntılı kullanım: YONETIM_PANELI.md.
