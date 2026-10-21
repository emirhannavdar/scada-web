# ScadaWatt – Teslim Notu (V14)

Bu sürümde kullanıcı geri bildirimine göre iki büyük alan yeniden geliştirildi.

## 1) Yazılım ekranları / monitor deneyimi
- Soldaki ekran etiketleri kaldırıldı.
- Bölüm gerçek bir monitor hissi verecek şekilde yeniden tasarlandı.
- Monitor gövdesi, bezel, kamera deliği, stand ve taban eklendi.
- Gerçekçi mouse / cursor hareketi eklendi.
- Ekran içinde scroll oluyormuş hissi için iç scroll ve scrollbar eklendi.
- Bölüm sticky / pinned akışa çevrildi.
- Kullanıcı bu bölüm tamamlanmadan doğal olarak aşağıdaki bölüme geçmez.
- Demo akışı aç/kapat korunmuştur.

## 2) Operatör mahallesi / şehir bölgesi
- Yarım ve kopuk yol hissi azaltıldı.
- Sürekliliği olan ana yollar, tali yollar ve kaldırımlar eklendi.
- Tek tip ev görünümü kırıldı.
- Karışık doku oluşturuldu:
  - villa tipleri
  - townhouse sıraları
  - orta katlı apartmanlar
  - yüksek blok / kule tipleri
  - büyük park alanı
  - ağaçlar, banklar, lambalar
  - park etmiş araçlar
- Hedef yapının yakınında daha yaşanmış bir avlu / yeşil alan hissi korundu.

## Güncellenen dosyalar
- src/components/site/ScreenExplorer.tsx
- src/screen-explorer.css
- src/lib/flight/world.ts
