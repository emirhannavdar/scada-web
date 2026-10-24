# ScadaWatt — SEO ve tipografi kontrolü

Tarih: 23 Ekim 2026 · Sürüm: 127.0.0

## Sonuç

Varsayılan kaynak içeriklerinde 23 sayfa; Türkçe/İngilizce ve mobil/masaüstü olmak üzere 92 kombinasyonda kontrol edildi. Eksik/çoklu H1, boş meta açıklaması veya atlanan başlık seviyesi bulunmadı. H4–H6 başlıkları sırf SEO için eklenmedi; yalnızca içerik hiyerarşisi gerektirirse kullanılmalıdır.

## Yapılan düzeltmeler

- Çözümler, donanımlar ve SCADA yazılımı sayfalarının başlıkları daha açıklayıcı hale getirildi.
- Ürün başlıklarındaki marka tekrarı kaldırıldı; cihaz kodu ve işlevi birlikte kullanıldı.
- Ana sayfa ve çerez sayfası açıklamaları içerikleriyle uyumlu hale getirildi.
- İngilizceye geçildiğinde başlığın marka ekinden önce çevrilmesi sağlandı.
- Sayfa geçişlerinde açıklama, Open Graph ve Twitter paylaşım bilgileri güncellenir.
- Sunucuda aynı sayfa işlendiğinde yinelenen canonical, paylaşım ve yapılandırılmış veri etiketleri temizlenir.
- Organization ve sayfa yolu verilerine WebSite verisi eklendi; kullanıcı puanı, fiyat veya başarı istatistiği uydurulmadı.
- Görsel düzenleme/önizleme bağlantılarının tarayıcı tarafında indekslemeye açılabilmesi engellendi.
- İkincil CMS görselleri tembel yüklenir; yüksek öncelikli ürün görselleri erken yüklenir.
- Bazı mobil açıklamalar, form alanları ve teknik tablo yazıları büyütüldü.

## Başlık ve yazı düzeni

| Alan | Varsayılan boyut |
|---|---|
| H1 masaüstü | Ekrana göre 38,4–76 px |
| H1 mobil | Ekrana göre 36–52 px |
| H2 masaüstü | Ekrana göre 28,8–48 px |
| H2 mobil | Ekrana göre 28–36 px |
| H3 | Masaüstü 19,2–24,8 px; mobil 20 px |
| H4 | 17,6 px |
| H5–H6 | 16 px |
| Uzun açıklamalar ve politika metinleri | 16 px |
| Teknik tablo | 15 px |
| Footer gövde / sütun başlığı | 14 / 16 px |
| Üst menü | 13 px; aynı kalınlık ve tema rengi |

Bu boyutlar 16 px kök yazı boyutu için varsayılanlardır. Bileşenlere ait özel tasarımlar ve yöneticinin bilerek yaptığı stiller farklılaşabilir. Başlık etiketi ile yazı boyutu ayrı kavramlardır; büyük görünen her metin H1 yapılmadı.

## Kontrol edilen sayfalar

| Sayfa | Sayfa başlığı | H1 |
|---|---|---|
| / | Yazılım, Elektronik ve Enerji Teknolojileri \| ScadaWatt | 1 |
| /cozumler | SCADA ve Enerji Yönetimi Çözümleri \| ScadaWatt | 1 |
| /urunler | Veri Toplama ve Kontrol Donanımları \| ScadaWatt | 1 |
| /scada-yazilimi | SCADA Yazılımı ve Uzaktan İzleme \| ScadaWatt | 1 |
| /paketler | İzleme Paketleri \| ScadaWatt | 1 |
| /hakkimizda | Hakkımızda \| ScadaWatt | 1 |
| /iletisim | İletişim ve Demo Talebi \| ScadaWatt | 1 |
| /privacy-policy | Gizlilik Politikası \| ScadaWatt | 1 |
| /cerez | Çerez Politikası \| ScadaWatt | 1 |
| /kullanim-kosullari | Kullanım Koşulları \| ScadaWatt | 1 |
| /saha-yapilandirici | Saha Yapılandırıcısı \| ScadaWatt | 1 |
| /urunler/s3000i | S3000i — Veri toplama \| ScadaWatt | 1 |
| /urunler/s4000mc | S4000MC — Çok amaçlı kontrol \| ScadaWatt | 1 |
| /urunler/lomr-07h | LOMR-07H — Şebeke arıza algılama \| ScadaWatt | 1 |
| /cozumler/enerji-yonetimi | Enerji Yönetimi \| ScadaWatt | 1 |
| /cozumler/uzaktan-izleme | Uzaktan İzleme \| ScadaWatt | 1 |
| /cozumler/yenilenebilir-enerji | Yenilenebilir Enerji \| ScadaWatt | 1 |
| /cozumler/ges-izleme | GES Uzaktan İzleme \| ScadaWatt | 1 |
| /cozumler/limit-yonetimi | Limit Yönetimi \| ScadaWatt | 1 |
| /cozumler/kompanzasyon | Kompanzasyon Takibi ve Kontrolü \| ScadaWatt | 1 |
| /cozumler/zero-injection | Zero Injection \| ScadaWatt | 1 |
| /cozumler/planli-uretim-durdurma | Planlı Yük Atma \| ScadaWatt | 1 |
| /cozumler/bildirimler | Anlık Bildirimler \| ScadaWatt | 1 |

## Doğrulama kapsamı

- 92 DOM/rota kontrolü: başlık sırası, tek H1, görsellerde alt niteliği, sayfa başlığı ve açıklamasının varlığı.
- Meta etiketlerinin dil/sayfa geçişlerinde güncellenmesi ve görsel yükleme önceliği kontrolleri geçti.
- Gerçek HTTP istekleriyle 404, yönetim/önizleme noindex, robots/sitemap, yasal sayfa ve eski demo adreslerinin yönlendirmeleri kontrol edildi.
- 23 sayfanın sunucudan üretilen başlıkları benzersiz; canonical ve paylaşım etiketleri yinelenmiyor.
- Hazır üretim build’i pakete dahildir.

## Canlı sürümde ayrıca kontrol edilecekler

- Bu kontrol sunucunuzdaki yayımlanmış veritabanını okumaz. CMS’teki özel içerikler ve stiller canlı ortamda ayrıca gözden geçirilmelidir.
- DOM kontrolleri jsdom ortamında yapıldı; 3D canvas bu testte çalıştırılmadı. Gerçek cihazlarda görsel taşma, renk kontrastı ve 3D performansı ölçülmüş kabul edilmemelidir.
- Core Web Vitals / Lighthouse, gerçek model ve görsel dosyalarıyla canlı ortamda ölçülmelidir. Model varlıkları bu güncellemede değiştirilmedi.
- SITE_URL nihai yayın domainini göstermeli. Test alanının noindex kalması normaldir. Nihai domain açılırken hem uygulama hem Nginx X-Robots-Tag kontrol edilmelidir. Bu paket .env veya Nginx indeksleme ayarlarını değiştirmez.
- Türkçe/İngilizce aynı URL üzerinden seçiliyor. Ayrı dil URL’leri olmadığı için yanıltıcı hreflang etiketleri eklenmedi.
- Search Console’a erişimim olmadığı için site doğrulaması, sitemap gönderimi ve Google’ın gerçek indeksleme durumunu kontrol etmedim.

## Kaynaklar

- [Google: Başlık bağlantıları](https://developers.google.com/search/docs/appearance/title-link)
- [Google: JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)

Bu düzenlemeler teknik altyapıyı iyileştirir; arama sonuçlarında belirli bir sıra garantisi vermez.
