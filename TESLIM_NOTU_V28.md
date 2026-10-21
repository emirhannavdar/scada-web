# V28 — gönderilen modeller ve tam ekran yükleme

Kullanılan dosyalar: Solar Panel (standıyla bütün saha), Pete (doğal statik pozda iki bakım çalışanı), Building (dört şehir parseli), Simple House (gece mahallesindeki evler), Laptop (operatör masasında ek cihaz), PSX Furniture Pack (seçili küçük aksesuarlar). Mevcut gerçekçi koltuk ve iskeletli yürüyen kişi korunur. Köşk, evirici, ScadaWatt cihazı ve operatör binasının giriş penceresi mevcut geometridir. Üretici CAD'siyle birebir ekipman oluşturulmamıştır.

Ford F-150 dosyası CC BY-NC-SA olduğundan kurumsal teslimde kullanılmaz ve pakete dahil edilmez; mevcut CC0 pickup korunur. CC BY modeller için footer'da 3B kaynakları bağlantısı ve public/model-credits.html eklendi. Özgün gömülü metadata korunur. Building dosyasının metadata yazarı ile gönderilen kredi metni farklı olduğundan ikisi de kaydedilmiştir.

Pete kaynağındaki klip YMCA dansıdır; sahada oynatılmaz. Kollar doğal dinlenme pozuna alınır. Eski specular/glossiness malzemesi Three.js sürümüne uygun metalik/pürüzlülük malzemesine çevrilir. Panelin parlaklık haritası kaldırılır; metalik sıfır, pürüzlülük 1, ortam yansıması sıfırdır. Yeni standlarla eski taşıyıcılar üst üste çizilmez.

Panel ve bina/ev çoğaltımları InstancedMesh ile gruplanır. Büyük bina haritaları 1K; panel/ev haritaları en çok 2K, Pete/laptop en çok 1K tutulmuştur. Kaynak fotoğraf arka plan olarak kullanılmaz. Model geometrileri tekdüze ölçeklenir, oranları korunur. Gerçek zemin PBR haritaları önceki sürümden korunur.

Yükleme ekranı body üzerinde portal ile tam ekran açılır, yükleme boyunca sayfanın kaydırması ve etkileşimi bloke edilir. Tüm model/doku vaatleri tamamlanınca altı kamera aşamasında shader derleme ve doku yükleme hazırlığı yapılır; ilk gerçek çizimden sonra ekran kapanır. Yüzde, iş ilerlemesidir; byte bazında indirme ölçümü değildir. Bu hazırlık kaydırma sırasındaki GPU yükünü ortadan kaldırmaz; her cihazda donmama garantisi yoktur. Yükleme hatasında mevcut model yedeği korunur; ciddi WebGL hatasında görsel hata görünümü açılır.

Doğrulama: 49 test / 13 dosya, TypeScript/Vite üretim derlemesi. Yeni gerçek GLB'lerle panel sayısı, mat malzeme, insan pozu/ölçeği, laptop konumu, şehir ve saha kamera geçişleri, monitör hizası kontrol edildi. Yükleme kapısının hazır sinyali gelmeden açılmadığı ve sayfa erişiminin geri verildiği test edildi. Kaynak önizlemeleri incelendi. Entegre sitenin gerçek tarayıcı/GPU görsel ve FPS testi bu ortamda yapılamadı.

Çalıştırma: Node.js LTS kurulu Windows'ta ZIP'i yeni klasöre çıkarın, önceki sunucuyu Ctrl+C ile kapatın. package.json klasöründe npm.cmd ci, npm.cmd run dev. http://127.0.0.1:5188. Model testi: npm.cmd run test:models. Üretim çıktısı: npm.cmd run build. Kaynak ZIP'te dist yoktur; npm run build oluşturur. İndirme bağlantısı gerekmeden modeller yerel dosyalardan yüklenir.
