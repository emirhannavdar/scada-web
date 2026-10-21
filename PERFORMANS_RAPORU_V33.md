# V33 performans raporu

Gerçek GLB geometrileri çözülerek CPU üzerinde görünür sahne gönderim bütçesi karşılaştırıldı. Sayılar GPU zamanlaması veya gerçek FPS değildir; render motorunun ek frustum elemesi gerçek çizim sayısını ayrıca azaltabilir.

| Evre | V32 çizim bütçesi | V33 çizim bütçesi | V32 üçgen | V33 üçgen |
|---|---:|---:|---:|---:|
| Şehir yaklaşması, p=0.85 | 237 | 48 | 1.024.166 | 374.050 |
| Operatör odası, p=0.96 | 236 | 46 | 1.024.154 | 374.542 |
| Yörünge, p=0.60 | 2 | 2 | 17.088 | 17.088 |
| Saha, p=0.45 | 650 | 649 | 9.132.507 | 6.565.483 |

Şehir yaklaşması çizim bütçesinde yaklaşık %80, üçgen bütçesinde %63 azalma. Saha halen ağırdır; bu sürüm özellikle şehir ve geçişlerin maliyetini düşürür.

Model dosyaları 93.679.564 bayttan 66.336.044 bayta indi. Aktif dosyalar 65.312.616 bayt. Geometri kayıpsız sıkıştırılmış, gömülü görüntü baytları korunmuştur. Doku belleği bu nedenle düşmez.

Açılış yalnızca ilk görünümü bekler. Kuyruklu model yükleme, worker destekli geometri çözümü, kademeli doku hazırlığı ve gece shader ön derlemesi ana iş parçacığındaki yığılmayı azaltmayı amaçlar. Donmasızlık ve 2–3 saniye açılış gerçek GPU/ağ testleri olmadan kesinleştirilemez.

SCENE_METRICS_V33.json yeniden üretilen sahne ölçülerini içerir. Testlerin paralel kaynak rekabetini azaltmak için iki worker ile çalıştırılması önerilir.
