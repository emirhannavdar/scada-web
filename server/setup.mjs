import { createInterface, emitKeypressEvents } from 'node:readline';
import { openStore } from './store.mjs';
async function question(label) { const r = createInterface({ input: process.stdin, output: process.stdout }); return new Promise(resolve => r.question(label, value => { r.close(); resolve(value.trim()); })); }
async function password(label) {
    if (!process.stdin.isTTY)
        throw Error('Etkileşimli terminal gerekli; otomasyon için CMS_ADMIN_EMAIL ve CMS_ADMIN_PASSWORD kullanın.');
    process.stdout.write(label);
    emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    return new Promise((resolve, reject) => {
        let value = '';
        const key = (str, k = {}) => {
            if (k.ctrl && k.name === 'c') {
                finish();
                reject(Error('İptal edildi.'));
                return;
            }
            if (k.name === 'return') {
                finish();
                resolve(value);
                return;
            }
            if (k.name === 'backspace') {
                value = value.slice(0, -1);
                return;
            }
            if (str && !k.ctrl && !k.meta && !str.includes('\x1b'))
                value += str;
        };
        const finish = () => { process.stdin.off('keypress', key); process.stdin.setRawMode(false); process.stdin.pause(); process.stdout.write('\n'); };
        process.stdin.on('keypress', key);
    });
}
const store = (await openStore(process.env['CMS_DATA_DIR'] || 'data'));
try {
    const replace = process.argv.includes('--reset'), email = process.env['CMS_ADMIN_EMAIL'] || await question('Yönetici e-posta: '), secret = process.env['CMS_ADMIN_PASSWORD'] || await password('Şifre (en az 12 karakter; yazarken görünmez): ');
    if (!process.env['CMS_ADMIN_PASSWORD'] && secret !== await password('Şifre tekrar: '))
        throw Error('Şifreler eşleşmiyor.');
    await store.createAdmin(email, secret, { replace });
    console.log('Yönetici hesabı kaydedildi. /admin adresinden giriş yapabilirsiniz.');
}
catch (e) {
    console.error(e.message);
    process.exitCode = 1;
}
finally {
    (await store.close());
}
