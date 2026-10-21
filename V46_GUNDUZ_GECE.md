# V46 — saha, dünya ve şehirde tutarlı gündüz/gece

- Kontrol ExperienceContext içinde tutulur; SiteHeader’da İletişim bağlantısının yanındadır. Mobil ve masaüstünde ikon düğmesi, açık aria etiketi ve klavye odağı kullanır.
- fieldNight=false: saha/Türkiye gündüz, ABD/şehir gece. fieldNight=true: saha/Türkiye gece, ABD/şehir gündüz. Ortak seçim rota değişimlerinde korunur.
- Dünya güneş yönü normalize(TürkiyeNormali−ABDNormali) ile tanımlanır ve ters modda negatifine çevrilir. Aynı yön hem fiziksel yön ışığına hem gece haritasının maske uniformuna verilir. Gece haritası yalnız karanlık yarıkürede kalır; geçiş yumuşaktır. Kamera rotası ve coğrafi yüzeyler döndürülmez.
- Saha güneşi kontrollü bir kadraj yönünde, uzakta konumlandırılmıştır; küçük korona tek şeffaf düzlem shader’ıdır. Sahanın yön ışığı ve gölgeleri aynı yöndedir. Ayın düşük çözünürlüklü krater dokusu kodla üretilir; yıldızlar tek geometri/materyaldir. Yeni dosya indirmesi, sürekli yıldız döngüsü, yeni point light veya bloom yoktur. Panel malzemeleri değiştirilmez.
- Şehirde güneş/ay objeleri görünmez; yalnız gökyüzü/sis, ortak pencere materyali ve mevcut ışıklar değişir. İç mekân aydınlığı da seçime göre ayarlanır.
- Bu sunum, karşıt gündüz/geceyi anlatır. Gerçek dünya saati veya astronomik ephemeris hesabı iddiası yoktur.
- Önceki 24 V simülasyon etiketi ve monitör kaydırma akışı korunur.

Doğrulama: coğrafi normal/ışık işaretleri, dünya ışığının ters çevrilmesi, gece dokusu maskesi, saha gök cisimlerinin görünürlüğü, şehirde görünmemeleri, başlık kontrolü ve mevcut monitör/performans regresyonları denetlenir. Gerçek tarayıcı/GPU görsel kontrolü bu ortamda yapılamadı.

Windows: npm.cmd ci; npm.cmd run build; npm.cmd run preview -- --host 0.0.0.0. Port 5188. Eski sunucuyu kapatıp ZIP’i yeni klasöre çıkarın.

Sonuç: 31 test dosyasında 90 test geçti. Son kontrol/maske güncellemelerinden sonra 17 ilgili test tekrar geçti. TypeScript ve Vite üretim derlemesi başarılı.
