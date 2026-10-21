# ScadaWatt V12 – Sinematik dünya geçişi ve şehir sahnesi iyileştirmeleri

Bu sürümde yapılan ana güncellemeler:

## 1) Dünya / uzay geçişi
- Kamera rotası kutup odaklı görünümden çıkarıldı.
- Dünya geçişi artık daha çok yan siluet / kara parçası odaklı ilerliyor.
- Dünya dönüşü azaltıldı ve yalnızca sınırlı Y ekseni hareketi bırakıldı.
- Kaynak: `src/lib/flight/path.ts`, `src/lib/flight/world.ts`

## 2) Şehir sahnesi
- Tekdüze bina ızgarası çeşitlendirildi.
- Şehir içine park alanları, düşük katlı sivil yapılar ve farklı blok tipleri eklendi.
- Gece sahnesine küçük araçlar eklenerek daha yaşayan bir görünüm hedeflendi.
- Kaynak: `src/lib/flight/world.ts`

## 3) Operatör tarafı
- Operatör mahallesi tarafında ek konutlar, park, ağaç, bank, yaya yolu ve küçük ışıklar korundu / geliştirildi.
- Kaynak: `src/lib/flight/world.ts`

## 4) Metin iyileştirmeleri
- Veri yolculuğu bölümlerindeki ilgili açıklamalar daha gerçekçi sahne anlatımına göre güncellendi.
- Yazılım ekranları bölümündeki başlık ve giriş metni güçlendirildi.
- Kaynak: `src/content/site.ts`, `src/components/site/ScreenExplorer.tsx`
