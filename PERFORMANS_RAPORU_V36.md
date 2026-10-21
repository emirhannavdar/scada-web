# V36 performans ve yerleşim raporu

## Şehir

142 yapı, 12–18 arası görünür çizim grubu. Müstakil ev ve apartman biçimleri metre ölçeğinde farklı genişlik/derinlik ve renklerle örneklenir. Yeni arka plan için GLB veya doku indirilmez. Dış şehirde Lambert/mat malzeme ve düşük maliyetli ışık renkleri kullanılır; gölge haritası eklenmez.

Çatı ve pencere ayrıntıları 75–115 metre mesafe bandında dither ile kademeli gösterilir. Yakın/uzak çatı geometrileri geçiş bandında birlikte bulunabilir; tamamlayıcı piksel maskeleri kullanılır. Görüş alanı dışındaki örnekler ve mesafe aralığı dışındaki ayrıntılar elenir. Tek dev şehir mesh'i kullanılmadığından görünür örnekler ayrı seçilebilir.

CPU sahne bütçeleri (SCENE_METRICS_V36.json):

| Evre | Çizim bütçesi | Üçgen bütçesi |
|---|---:|---:|
| Şehir p=0.81 | 14 | 7.680 |
| Şehir p=0.85 | 18 | 6.156 |
| Şehir p=0.875 | 18 | 5.768 |
| Şehir p=0.90 | 18 | 5.380 |
| Pencereden giriş p=0.94 | 95 | 204.371 |
| Operatör odası p=0.96 | 77 | 199.673 |

Bunlar gerçek GPU çizim/FPS ölçümleri değildir. Render motorunun ek mesh frustum elemesi gerçek çizim sayısını ayrıca azaltabilir. V35 oda bütçesi 374.542 üçgendi; yeni mobilyalar eklenmesine rağmen eski gereksiz oda bileşenleri kaldırılarak yaklaşık %47 düşürüldü. Draw call bütçesi oda için 46'dan 77'ye çıktı; kitaplığın farklı malzemeleri ve ek mobilyalar bu artışın parçasıdır. Şehirde ağır model tekrarları eklenmedi.

## Mobilya ve yerleşim

- Büyük L koltuk yaklaşık 3,65 × 4,03 m; tabanı halı üstündedir. Oturma yönü çevrilmiş ve sehpa L'nin boşluğuna yerleştirilmiştir.
- Sehpa yaklaşık 1,15 × 1,15 m. Koltuk geometrisinin sehpa sınırına girmediği kontrol edilir.
- Ofis masası yaklaşık 2,155 × 1,01 m, üst kot yaklaşık 0,765 m. Operatör, gerçek monitör ve klavye hizası korunur.
- Kitaplık yaklaşık 1,85 m genişlik, 2,20 m yükseklik. Duvar önündedir; tabanı zemine oturur.
- Gaming Room kaynağından sandalye, monitör çerçevesi ve klavye tutuldu. Eski masa, koltuk, dağınık kitap ve aksesuar grupları kaldırıldı. Kullanılmayan gömülü görseller çalışma donanımı dosyasından çıkarıldı.
- Zemin, iç bölmeler, 3,2 m tavan, halılar, konsol, lamba ve duvar görselleri iki alanı birleştirir. Kamera giriş koridoru boş bırakılır.

Yeni dört mobilya GLB'si toplam yaklaşık 2,59 MB. 2048 px kaynakların çoğu 1024 px olarak, koltuk renk dokusu 2048 px olarak WebP kalite 92 ile paketlendi. Geometri Meshopt ile kayıpsız kodlandı. Doku yeniden kodlaması kayıpsız değildir. Asıl dosyalar kullanıcı tarafından sağlanan orijinallerdir; üretici atıfları /model-credits.html içindedir.

## Ağ ve bellek

Aktif GLB dosyaları 50.577.780 bayt; V35 aktif dosyaları 52.653.136 bayttı. Yeni mobilyalara rağmen eski oda kırpıldığı için toplam indirme azaldı. Dosyalardaki aktif görsellerin açılmış mipmap tahmini yaklaşık 333,8 MiB; V35 yaklaşık 296,8 MiB idi. Yeni dokular bellek ekler; geometri belleği azalır. Bu değer toplam GPU belleği değildir; gerçek toplam ölçülmedi.

V35'in tam hazır açılış kilidi korunur. Oda girişinin geniş ve dar görünümleri GPU hazırlığına alınır. Dokular ve modeller kaydırma başlamadan tamamlanır; monitör ekranları kullanıcı seçimine göre yüklenebilir.

## Doğrulama ve sınırlar

64 testlik kontrol paketi; yeni mobilyalarda zemin kotları, oda sınırları, masa yüksekliği ve koltuk/sehpa ayrımı, kamera çarpışmaları, gerçek monitör köşe görünürlüğü, şehir parsel çakışmaları, LOD/culling bütçeleri ve yükleme kilidi denetlendi. TypeScript kontrolü, Vite üretim derlemesi ve GLB hash/buffer doğrulaması uygulanır.

Bu ortamda gerçek tarayıcı/GPU görsel kontrolü ve FPS testi yapılamadı. Dither geçişinin ve oda aydınlatmasının son görsel değerlendirmesi gerçek cihazda yapılmalıdır. Her bilgisayarda hiç takılmama ve sabit 2–3 saniye yükleme garantisi yoktur.
