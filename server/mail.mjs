import nodemailer from 'nodemailer';
import { z } from 'zod';
import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { CmsError } from './store.mjs';
const email = z.string().trim().email().max(254).refine(s => !s.includes('\r') && !s.includes('\n'));
const settingsSchema = z.object({ enabled: z.boolean(), host: z.string().trim().max(253).regex(/^(?:[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?)?$/), port: z.number().int().min(1).max(65535), secure: z.boolean(), username: z.string().trim().max(254), password: z.string().max(1024).optional(), clearPassword: z.boolean().optional(), fromEmail: z.union([email, z.literal('')]), fromName: z.string().trim().max(100).refine(s => !s.includes('\r') && !s.includes('\n')), toEmail: email });
export const enquirySchema = z.object({
    type: z.enum(['demo', 'teklif', 'bilgi']), name: z.string().trim().min(2).max(100),
    company: z.string().trim().max(120).optional(), email, phone: z.string().trim().max(20).refine(v => !v || /^[0-9+()\s-]{10,20}$/.test(v)).optional(),
    interest: z.string().max(150).optional(), interests: z.array(z.string().min(1).max(150)).max(25).optional(),
    message: z.string().trim().min(10).max(4000), preferredContact: z.enum(['email', 'phone']).optional(),
    preferredDate: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional(),
    projectType: z.string().max(80).optional(), siteCount: z.string().refine(v => !v || (/^\d+$/.test(v) && Number(v) > 0 && Number(v) <= 100000)).optional(),
    capacity: z.string().max(80).optional(), topic: z.string().max(150).optional(), consent: z.literal(true),
    locale: z.enum(['tr', 'en']).default('tr'), website: z.string().max(200).default(''), requestId: z.string().uuid()
}).superRefine((v, c) => {
    const issue = path => c.addIssue({ code: 'custom', path: [path], message: 'Gerekli alan eksik.' });
    if (v.type !== 'bilgi' && !v.interests?.length && !v.interest)
        issue('interest');
    if (v.type === 'teklif') {
        if (!v.company)
            issue('company');
        if (!v.projectType)
            issue('projectType');
    }
    if (v.type === 'bilgi' && !v.topic)
        issue('topic');
    if (v.type === 'demo' && v.preferredContact === 'phone' && !v.phone)
        issue('phone');
});
// Root-only diagnostics: never return SMTP response text, credentials or AUTH payloads.
export function mailDiagnostic(error, action = 'Bağlantı') {
    if (error instanceof CmsError)
        return error;
    const known = new Set(['EAUTH', 'ETIMEDOUT', 'EDNS', 'ECONNECTION', 'ECONNREFUSED', 'ECONNRESET', 'ESOCKET', 'ETLS', 'EENVELOPE', 'EMESSAGE', 'EPROTOCOL', 'ERR_TLS_CERT_ALTNAME_INVALID', 'CERT_HAS_EXPIRED', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'SELF_SIGNED_CERT_IN_CHAIN']);
    const code = known.has(error?.code) ? error.code : 'SMTP';
    const status = Number.isInteger(error?.responseCode) && error.responseCode >= 400 && error.responseCode <= 599 ? String(error.responseCode) : '';
    const command = ['AUTH', 'STARTTLS', 'EHLO', 'HELO', 'CONN', 'MAIL FROM', 'RCPT TO', 'DATA'].find(v => String(error?.command || '').toUpperCase().startsWith(v)) || '';
    const detail = String(error?.message || '') + ' ' + String(error?.reason || '');
    let hint = 'SMTP sağlayıcısı isteği tamamlayamadı. Gönderen hesabının SMTP yetkisini ve sağlayıcı kayıtlarını kontrol edin.';
    if (code === 'EAUTH' || status === '535' || status === '534')
        hint = 'Hesap doğrulanamadı. Uygulama şifresinin kullanıcı adı alanındaki aynı Google hesabından üretildiğini kontrol edin; şifreyi yeniden girip kaydedin.';
    else if (/CERT|SELF_SIGNED/.test(code) || /certificate|self.signed|unable to verify/i.test(detail))
        hint = 'TLS sertifikası doğrulanamadı. Bilgisayarın tarih/saatini ve antivirüs/kurumsal ağın şifreli bağlantı denetimini kontrol edin. Sertifika doğrulamasını kapatmayın.';
    else if (code === 'ETIMEDOUT')
        hint = 'SMTP bağlantısı zaman aşımına uğradı. Node.js uygulamasının ağ erişimini, güvenlik yazılımını ve SMTP portunu kontrol edin.';
    else if (code === 'EDNS')
        hint = 'SMTP sunucusunun adresi çözümlenemedi. Sunucu adını ve DNS bağlantısını kontrol edin.';
    else if (['ECONNECTION', 'ECONNREFUSED', 'ECONNRESET'].includes(code))
        hint = 'SMTP bağlantısı kurulamadı veya kesildi. Ağ, güvenlik duvarı ve sunucu adresini kontrol edin.';
    else if (code === 'ETLS' || /wrong version|ssl routines|starttls/i.test(detail))
        hint = 'Şifreleme ve port eşleşmesini kontrol edin: 587 için STARTTLS, 465 için TLS.';
    else if (code === 'EENVELOPE' || command === 'MAIL FROM' || command === 'RCPT TO')
        hint = 'Gönderen veya alıcı reddedildi. Gönderen adresinin bu SMTP hesabınca kullanılabildiğini ve alıcı adresini kontrol edin.';
    return new CmsError(502, action + ' başarısız. [' + [code, status, command].filter(Boolean).join(' / ') + '] ' + hint);
}
export async function createMailService(store, { transportFactory = options => nodemailer.createTransport(options) } = {}) {
    const db = store.db;
    (await db.exec("CREATE TABLE IF NOT EXISTS mail_settings(id INTEGER PRIMARY KEY CHECK(id=1),body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS contact_deliveries(id TEXT PRIMARY KEY,digest TEXT NOT NULL,status TEXT NOT NULL,created INTEGER NOT NULL);"));
    const keyPath = join(store.dir, 'mail.key');
    function secretKey() {
        if (!existsSync(keyPath))
            writeFileSync(keyPath, randomBytes(32), { flag: 'wx', mode: 0o600 });
        const key = readFileSync(keyPath);
        if (key.length !== 32)
            throw Error('Invalid mail key');
        return key;
    }
    function encrypt(value) { const iv = randomBytes(12), c = createCipheriv('aes-256-gcm', secretKey(), iv), bytes = Buffer.concat([c.update(value, 'utf8'), c.final()]); return [iv.toString('base64'), c.getAuthTag().toString('base64'), bytes.toString('base64')].join('.'); }
    function decrypt(value) {
        if (!value)
            return '';
        const [iv, tag, bytes] = value.split('.');
        const c = createDecipheriv('aes-256-gcm', secretKey(), Buffer.from(iv, 'base64'));
        c.setAuthTag(Buffer.from(tag, 'base64'));
        return Buffer.concat([c.update(Buffer.from(bytes, 'base64')), c.final()]).toString('utf8');
    }
    async function raw() { return JSON.parse((await db.prepare('SELECT body FROM mail_settings WHERE id=1').get())?.body || 'null') || { enabled: false, host: '', port: 587, secure: false, username: '', fromEmail: '', fromName: 'ScadaWatt', toEmail: 'info@scadawatt.com', encryptedPassword: '' }; }
    async function read() { const { encryptedPassword, ...settings } = (await raw()); return { ...settings, hasPassword: Boolean(encryptedPassword) }; }
    async function save(value) {
        const parsed = settingsSchema.safeParse(value);
        if (!parsed.success)
            throw new CmsError(400, 'E-posta ayarlarını kontrol edin. Geçerli sunucu, port ve e-posta adresleri kullanın.');
        const next = parsed.data, old = (await raw()), password = next.password ? encrypt(next.password) : next.clearPassword ? '' : old.encryptedPassword;
        if (next.enabled && (!next.host || !next.fromEmail || (next.username && !password)))
            throw new CmsError(400, 'Gönderimi açmak için SMTP sunucusu, gönderen adresi ve gerekiyorsa şifreyi girin.');
        const { password: unused, clearPassword, ...safe } = next;
        (await db.prepare('INSERT INTO mail_settings VALUES(1,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body').run(JSON.stringify({ ...safe, encryptedPassword: password })));
        return (await read());
    }
    async function transport() {
        const s = (await raw());
        if (!s.enabled || !s.host || !s.fromEmail)
            throw new CmsError(503, 'E-posta gönderimi henüz yapılandırılmadı. Lütfen telefon veya e-posta ile bize ulaşın.');
        let password;
        try {
            password = decrypt(s.encryptedPassword);
        }
        catch {
            throw new CmsError(503, 'E-posta hizmetine şu anda erişilemiyor. Lütfen doğrudan iletişime geçin.');
        }
        if (s.host.toLowerCase() === 'smtp.gmail.com' && /^[a-zA-Z]{16}$/.test(password.replace(/\s/g, '')))
            password = password.replace(/\s/g, '');
        return { s, t: transportFactory({ host: s.host, port: s.port, secure: s.secure, requireTLS: !s.secure, auth: s.username ? { user: s.username, pass: password } : undefined, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000, disableFileAccess: true, disableUrlAccess: true, tls: { minVersion: 'TLSv1.2' } }) };
    }
    async function rate(key,max,period){
        const now=Date.now();await db.prepare('DELETE FROM attempts WHERE until_at<?').run(now);
        const reserved=await db.prepare('INSERT INTO attempts VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=attempts.count+1 WHERE attempts.count<? RETURNING count').get(key,now+period,max);
        if(!reserved)throw new CmsError(429,'Çok fazla talep gönderildi. Lütfen daha sonra tekrar deneyin.');
    }
    async function verify() {
        const { t } = (await transport());
        try {
            await t.verify();
            return { ok: true };
        }
        catch (error) {
            throw mailDiagnostic(error, 'SMTP bağlantı doğrulaması');
        }
        finally {
            t.close?.();
        }
    }
    async function test() {
        const { s, t } = (await transport());
        try {
            const result = await t.sendMail({ from: { name: s.fromName, address: s.fromEmail }, to: s.toEmail, subject: 'ScadaWatt · Test e-postası', text: 'ScadaWatt iletişim formu e-posta bağlantısı test edildi.' });
            if (!result.accepted?.length || result.rejected?.length)
                throw Error('Rejected');
            return { ok: true };
        }
        catch (error) {
            throw mailDiagnostic(error, 'Test e-postası gönderimi');
        }
        finally {
            t.close?.();
        }
    }
    async function submit(body, ip) {
        const parsed = enquirySchema.safeParse(body);
        if (!parsed.success)
            throw new CmsError(400, 'Formdaki gerekli alanları ve e-posta adresinizi kontrol edin.');
        const v = parsed.data;
        if (v.website)
            throw new CmsError(400, 'Talep doğrulanamadı.');
        const digest = createHash('sha256').update(JSON.stringify({ ...v, requestId: undefined })).digest('hex');
        (await db.prepare('DELETE FROM contact_deliveries WHERE created<?').run(Date.now() - 7 * 86400000));
        const previous = (await db.prepare('SELECT * FROM contact_deliveries WHERE id=?').get(v.requestId));
        if (previous) {
            if (previous.digest !== digest)
                throw new CmsError(409, 'Bu talep kimliği başka bir gönderim için kullanıldı. Sayfayı yenileyin.');
            if (previous.status === 'sent')
                return { ok: true, reference: v.requestId };
            if (previous.status !== 'failed')
                throw new CmsError(409, 'Gönderim sonucu henüz kesinleşmedi. Tekrar göndermeden önce ekibimizle iletişime geçin.');
        }
        (await rate('contact:ip:' + ip, 10, 10 * 60000));
        (await rate('contact:global', 200, 3600000));
        const { s, t } = (await transport());
        const reserved=await db.prepare("INSERT INTO contact_deliveries VALUES(?,?,'pending',?) ON CONFLICT(id) DO UPDATE SET status='pending',created=excluded.created WHERE contact_deliveries.status='failed' AND contact_deliveries.digest=excluded.digest RETURNING id").get(v.requestId,digest,Date.now());
        if(!reserved){t.close?.();throw new CmsError(409,'Bu talep zaten işleniyor. Lütfen tekrar göndermeyin.')}
        const type = { demo: 'Demo talebi', teklif: 'Teklif talebi', bilgi: 'Bilgi talebi' }[v.type], selected = v.interests?.length ? v.interests : v.interest ? [v.interest] : [];
        const lines = [type, 'Referans: ' + v.requestId, 'Ad soyad: ' + v.name, 'Firma: ' + (v.company || '—'), 'E-posta: ' + v.email, 'Telefon: ' + (v.phone || '—'), 'Dil: ' + v.locale, 'Ürünler / hizmetler: ' + (selected.join(', ') || '—')];
        if (v.type === 'demo')
            lines.push('Görüşme tercihi: ' + (v.preferredContact === 'phone' ? 'Telefon' : 'E-posta'), 'Tercih edilen gün: ' + (v.preferredDate || '—'));
        if (v.type === 'teklif')
            lines.push('Proje türü: ' + (v.projectType || '—'), 'Saha sayısı: ' + (v.siteCount || '—'), 'Kapasite: ' + (v.capacity || '—'));
        if (v.type === 'bilgi')
            lines.push('Konu: ' + (v.topic || '—'));
        lines.push('', 'Mesaj:', v.message);
        const text = lines.join('\n');
        try {
            const result = await t.sendMail({ from: { name: s.fromName, address: s.fromEmail }, to: s.toEmail, replyTo: { name: v.name, address: v.email }, messageId: '<' + v.requestId + '@' + s.fromEmail.split('@')[1] + '>', subject: 'ScadaWatt · ' + type, text });
            if (!result.accepted?.length || result.rejected?.length)
                throw Object.assign(Error('Rejected'), { code: 'EENVELOPE' });
            (await db.prepare("UPDATE contact_deliveries SET status='sent' WHERE id=?").run(v.requestId));
            return { ok: true, reference: v.requestId };
        }
        catch (error) {
            const definite = ['EAUTH', 'EENVELOPE', 'ECONNECTION', 'EDNS'].includes(error.code) && !['DATA'].includes(error.command) || Number(error.responseCode) >= 400;
            (await db.prepare('UPDATE contact_deliveries SET status=? WHERE id=?').run(definite ? 'failed' : 'unknown', v.requestId));
            throw new CmsError(502, definite ? 'E-posta gönderilemedi. Bilgileriniz korunuyor; daha sonra tekrar deneyebilir veya doğrudan bize ulaşabilirsiniz.' : 'Gönderim sonucu doğrulanamadı. Tekrar göndermeden önce ekibimizle iletişime geçin.');
        }
        finally {
            t.close?.();
        }
    }
    return { read, save, verify, test, submit, rate };
}
