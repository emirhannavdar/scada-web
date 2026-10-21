import {Link} from '@tanstack/react-router';
import {CmsImage} from '@/components/site/CmsImage';
import {translate as _tx,useLocale as _useLocale} from '@/lib/i18n';
import { useId, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, ArrowRight, Search } from 'lucide-react';
import { products, productSpecifications, type Product } from '@/content/site';
import { useExperience } from './ExperienceContext';
/** A single detail surface, regardless of catalogue size. Stable slugs own selection. */
export function ProductTheatre({ items = products }: {
    items?: Product[];
}) {
    _useLocale();
    const { reduced } = useExperience(), id = useId();
    const [selected, setSelected] = useState(items[0]?.slug ?? ''), [query, setQuery] = useState('');
    const filtered = items.filter(p => `${p.code} ${p.name} ${_tx(p.role)} ${_tx(p.tagline)} ${p.role}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
    const product = filtered.find(p => p.slug === selected) ?? filtered[0];
    if(!items.length)return null;
    return <section data-cms-section="hardware" data-cms-collection="products" className="product-experience" id="donanim" aria-labelledby={`${id}-title`}><div className="film-wrap"><header className="product-experience-heading"><p className="film-label"><span />{_tx("SCADAWATT DONANIM A\u0130LES\u0130")}</p><h2 id={`${id}-title`}>{_tx("Her g\u00F6revin")}<br /><em>{_tx("bir donan\u0131m\u0131 var.")}</em></h2><p>{_tx("Saha verisini toplayan, kontrol\u00FC sa\u011Flayan ve sistemi koruyan teknolojiyi yak\u0131ndan tan\u0131y\u0131n.")}</p></header>
 <div className="hardware-catalogue" data-product-count={items.length}>
 <div className="hardware-index"><div className="hardware-index-heading"><span>{_tx("DONANIMLAR")}</span><span>{_tx(String(items.length).padStart(2, '0'))}</span></div>
 {_tx(items.length > 8 && <label className="hardware-search"><Search size={15}/><input aria-label={_tx("Cihaz ara")} type="search" placeholder={_tx("Cihaz ara")} value={query} onChange={e => setQuery(e.target.value)}/></label>)}
 <div className="hardware-list" role="group" aria-label={_tx("Donan\u0131m se\u00E7imi")}>{_tx(filtered.map((p, i) => <button data-cms-record={p.slug} key={p.slug} className="hardware-row" aria-pressed={product?.slug === p.slug} aria-controls={`${id}-detail`} onMouseEnter={() => setSelected(p.slug)} onFocus={() => setSelected(p.slug)} onClick={() => setSelected(p.slug)}><span className="hardware-number">{_tx(String(i + 1).padStart(2, '0'))}</span><CmsImage src={p.image} alt={_tx("")} width="100" height="100" loading="lazy"/><span className="hardware-row-label"><small>{_tx(p.role)}</small><strong>{_tx(p.code)}</strong><span>{_tx(p.tagline)}</span></span><ArrowUpRight size={18}/></button>))}</div>
 {_tx(!filtered.length && <p className="hardware-empty">{_tx("Bu aramayla e\u015Fle\u015Fen cihaz bulunamad\u0131.")}</p>)}
 </div>
 <div className="hardware-preview-shell">{_tx(product && <div data-cms-record={product.slug} id={`${id}-detail`} role="region" aria-label={_tx(`${product.code} ${_tx("ürün bilgileri")}`)} className="hardware-preview" key={product.slug}>
 <div className="hardware-preview-top"><span>{_tx("SAHAYA UYGUN TEKNOLOJ\u0130")}</span><span>{_tx(product.code)}</span></div>
 <motion.figure className="hardware-photo" initial={reduced ? false : { opacity: 0, x: -60, scale: .72, rotate: 0, rotateY: 0 }} animate={{ opacity: 1, x: 0, scale: 1, rotate: -8, rotateY: 14 }} transition={{ duration: reduced ? 0 : .8, ease: [.22, 1, .36, 1] }}><CmsImage src={product.image} alt={_tx(`${product.code} ${_tx("gerçek ürün fotoğrafı")}`)} width="900" height="900" loading="lazy"/></motion.figure>
 <motion.div className="hardware-story" initial={reduced ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .45, delay: reduced ? 0 : .12 }}><p className="hardware-role">{_tx(product.role)}</p><h3>{_tx(product.code)}</h3><p className="hardware-tagline">{_tx(product.tagline)}</p><p className="hardware-summary">{_tx(product.summary)}</p><dl>{_tx((productSpecifications[product.slug] ?? []).slice(0, 3).map(s => <div key={s.name}><dt>{_tx(s.name)}</dt><dd>{_tx(s.value)}</dd></div>))}</dl><Link to="/urunler/$slug" params={{slug:product.slug}}>{_tx("Donan\u0131m\u0131 inceleyin ")}<ArrowRight size={18}/></Link></motion.div>
 </div>)}</div>
 </div></div></section>;
}
