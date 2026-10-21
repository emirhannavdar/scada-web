# V17 değişiklikleri

Esas alınan dosya: scadawatt-v16-monitor-kadraja-sigma-sehir.zip.

Monitörün içindeki gerçek ekran artık tam görüntülenir: cover/min-height/scale/translate kaldırıldı. Fiziksel monitör genişliği yüksekliğe göre de sınırlandırılır. Monitör hareketinin yanında teknik demo açıklaması kaldırıldı. Kaydırmalı tur ve seçim kontrolleri korunur.

Operatör şehri tek masterplanla yeniden kuruldu. Eski eklemeler kaldırıldı. Yeni bölgeler: yüksek cam kuleler, farklı yükseklikte apartmanlar, bahçeli villalar, büyük organik park, kıvrımlı yollar/gölet, üç otopark, sürekli caddeler, yaya geçitleri ve trafik. Kamera geniş şehir kadrajını gösterir. Gece ışıkları güçlendirildi. Nesneler ortak materyal/geometri ile instanced çizilir.

Ana değişiklikler:
- src/components/site/ScreenExplorer.tsx
- src/screen-explorer.css
- src/lib/monitor-fit.ts
- src/lib/flight/city-plan.ts
- src/lib/flight/city.ts
- src/lib/flight/world.ts
- src/lib/flight/path.ts

V16 Dünya/saha ayarları ve diğer sayfalar korunur. Kaynak + dist ZIP’tedir. Port 5188.
