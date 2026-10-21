# Monitor ekran güncellemesi

Yapılanlar:
- Son monitör ekranına iki yeni görsel eklendi:
  - `/assets/screens/monitor-dashboard-1.png`
  - `/assets/screens/monitor-dashboard-2.png`
- Final monitör sahnesinde bu iki görsel 2 saniyede bir otomatik değişir.
- Görseller monitöre tam sığacak şekilde `prepareDisplayTexture` iyileştirildi.
- Ekran dokusu daha net görünmesi için daha yüksek çözünürlüklü canvas ve hafif ekran yansıması/vinyet eklendi.

Değişen dosyalar:
- `src/components/site/DataVoyage.tsx`
- `src/lib/flight/screen-texture.ts`
- `public/assets/screens/monitor-dashboard-1.png`
- `public/assets/screens/monitor-dashboard-2.png`

Not:
- Kaynak kod güncellenmiştir.
- Bu container ortamında Node 22 bulunduğu için tam build doğrulaması yapılamadı; proje `package.json` içinde Node `>=24 <27` istiyor.
- Kendi ortamında Node 24+ ile:
  - `npm install`
  - `npm run build`
  - veya geliştirme için `npm run dev`
