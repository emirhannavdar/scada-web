# V37 performans doğrulaması

Şehir 142 yapıdan oluşur. Gerçek metre ölçeğinde çeşitli ev, apartman ve kule yükseklikleri kullanılır. Kaynak GLB indirme listesi V36 ile aynıdır. Operatör odasının dış kabuğu kalıcıdır; iç mekânın görünür olması bina yüksekliğini değiştirmez.

CPU sahne sayımı (gerçek ekran kartı FPS ölçümü değildir):

| Yolculuk | Çizim gönderimi | Üçgen |
|---|---:|---:|
| 0.81 | 19 | 8,630 |
| 0.85 | 23 | 6,970 |
| 0.875 | 24 | 6,426 |
| 0.9 | 24 | 5,676 |

Önceki sınırlar korunur: şehir yaklaşımında 25'ten az gönderim ve 30.000'den az üçgen. Kamera dışındaki örnekler ayrıca elenir; uzaktaki ayrıntılar mesafe ile sınırlandırılır. Pencereler iki üçgenli yüzeylerle temsil edilir. Şehirde yeni doku, model, gerçek zamanlı ışık veya gölge geçişi yoktur.

Doğrulama: tüm otomatik testler, TypeScript/üretim derlemesi ve model dosyası denetimi. Kamera çarpışma yolu ve operatör binasının erken/geç aşamalarda sabit dış boyutu kontrol edilir.

Bu ortamda tarayıcı/GPU görsel incelemesi ve FPS ölçümü yapılamadı. Donma olmaması tüm cihazlarda garanti edilemez; ölçümler geometri/gönderim bütçesini doğrular. Kullanıcının akıcı bulduğu V36 yükleme ve çizim mimarisi korunur.
