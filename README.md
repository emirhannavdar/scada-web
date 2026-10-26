ScadaWatt v2.0.0
ScadaWatt için geliştirilen; enerji yönetimi, uzaktan izleme, yazılım ve elektronik çözümlerini tanıtan kurumsal web sitesi. Masaüstünde kaydırmayla ilerleyen 3D saha yolculuğu, mobil için ayrı arayüz ve sayfa üzerinde düzenleme yapılabilen bir içerik yönetim sistemi içerir.
Bu belgenin sürüm adı v2.0.0'dır. README güncellemesi, package.json içindeki teknik sürüm numarasını veya uygulama kodunu değiştirmez.

Temel özellikler
- React, TypeScript ve Vite tabanlı çok sayfalı arayüz.
- Node.js sunucusu ve PostgreSQL üzerinde kalıcı içerik, kullanıcı ve yayın kayıtları.
- Türkçe/İngilizce içerikler ve aydınlık/karanlık tema.
- Masaüstünde saha → inverter → köşk/SCADA → Dünya → şehir → operatör/monitör yolculuğu.
- Mobilde kaydırmalı 3D yolculuk yerine bağımsız, daha hafif bir arayüz.
- Ana sayfaya dönüşte konumun korunması ve sahne kaynaklarının yeniden kullanılmasına yönelik önbellekleme.
- Animasyon başlıklarında ince sans ve serif italik tipografi. Çift renk yalnız açılış başlığında kullanılır; sonraki animasyon başlıkları tek renktir.
- Donanım, çözüm, izleme planları, şirket, iletişim, saha yapılandırıcı ve yasal içerik sayfaları.
- SMTP ile iletişim formu gönderimi, harita, yönetilebilir SSS ve müşteri yorumları.
- SEO başlıkları/açıklamaları, sitemap, robots ve yayın öncesi kontroller.
Gereksinimler
- Node.js 24–26 (>=24 <27) ve npm.
- Çalışan bir PostgreSQL sunucusu; mevcut ortamda PostgreSQL 18 kullanılır.
- Projeye ait .env dosyası ve doğru DATABASE_URL bağlantısı.
- Üretimde kalıcı disk ve HTTPS sağlayan bir reverse proxy.
PostgreSQL, uygulamanın kalıcı veritabanıdır. Redis bu web sitesinin normal çalışması için zorunlu değildir. Statik Vite önizlemesi, CMS ve iletişim sunucusunun yerini tutmaz.
Mevcut kurulumu çalıştırma
Komutları package.json bulunan proje klasöründe çalıştırın:
npm.cmd start
- Site: http://127.0.0.1:5188/
- Yönetim: http://127.0.0.1:5188/admin
- Yerel ağ: http://BILGISAYARINIZIN-IP-ADRESI:5188/
Varsayılan port 5188, dinleme adresi 0.0.0.0'dır. 0.0.0.0, tarayıcıya yazılacak adres değildir. Aynı ağdaki cihazlar sunucunun yerel IP adresini kullanır; ağ izolasyonu ve güvenlik duvarı izinleri ayrıca geçerlidir.

Mevcut bağımlılıklar ve güncel dist/ derlemesi varsa tekrar kurulum gerekmez. Kaynak kod değiştiğinde npm.cmd run build çalıştırın. npm.cmd start, tek başına yeni arayüz derlemesi oluşturmaz.

Windows için yerel PostgreSQL başlangıç betiği, prestart aşamasında çalışır. Bu, PostgreSQL'in kurulu ve yapılandırılmış olması gerekliliğini ortadan kaldırmaz. Canlı sunucuda PostgreSQL'i işletim sisteminin servis yöneticisiyle yönetin.
İlk kurulum
npm.cmd ci --include=dev
npm.cmd run cms:postgres:setup
npm.cmd run cms:setup
npm.cmd run build
npm.cmd start
cms:postgres:setup, PostgreSQL yönetici bilgilerini sorar ve uygulama bağlantısını .env içine kaydeder. Mevcut bağlantı veya veritabanı varsa komutun çıktısına göre ilerleyin; kurulu veritabanını silmeyin.

