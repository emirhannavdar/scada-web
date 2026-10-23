import manifest from './seo-manifest.json' with { type: 'json' };
import { gzipSync, brotliCompressSync } from 'node:zlib';
const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function siteOrigin() {
    try {
        const u = new URL(process.env.SITE_URL || 'https://scadawatt.com');
        return /^https?:$/.test(u.protocol) ? u.origin : 'https://scadawatt.com';
    }
    catch {
        return 'https://scadawatt.com';
    }
}
/** An unset launch flag opens only the canonical public host, never LAN/preview hosts. */
export function siteIndexable(req) {
    const flag = String(process.env.SITE_INDEXABLE || '').trim().toLowerCase();
    if (['0', 'false', 'off'].includes(flag))
        return false;
    if (['1', 'true', 'on'].includes(flag))
        return true;
    if (!req)
        return false;
    try {
        const host = new URL('http://' + String(req.headers.host || '')).hostname.toLowerCase();
        const canonical = new URL(siteOrigin()).hostname.toLowerCase().replace(/^www\./, '');
        if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.includes(':') || /^\d+\.\d+\.\d+\.\d+$/.test(host))
            return false;
        return host === canonical || host === 'www.' + canonical;
    }
    catch {
        return false;
    }
}
export function robotsTxt(req) { return siteIndexable(req) ? 'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /*?*cms-\nSitemap: ' + siteOrigin() + '/sitemap.xml\n' : 'User-agent: *\nDisallow: /\n'; }
export async function publicPages(store) {
    const state = (await store.state('desktop')), p = store.payload(state.published, state.version, state.publishedCollections, state.publishedDesign, true);
    const pages = { ...manifest.pages };
    for (const [kind, prefix] of [['products', '/urunler/'], ['solutions', '/cozumler/']])
        for (const item of p.collections[kind] || [])
            pages[prefix + item.slug] = { title: (item.name || item.title) + ' | ScadaWatt', description: item.summary || item.short || '', image: item.image };
    const contact = { ...manifest.contact }, images = { ...manifest.images };
    for (const e of p.entries)
        if (e.path?.length === 2) {
            if (e.path[0] === 'contact')
                contact[e.path[1]] = e.tr;
            if (e.path[0] === 'images')
                images[e.path[1]] = e.tr;
        }
    return { pages, contact, images };
}
export async function sitemap(store) { return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + Object.keys((await publicPages(store)).pages).filter(path => path !== '/kvkk').map(path => '<url><loc>' + escape(siteOrigin() + path) + '</loc></url>').join('') + '</urlset>'; }
export async function renderPage(html, path, store, privatePage = false, req) {
    const { pages, contact, images } = (await publicPages(store)), page = pages[path], known = Boolean(page) || privatePage;
    const title = page?.title || (privatePage ? 'Yönetim | ScadaWatt' : 'Sayfa bulunamadı | ScadaWatt'), description = page?.description || 'Aradığınız sayfa bulunamadı. ScadaWatt çözümlerini ve donanımlarını keşfedin.';
    const url = siteOrigin() + path, noindex = privatePage || !known || path === '/kvkk' || !siteIndexable(req);
    html = html.replace(/<title>[\s\S]*?<\/title>/, '').replace(/<meta\b[^>]*(?:name=["'](?:description|robots|sw-indexable|sw-origin)["']|property=["']og:[^"']+["'])[^>]*>/gi, '');
    const image = new URL(page?.image || images.wordmark, siteOrigin()).href;
    const graph = [{ '@context': 'https://schema.org', '@type': 'Organization', '@id': siteOrigin() + '/#organization', name: 'ScadaWatt', url: siteOrigin(), logo: new URL(images.wordmark, siteOrigin()).href, email: contact.email, telephone: contact.phone, address: { '@type': 'PostalAddress', streetAddress: contact.address } }];
    if (page && /^\/(urunler|cozumler)\/[^/]+$/.test(path)) {
        const group = path.split('/')[1];
        graph.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Ana sayfa', item: siteOrigin() + '/' }, { '@type': 'ListItem', position: 2, name: group === 'urunler' ? 'Donanımlar' : 'Çözümler', item: siteOrigin() + '/' + group }, { '@type': 'ListItem', position: 3, name: title.replace(' | ScadaWatt', ''), item: url }] });
    }
    const head = '<meta name="sw-indexable" content="' + (siteIndexable(req) ? '1' : '0') + '"><meta name="sw-origin" content="' + escape(siteOrigin()) + '"><title>' + escape(title) + '</title><meta name="description" content="' + escape(description) + '"><meta name="robots" content="' + (noindex ? 'noindex,nofollow' : 'index,follow') + '"><meta property="og:title" content="' + escape(title) + '"><meta property="og:description" content="' + escape(description) + '"><meta property="og:url" content="' + escape(url) + '"><meta property="og:type" content="website"><meta property="og:image" content="' + escape(image) + '"><meta name="twitter:card" content="summary_large_image">' + (known && !privatePage ? '<link rel="canonical" href="' + escape(url) + '">' : '') + (!privatePage && known ? '<script type="application/ld+json" id="site-schema">' + JSON.stringify(graph).replace(/</g, '\\u003c') + '</script>' : '');
    return { html: html.replace('</head>', head + '</head>'), status: known ? 200 : 404, noindex };
}
export function compression(header) {
    const values = String(header || '').split(',').map(v => { const [name, ...params] = v.trim().split(';'); const q = params.find(p => p.trim().startsWith('q=')); return { name: name.toLowerCase(), q: q ? Number(q.trim().slice(2)) : 1 }; }).filter(v => ['br', 'gzip'].includes(v.name) && Number.isFinite(v.q) && v.q > 0 && v.q <= 1);
    values.sort((a, b) => b.q - a.q || (a.name === 'br' ? -1 : 1));
    return values[0]?.name || '';
}
export function sendText(req, res, text, type, status = 200) {
    let body = Buffer.from(text);
    const encoding = compression(req.headers['accept-encoding']);
    res.setHeader('Vary', 'Accept-Encoding');
    res.setHeader('Content-Type', type);
    if (!res.hasHeader('Cache-Control'))
        res.setHeader('Cache-Control', 'no-cache');
    if (encoding === 'br') {
        body = brotliCompressSync(body);
        res.setHeader('Content-Encoding', 'br');
    }
    else if (encoding === 'gzip') {
        body = gzipSync(body);
        res.setHeader('Content-Encoding', 'gzip');
    }
    res.writeHead(status, { 'Content-Length': body.length });
    res.end(req.method === 'HEAD' ? undefined : body);
}
