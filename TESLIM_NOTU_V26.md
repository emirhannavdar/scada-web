# V26 — kullanıcı tarafından sağlanan Rocks Ground 01 malzemesi

rocks_ground_01_4k.blend.zip içindeki diffuse, normal OpenGL EXR ve roughness dosyaları işlenerek saha arazisine entegre edilmiştir. Native karo genişliği kaynakta 2 m olduğundan 750 m arazide tekrar 375×375 olarak ayarlanmıştır. Albedo sRGB; normal ve pürüzlülük haritaları lineer veri olarak yüklenir. Normal EXR gama uygulanmadan çözülmüş, 2K boyutuna indirilmiş ve vektörler yeniden normalize edilmiştir. Albedo WebP, veri haritaları PNG biçimindedir.

Bu değişiklik gerçek malzeme taramasını mevcut 3B araziye uygular. Fotoğraf arka planı veya 4D çekim değildir. Blender sahnesi çalıştırılmamıştır; displacement haritası geometriye uygulanmamıştır. İnsan ve araçlar önceki parametrik modellerdir; bunların gerçekçi assetlerle değiştirilmesi ayrıca gereklidir. Servis yolu, çitler, kamera akışı ve ScadaWatt ekranları korunur.

Kaynak: Rob Tuytel / Poly Haven, https://polyhaven.com/a/rocks_ground_01 (CC0). Ayrıntılar public/assets/materials/rocks-ground-01/SOURCE.txt içinde. Yükleme başarısız olursa mevcut prosedürel yüzey korunur; textureReady yeni haritaları bekler; dokular dispose edilir.

Kontrol: 46 test / 10 dosya; TypeScript ve Vite üretim derlemesi. Haritalar 2048×2048 ve normal vektör uzunlukları kontrol edilmiştir. Gerçek tarayıcı/GPU görsel kontrolü yapılamadı. Fotogerçekçilik doğrulanmış değildir.

Kurulum: ZIP'i yeni klasöre çıkarın. Node.js LTS ile package.json klasöründe npm.cmd ci ve npm.cmd run dev. Adres http://127.0.0.1:5188. Önce eski sunucuyu Ctrl+C ile kapatın.
