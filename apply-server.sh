#!/usr/bin/env bash
set -euo pipefail
[ "$(id -u)" -eq 0 ] || { echo 'sudo bash apply-server.sh ile çalıştırın.'; exit 1; }
TARGET=/var/www/sca.scadawatt.com
STAGE=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
PAYLOAD="$STAGE"
[ -f "$TARGET/server/index.mjs" ] && [ -f "$TARGET/.env" ] && [ -f "$TARGET/dist/index.html" ] || { echo 'Mevcut proje bulunamadı. Hiçbir dosya değiştirilmedi.'; exit 1; }
[ -f "$PAYLOAD/dist/index.html" ] && [ -f "$STAGE/FILES.txt" ] || { echo 'Güncelleme paketi eksik.'; exit 1; }
command -v curl >/dev/null
systemctl is-active --quiet scadawatt-preview || { echo 'Mevcut servis çalışmıyor. Önce servis sorununu giderin; güncelleme uygulanmadı.'; exit 1; }
[ "$(curl --max-time 10 -s -o /dev/null -w '%{http_code}' http://127.0.0.1:5188/)" = 200 ] || { echo 'Mevcut site sağlıklı değil; güncelleme uygulanmadı.'; exit 1; }
while IFS= read -r rel; do
  case "$rel" in
    *..*|/*) echo 'Geçersiz paket yolu'; exit 1 ;;
    src/*|scripts/*|dist/*|public/assets/inter-*|server/app.mjs|server/seo.mjs|server/seo.test.mjs|server/seo-render.test.mjs|server/catalog.json|server/retired-fields.json|server/seo-manifest.json|package.json|package-lock.json) ;;
    *) echo "İzin verilmeyen paket yolu: $rel"; exit 1 ;;
  esac
  [ -f "$PAYLOAD/$rel" ] || { echo "Eksik dosya: $rel"; exit 1; }
done < "$STAGE/FILES.txt"
BACKUP="/home/developer/scadawatt-transfer/updates/pre-v128-$(date +%Y%m%d-%H%M%S)-$$"
install -d -m 700 "$BACKUP/previous"
: > "$BACKUP/existing.txt"
: > "$BACKUP/new.txt"
while IFS= read -r rel; do
  if [ -f "$TARGET/$rel" ]; then
    mkdir -p "$BACKUP/previous/$(dirname -- "$rel")"
    cp -a "$TARGET/$rel" "$BACKUP/previous/$rel"
    printf '%s\n' "$rel" >> "$BACKUP/existing.txt"
  else
    printf '%s\n' "$rel" >> "$BACKUP/new.txt"
  fi
done < "$STAGE/FILES.txt"
cat > "$BACKUP/rollback.sh" <<'ROLLBACK'
#!/usr/bin/env bash
set -euo pipefail
[ "$(id -u)" -eq 0 ] || exit 1
TARGET=/var/www/sca.scadawatt.com
HERE=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
while IFS= read -r rel; do
  [ -n "$rel" ] || continue
  mkdir -p "$TARGET/$(dirname -- "$rel")"
  cp -a "$HERE/previous/$rel" "$TARGET/$rel"
done < "$HERE/existing.txt"
while IFS= read -r rel; do
  [ -n "$rel" ] && rm -f -- "$TARGET/$rel"
done < "$HERE/new.txt"
systemctl restart scadawatt-preview
echo 'Önceki uygulama dosyaları geri yüklendi. Veritabanı ve .env değiştirilmedi.'
ROLLBACK
chmod 700 "$BACKUP/rollback.sh"
restore_on_error() {
  trap - ERR
  echo 'Güncelleme tamamlanamadı; önceki dosyalar geri yükleniyor.'
  bash "$BACKUP/rollback.sh" || echo "Geri alma tamamlanamadı. Kontrol edin: $BACKUP/rollback.sh"
  exit 1
}
trap restore_on_error ERR
# Copy index.html last; existing hashed assets are retained for open browser sessions.
while IFS= read -r rel; do
  [ "$rel" = dist/index.html ] && continue
  install -d -m 755 "$TARGET/$(dirname -- "$rel")"
  install -o developer -g developer -m 644 "$PAYLOAD/$rel" "$TARGET/$rel"
done < "$STAGE/FILES.txt"
install -o developer -g developer -m 644 "$PAYLOAD/dist/index.html" "$TARGET/dist/index.html"
systemctl restart scadawatt-preview
healthy=0
for attempt in 1 2 3 4 5 6 7 8 9 10; do
  if curl --max-time 3 -fsS http://127.0.0.1:5188/api/content -o /dev/null &&
     curl --max-time 3 -fsS http://127.0.0.1:5188/privacy-policy -o /dev/null; then
    healthy=1
    break
  fi
  sleep 1
done
[ "$healthy" -eq 1 ]
trap - ERR
echo 'V128 güncellemesi uygulandı. Veritabanı, yüklenen görseller, .env ve Nginx ayarları korunuyor.'
printf 'Geri alma: sudo bash %s/rollback.sh\n' "$BACKUP"
echo 'Tarayıcıda Ctrl+F5 yapın. https://sca.scadawatt.com/privacy-policy adresini ve admin önizlemesini kontrol edin.'
