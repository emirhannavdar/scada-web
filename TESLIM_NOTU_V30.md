# V30 — gerçek ölçekte monitör, taranmış ana saha, çakıl yollar ve apartmanlar

## Monitör

Monitör dış genişliği yaklaşık 62 cm, taban dahil yüksekliği 44 cm olan yaklaşık 27 inç sınıfına getirildi. Önceki yaklaşık 1,8 m genişlik kaldırıldı. Fiziksel ekran açıklığına 58,8 × 31,5 cm ScadaWatt arayüz düzlemi yerleştirildi. Monitör tabanı masanın üst kotuna oturur. Ekran merkezi ve son kamera yaklaşması birlikte değiştirildi; son yakın çekimde yine arayüze yaklaşılır.

## Ana saha

Yeniden gönderilen 75 Acres arazi dosyası önceki dosyayla SHA-256 olarak aynıdır. Bu sürümde tarama yan tarafta dekor olarak durmaz: ana saha zemininin yerini alır. Taramanın gerçek üçgenleri ve UV/doku haritaları kullanılır; fotoğraf düzlemi eklenmez.

Panel alanı, köşk, kontrol evi ve giriş zemini tesviye edilir. Panel ayakları, çitler ve ekipmanların kotları korunur. Merkezin dışında 45 metrelik geçişle özgün tarama rölyefine bağlanılır. Eski arazi ve onun kotuna göre yerleştirilmiş çevre kayaları/ağaçları gizlenir; kaydırma bunları yeniden görünür yapmaz. Tarama şirketin kendi sahasının birebir ölçümü değildir; kaynak araziden uyarlanmıştır.

## Yollar

SPLEEN VISION'ın gravel road 2 geometrisi ve dokusu ana servis yolu, panel arası enine yollar, iki çevre yolu, kontrol evi bağlantısı ve köşk servis alanına uygulandı. Yol kesiti birkaç santimetrelik çakıl kabartısına ayarlandı. UV koruyan konum kümelendirme ile kaynak yolun 150 bin üçgeni tekrar edilmeden önce 50 bin üçgenin altına indirilir; yol parçaları ortak geometrili InstancedMesh olarak çizilir. Doku 2048 piksel sınırındadır.

## Şehir

Korean Apartment modeli, standart çevre apartmanlarının yerine 4 ortak geometri/malzeme grubuyla çoğaltılır. Ölçek her örnekte tek oranla uygulanır; bina şekli yatay/dikey ayrı esnetilmez. Apartmanlar 18–24 m yüksekliğe, ayrılmış şehir parsellerine oturtulur. Eski apartman cepheleri ve onlara ait pencereler gizlenir. Parklar, asfalt caddeler, sokak lambaları, villalar, ayrıntılı müstakil ev ve farklı bina blokları korunur. Operatörün pencere girişli binası korunur.

Korean Apartment dosyasının metadata lisansı Sketchfab Standard olarak kayıtlıdır; CC BY olarak etiketlenmedi. Özgün üretici/kaynak/lisans bilgisi korundu. Çakıl yolun CC BY 4.0 atfı kaynak listesine eklendi.

## Kontroller

- 53 test / 15 dosya geçti.
- TypeScript ve Vite üretim derlemesi geçti. Mevcut büyük 3D paket uyarısı hata değildir.
- GLB başlıkları, gömülü dokular ve buffer sınırları kontrol edildi.
- Yeni zemin, yeni yol geometrisi, gerçek ithal panel, yeni apartmanlar ve oturan operatörle saha/şehir/monitör kamera geçişleri CPU ışın testleriyle kontrol edildi.
- Monitörün ölçüleri, merkez ve köşeleri dört farklı yaklaşma noktasında kontrol edildi.
- Yükleme ekranı yeni varlıkları da bekler. Yeni çoğaltılmış yol/apartman kaynakları kapanışta temizlenir.

GPU üzerinde görsel/FPS testi bu ortamda yapılamadı; ışık, doku görünümü ve gerçek akıcılık tarayıcıda ayrıca değerlendirilmelidir. Yükleme ekranı sürekli GPU yükünü ortadan kaldırmaz.

## Çalıştırma

ZIP'i yeni klasöre çıkarın. `scada-companion-main` içinde PowerShell:

```powershell
npm.cmd ci
npm.cmd run dev
```

Adres: http://127.0.0.1:5188 . Kaynak proje ve yerel modeller dahildir; `dist` ve `node_modules` paketlenmez. Node.js kurulu olmalıdır. Yayın yapılmadı.
