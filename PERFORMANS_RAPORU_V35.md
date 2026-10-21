# V35 — şehir yeniden modelleme ve açılış düzeltmesi

Şehir dışı yeniden oluşturuldu: 12 müstakil ev, iki küçük apartman ve operatörün ayrı hedef binası. Eski ithal ev/villa/apartman modelleri yükleme listesinden çıkarıldı. Önceki sahnenin üstüne yeni bir şehir eklenmedi; buildNightCity bütünüyle değiştirildi.

## Sahne bütçesi

| Yolculuk evresi | V34 | V35 |
|---|---:|---:|
| Şehir yaklaşması, çizim bütçesi | 48 | 12 |
| Şehir yaklaşması, üçgen bütçesi | 374.050 | 2.164 |
| Oda, çizim bütçesi | 46 | 46 |
| Oda, üçgen bütçesi | 374.542 | 374.542 |

Bu sayılar p=0.85 ve p=0.96 noktalarındaki CPU sahne sayımlarıdır. Şehir kamera kadrajı da kompakt mahalleye göre değiştirildi; gerçek GPU/FPS karşılaştırması değildir. Motorun ek frustum elemesi gerçek çizim sayısını ayrıca azaltabilir. SCENE_METRICS_V35.json ayrıntıları içerir.

Arka plan şehir Lambert mat renkler, ortak geometri ve InstancedMesh grupları kullanır. Şehir için yeni doku indirilmez, dinamik gölge veya ek ekran geçişi çizilmez. Küçük pencere/kapı detayları p>=0.865 iken açılır. Kamera dışındaki örnekler ve gruplar elenir. Operatörün mevcut gerçek insanı, mobilyaları ve oda dokuları korunur.

## Yükleme

Aktif GLB miktarı **52.653.136 bayt** (52,65 MB); önceki aktif miktar 64.144.192 bayttı. Kullanılan modellerin açılmış doku/mipmap tahmini yaklaşık **296,8 MiB**; önceki yaklaşık 394 MiB. Bunlar toplam ağ veya GPU belleği değildir. JavaScript, Dünya dokuları, ekran görselleri, GPU tamponları ve render hedefleri ayrıca yer kaplar.

Açılış artık sahne indirmelerini başlatır, bütün kullanılan model kurulumlarının bitmesini bekler, dokuları hazırlar ve küçük bir render hedefine şehir/oda/sahayı önceden çizer. Sonra gerçek ilk kare çizilip yükleme ekranı kapanır. Kullanıcı kaydırmaya başladıktan sonra işçi ve operatör modelinin gelmesi önlenir. Monitör ekranları kullanıcı seçtikçe yüklenebilir.

Bu yaklaşım ilk bekleme süresini gerçek cihaz ve bağlantıya bağlı hale getirir; 2–3 saniye garanti edilmez. Düşük güçlü her cihazda hiç takılmama iddiası yoktur. Bu ortamda gerçek tarayıcı/GPU üzerinden görsel kontrol ve FPS ölçümü yapılmadı.

## Arayüz

Sağdaki Üretimler / ekran açıklaması paneli kaldırıldı. Monitörün kendi menüsü, üzerinde tekerlekle dolaşma ve yolculuk bölümüne odaklanınca sağ/sol oklarla ekran değiştirme korunur. Yolculuk metinleri sınırlı alanlı, 6 px bulanıklıklı cam panel içindedir; tüm ekranı bulanıklaştıran bir efekt kullanılmaz.

## Doğrulama

62 test: yükleme kilidi, kamera ve pencere geçişi çarpışmaları, monitör köşeleri, ekran geçişi, mahalle parselleri, şehir/oda görünürlüğü ve model hash'leri. TypeScript kontrolü ve Vite üretim derlemesi uygulanır. Yerelde performans için npm run build ardından npm run preview ile http://127.0.0.1:5188 kullanın.
