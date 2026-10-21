# ScadaWatt V13 – Dünya ölçeği, şehir gerçekçiligi ve monitor içi demo akışı

## 1) Dünya sahnesi
- Dünya sahnesinde kamera daha uzağa alındı.
- Küre kadrajı artık daha küçük ve daha sinematik görünecek şekilde orbital frame'ler güncellendi.
- Yan siluet / kara parçası geçiş yaklaşımı korundu.
- Dosya: `src/lib/flight/path.ts`

## 2) Operatör tarafı şehir / mahalle
- Operatör cephesine ek boulevard, şerit çizgileri ve kaldırımlar eklendi.
- Townhouse benzeri ön sıra yapılar eklendi.
- Park etmiş araçlar ve ilave ağaçlarla ön alan zenginleştirildi.
- Dosya: `src/lib/flight/world.ts`

## 3) Yazılım ekranları bölümü
- Statik galeri hissi azaltıldı.
- Scroll ilerledikçe ekranların otomatik dolaştığı bir demo akışı eklendi.
- Monitörün içinde geziyormuş hissi için sahte imleç ve hafif ekran hareketi eklendi.
- Demo akışı aç/kapat kontrolü eklendi.
- Dosyalar: `src/components/site/ScreenExplorer.tsx`, `src/screen-explorer.css`
