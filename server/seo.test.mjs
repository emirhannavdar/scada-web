import { compression } from './seo.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCmsApp } from './app.mjs';
test('public SEO uses published pages, real HTTP 404, private noindex and controlled indexing', async () => {
    assert.equal(compression('br;q=0, gzip;q=0.5'), 'gzip');
    assert.equal(compression('br;q=0,gzip;q=0'), '');
    const dir = mkdtempSync(join(tmpdir(), 'sw-seo-'));
    mkdirSync(join(dir, 'dist'));
    writeFileSync(join(dir, 'dist/index.html'), '<!doctype html><html><head><title>Default</title><meta name="robots" content="noindex,nofollow"><meta name="description" content="Default"></head><body><div id="root"></div></body></html>');
    const saved = { url: process.env.SITE_URL, index: process.env.SITE_INDEXABLE };
    process.env.SITE_URL = 'https://example.test';
    delete process.env.SITE_INDEXABLE;
    const { server, store } = (await createCmsApp({ dataDir: join(dir, 'data'), distDir: join(dir, 'dist') }));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = 'http://127.0.0.1:' + server.address().port;
    try {
        let r = await fetch(base + '/robots.txt');
        assert.match(await r.text(), /Disallow: \//);
        r = await fetch(base + '/cozumler');
        assert.equal(r.status, 200);
        let html = await r.text();
        assert.match(html, /<title>Çözümler \| ScadaWatt/);
        assert.match(html, /https:\/\/example.test\/cozumler/);
        assert.equal((html.match(/name="description"/g) || []).length, 1);
        process.env.SITE_INDEXABLE = '1';
        r = await fetch(base + '/robots.txt');
        assert.match(await r.text(), /Sitemap: https:\/\/example.test\/sitemap.xml/);
        r = await fetch(base + '/');
        html = await r.text();
        assert.match(html, /content="index,follow"/);
        assert.match(html, /"@type":"Organization"/);
        r = await fetch(base + '/urunler/s3000i');
        assert.equal(r.status, 200);
        html = await r.text();
        assert.match(html, /BreadcrumbList/);
        r = await fetch(base + '/sitemap.xml');
        const xml = await r.text();
        assert.match(xml, /urunler\/s3000i/);
        assert.doesNotMatch(xml, /\/admin|\/demo|\/kvkk/);
        r = await fetch(base + '/not-a-page');
        assert.equal(r.status, 404);
        assert.match(r.headers.get('x-robots-tag'), /noindex/);
        r = await fetch(base + '/urunler/unknown');
        assert.equal(r.status, 404);
        r = await fetch(base + '/admin');
        assert.match(r.headers.get('cache-control'), /no-store/);
        assert.match(await r.text(), /noindex,nofollow/);
        r = await fetch(base + '/?cms-preview=1');
        assert.match(r.headers.get('cache-control'), /no-store/);
        assert.match(await r.text(), /noindex,nofollow/);
        r = await fetch(base + '/demo', { redirect: 'manual' });
        assert.equal(r.status, 301);
        assert.equal(r.headers.get('location'), '/saha-yapilandirici');
        r = await fetch(base + '/cozumler', { method: 'HEAD' });
        assert.equal(r.status, 200);
        assert.equal(await r.text(), '');
    }
    finally {
        await new Promise(resolve => server.close(resolve));
        (await store.close());
        rmSync(dir, { recursive: true, force: true });
        for (const [key, value] of [['SITE_URL', saved.url], ['SITE_INDEXABLE', saved.index]]) {
            if (value === undefined)
                delete process.env[key];
            else
                process.env[key] = value;
        }
    }
});
