# ScadaWatt V24 — boş görüntü düzeltmesi

V23 masaüstü efekt zincirinde RenderPass eksikti. SSAOPass mevcut görüntünün üzerine gölgeyi karıştırır; ana sahneyi tek başına çizmez. Efekt zinciri artık RenderPass → SSAOPass → OutputPass sırasındadır.

Kamera projeksiyonu, ters projeksiyonu ve yakın/uzak düzlemleri her çizimde SSAO hesabına aktarılır. Uzay aşamasında doğrudan çizime geçerken hedef varsayılan ekrana sıfırlanır. Mobilde doğrudan çizim korunur. Saha sisi azaltılmıştır; V23 ön giriş rotası ve pickup modeli korunur.

Kontrol: 43 test / 9 dosya; TypeScript ve Vite üretim derlemesi. Yeni testler masaüstü sahne/gölge/çıktı sırasını, gece yaklaşımında ana sahnenin çizilmesini ve mobil doğrudan çizimini denetler. Testlerde GPU yerine çizim bağımlılıkları taklit edilir; gerçek tarayıcı/GPU görsel kontrolü yapılmamıştır. Fotogerçekçilik doğrulanmış değildir.

Windows: Node.js LTS kurulu olmalı. ZIP'i yeni bir klasöre çıkarın; package.json bulunan klasörde npm.cmd ci ve npm.cmd run dev çalıştırın. Adres http://127.0.0.1:5188. Önceki sunucuyu Ctrl+C ile kapatın.
