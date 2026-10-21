# ScadaWatt V23

İkinci ekran görüntüsündeki ön giriş yönü açılışa alınmıştır. Kamera 22 m yüksekliğinde kapı önünden köşke bakar; sonra servis yoluna alçalarak eviriciye ve köşke ilerler. Önceki doğu çitinden yan giriş kaldırılmıştır.

Kontrol evi yanında kasası, lastikleri, jantları, camları, aynaları ve tamponları geometriden oluşturulmuş servis pickup modeli bulunur. Yol ve kamera koridoru açıktır. İşçiler yol kenarına taşınmıştır.

Düzenli taş çizgileri kaldırılmış, seyrek bitki örtüsü ve düzensiz taş dağılımı oluşturulmuştur. Arazi tepeleri alçaltılmış; kuru toprak/taş ve yer yer kar kalıntısı renkleri arazi geometrisine işlenmiştir. Yol yüzeyine kabartı eklenmiştir. Masaüstünde SSAO temas gölgesi uygulanır; mobilde ek işlem kapalıdır. Panel yüzeyleri mat kalır. Fotoğraflar sahne arka planı olarak kullanılmaz.

Çalıştırma: Node.js LTS kurulu Windows PowerShell üzerinde npm.cmd ci ve npm.cmd run dev. Adres http://127.0.0.1:5188.

Doğrulama: 41 test / 8 dosya, TypeScript ve Vite üretim derlemesi. Tarayıcı/GPU görsel kontrolü bu ortamda yapılamadı. Referans fotoğrafla birebir fotogerçekçilik doğrulanmamıştır. SSAO masaüstü GPU yükünü artırabilir.
