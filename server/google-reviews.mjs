import { z } from 'zod';
import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CmsError } from './store.mjs';
import { COMMUNITY_FIELD, parseCommunity } from '../shared/community.mjs';
const schema = z.object({ enabled: z.boolean(), placeId: z.string().trim().max(200).regex(/^[a-zA-Z0-9_-]*$/), dailyLimit: z.number().int().min(1).max(10000), apiKey: z.string().trim().max(300).optional(), clearKey: z.boolean().optional() });
const link = value => {
    try {
        const u = new URL(value);
        return u.protocol === 'https:' && !u.username && !u.password ? u.href : '';
    }
    catch {
        return '';
    }
};
const text = (value, max = 10000) => typeof value === 'string' ? value.slice(0, max) : '';
export async function createGoogleReviewsService(store, { fetcher = fetch } = {}) {
    const db = store.db, inflight = new Map();
    (await db.exec('CREATE TABLE IF NOT EXISTS google_reviews_settings(id INTEGER PRIMARY KEY CHECK(id=1),body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS google_reviews_usage(day TEXT PRIMARY KEY,calls INTEGER NOT NULL);'));
    const keyPath = join(store.dir, 'google.key');
    function key() {
        if (!existsSync(keyPath))
            writeFileSync(keyPath, randomBytes(32), { flag: 'wx', mode: 0o600 });
        const bytes = readFileSync(keyPath);
        if (bytes.length !== 32)
            throw Error('Invalid key');
        return bytes;
    }
    function encode(secret) { const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key(), iv); const bytes = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]); return [iv.toString('base64'), cipher.getAuthTag().toString('base64'), bytes.toString('base64')].join('.'); }
    function decode(secret) { const [iv, tag, bytes] = secret.split('.'); const cipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64')); cipher.setAuthTag(Buffer.from(tag, 'base64')); return Buffer.concat([cipher.update(Buffer.from(bytes, 'base64')), cipher.final()]).toString('utf8'); }
    async function raw() { return JSON.parse((await db.prepare('SELECT body FROM google_reviews_settings WHERE id=1').get())?.body || 'null') || { enabled: false, placeId: '', dailyLimit: 100, encryptedKey: '' }; }
    async function read() { const { encryptedKey, ...settings } = (await raw()), day = new Date().toISOString().slice(0, 10); return { ...settings, hasKey: Boolean(encryptedKey), usedToday: (await db.prepare('SELECT calls FROM google_reviews_usage WHERE day=?').get(day))?.calls || 0 }; }
    async function save(value) {
        const parsed = schema.safeParse(value);
        if (!parsed.success)
            throw new CmsError(400, 'Google ayarlarını kontrol edin. Place ID, günlük sınır ve API anahtarı geçerli olmalı.');
        const old = (await raw()), { apiKey, clearKey, ...settings } = parsed.data;
        if (apiKey && !/^[A-Za-z0-9_-]{20,300}$/.test(apiKey))
            throw new CmsError(400, 'Geçerli Google API anahtarını girin.');
        const encryptedKey = apiKey ? encode(apiKey) : clearKey ? '' : old.encryptedKey;
        if (settings.enabled && (!settings.placeId || !encryptedKey))
            throw new CmsError(400, 'Otomatik yorumlar için Place ID ve API anahtarı gerekli.');
        (await db.prepare('INSERT INTO google_reviews_settings VALUES(1,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body').run(JSON.stringify({ ...settings, encryptedKey })));
        return (await read());
    }
    async function rate(key,max,period){
        const now=Date.now();await db.prepare('DELETE FROM attempts WHERE until_at<?').run(now);
        const reserved=await db.prepare('INSERT INTO attempts VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=attempts.count+1 WHERE attempts.count<? RETURNING count').get(key,now+period,max);
        if(!reserved)throw new CmsError(429,'Yorumlar için istek sınırına ulaşıldı. Daha sonra tekrar deneyin.');
    }
    async function published(device) { const state = (await store.state(device)); const entry = state.published[COMMUNITY_FIELD] ?? store.catalog.fields.find(f => f.id === COMMUNITY_FIELD)?.default; return parseCommunity(String(entry?.tr || '{}')).reviews; }
    async function load(language = 'tr') {
        const s = (await raw());
        if (!s.enabled || !s.placeId || !s.encryptedKey)
            throw new CmsError(503, 'Google yorum bağlantısı henüz yapılandırılmadı.');
        const identity = s.placeId + ':' + language + ':' + s.encryptedKey;
        if (inflight.has(identity))
            return inflight.get(identity);
        const promise = (async () => {
            let apiKey;
            try {
                apiKey = decode(s.encryptedKey);
            }
            catch {
                throw new CmsError(503, 'Google API anahtarı açılamadı. Anahtarı root panelinden yeniden kaydedin.');
            }
            const day = new Date().toISOString().slice(0, 10);
            (await db.prepare('DELETE FROM google_reviews_usage WHERE day<?').run(day));
            const quota=await db.prepare('INSERT INTO google_reviews_usage VALUES(?,1) ON CONFLICT(day) DO UPDATE SET calls=google_reviews_usage.calls+1 WHERE google_reviews_usage.calls<? RETURNING calls').get(day,s.dailyLimit);
            if(!quota)throw new CmsError(429,'Google yorumları için günlük istek sınırına ulaşıldı.');
            let response;
            try {
                response = await fetcher('https://places.googleapis.com/v1/places/' + encodeURIComponent(s.placeId) + '?languageCode=' + language, { headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'displayName,reviews,googleMapsUri,attributions' }, signal: AbortSignal.timeout(12000), redirect: 'error' });
            }
            catch {
                throw new CmsError(502, 'Google bağlantısı kurulamadı. Sunucunun internet ve güvenilir sertifika ayarlarını kontrol edin.');
            }
            if (!response.ok) {
                const messages = { 400: 'Place ID veya istek alanları geçersiz.', 403: 'Google erişimi reddetti. Places API (New), faturalandırma ve API anahtarının sunucu IP/API kısıtlarını kontrol edin.', 404: 'Google işletmesi bulunamadı. Place ID bilgisini kontrol edin.', 429: 'Google kotası aşıldı. Google Cloud kotalarını kontrol edin.' };
                throw new CmsError(502, messages[response.status] || 'Google yorumları şu anda alınamadı.');
            }
            let data;
            try {
                data = await response.json();
            }
            catch {
                throw new CmsError(502, 'Google yanıtı okunamadı.');
            }
            // No content is persisted or cached; only configuration and numeric usage counters are stored.
            return { enabled: true, businessName: text(data.displayName?.text, 300), url: link(data.googleMapsUri), attributions: (Array.isArray(data.attributions) ? data.attributions : []).map(a => ({ name: text(a.provider, 300), url: link(a.providerUri) })), reviews: (Array.isArray(data.reviews) ? data.reviews : []).slice(0, 5).map((r, index) => ({
                    id: text(r.name, 500) || String(index), name: text(r.authorAttribution?.displayName, 300), authorUrl: link(r.authorAttribution?.uri), photo: link(r.authorAttribution?.photoUri), rating: Number.isFinite(r.rating) ? Math.max(1, Math.min(5, r.rating)) : null, text: text(r.text?.text), originalText: text(r.originalText?.text), translated: Boolean(r.text?.languageCode && r.originalText?.languageCode && r.text.languageCode !== r.originalText.languageCode), date: text(r.relativePublishTimeDescription, 300), publishTime: text(r.publishTime, 100), url: link(r.googleMapsUri), reportUrl: link(r.flagContentUri), visitDate: r.visitDate && Number.isInteger(r.visitDate.month) && Number.isInteger(r.visitDate.year) ? r.visitDate : null
                })) };
        })();
        inflight.set(identity, promise);
        try {
            return await promise;
        }
        finally {
            inflight.delete(identity);
        }
    }
    async function publicReviews(device, language, ip) {
        const r = (await published(device));
        if (!r.enabled || !r.google.enabled || !r.google.automatic || !(await raw()).enabled)
            return { enabled: false, reviews: [] };
        (await rate('google:ip:' + ip, 8, 60000));
        (await rate('google:global', 60, 60000));
        return (await load(language));
    }
    return { read, save, load, publicReviews, rate };
}