cms:setup, ilk yönetici hesabını oluşturmak içindir. Önceden hesap ve içerik aktarılmışsa yeniden hesap oluşturmanız gerekmez.
Ortam ayarları
.env dosyası proje kökünde bulunur. Örnek yapı:
DATABASE_URL=postgresql://KULLANICI:URL_KODLANMIS_SIFRE@127.0.0.1:5432/VERITABANI
CMS_HOST=0.0.0.0
CMS_PORT=5188
CMS_DATA_DIR=data
- Yerel PostgreSQL için 127.0.0.1 kullanılır. Veritabanı başka makinedeyse yalnız bağlantı adresi değiştirilir.
- Bağlantı URL'sindeki kullanıcı adı/şifre özel karakter içeriyorsa URL kodlaması gerekir.
- HTTPS ve reverse proxy kurulumunda CMS_ORIGIN, CMS_COOKIE_SECURE ve CMS_TRUSTED_PROXIES değerlerini gerçek alan adına ve güvenilen proxy adreslerine göre ayarlayın.
- .env, veritabanı parolaları ve data/ içindeki anahtarlar Git'e eklenmemelidir.
Geliştirme ve derleme
npm.cmd run dev -- --host 0.0.0.0
Üretim derlemesi ve normal sunucu:
npm.cmd run build
npm.cmd start
macOS/Linux üzerinde komutlarda npm.cmd yerine npm kullanın.

Başlıca kontroller:
npm.cmd run test:types
npm.cmd test
npm.cmd run test:security
npm.cmd run test:cms
Test komutları gerekli geliştirme bağımlılıklarını ister. Testler için canlı veritabanı kullanmayın. Derleme sırasında görülen büyük JavaScript parçası uyarısı, tek başına derlemenin başarısız olduğu anlamına gelmez.
Yönetim paneli
Roller ve yayın akışı
- Root: Yönetim ayarlarına, kullanıcılara ve yayın onaylarına erişir. Değişiklikleri inceleyip yayınlayabilir, revize isteyebilir veya reddedebilir.
- Admin: İzin verilen içerikleri sayfa üzerinde düzenler ve taslağını root onayına gönderir. Doğrudan yayın yapamaz; root yönetim alanına erişemez.
Taslağı kaydetmek, ziyaretçilerin gördüğü içeriği değiştirmez. Yayın için ilgili onay akışının tamamlanması gerekir. Revize notları ve mesajlar yönetim içindeki bildirim/mesaj alanından izlenebilir.
Sayfa üzerinde düzenleme
1. /admin üzerinden giriş yapın.
2. Sayfayı, dili, masaüstü/mobil görünümü ve düzenlenecek temayı seçin.
3. Düzenleme modunda metne veya görsele tıklayın.
4. Sağ panelden içerik, renk, boyut, tipografi veya yerleşim ayarlarını değiştirin.
5. Taslağı kaydedip önizleyin; role uygun yayın/onay işlemini tamamlayın.
   - Tek tıklama metin alanını; çift tıklama kelime üzerinde düzenlemeyi sağlar.
   - Toplu seçim, sürükleyerek taşıma ve görünüm bazında alan gizleme araçları bulunur.
   - Mobil/masaüstü ile aydınlık/karanlık tema tasarım ayarları ayrı düzenlenebilir. İşlem öncesinde seçili hedefi kontrol edin.
   - Tipografi bölümünde yazı tipi, kalınlık, boyut, satır ve harf aralığı ile hazır stil seçenekleri bulunur.
   - Önizlemede değişen alanlar işaretlenebilir; karşılaştırmada basılı tutarak eski hali görme yaklaşımı kullanılır.
   - Yayın geçmişi, eski sürümleri inceleme ve uygun yetkiyle yeniden yayına alma için kullanılır.
   - Donanım/çözüm/plan kayıtları, görsel kütüphanesi, SSS, yorumlar ve saha yapılandırıcı ayarları ilgili yönetim bölümlerinden düzenlenir.
Görsele gömülü yazılar metin düzenleyicisinden değiştirilemez. 3D model geometrisi ve kamera rotası içerik düzenleyicisinin kapsamında değildir.
İletişim ve yorumlar
SMTP bağlantısı, gönderici ve alıcı ayarları yönetimden yapılır. Gerçek e-posta gönderimi için geçerli kimlik bilgileri ve sunucudan SMTP erişimi gerekir. TLS sertifika doğrulamasını kapatmayın.

