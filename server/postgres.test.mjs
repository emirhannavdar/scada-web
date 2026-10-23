import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { openDatabase, sqlForPostgres } from './database.mjs';
import { migratePostgres } from './migrate-postgres.mjs';
import { openStore } from './store.mjs';
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex');
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'pglite:test';
async function fixture() {
    const dir = mkdtempSync(join(tmpdir(), 'sw-pg-migration-')), db = new DatabaseSync(join(dir, 'cms.sqlite'));
    (await db.exec(`
 CREATE TABLE content(id INTEGER PRIMARY KEY CHECK(id=1),revision INTEGER NOT NULL,draft TEXT NOT NULL,published TEXT NOT NULL,version INTEGER NOT NULL,updated TEXT NOT NULL);
 CREATE TABLE history(version INTEGER PRIMARY KEY,created TEXT NOT NULL,author TEXT NOT NULL,note TEXT NOT NULL,body TEXT NOT NULL);
 CREATE TABLE cms_users(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT NOT NULL UNIQUE,password TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('root','admin')),created TEXT NOT NULL);
 CREATE UNIQUE INDEX cms_users_single_root ON cms_users(role) WHERE role='root';
 CREATE TABLE cms_messages(id INTEGER PRIMARY KEY AUTOINCREMENT,sender TEXT NOT NULL,recipient TEXT NOT NULL,body TEXT NOT NULL,created TEXT NOT NULL,read_at TEXT);
 CREATE TABLE media(id TEXT PRIMARY KEY,name TEXT NOT NULL,mime TEXT NOT NULL,size INTEGER NOT NULL,created TEXT NOT NULL,deleted INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE mail_settings(id INTEGER PRIMARY KEY CHECK(id=1),body TEXT NOT NULL);
 CREATE TABLE google_reviews_settings(id INTEGER PRIMARY KEY CHECK(id=1),body TEXT NOT NULL);
 CREATE TABLE approval_requests(id INTEGER PRIMARY KEY AUTOINCREMENT,created TEXT NOT NULL,author TEXT NOT NULL,device TEXT NOT NULL,note TEXT NOT NULL,status TEXT NOT NULL,body TEXT NOT NULL,reviewer TEXT,reviewer_comment TEXT,reviewed TEXT);
 `));
    const raw = JSON.stringify({ '@devices': { mobile: { values: { 'data.aboutCompany.headline': { tr: 'Türkçe mobil içerik', en: 'English mobile copy' } }, design: { version: 1, palette: { light: {}, dark: {} }, elements: {}, homeOrder: ['hardware', 'solutions', 'discovery', 'contact'] } } } });
    (await db.prepare('INSERT INTO content VALUES(1,17,?,?,9,?)').run(raw, raw, '2026-10-22T00:00:00Z'));
    (await db.prepare('INSERT INTO history VALUES(9,?,?,?,?)').run('2026-10-22', 'root@test.com', 'Yayın notu', raw));
    (await db.prepare('INSERT INTO cms_users VALUES(7,?,?,?,?)').run('root@test.com', 'unchanged:password-hash', 'root', '2026-10-22'));
    (await db.prepare('INSERT INTO cms_users VALUES(19,?,?,?,?)').run('admin@test.com', 'unchanged:admin-hash', 'admin', '2026-10-22'));
    (await db.prepare('INSERT INTO cms_messages VALUES(3,?,?,?,?,NULL)').run('root@test.com', 'admin@test.com', 'Revize isteği', '2026-10-22'));
    (await db.prepare('INSERT INTO media VALUES(?,?,?,?,?,0)').run('existing.png', 'Müşteri resmi', 'image/png', 340, '2026-10-22'));
    (await db.prepare('INSERT INTO mail_settings VALUES(1,?)').run('{"encryptedPassword":"existing-smtp-ciphertext"}'));
    (await db.prepare('INSERT INTO google_reviews_settings VALUES(1,?)').run('{"encryptedKey":"existing-google-ciphertext"}'));
    (await db.prepare('INSERT INTO approval_requests VALUES(12,?,?,?,?,?,?,NULL,NULL,NULL)').run('2026-10-22', 'admin@test.com', 'mobile', 'Düzenleme', 'pending', raw));
    (await db.close());
    writeFileSync(join(dir, 'mail.key'), Buffer.alloc(32, 7));
    writeFileSync(join(dir, 'google.key'), Buffer.alloc(32, 8));
    return dir;
}
test('migration preserves all records, IDs, UTF-8, hashes, variants, keys and sequence values; rerun never overwrites', async () => {
    const dir = (await fixture()), sourceHash = hash(join(dir, 'cms.sqlite')), db = await openDatabase(dir, { allowUnmigrated: true });
    try {
        const result = await migratePostgres({ directory: dir, destination: db });
        assert.equal(result.tables.length, 8);
        assert.equal(hash(join(dir, 'cms.sqlite')), sourceHash);
        assert.equal(hash(join(result.backupDir, 'mail.key')), hash(join(dir, 'mail.key')));
        const content = await db.prepare('SELECT * FROM content WHERE id=1').get();
        assert.equal(content.revision, 17);
        assert.match(content.draft, /Türkçe mobil/);
        assert.equal((await db.prepare('SELECT password FROM cms_users WHERE id=19').get()).password, 'unchanged:admin-hash');
        assert.equal((await db.prepare('SELECT status FROM approval_requests WHERE id=12').get()).status, 'pending');
        const newUser = await db.prepare('INSERT INTO cms_users(email,password,role,created) VALUES(?,?,?,?)').run('new@test.com', 'hash', 'admin', '2026');
        assert.equal(newUser.lastInsertRowid, 20);
        await assert.rejects(migratePostgres({ directory: dir, destination: db }), /boş değil/);
        assert.equal((await db.prepare('SELECT revision FROM content WHERE id=1').get()).revision, 17);
    }
    finally {
        await db.close();
        rmSync(dir, { recursive: true, force: true });
    }
});
test('a failed comparison rolls back all destination tables and preserves source', async () => {
    const dir = (await fixture()), sourceHash = hash(join(dir, 'cms.sqlite')), db = await openDatabase(dir, { allowUnmigrated: true });
    try {
        await assert.rejects(migratePostgres({ directory: dir, destination: db, afterInsert: async (client, table) => { if (table === 'content')
                await client.query('UPDATE content SET revision=999'); } }), /karşılaştırması/);
        assert.equal((await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='scadawatt'")).rows.length, 0);
        assert.equal(hash(join(dir, 'cms.sqlite')), sourceHash);
    }
    finally {
        await db.close();
        rmSync(dir, { recursive: true, force: true });
    }
});
test('competing content updates reject stale revisions instead of losing a change', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'sw-pg-race-')), store = await openStore(dir);
    try {
        const results = await Promise.allSettled([store.save(0, {}), store.save(0, {})]);
        assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
        assert.equal(results.find(r => r.status === 'rejected').reason.status, 409);
        assert.equal((await store.state()).revision, 1);
    }
    finally {
        await store.close();
        rmSync(dir, { recursive: true, force: true });
    }
});
