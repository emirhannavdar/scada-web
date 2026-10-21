# V21 doğrulama

Production build başarılı; 8 dosyada 40 test geçti.

Yeni kontroller:
- Kontrol evinin tüm geometri sınırı ön çitin dışındadır.
- Kapalı köşkün geometri sınırı enine yol genişliği içindedir.
- Kamera başlangıçta 100 birimden yüksekten dalar; panel üstü uçuş 2,8–6 aralığındaki kamera yüksekliğinde ilerler.
- Alçak uçuş kadrajında en az iki işçinin baş konumu viewport içindedir. Bu bir GPU/occlusion görüntüsü doğrulaması değildir.
- Dalış ve alçak geçişte 160 kamera segmenti, köşk yaklaşma/giriş/çıkışında 320 segment gerçek Three.js geometrisine karşı kontrol edildi; çarpışma bulunmadı.
- Köşk dış kadrajında yapı merkezi görüntü ortasındadır; kamera önce dışarıda kalır. Kapılar girişten önce açılır, çıkış sonrasında kapanır.
- Yeni iç ekipman grubu şalt/trafo/dolap ve kablo donanımını içerir. Merkez ışın ScadaWatt cihazına ulaşır.

Korunan kontroller: kamera/gezegen/coğrafi kısa yay, çit ve yansımasız panel geometrisi, işçi geri sarma hareketi, gece şehir/ev geçişi, son monitör kadrajı, dokuz ekran galerisi, viewport monitör hesabı, ürün/çözüm sayfaları, menü/fokus ve iletişim taslağı.

Gerçek browser/GPU görsel kontrolü ve FPS testi yapılamadı. Geometri/projeksiyon testleri bunun yerine geçmez. 3B motor tembel yüklenir; Vite’ın yaklaşık 563 kB chunk uyarısı build hatası değildir. Yayın yapılmadı; port 5188.
