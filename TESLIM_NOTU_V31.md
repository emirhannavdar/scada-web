# V31 teslim notu

Bu sürüm V30'un üzerine hazırlanmıştır. Yerel kaynak proje ve optimize modeller dahildir; yayın yapılmamıştır. Orijinal ağır modeller ve kullanılmayan yüzeyler public dizininden çıkarılmıştır. Ölçümler `PERFORMANS_RAPORU_V31.md` ve `MODEL_METRICS_V31.json` içindedir.

- Şehir daha seyrek ve konut ağırlıklı tasarlandı. Yeni ve eski apartman/villa çizimleri aynı anda tutulmaz; yerini alan çizimler sahne ağacından çıkarılır. İki kule ve farklı konut aileleri çeşitlilik sağlar; boş parseller bahçe olur.
- Gaming Room'un oda mobilyaları seçilerek sadeleştirildi ve malzemeye göre birleştirildi. Kaynakta bulunan çevreleyen duvarlar kamera geçişini kapatmasın diye kullanılmadı. Small Villa'nın dış kabuğu mahallede kullanıldı; iç mobilyalar ve yoğun çitler çıkarıldı.
- Operatör ve sandalye ana ekran/klavye eksenine hizalandı. Kaynak sandalyenin eğik yatay yönü düzeltildi. Klavye ana eksene göre doğrultuldu. Eski masa, sandalye, zemin tahta kutuları ve mobilya nesilleri kaldırıldı; oda taban kotu yeni mobilyalara uyarlandı.
- Ana monitör dokuz gerçek SCADA görüntüsünü seçilebilir biçimde gösterir. İkinci monitörde “Kahve sizden. Takip bizden.” mesajı, TV'de ScadaWatt kimliği yer alır. Aynı görüntü iki monitöre kopyalanmaz.
- Kamera ekrana girmez; son iki durak aynı dış bakış noktasını kullanır. Eski tam ekran görüntü katmanı ve ana sayfanın aşağısındaki tekrarlanan galeri kaldırıldı. Ayrı yazılım sayfası kendi tanıtımını korur.
- Saha yolu bölgesel asfalt yola bağlandı. Yol koridorunun çevresindeki tarama zemini de tesviye edildi. Pickup panel arası yolun kenarındadır; kasasında ekipmanlar ve yanında yük alma pozunda işçi vardır.
- Aktif 12 model hash sürümlü dosyalardadır. Soğuk model aktarımı 253,11 → 36,17 MB (%85,71 azalma). Üç ekranlık GPU doku sınırı ve oran koruyan ekran yerleştirmesi uygulandı.
- Render gece tek geçiştir; gece dinamik gölgeleri kaldırılır. Uyarlanır piksel oranı, görünürlük durdurması ve olay üzerine çizim korunur. Boşta sonsuz çizim döngüsü yoktur.

## Doğrulama

53 test / 17 dosya: optimize gerçek modeller, kamera geçişleri, SCADA alt kablo bağlantısı, baret bağlantısı, sahneden eski nesillerin kaldırılması, ana ekran merkez/köşe görünümü, ekran seçimi/klavye, görüntü oranı ve hash/cache politikası. Önceki sürümlerin emekli modellerini bir araya getiren testlerin yerini çalışan V31 pipeline'ını kuran entegrasyon testi aldı. TypeScript ve Vite üretim derlemesi kontrol edilir. Büyük 3D paket uyarısı hata değildir.

GPU üzerinden görsel kalite veya gerçek FPS kontrolü bu ortamda yapılamadı. “Her cihazda kesinlikle donmaz” garantisi verilmez; raporda bu sınır açıkça belirtilmiştir.

## Çalıştırma

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd run preview
```

Adres: http://127.0.0.1:5188 . ZIP'i yeni klasöre çıkarın; eski sunucuyu Ctrl+C ile kapatın. Node.js gerekir. Geliştirme için `npm.cmd run dev` kullanılabilir. Ayrıntılar README.md dosyasındadır.
