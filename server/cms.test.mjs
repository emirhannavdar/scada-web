import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCmsApp } from './app.mjs';
import { openStore } from './store.mjs';
import {totp} from './security-core.mjs';
async function enrollEditor(base,headers){
 const setup=await fetch(base+'/api/cms/security/mfa/setup',{method:'POST',headers,body:'{}'});assert.equal(setup.status,200);const {secret}=await setup.json();
 const confirmed=await fetch(base+'/api/cms/security/mfa/confirm',{method:'POST',headers,body:JSON.stringify({code:totp(secret,Math.floor(Date.now()/30000))})});assert.equal(confirmed.status,200);
}
test('theme-scoped styles persist independently and validate mobile limits', async () => {
    const { emptyDesign, designKey, validateDesign } = await import('../shared/design.mjs');
    const design = emptyDesign(), selector = '#main > footer:nth-of-type(1) > p:nth-of-type(1)', key = designKey('/', selector);
    design.elements[key] = { page: '/', selector, label: 'Alt bilgi', kind: 'text', desktop: { fontSize: 16 }, mobile: {}, desktopLight: { color: '#112233', fontSize: 20 }, desktopDark: { color: '#ddeeff', fontSize: 22 }, mobileDark: { fontSize: 18 } };
    const parsed = validateDesign(design);
    assert.equal(parsed.elements[key].desktopLight.color, '#112233');
    assert.equal(parsed.elements[key].desktopDark.fontSize, 22);
    assert.deepEqual(parsed.elements[key].mobile, {});
    parsed.elements[key].mobileDark.fontSize = 90;
    assert.throws(() => validateDesign(parsed));
});
test('root messages target selected admins or all admins and remain private', async () => {
    const f = await fixture();
    try {
        await f.store.createAdmin('admin@example.com', 'Long-Test-Password-4901');
        await f.login();
        const a = await f.store.upsertUser('editor-a@example.com', 'Editor-Password-4901', 'admin'), b = await f.store.upsertUser('editor-b@example.com', 'Editor-Password-4901', 'admin');
        assert.equal((await f.call('/api/cms/messages', { method: 'POST', data: { message: 'Revizeyi inceleyin.', recipients: [a.id] } })).response.status, 201);
        assert.equal((await f.call('/api/cms/messages', { method: 'POST', data: { message: 'Herkese bilgi.', recipients: 'all' } })).json.sent, 2);
        const login = await fetch(f.base + '/api/cms/login', { method: 'POST', headers: { Origin: f.base, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: a.email, password: 'Editor-Password-4901' }) });
        const session = await login.json(), headers = { Cookie: login.headers.get('set-cookie').split(';')[0], 'X-CSRF-Token': session.csrf, Origin: f.base, 'Content-Type': 'application/json' };
        await enrollEditor(f.base,headers);
        const own = await (await fetch(f.base + '/api/cms/messages', { headers })).json();
        assert.equal(own.items.length, 2);
        assert.ok(own.items.every(item => item.recipient === a.email));
        assert.equal((await fetch(f.base + '/api/cms/messages', { method: 'POST', headers, body: JSON.stringify({ message: 'Forbidden', recipients: 'all' }) })).status, 403);
        const other = (await f.store.db.prepare('SELECT id FROM cms_messages WHERE recipient=?').get(b.email));
        assert.equal((await fetch(f.base + `/api/cms/messages/${other.id}/read`, { method: 'PATCH', headers })).status, 404);
        assert.equal((await fetch(f.base + `/api/cms/messages/${own.items[0].id}/read`, { method: 'PATCH', headers })).status, 200);
        assert.ok((await f.store.db.prepare('SELECT read_at FROM cms_messages WHERE id=?').get(own.items[0].id)).read_at);
    }
    finally {
        await f.close();
        f.cleanup();
    }
});
test('admin after MFA enrollment can edit drafts but cannot access root management APIs', async () => {
    const f = await fixture();
    try {
        await f.store.createAdmin('root@example.com', 'Root-Test-Password-4901');
        await f.store.upsertUser('admin@example.com', 'Long-Test-Password-4901', 'admin');
        await f.login();
        assert.equal((await f.call('/api/cms/session')).json.role, 'admin');
        assert.equal((await f.call('/api/cms/workspace?device=mobile')).response.status, 200);
        for (const path of ['/api/cms/users', '/api/cms/history', '/api/cms/preview?version=1']) {
            assert.equal((await f.call(path)).response.status, 403, path);
        }
        assert.equal((await f.call('/api/cms/publish', { method: 'POST', data: { device: 'desktop', revision: 0 } })).response.status, 403);
    }
    finally {
        await f.close();
        f.cleanup();
    }
});
async function fixture() { const dir = mkdtempSync(join(tmpdir(), 'sw-cms-')), app = (await createCmsApp({ dataDir: dir })); await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve)); const base = 'http://127.0.0.1:' + app.server.address().port; let cookie = '', csrf = ''; async function call(path, { method = 'GET', data, raw, withAuth = true, withCsrf = true, origin = base, headers = {} } = {}) { const response = await fetch(base + path, { method, headers: { ...(data ? { 'Content-Type': 'application/json' } : {}), ...(method !== 'GET' && origin !== null ? { Origin: origin } : {}), ...(withAuth && cookie ? { Cookie: cookie } : {}), ...(withCsrf && csrf ? { 'X-CSRF-Token': csrf } : {}), ...headers }, ...(data ? { body: JSON.stringify(data) } : raw ? { body: raw } : {}) }); const json = String(response.headers.get('content-type')).includes('application/json') ? await response.json() : null; return { response, json }; } async function login() { const r = await call('/api/cms/login', { method: 'POST', data: { email: 'admin@example.com', password: 'Long-Test-Password-4901' } }); assert.equal(r.response.status, 200); cookie = r.response.headers.get('set-cookie').split(';')[0]; csrf = r.json.csrf;if(r.json.mfaEnrollmentRequired)await enrollEditor(base,{Cookie:cookie,'X-CSRF-Token':csrf,Origin:base,'Content-Type':'application/json'}); assert.match(r.response.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/); } async function close() { await new Promise(r => app.server.close(r)); (await app.store.close()); } return { ...app, dir, base, call, login, close, cleanup: () => rmSync(dir, { recursive: true, force: true }) }; }
test('authentication, CSRF, persistent publish, preview and rollback stay isolated', async () => {
    const f = await fixture();
    try {
        assert.equal((await f.call('/api/cms/workspace')).response.status, 401);
        assert.equal((await f.call('/api/cms/preview')).response.status, 401);
        assert.equal((await f.call('/api/content')).json.entries.length, 0);
        await f.store.createAdmin('admin@example.com', 'Long-Test-Password-4901');
        assert.equal((await f.store.db.prepare('SELECT password FROM admin').get()).password.includes('Long-Test'), false);
        assert.equal((await f.call('/api/cms/login', { method: 'POST', data: { email: 'admin@example.com', password: 'invalid-password' }, origin: 'https://evil.example' })).response.status, 403);
        await f.login();
        const field = f.store.catalog.fields.find(v => v.id === 'data.aboutCompany.headline');
        const draft = { [field.id]: { tr: 'Güncel kurumsal başlık', en: 'Updated company headline' } };
        assert.equal((await f.call('/api/cms/draft', { method: 'PUT', withCsrf: false, data: { revision: 0, values: draft } })).response.status, 403);
        let r = await f.call('/api/cms/draft', { method: 'PUT', data: { revision: 0, values: draft } });
        assert.equal(r.response.status, 200);
        assert.equal(r.json.revision, 1);
        assert.equal((await f.call('/api/content')).json.entries.length, 0);
        assert.equal((await f.call('/api/cms/preview')).json.entries[0].tr, 'Güncel kurumsal başlık');
        assert.equal((await f.call('/api/cms/draft', { method: 'PUT', data: { revision: 0, values: {} } })).response.status, 409);
        assert.equal((await f.call('/api/cms/publish', { method: 'POST', origin: 'https://evil.example', data: { revision: 1 } })).response.status, 403);
        r = await f.call('/api/cms/publish', { method: 'POST', data: { revision: 1, note: 'İlk yayın' } });
        assert.equal(r.json.version, 1);
        assert.equal((await f.call('/api/content', { withAuth: false })).json.entries[0].en, 'Updated company headline');
        r = await f.call('/api/cms/restore', { method: 'POST', data: { revision: 2, version: 0 } });
        assert.equal(r.response.status, 200);
        assert.deepEqual(r.json.values, {});
        assert.equal((await f.call('/api/content')).json.entries.length, 1);
        assert.equal((await f.call('/api/cms/preview')).json.entries.length, 0);
        r = await f.call('/api/cms/publish', { method: 'POST', data: { revision: 3, note: 'Başlangıca dönüş' } });
        assert.equal(r.json.version, 2);
        assert.equal((await f.call('/api/content')).json.entries.length, 0);
        assert.equal((await f.call('/api/cms/history')).json.items.length, 3);
        await f.call('/api/cms/logout', { method: 'POST' });
        assert.equal((await f.call('/api/cms/workspace')).response.status, 401);
        await f.close();
        const reopened = (await openStore(f.dir));
        assert.equal((await reopened.state()).version, 2);
        assert.equal((await reopened.state()).revision, 4);
        assert.equal((await reopened.db.prepare('SELECT count(*) AS count FROM history').get()).count, 3);
        (await reopened.close());
    }
    finally {
        if (f.server.listening)
            await f.close();
        f.cleanup();
    }
});
test('uploads require auth, reject SVG and unsafe URLs, persist and serve real image bytes', async () => {
    const f = await fixture();
    try {
        await f.store.createAdmin('admin@example.com', 'Long-Test-Password-4901');
        await f.login();
        const bytes = readFileSync('public/assets/about-mobile.png');
        let r = await f.call('/api/cms/media', { method: 'POST', raw: bytes, withAuth: false });
        assert.equal(r.response.status, 401);
        r = await f.call('/api/cms/media', { method: 'POST', raw: Buffer.from('<svg onload="alert(1)"/>') });
        assert.equal(r.response.status, 415);
        r = await f.call('/api/cms/media', { method: 'POST', raw: bytes, headers: { 'X-File-Name': 'sample.png' } });
        assert.equal(r.response.status, 201);
        assert.match(r.json.url, /^\/uploads\/[a-f0-9]+\.png$/);
        const image = r.json;
        const served = await fetch(f.base + image.url);
        assert.equal(served.headers.get('content-type'), 'image/png');
        assert.deepEqual(Buffer.from(await served.arrayBuffer()), bytes);
        assert.equal((await f.call('/api/cms/media')).json.items.length, 1);
        const field = 'data.aboutCompany.image';
        assert.equal((await f.call('/api/cms/draft', { method: 'PUT', data: { revision: 0, values: { [field]: { tr: 'javascript:alert(1)', en: 'x' } } } })).response.status, 400);
        assert.equal((await f.call('/api/cms/draft', { method: 'PUT', data: { revision: 0, values: { 'data.contact.mapEmbed': { tr: 'https://evil.example', en: 'https://evil.example' } } } })).response.status, 400);
        assert.equal((await f.call('/api/cms/draft', { method: 'PUT', data: { revision: 0, values: { 'data.products.0.slug': { tr: 'bad', en: 'bad' } } } })).response.status, 400);
        r = await f.call('/api/cms/draft', { method: 'PUT', data: { revision: 0, values: { [field]: { tr: image.url, en: image.url } } } });
        assert.equal(r.response.status, 200);
        await f.call('/api/cms/publish', { method: 'POST', data: { revision: r.json.revision } });
        assert.equal((await f.call('/api/content', { withAuth: false })).json.entries[0].tr, image.url);
    }
    finally {
        await f.close();
        f.cleanup();
    }
});
test('login throttling and API errors never expose private data', async () => {
    const f = await fixture();
    try {
        for (let i = 0; i < 8; i++) {
            const r = await f.call('/api/cms/login', { method: 'POST', data: { email: 'missing@example.com', password: 'wrong' } });
            assert.equal(r.response.status, 401);
        }
        const r = await f.call('/api/cms/login', { method: 'POST', data: { email: 'missing@example.com', password: 'wrong' } });
        assert.equal(r.response.status, 429);
        assert.equal(r.response.headers.get('retry-after'), '900');
        const api = await f.call('/api/cms/workspace');
        assert.equal(api.response.headers.get('cache-control'), 'no-store');
        assert.equal(JSON.stringify(api.json).includes('password'), false);
    }
    finally {
        await f.close();
        f.cleanup();
    }
});
test('production routes serve admin HTML and preserve range delivery for scene assets', async () => {
    const f = await fixture();
    try {
        const admin = await fetch(f.base + '/admin');
        assert.equal(admin.status, 200);
        assert.match(admin.headers.get('content-type'), /text\/html/);
        assert.match(admin.headers.get('x-robots-tag'), /noindex/);
        assert.match(admin.headers.get('content-security-policy'), /frame-ancestors 'none'/);
        const image = await fetch(f.base + '/assets/about-mobile.png', { headers: { Range: 'bytes=0-15' } });
        assert.equal(image.status, 206);
        assert.equal((await image.arrayBuffer()).byteLength, 16);
        assert.equal((await fetch(f.base + '/server/catalog.json')).status, 404);
        assert.equal((await fetch(f.base + '/data/cms.sqlite')).status, 404);
    }
    finally {
        await f.close();
        f.cleanup();
    }
});
test('login works when Origin is omitted but Referer proves the same local site', async () => {
    const f = await fixture();
    try {
        await f.store.createAdmin('admin@example.com', 'Long-Test-Password-4901');
        const r = await f.call('/api/cms/login', { method: 'POST', origin: null, headers: { Referer: f.base + '/admin' }, data: { email: 'admin@example.com', password: 'Long-Test-Password-4901' } });
        assert.equal(r.response.status, 200);
        assert.equal(r.json.authenticated, true);
        assert.ok(r.json.csrf);
    }
    finally {
        await f.close();
        f.cleanup();
    }
});
test('existing scene copy edits and historical versions migrate to the new scene fields', async () => {
    const f = await fixture();
    try {
        const field = f.store.catalog.fields.find(v => v.id === 'data.fieldJourney.6.title');
        assert.ok(field.legacyId);
        const old = { [field.legacyId]: { tr: 'Önceden kaydedilmiş şehir başlığı', en: 'Previously saved city title' } };
        (await f.store.db.prepare('UPDATE content SET draft=?,published=? WHERE id=1').run(JSON.stringify(old), JSON.stringify(old)));
        (await f.store.db.prepare('INSERT INTO history VALUES(1,?,?,?,?)').run(new Date().toISOString(), 'admin@example.com', 'Eski kayıt', JSON.stringify(old)));
        const state = (await f.store.state());
        assert.equal(state.values[field.id].tr, old[field.legacyId].tr);
        assert.equal(state.published[field.id].en, old[field.legacyId].en);
        assert.equal(f.store.payload(state.published, 1).entries.find(v => v.id === field.id).tr, old[field.legacyId].tr);
        (await f.store.save(0, {}));
        const restored = (await f.store.restore(1, 1));
        assert.equal(restored.values[field.id].tr, old[field.legacyId].tr);
    }
    finally {
        await f.close();
        f.cleanup();
    }
});
test('collection CRUD stays draft-only until publish and deleted media respects retained history', async () => {
    const f = await fixture();
    try {
        await f.store.createAdmin('admin@example.com', 'Long-Test-Password-4901');
        await f.login();
        const workspace = (await f.call('/api/cms/workspace')).json, collections = structuredClone(workspace.collections);
        const bytes = readFileSync('public/assets/about-mobile.png');
        const upload = (await f.call('/api/cms/media', { method: 'POST', raw: bytes, headers: { 'X-File-Name': 'hardware.png' } })).json;
        const product = { ...structuredClone(collections.products[0]), slug: 's5000-test', code: 'S5000-TEST', name: 'Yeni donanım', image: upload.url };
        product.en.name = 'New hardware';
        collections.products.push(product);
        const solution = { ...structuredClone(collections.solutions[0]), slug: 'yeni-cozum', title: 'Yeni çözüm' };
        solution.en.title = 'New solution';
        collections.solutions.push(solution);
        const plan = { ...structuredClone(collections.plans[0]), id: 'yeni-plan', name: 'Yeni paket' };
        plan.en.name = 'New plan';
        collections.plans.push(plan);
        let r = await f.call('/api/cms/draft', { method: 'PUT', data: { revision: workspace.revision, values: workspace.values, collections } });
        assert.equal(r.response.status, 200, JSON.stringify(r.json));
        assert.equal((await f.call('/api/content')).json.collections.products.length, 3);
        assert.equal((await f.call('/api/cms/preview')).json.collections.products.at(-1).slug, 's5000-test');
        const duplicate = structuredClone(r.json.collections);
        duplicate.products.push(structuredClone(duplicate.products[0]));
        assert.equal((await f.call('/api/cms/draft', { method: 'PUT', data: { revision: r.json.revision, values: r.json.values, collections: duplicate } })).response.status, 400);
        r = await f.call('/api/cms/publish', { method: 'POST', data: { revision: r.json.revision } });
        assert.equal(r.response.status, 200);
        const published = (await f.call('/api/content', { withAuth: false })).json;
        assert.equal(published.collections.products.at(-1).image, upload.url);
        assert.equal(published.collections.solutions.at(-1).slug, 'yeni-cozum');
        assert.equal(published.collections.plans.at(-1).id, 'yeni-plan');
        const retained = await f.call('/api/cms/media/' + upload.id, { method: 'DELETE' });
        assert.equal(retained.response.status, 200);
        assert.equal(retained.json.retained, true);
        assert.equal((await f.call('/api/cms/media')).json.items.length, 0);
        assert.equal((await fetch(f.base + upload.url)).status, 200);
        const unused = (await f.call('/api/cms/media', { method: 'POST', raw: bytes })).json;
        assert.equal((await f.call('/api/cms/media/' + unused.id, { method: 'DELETE' })).json.retained, false);
        assert.equal((await fetch(f.base + unused.url)).status, 404);
        const next = structuredClone(r.json.collections);
        next.products = next.products.filter(p => p.slug !== 's5000-test');
        next.solutions = [];
        next.plans = next.plans.slice(1);
        r = await f.call('/api/cms/draft', { method: 'PUT', data: { revision: r.json.revision, values: r.json.values, collections: next } });
        assert.equal(r.response.status, 200);
        assert.equal((await f.call('/api/content')).json.collections.products.length, 4);
        r = await f.call('/api/cms/publish', { method: 'POST', data: { revision: r.json.revision } });
        assert.equal((await f.call('/api/content')).json.collections.products.length, 3);
        assert.equal((await f.call('/api/content')).json.collections.solutions.length, 0);
        r = await f.call('/api/cms/restore', { method: 'POST', data: { revision: r.json.revision, version: 1 } });
        assert.equal(r.response.status, 200);
        assert.equal(r.json.collections.products.length, 4);
        assert.equal(r.json.publishedCollections.products.length, 3);
    }
    finally {
        await f.close();
        f.cleanup();
    }
});
test('only authenticated visual previews allow same-origin frames; admin remains unframeable', async () => {
    const f = await fixture();
    try {
        let r = await f.call('/?cms-preview=1&cms-edit=1', { withAuth: false });
        assert.equal(r.response.headers.get('x-frame-options'), 'DENY');
        await f.store.createAdmin('admin@example.com', 'Long-Test-Password-4901');
        await f.login();
        r = await f.call('/?cms-preview=1&cms-edit=1');
        assert.equal(r.response.status, 200);
        assert.equal(r.response.headers.get('x-frame-options'), 'SAMEORIGIN');
        assert.match(r.response.headers.get('content-security-policy'), /frame-ancestors 'self'/);
        assert.match(r.response.headers.get('cache-control'), /no-store/);
        r = await f.call('/admin');
        assert.equal(r.response.headers.get('x-frame-options'), 'DENY');
        assert.match(r.response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
        r = await f.call('/');
        assert.equal(r.response.headers.get('x-frame-options'), 'DENY');
    }
    finally {
        await f.close();
        f.cleanup();
    }
});
test('design settings validate, remain private until publish and restore through history', async () => {
    const f = await fixture();
    try {
        await f.store.createAdmin('admin@example.com', 'Long-Test-Password-4901');
        await f.login();
        const { emptyDesign, designKey } = await import('../shared/design.mjs');
        const design = emptyDesign(), selector = '#main > section:nth-of-type(1) > h2:nth-of-type(1)', key = designKey('/', selector);
        design.palette.dark.accent = '#ff8800';
        design.elements[key] = { page: '/', selector, label: 'Başlık', kind: 'text', desktop: { fontSize: 48, x: 12 }, mobile: { fontSize: 24 } };
        design.homeOrder.reverse();
        let r = await f.call('/api/cms/draft', { method: 'PUT', data: { revision: 0, values: {}, design } });
        assert.equal(r.response.status, 200, JSON.stringify(r.json));
        assert.equal((await f.call('/api/content')).json.design.palette.dark.accent, undefined);
        assert.deepEqual((await f.call('/api/cms/preview')).json.design, design);
        for (const mutation of [d => d.elements[key].desktop.fontSize = 999, d => d.palette.dark.accent = 'red;display:none', d => d.elements[key].selector = 'body', d => d.homeOrder = ['hardware', 'hardware', 'hardware', 'hardware']]) {
            const bad = structuredClone(design);
            mutation(bad);
            assert.equal((await f.call('/api/cms/draft', { method: 'PUT', data: { revision: r.json.revision, values: {}, design: bad } })).response.status, 400);
        }
        r = await f.call('/api/cms/draft', { method: 'PUT', data: { revision: r.json.revision, values: {} } });
        assert.deepEqual(r.json.design, design);
        r = await f.call('/api/cms/publish', { method: 'POST', data: { revision: r.json.revision } });
        assert.equal(r.response.status, 200);
        assert.deepEqual((await f.call('/api/content')).json.design, design);
        r = await f.call('/api/cms/restore', { method: 'POST', data: { revision: r.json.revision, version: 0 } });
        assert.equal(r.response.status, 200);
        assert.deepEqual(r.json.design, emptyDesign());
        assert.deepEqual((await f.call('/api/content')).json.design, design);
    }
    finally {
        await f.close();
        f.cleanup();
    }
});
test('mobile and desktop isolate copy, images, records, palettes, order and publication', async () => {
    const f = await fixture();
    try {
        await f.store.createAdmin('admin@example.com', 'Long-Test-Password-4901');
        await f.login();
        let w = (await f.call('/api/cms/workspace?device=mobile')).json;
        assert.equal(w.device, 'mobile');
        const beforeDesktop = (await f.call('/api/cms/workspace?device=desktop')).json;
        const field = 'data.aboutCompany.headline', image = 'data.aboutCompany.image', collections = structuredClone(w.collections), design = structuredClone(w.design);
        collections.products[0].name = 'Mobil cihaz';
        design.palette.light.accent = '#123456';
        design.homeOrder.reverse();
        const values = { ...w.values, [field]: { tr: 'Mobil başlık', en: 'Mobile headline' }, [image]: { tr: '/assets/scadawatt-logo.png', en: '/assets/scadawatt-logo.png' } };
        let r = await f.call('/api/cms/draft', { method: 'PUT', data: { device: 'mobile', revision: w.revision, values, collections, design } });
        assert.equal(r.response.status, 200, JSON.stringify(r.json));
        const desktop = (await f.call('/api/cms/workspace?device=desktop')).json;
        assert.deepEqual(desktop.values, beforeDesktop.values);
        assert.deepEqual(desktop.collections, beforeDesktop.collections);
        assert.deepEqual(desktop.design, beforeDesktop.design);
        let content = (await f.call('/api/content')).json;
        assert.notEqual(content.variants.mobile.entries.find(e => e.id === field).tr, 'Mobil başlık');
        r = await f.call('/api/cms/publish', { method: 'POST', data: { device: 'mobile', revision: r.json.revision } });
        assert.equal(r.response.status, 200);
        const mobileVersion = r.json.version;
        content = (await f.call('/api/content')).json;
        assert.equal(content.variants.mobile.entries.find(e => e.id === field).tr, 'Mobil başlık');
        assert.notEqual(content.variants.desktop.entries.find(e => e.id === field).tr, 'Mobil başlık');
        assert.equal(content.variants.desktop.design.palette.light.accent, undefined);
        assert.equal(content.variants.mobile.design.palette.light.accent, '#123456');
        assert.equal(content.variants.mobile.entries.find(e => e.id === image).tr, '/assets/scadawatt-logo.png');
        assert.notEqual(content.variants.desktop.entries.find(e => e.id === image).tr, '/assets/scadawatt-logo.png');
        assert.equal(content.variants.mobile.collections.products[0].name, 'Mobil cihaz');
        assert.notEqual(content.variants.desktop.collections.products[0].name, 'Mobil cihaz');
        w = (await f.call('/api/cms/workspace?device=desktop')).json;
        r = await f.call('/api/cms/draft', { method: 'PUT', data: { device: 'desktop', revision: w.revision, values: { [field]: { tr: 'Masaüstü başlık', en: 'Desktop headline' } } } });
        assert.equal(r.response.status, 200);
        r = await f.call('/api/cms/publish', { method: 'POST', data: { device: 'desktop', revision: r.json.revision } });
        assert.equal(r.response.status, 200);
        content = (await f.call('/api/content')).json;
        assert.equal(content.variants.mobile.entries.find(e => e.id === field).tr, 'Mobil başlık');
        assert.equal(content.variants.desktop.entries.find(e => e.id === field).tr, 'Masaüstü başlık');
        r = await f.call('/api/cms/restore', { method: 'POST', data: { device: 'mobile', revision: r.json.revision, version: 0 } });
        assert.equal(r.response.status, 200);
        assert.deepEqual(r.json.values, {});
        assert.equal((await f.store.state('desktop')).values[field].tr, 'Masaüstü başlık');
        assert.equal((await f.store.state('mobile')).published[field].tr, 'Mobil başlık');
        assert.equal((await f.call('/api/cms/preview?device=desktop')).json.entries.find(e => e.id === field).tr, 'Masaüstü başlık');
        assert.equal((await f.call('/api/cms/workspace?device=evil')).response.status, 400);
    }
    finally {
        await f.close();
        f.cleanup();
    }
});
test('word formatting persists by language and device and never styles the enclosing paragraph', async () => {
    const f = await fixture();
    try {
        await f.store.createAdmin('admin@example.com', 'Long-Test-Password-4901');
        await f.login();
        const { emptyDesign, designKey } = await import('../shared/design.mjs');
        const d = emptyDesign(), selector = '#main > main:nth-of-type(1) > h1:nth-of-type(1)', fragment = { start: 7, end: 13, text: 'enerji', language: 'tr' }, key = designKey('/hakkimizda', selector, fragment);
        d.elements[key] = { page: '/hakkimizda', selector, label: 'enerji', kind: 'text', fragment, desktop: { color: '#ff5500', fontWeight: 700, fontStyle: 'italic' }, mobile: {} };
        let r = await f.call('/api/cms/draft', { method: 'PUT', data: { device: 'desktop', revision: 0, values: {}, design: d } });
        assert.equal(r.response.status, 200, JSON.stringify(r.json));
        r = await f.call('/api/cms/publish', { method: 'POST', data: { device: 'desktop', revision: r.json.revision } });
        assert.equal(r.response.status, 200);
        const content = (await f.call('/api/content')).json;
        assert.deepEqual(content.variants.desktop.design.elements[key].fragment, fragment);
        assert.equal(content.variants.mobile.design.elements[key], undefined);
        const invalid = structuredClone(d);
        invalid.elements[key].fragment.end = 99999;
        assert.equal((await f.call('/api/cms/draft', { method: 'PUT', data: { device: 'desktop', revision: r.json.revision, values: {}, design: invalid } })).response.status, 400);
    }
    finally {
        await f.close();
        f.cleanup();
    }
});
test('admin approval snapshot stays unpublished until root approves it', async () => {
    const f = await fixture();
    try {
        await f.store.createAdmin('root@example.com', 'Long-Test-Password-4901');
        const field = f.store.catalog.fields.find(v => v.id === 'data.aboutCompany.headline');
        (await f.store.save(0, { [field.id]: { tr: 'Root onayı bekleyen başlık', en: 'Headline awaiting root' } }, undefined, undefined, 'desktop'));
        const request = (await f.store.createApproval('desktop', 'editor@example.com', 'Başlık güncellendi'));
        assert.equal(request.status, 'pending');
        assert.notEqual((await f.store.state('desktop')).published[field.id]?.tr, 'Root onayı bekleyen başlık');
        (await f.store.reviewApproval(request.id, 'approved', 'Uygun', 'root@example.com'));
        assert.equal((await f.store.state('desktop')).published[field.id].tr, 'Root onayı bekleyen başlık');
        assert.equal((await f.store.db.prepare('SELECT status FROM approval_requests WHERE id=?').get(request.id)).status, 'approved');
    }
    finally {
        await f.close();
        f.cleanup();
    }
});
test('preview comparisons stay authenticated and use the selected approval snapshot', async () => {
    const f = await fixture();
    try {
        assert.equal((await f.call('/api/cms/preview?device=desktop', { withAuth: false })).response.status, 401);
        await f.store.createAdmin('admin@example.com', 'Long-Test-Password-4901');
        await f.login();
        const field = f.store.catalog.fields.find(v => v.kind === 'text' && !v.retired).id;
        (await f.store.save(0, { [field]: { tr: 'Yeni inceleme metni', en: 'New review copy' } }, undefined, undefined, 'desktop'));
        const preview = (await f.call('/api/cms/preview?device=desktop')).json;
        assert.equal(preview.review.device, 'desktop');
        assert.equal(preview.review.values[field].tr, 'Yeni inceleme metni');
        assert.equal(preview.review.published[field], undefined);
        assert.equal(Object.hasOwn((await f.call('/api/content')).json, 'review'), false);
        const approval = (await f.store.createApproval('desktop', 'admin@test.local', 'İncelenecek'));
        (await f.store.save((await f.store.state('desktop')).revision, { [field]: { tr: 'Sonraki taslak', en: 'Later draft' } }, undefined, undefined, 'desktop'));
        const snapshot = (await f.call('/api/cms/preview?approval=' + approval.id)).json;
        assert.equal(snapshot.review.values[field].tr, 'Yeni inceleme metni');
        assert.equal(snapshot.review.device, 'desktop');
    }
    finally {
        await f.close();
    }
});
test('configurator definitions validate, remain device-specific and only become public after root publication', async () => {
    const { CONFIGURATOR_FIELD, defaultConfigurator } = await import('../shared/configurator.mjs');
    const f = await fixture();
    try {
        await f.store.createAdmin('admin@example.com', 'Long-Test-Password-4901');
        await f.login();
        const schema = structuredClone(defaultConfigurator);
        schema.questions[0].type = 'multi';
        schema.questions[0].defaultValue = [];
        schema.questions[0].required = false;
        for (let i = 0; i < 35; i++)
            schema.questions.push({ id: 'custom' + i, section: 'facility', label: { tr: 'Özel soru ' + i, en: 'Custom question ' + i }, help: { tr: 'Açıklama '.repeat(20), en: 'Description '.repeat(20) }, type: 'text', enabled: true, required: false, defaultValue: '', options: [] });
        const text = JSON.stringify(schema);
        assert.ok(text.length > 12000);
        let response = await f.call('/api/cms/draft', { method: 'PUT', data: { device: 'mobile', revision: 0, values: { [CONFIGURATOR_FIELD]: { tr: text, en: text } } } });
        assert.equal(response.response.status, 200, JSON.stringify(response.json));
        assert.equal((await f.store.state('desktop')).values[CONFIGURATOR_FIELD], undefined);
        const before = (await f.call('/api/content')).json;
        assert.equal(JSON.parse(before.variants.mobile.entries.find(e => e.id === CONFIGURATOR_FIELD).tr).questions[0].type, 'single');
        const published = await f.call('/api/cms/publish', { method: 'POST', data: { device: 'mobile', revision: response.json.revision, note: 'Yapılandırıcı' } });
        assert.equal(published.response.status, 200, JSON.stringify(published.json));
        const publicData = (await f.call('/api/content')).json;
        const entry = publicData.variants.mobile.entries.find(e => e.id === CONFIGURATOR_FIELD);
        assert.equal(JSON.parse(entry.tr).questions[0].type, 'multi');
        assert.equal(JSON.parse(publicData.variants.desktop.entries.find(e => e.id === CONFIGURATOR_FIELD).tr).questions[0].type, 'single');
        const bad = structuredClone(schema);
        bad.questions[1].id = bad.questions[0].id;
        const raw = JSON.stringify(bad);
        response = await f.call('/api/cms/draft', { method: 'PUT', data: { device: 'mobile', revision: published.json.revision, values: { [CONFIGURATOR_FIELD]: { tr: raw, en: raw } } } });
        assert.equal(response.response.status, 400);
    }
    finally {
        await f.close();
    }
});
