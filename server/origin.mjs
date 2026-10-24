/** Verify browser origin without treating every omitted Origin as a cross-site request. */
function parseOrigin(value, { referrer = false } = {}) {
    if (typeof value !== 'string' || !value.trim() || value === 'null')
        return null;
    try {
        const u = new URL(value.trim());
        if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password)
            return null;
        if (!referrer && (u.search || u.hash || u.pathname !== '/'))
            return null;
        return u.origin;
    }
    catch {
        return null;
    }
}
const loopback = new Set(['localhost', '127.0.0.1', '[::1]']);
export function originPolicy(req, configured = '') {
    const expected = parseOrigin(configured.trim() || `${req.socket?.encrypted ? 'https' : 'http'}://${req.headers.host}`);
    if (!expected)
        throw Error('CMS_ORIGIN geçerli bir http(s) kökeni olmalı; örn. http://localhost:5188');
    const allowed = new Set([expected]), base = new URL(expected);
    // Loopback aliases are equivalent only in local HTTP development, at the same port.
    if (base.protocol === 'http:' && loopback.has(base.hostname))
        for (const host of loopback)
            allowed.add(`http://${host}${base.port ? ':' + base.port : ''}`);
    const fetchSite = req.headers['sec-fetch-site'], supplied = req.headers.origin, actual = parseOrigin(supplied), referer = parseOrigin(req.headers.referer, { referrer: true });
    let accepted = false, reason = 'origin-mismatch';
    if (fetchSite === 'cross-site')
        reason = 'cross-site';
    else if (supplied !== undefined) {
        accepted = Boolean(actual && allowed.has(actual));
        reason = accepted ? 'origin' : 'origin-mismatch';
    }
    else if (referer && allowed.has(referer)) {
        accepted = true;
        reason = 'same-origin-referer';
    }
    else if (!referer && fetchSite === 'same-origin' && req.headers['x-scadawatt-request'] === 'cms') {
        accepted = true;
        reason = 'same-origin-fetch-metadata';
    }
    else
        reason = 'missing-origin-proof';
    return { accepted, expected, actual, referer, fetchSite, reason };
}