Müşteri yorumları ve görselleri yönetimden düzenlenebilir. Google yorum bağlantısı, manuel kayıtlar ve otomatik entegrasyon aynı şey değildir; otomatik veri alımı için seçilen entegrasyonun gerekli erişim bilgileri ayrıca sağlanmalıdır.
Hesap güvenliği
- Authenticator ile iki aşamalı doğrulama ve ayrı kurtarma kodları.
- Başarısız giriş sınırları, oturum yönetimi ve güvenlik işlem geçmişi.
- Root tarafından admin güvenliğini yönetme ve oturumları iptal etme.
- Açık oturum ile çıkış sonrası doğrulama hatırlama süresi birbirinden ayrıdır.
- Açıkça çıkış yapıldığında başlayan 10 dakikalık hatırlama, aynı hesap/tarayıcı ve ilgili güvenlik koşulları için geçerlidir. Şifre yine gerekir; cookie silinmesi, IP değişimi veya güvenlik sıfırlaması yeniden kod gerektirebilir.
Sunucu erişimi olan yetkili kişi için kurtarma komutları:
npm.cmd run cms:reset-password
npm.cmd run cms:reset-2fa
Kurtarma kodlarını ve şifreleme anahtarlarını güvenli saklayın; kaynak kod deposuna koymayın.
Veri, yedekleme ve güncelleme
npm.cmd run cms:backup
Yedekleme; PostgreSQL verilerini, yüklenen görselleri ve gerekli şifreleme anahtarlarını birlikte korumak için kullanılır. Komutun bildirdiği yedek dizinini kontrol edin ve yedeği ayrı bir güvenli konumda saklayın.

Yalnız data/ klasörünü kopyalamak PostgreSQL veritabanını taşımaz. Veritabanı aktarımı için uygun dump/restore işlemi, görseller ve anahtarlar birlikte gereklidir.

Eski SQLite kurulumundan geçiş için ayrı komut bulunur:
npm.cmd run cms:migrate-postgres
Bu işlem normal başlatmanın parçası değildir. Önce yedek alın, hedef PostgreSQL bağlantısını hazırlayın ve uygulama kapalıyken geçiş yönergelerine göre çalıştırın.

Güncelleme sırasında:
1. Veritabanını, yüklemeleri ve anahtarları yedekleyin.
2. Kaynak/hazır derleme dosyalarını güncelleyin; .env ve data/ klasörünü koruyun.
3. Kaynaklar değiştiyse üretim derlemesini alın.
4. Uygulama servisini yeniden başlatıp siteyi, giriş akışını ve iletişim formunu kontrol edin.
Modeller ve görsellerin bulunduğu mevcut statik dizinleri silmeyin. Yalnız değişen dosyaları içeren ZIP paketleri, tek başına tam proje kurulumu değildir.
Canlıya alma
Node.js uygulamasını ayrı bir servis olarak çalıştırın. Nginx üzerinden HTTPS alan adını uygulamanın yerel portuna yönlendirin. .env, data/, yedekler ve kaynak depo metaverileri doğrudan web kökü olarak sunulmamalıdır.

Örnek test ortamında kullanılan yapı:
- Alan adı: sca.scadawatt.com
- Uygulama dizini: /var/www/sca.scadawatt.com
- Yerel uygulama: 127.0.0.1:5188
- Servis: scadawatt-preview
Bunlar ortama özel örneklerdir; başka sunucuya aynen uygulanmadan önce mevcut servisler ve portlar kontrol edilmelidir. Çalışan API, panel, Redis ve diğer veritabanlarını değiştirmeyin.

Test alan adında indekslemeyi kapalı tutun. Asıl alan adında yayına geçerken robots, X-Robots-Tag, sitemap ve canonical adreslerini birlikte kontrol edin. Bu ayarlar arama motoru sıralamasını garanti etmez.
Sık karşılaşılan sorunlar
Belirti	Kontrol
Değişiklik görünmüyor	Doğru proje klasörü, başarılı build, çalışan sunucunun dizini, taslak/yayın ayrımı ve tarayıcı önbelleği.
ECONNREFUSED 127.0.0.1:5432	PostgreSQL servisinin çalışması ve bağlantı portu.
MODULE_NOT_FOUND	Eksik kaynak dosyaları, doğru klasör ve npm.cmd ci --include=dev.
.env not found	Proje kökündeki .env dosyası ve veritabanı ayarları.
Başka cihazdan erişilemiyor	Dinleme adresi, yerel IP, ağ izolasyonu ve 5188 için güvenlik duvarı izni.
SMTP TLS hatası	Sistem saati, sertifika zinciri ve ağ/antivirüs TLS denetimi.


Model ve görsel lisansları
Üçüncü taraf modellerin lisans ve atıf kayıtlarını koruyun. Ücretsiz indirilebilmesi, bir modelin ticari kullanım izni olduğu anlamına gelmez. Özellikle NonCommercial lisanslı varlıkların kurumsal yayına uygunluğunu ayrıca değerlendirin.