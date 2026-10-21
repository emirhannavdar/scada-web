# V29 — ek modeller, sağ SCADA bölmesi ve alt kablo girişi

## Yerleşim

- Taranmış arazi batı çitinin dışında, sahadaki düz çalışma zemininin yanına yerleştirildi. Bu tarama ABD kaynaklı bir referans varlığıdır; şirketin Türkiye sahasının birebir taraması olarak sunulmaz.
- Yeni Conquer pickup giriş dışındaki servis aracının yerini alır.
- Yüksek ayrıntılı müstakil ev tek mahalle parseline konur. 745 bin üçgenli modeli bütün mahalleye çoğaltmak yerine kalan konutlar önceki modelleri kullanır. Operatörün girilen pencere açıklığı korunur.
- Peel Center iki ayrılmış şehir parselinde kullanılır; bu parsellerdeki eski modeller gizlenir.
- Yeni koltuğun uzun ekseni düzeltilir; genişliği 2,9 m olarak ayarlanır. Sandalye 1,28 m boyunda, oturma yüzeyi yaklaşık 0,64 m olacak şekilde operatöre yönlendirilir.
- Operatör ve sandalyesi birlikte 30 cm sola alınır; son yaklaşmada başın ekran köşelerini örtmesi engellenir.
- Monitörün gerçek cam açıklığı, ScadaWatt ekran düzleminin arkasına hizalanır. Ekran yüksekliği ve son kamera hedefleri birlikte 11 cm yükseltilir.

## Köşk ve işçi

- Kontrol panosu sağ servis bölmesindedir; cihaz dünya x=-0,5 koordinatında bulunur. Trafo sol arka bölmeye, şalt hücreleri sol ön bölmeye alınır.
- Taban kablo kanalı/ızgarası, topraklama barası, iletkenler, kelepçeler ve dikey koruma borusu eklenir. Kamera geçişi boş bırakılır.
- Kablo cihazın altındaki rakorda sonlanır; üstten veya ön yüzden girmez.
- Yürüyen Sam modeline takılan Drew bareti sabit 1,68 m varsayımından kurtarılır; gövdenin üst sınırına göre yerleştirilir ve animasyonlu baş kemiğine bağlanır. Pete'nin kendi modellenmiş bareti korunur.

## Yükleme ve performans

- Yeni GLB'ler aynı yükleme yöneticisine ve hazırlık kapısına dahildir. Önce temel ve önceki kullanıcı modelleri kurulur; yeni modellerin değiştirdiği objeler sonra gizlenir. Böylece yükleme sırası sonucu değiştirmez.
- Büyük dokular web için küçültüldü; gömülü dokular, yerel dosyalar ve özgün kaynak metadata bilgisi korunur.
- Değiştirilen eski pickup/koltuk başlangıçta indirilmez. Ağır ev bir kez, yeni şehir bloğu iki kez kullanılır. Arazi gölge haritası çizimine katılmaz.
- Yükleme ekranı GPU'nun kare başına işini azaltmaz. Bu sürümde gerçek GPU/FPS ve tarayıcıda görsel kalite testi yapılamadı; akıcılık garantisi verilmez.

## Doğrulama

- Tam test paketi: 52 test / 14 dosya.
- Gerçek GLB geometri, rig ve animasyonları üretimdeki GLTFLoader ile CPU tarafında çözüldü.
- Baretin baş üstündeki konumu, baş kemiğine bağlılığı, alt kablo sonlanması, cihazın sağdaki konumu, köşke giriş çarpışmaları ve monitör merkez/köşe görüşleri kontrol edildi.
- TypeScript ve Vite üretim derlemesi. 3D modül için mevcut büyük paket uyarısı hata değildir.
- Görüntüler GPU ile render edilerek doğrulanmadı. CPU testleri dokuların/ışığın gerçek tarayıcıdaki görünümünü doğrulamaz.

Lisans/atıf listesi `public/model-credits.html` içindedir. Yedi modelin tümü kullanıcı tarafından CC BY 4.0 olarak belirtilmiştir. Tam kaynak proje teslim edilir; yayın yapılmaz.
