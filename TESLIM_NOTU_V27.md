# V27 — indirilen modellerin entegrasyonu ve test paketi

Beş GLB dosyası kuruldu: pickup, baretli saha çalışanı, animasyonlu yürüyen kişi, oturan operatör, üç kişilik kumaş koltuk. Modeller public/assets/models içinde yerel olarak paketlidir; çalışırken dış servise bağlanmaz. Texture boyutları en fazla 1024px; geometri, malzemeler ve iskelet animasyonu korunur. Kaynak/lisans bilgileri MODEL_SOURCES.md içindedir.

Bakım çalışanları statiktir. Yürüyen kişi kaydırmaya bağlı iskelet animasyonu kullanır; alınan mesafe 1.7 m/s klip hızına bağlanır. Baret baş kemiğine bağlanır. Pickup, koltuk ve operatör yerel ölçeğe tekdüze ölçeklenir. Başarılı yüklemede eski basit model gizlenir; yükleme hatasında eski model kalır. Kaynaklar dispose edilir. Seçili beş modelde otomatik başlatma için ilave indirme veya Blender kurulumu gerekmez.

Önemli kapsam: Köşk, evirici, ScadaWatt cihazı, binalar ve diğer çevre elemanları mevcut parametrik modellerdir. Bunlar üretici CAD'siyle değiştirilmiş değildir. Bu sürümde bütün sahnenin birebir dijital ikizi veya fotogerçekçiliği tamamlandı denmez. Şirket ekipmanının birebirliği için üretici modeli/ölçüleri gerekir.

Kontrol: 47 test / 11 dosya; üretim TypeScript/Vite derlemesi. Beş gerçek GLB üretimdeki GLTFLoader ile geometri/iskelet düzeyinde açılarak boyut, konum, animasyon ve monitör yaklaşımı test edildi. Bu testte browser görsel API'si gerektiren görüntü haritaları devre dışıdır. Ek dosya denetimi GLB başlıkları, bufferView sınırları, gömülü resimleri ve yürüyüş klibini kontrol eder. Kaynak önizlemeleri incelendi; entegre sahne GPU/tarayıcı ile görsel olarak doğrulanamadı.

ZIP kaynak projedir; büyük modeller iki kez paketlenmesin diye dist dahil edilmemiştir. Node.js LTS kurulu Windows'ta ZIP'i yeni klasöre çıkarın, eski sunucuyu Ctrl+C ile kapatın. package.json klasöründe npm.cmd ci, npm.cmd run dev. Adres http://127.0.0.1:5188. Model testi: npm.cmd run test:models. Üretim çıktısı: npm.cmd run build.
