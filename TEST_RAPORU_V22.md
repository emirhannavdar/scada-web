# V22 doğrulaması

`npm test`: 8 dosya, 40 başarılı test.

`npm run build`: TypeScript ve Vite üretim derlemesi.

Saha rotasının 160 örnek adımı, köşk geçişi, gece şehri/ev geçişi, kamera sürekliliği ve monitör hizası mevcut testlerle kontrol edilir. Yeni rota sınır dışında başlama, düşük yükseklik ve paralel uçuş koşullarını da doğrular.

GPU ile görsel kontrol yapılmadı. Vite 3B modül için paket boyutu uyarısı üretir; hata değildir.
