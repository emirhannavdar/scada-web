# V32 varlık raporu

Öncelik görsel ayrıntıyı korumaktır. V31'in verteks kümelendirmesi kaldırıldı; oda ve villa için yalnızca kullanılmayan elemanlar ayıklandı. Ağ boyutu buna bağlı olarak büyüdü.

Aktif GLB toplamı: 92,609,868 bayt. Paketlenmiş GLB toplamı: 93,679,564 bayt. Aktif tahmini açılmış doku+mipmap: 394.1 MiB. JS, Dünya görselleri, panel ekranları ve sürücü/buffer maliyeti bu rakamlara dahil değildir.

| Model | Dosya MB | Üçgen |
| --- | ---: | ---: |
| landscape | 37.39 | 838,969 |
| gravel_road | 6.80 | 150,222 |
| solar_panel | 1.07 | 1,854 |
| pete | 4.46 | 53,738 |
| walker | 5.64 | 91,610 |
| worker_hat | 0.04 | 1,080 |
| operator | 3.77 | 92,541 |
| service_pickup | 6.17 | 21,130 |
| simple_house | 3.56 | 3,153 |
| korean_apartment | 9.97 | 17,004 |
| small_villa | 1.00 | 13,498 |
| gaming_room | 13.81 | 278,987 |

Güneş rafı GLB'si artık istenmez. Paneller field.ts içindeki paylaşılan masa geometrisiyle çizilir. Şehir 66 yapı; evler gerçekçi parsel ölçeğinde, iki kule korunur. Parke 224 nesne yerine tek InstancedMesh. Kaynak mobilyalar malzemeye göre birleştirilir. Eski yapıların gövdeleri ve pencere kartları birlikte kaldırılır.

Hash URL ve immutable cache politikası değişmeyen dosyaların tekrar kullanılmasını sağlar; önbellek kalıcılığı garanti edilmez. GPU/FPS gerçek cihaz ölçümü yapılmadığından sıfır donma garantisi yoktur.
