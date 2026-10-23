import pg from 'pg';
import { createInterface, emitKeypressEvents } from 'node:readline';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
async function question(label, fallback) { const r = createInterface({ input: process.stdin, output: process.stdout }); return new Promise(resolve => r.question(label + ' [' + fallback + ']: ', value => { r.close(); resolve(value.trim() || fallback); })); }
async function password() {
    if (!process.stdin.isTTY) {
        if (process.env.PGPASSWORD)
            return process.env.PGPASSWORD;
        throw Error('Etkileşimli PowerShell kullanın.');
    }
    process.stdout.write('PostgreSQL yönetici şifresi (görünmez): ');
    emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    return new Promise((resolve, reject) => {
        let value = '';
        function done() { process.stdin.off('keypress', key); process.stdin.setRawMode(false); process.stdin.pause(); process.stdout.write('\n'); }
        function key(str, k = {}) {
            if (k.ctrl && k.name === 'c') {
                done();
                reject(Error('İptal edildi.'));
                return;
            }
            if (k.name === 'return') {
                done();
                resolve(value);
                return;
            }
            if (k.name === 'backspace') {
                value = value.slice(0, -1);
                return;
            }
            if (str && !k.ctrl && !k.meta && !str.includes('\x1b'))
                value += str;
        }
        process.stdin.on('keypress', key);
    });
}
let client;
try {
    if (process.env.DATABASE_URL) {
        const test = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
        try {
            await test.connect();
            await test.query('SELECT 1');
            console.log('DATABASE_URL zaten var ve bağlantı başarılı. Yeni hesap oluşturulmadı.');
        }
        finally {
            await test.end();
        }
    }
    else {
        const host = await question('PostgreSQL sunucusu', '127.0.0.1'), port = Number(await question('Port', '5432')), user = await question('PostgreSQL yönetici kullanıcısı', 'postgres'), secret = await password();
        client = new pg.Client({ host, port, user, password: secret, database: 'postgres', connectionTimeoutMillis: 10000 });
        await client.connect();
        const database = 'scadawatt_web', role = 'scadawatt_web';
        if ((await client.query('SELECT 1 FROM pg_database WHERE datname=$1', [database])).rowCount || (await client.query('SELECT 1 FROM pg_roles WHERE rolname=$1', [role])).rowCount)
            throw Error('scadawatt_web zaten var. Var olan hesap veya veritabanı değiştirilmedi. Mevcut bağlantıyı .env içindeki DATABASE_URL alanına girin.');
        const appPassword = randomBytes(32).toString('hex');
        await client.query(`CREATE ROLE scadawatt_web LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '${appPassword}'`);
        try {
            await client.query('CREATE DATABASE scadawatt_web OWNER scadawatt_web');
        }
        catch (error) {
            await client.query('DROP ROLE scadawatt_web');
            throw error;
        }
        const url = new URL('postgresql://127.0.0.1/scadawatt_web');
        url.hostname = host;
        url.port = String(port);
        url.username = role;
        url.password = appPassword;
        const old = existsSync('.env') ? readFileSync('.env', 'utf8') : '';
        const updated = old.replace(/^DATABASE_URL=.*(?:\r?\n|$)/gm, '').trimEnd() + '\nDATABASE_URL=' + url.href + '\n';
        writeFileSync('.env', updated, { mode: 0o600 });
        console.log('Ayrı scadawatt_web veritabanı ve yetkileri sınırlı kullanıcı oluşturuldu. DATABASE_URL .env dosyasına kaydedildi. Diğer veritabanlarına dokunulmadı.');
    }
    console.log('Sunucu kapalıyken npm.cmd run cms:migrate-postgres çalıştırın.');
}
catch (error) {
    console.error('PostgreSQL yapılandırılamadı: ' + error.message);
    process.exitCode = 1;
}
finally {
    await client?.end();
}
