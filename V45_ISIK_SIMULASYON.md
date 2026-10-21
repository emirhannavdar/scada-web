# V45 değişiklikleri

- Dünya koordinatlarında tek 512×352 canvas dokulu gösterge; sabit kart boyutu, kameraya yönelim ve mobil yerleşim.
- simulation.ts matematiksel, deterministik örnek gerilim üretir; gerçek telemetri bağlantısı içermez. Başlık ve kart alt metni bunun simülasyon olduğunu açıkça belirtir. Akım ölçümü üretilmez.
- Durum LED'i emissive parlaklık, ETH-0 ve pano göstergeleri material rengi ile kısa darbeler gösterir. Hiçbir yeni noktasal ışık veya postprocess eklenmedi. Yalnız kamera 0.30–0.42 aralığındayken yenileme yapılır (120 ms); kart metni en fazla saniyede bir boyanır. Sekme/sahne görünmezse çizim durur; reduced motion halinde sürekli çizim yoktur.
- Gündüz/gece anahtarı şehir bölümünde görünür. Mevcut ışıkların renk/intensiteleri ve ortak pencere materyali değiştirilir. Geometri çoğaltılmaz, şehir gölgeleri açılmaz, kamera ve monitör kaydırma akışı değiştirilmez.
- Gerçek tarayıcı/GPU görsel kontrolü bu ortamda yapılamadı. Otomatik testler örnek değer sınırlarını/sürekliliğini, efektlerin sahne kapsamını, gündüz/gece anahtarını, geometri bütçesini ve mevcut monitör sırasını denetler.

Windows: npm.cmd ci; npm.cmd run build; npm.cmd run preview. Port 5188. ZIP’i yeni klasöre çıkarın; önceki sunucuyu kapatın.

Doğrulama: 86 testlik tam paket geçti. Son UI ve statik sahne güncelleme iyileştirmesinden sonra 6 ilgili test tekrar geçti. TypeScript/Vite üretim derlemesi başarılı.
