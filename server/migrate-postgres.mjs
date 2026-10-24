import { DatabaseSync, backup } from 'node:sqlite';
import { existsSync, mkdirSync, writeFileSync, cpSync, unlinkSync } from 'node:fs';
import net from 'node:net';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { openDatabase } from './database.mjs';
const identifier = value => {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value))
        throw Error('Desteklenmeyen tablo / alan adı.');
    return '"' + value + '"';
};
const normalized = rows => rows.map(row => JSON.stringify(Object.fromEntries(Object.keys(row).sort().map(key => [key, typeof row[key] === 'bigint' ? Number(row[key]) : row[key]])))).sort();
const checksum = rows => createHash('sha256').update(JSON.stringify(normalized(rows))).digest('hex');
export async function migratePostgres({ directory = process.env.CMS_DATA_DIR || 'data', destination, afterInsert } = {}) {
    const dir = resolve(directory), source = join(dir, 'cms.sqlite');
    if (!existsSync(source))
        throw Error('SQLite dosyası bulunamadı: ' + source + '. Yanlış klasörde boş aktarım yapılmadı.');
    const sqlite = new DatabaseSync(source, { readOnly: true });
    let db, report, backupDir;
    try {
        const integrity = (await sqlite.prepare('PRAGMA quick_check').get());
        if (Object.values(integrity)[0] !== 'ok')
            throw Error('SQLite bütünlük kontrolü başarısız. Kaynak korunuyor.');
        backupDir = join(dir, 'migration-backups', new Date().toISOString().replace(/[:.]/g, '-'));
        mkdirSync(backupDir, { recursive: true, mode: 0o700 });
        await backup(sqlite, join(backupDir, 'cms.sqlite'));
        for (const file of ['mail.key', 'google.key'])
            if (existsSync(join(dir, file)))
                cpSync(join(dir, file), join(backupDir, file), { errorOnExist: true });
        const snapshot = new DatabaseSync(join(backupDir, 'cms.sqlite'), { readOnly: true });
        try {
            const tables = (await snapshot.prepare("SELECT name,sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all());
            if (!tables.some(table => table.name === 'content'))
                throw Error('Bu dosya ScadaWatt içerik veritabanı değil.');
            db = destination || await openDatabase(dir, { allowUnmigrated: true });
            report = await db.transaction(async () => {
                await db.query('SELECT pg_advisory_xact_lock(11820261022)');
                const existing = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='scadawatt' AND table_type='BASE TABLE'");
                if (existing.rows.length)
                    throw Error('Hedef scadawatt şeması boş değil. Mevcut PostgreSQL verileri değiştirilmedi. Aktarım yeniden çalıştırılmadı.');
                const summary = [];
                for (const table of tables) {
                    await db.exec(table.sql);
                    const name = identifier(table.name), columns = (await snapshot.prepare('PRAGMA table_info(' + name + ')').all()).map(c => c.name), fields = columns.map(identifier).join(','), rows = (await snapshot.prepare('SELECT ' + fields + ' FROM ' + name).all());
                    if (rows.length) {
                        const query = 'INSERT INTO ' + name + ' (' + fields + ') VALUES (' + columns.map((_, i) => '$' + (i + 1)).join(',') + ')';
                        for (const row of rows)
                            await db.query(query, columns.map(c => row[c]));
                    }
                    if (afterInsert)
                        await afterInsert(db, table.name);
                    const restored = (await db.query('SELECT ' + fields + ' FROM ' + name)).rows;
                    const sourceHash = checksum(rows), targetHash = checksum(restored);
                    if (sourceHash !== targetHash)
                        throw Error(table.name + ' veri karşılaştırması başarısız. Aktarım tamamen geri alındı.');
                    for (const column of columns) {
                        const sequence = (await db.query('SELECT pg_get_serial_sequence($1,$2) AS name', ['scadawatt.' + table.name, column])).rows[0]?.name;
                        if (sequence) {
                            const max = rows.reduce((value, row) => Math.max(value, Number(row[column]) || 0), 0);
                            await db.query('SELECT setval($1::regclass,$2::bigint,$3::boolean)', [sequence, Math.max(1, max), max > 0]);
                        }
                    }
                    summary.push({ table: table.name, rows: rows.length, sha256: sourceHash });
                }
                for (const index of (await snapshot.prepare("SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL ORDER BY name").all()))
                    await db.exec(index.sql);
                return { completed: new Date().toISOString(), database: 'PostgreSQL', schema: 'scadawatt', tables: summary };
            });
        }
        finally {
            snapshot.close();
        }
        writeFileSync(join(backupDir, 'transfer-report.json'), JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
        return { ...report, backupDir };
    }
    finally {
        sqlite.close();
        if (db && !destination)
            await db.close();
    }
}
async function isListening(port){return new Promise(resolve=>{const socket=net.connect({host:'127.0.0.1',port});const done=value=>{socket.destroy();resolve(value)};socket.setTimeout(700,()=>done(false));socket.on('connect',()=>done(true));socket.on('error',()=>done(false))})}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 let lock,createdLock=false;
 try{
  for(const port of new Set([Number(process.env.CMS_PORT||5188),5189]))if(await isListening(port))throw Error('Önce web sunucusunu Ctrl+C ile durdurun (port '+port+').');
  const dir=resolve(process.env.CMS_DATA_DIR||'data');if(!existsSync(join(dir,'cms.sqlite')))throw Error('data/cms.sqlite bulunamadı; mevcut proje klasöründe çalıştırın.');
  lock=join(dir,'postgres-migration.lock');writeFileSync(lock,JSON.stringify({pid:process.pid,started:new Date().toISOString()}),{flag:'wx',mode:0o600});createdLock=true;
  const result=await migratePostgres();console.log('Aktarım doğrulandı. SQLite dosyası ve yüklenen görseller korundu.');for(const item of result.tables)console.log(item.table+': '+item.rows+' kayıt / içerik özeti eşleşti');console.log('Yedek ve rapor: '+result.backupDir);console.log('Şimdi npm.cmd start çalıştırın.');
 }catch(error){if(error.code==='EEXIST')lock=undefined;console.error('Aktarım tamamlanmadı: '+error.message);process.exitCode=1}
 finally{if(createdLock&&lock&&existsSync(lock))unlinkSync(lock)}
}
