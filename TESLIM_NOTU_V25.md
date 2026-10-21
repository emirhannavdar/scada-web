# V25 — saha model ve malzeme geliştirmesi

Panel hücreleri 12×8 yerleşim, köşe kesimleri ve ince iletken çizgileriyle yeniden çizilmiştir. Paneller tek, opak, mat yüzey olarak kalır; parlama eklenmemiştir. Kamera yakınındaki iki panel kolonu U profil yanakları, kelepçeler, bağlantılar, arka kutular ve DC bağlantı ayrıntıları içerir.

Yeni field-craft.ts modülü detayları dört InstancedMesh grubunda toplar. Çakıllar ve kuru otlar hacimli geometridir. Yeni surface-materials.ts beton, çinko ve toz yüzeylerinin albedo/kabartı haritalarını kodla üretir. Yeni service-road.ts ana servis yolunda tekerlek izlerini ve düzensiz yol omuzlarını geometriyle oluşturur. Arazi 250×250 bölüme çıkarılmış ve farklı ölçeklerde düzensizlik eklenmiştir. Köşkte beton dokusu, kapı fitilleri, damlalık ve metal birleşimler geliştirilmiştir.

Mevcut saha/evirici/köşk/Dünya/ABD/ev/monitör yolculuğu ve şirket sayfaları korunmuştur. Referans fotoğraf arka plan olarak kullanılmaz. Bunlar Three.js ile üretilen parametrik 3B modellerdir; Blender üretimi veya fotogrametri modeli değildir. 3B ve 3D aynı anlama gelir.

Kontrol: 44 test, 9 dosya; TypeScript ve Vite derlemesi. Kamera çarpışma testleri ve RenderPass sırası kontrol edilmiştir. Bu ortamda tarayıcı/GPU görsel doğrulaması yapılamadığından Faers seviyesinde fotogerçekçilik iddiası yoktur. Ek geometri GPU yükünü artırabilir; ayrıntılar instancing ile gruplanmıştır.

Windows: Node.js LTS kurulu olmalı. Önceki sunucuyu Ctrl+C ile kapatın. ZIP'i yeni bir klasöre çıkarın. package.json klasöründe npm.cmd ci ve npm.cmd run dev. Adres http://127.0.0.1:5188.
