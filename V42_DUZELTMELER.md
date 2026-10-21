# V42 — dikey donanım kataloğu, yolculuk tamamlanma kilidi, gerçek SCADA etiketi

## Kod

- src/components/site/ProductExperience.tsx: sınırsız sayıya uygun, slug tabanlı dikey liste; tek fotoğraflı detay, arama, hover/focus/tap ve azaltılmış hareket.
- src/editorial.css: katalog, sağ önizleme, mobil yerleşim.
- src/lib/journey-gate.ts: büyük kaydırmalarda kamera hız sınırı ve bölüm sonu kilidi.
- DataVoyage.tsx / FlightCanvas.tsx / lib/flight/render.ts: yüklenme ve gerçekten çizilmiş kare sinyalleri; bitmeden monitör sayfalama veya bölüm dışına çıkış açılmaz. Kamera yalnız ilerlerken RAF kullanır.
- src/lib/flight/scada-device.ts: yuvarlatılmış kasa/kapaklar, gerçek ön etiket, yuvarlak O/I anahtar, ayrı sinyal/güç bağlantıları. Tekrarlanan parçalar InstancedMesh ile gruplanır.
- src/lib/flight/world.ts: ürün etiketini yükleme tamamlanmasına dahil etme, alttan terminal bağlantısı.
- V41 ProductVolumes, product-model ve product-renderer kaldırıldı. Temsili arka yüz yerine gerçek ürün fotoğrafları kullanılır.

## Doğrulama

81 testlik tam paket başarılı: 100 cihaz, seçim/arama, kaydırma sınırı, kare sinyali, fiziksel monitör uyumu, cihaz bağlantısı, sahne geometrisi, şehir çizim bütçesi ve dosya bütünlüğü dahil. Son yükleme kilidi değişikliğinin ardından ilgili testler ve üretim derlemesi tekrar çalıştırıldı.

Şehir için CPU geometri bütçesi korunur: yaklaşımda 25'ten az çizim grubu, 30.000'den az üçgen. Bunlar GPU FPS ölçümü değildir. Gerçek tarayıcı/GPU görsel testi bu ortamda yapılamadı.
