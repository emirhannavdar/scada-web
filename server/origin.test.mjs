import { test } from 'node:test';
import assert from 'node:assert/strict';
import { originPolicy } from './origin.mjs';
const req = (headers) => ({ headers: { host: '127.0.0.1:5188', ...headers }, socket: { encrypted: false } });
test('accepts the actual local site, normalises slash and accepts same-port loopback aliases', () => { assert.equal(originPolicy(req({ origin: 'http://127.0.0.1:5188' })).accepted, true); assert.equal(originPolicy(req({ origin: 'http://localhost:5188' }), ' http://127.0.0.1:5188/ ').accepted, true); assert.equal(originPolicy(req({ origin: 'http://[::1]:5188' })).accepted, true); assert.equal(originPolicy(req({ origin: 'http://localhost:5189' })).accepted, false); });
test('handles omitted Origin only when the browser supplies same-origin evidence', () => { assert.equal(originPolicy(req({ referer: 'http://127.0.0.1:5188/admin' })).accepted, true); assert.equal(originPolicy(req({ 'sec-fetch-site': 'same-origin', 'x-scadawatt-request': 'cms' })).accepted, true); assert.equal(originPolicy(req({ 'x-scadawatt-request': 'cms' })).accepted, false); assert.equal(originPolicy(req({})).accepted, false); assert.equal(originPolicy(req({ referer: 'https://evil.example/admin', 'sec-fetch-site': 'same-origin', 'x-scadawatt-request': 'cms' })).accepted, false); });
test('does not bypass explicit foreign/null Origin or cross-site browser metadata', () => {
    for (const origin of ['https://evil.example', 'null', 'http://localhost:5188.evil.example']) {
        assert.equal(originPolicy(req({ origin, referer: 'http://127.0.0.1:5188/admin', 'sec-fetch-site': 'same-origin', 'x-scadawatt-request': 'cms' })).accepted, false);
    }
    assert.equal(originPolicy(req({ origin: 'http://localhost:5188', 'sec-fetch-site': 'cross-site' })).accepted, false);
});
test('keeps production HTTPS origin exact and never trusts forwarded headers by default', () => { assert.equal(originPolicy(req({ origin: 'https://www.scadawatt.com' }), 'https://www.scadawatt.com/').accepted, true); assert.equal(originPolicy(req({ origin: 'http://localhost:5188' }), 'https://www.scadawatt.com').accepted, false); assert.equal(originPolicy(req({ origin: 'https://evil.example', 'x-forwarded-host': 'evil.example', 'x-forwarded-proto': 'https' })).accepted, false); });
