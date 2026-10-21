import {CmsImage} from '@/components/site/CmsImage';
import {translate as _tx,useLocale as _useLocale} from '@/lib/i18n';
import { useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { AnimatePresence, motion, useIsPresent } from 'motion/react';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { solutions, solutionPresentation, screenGallery } from '@/content/site';
import { useExperience } from './ExperienceContext';
const slugs = ['enerji-yonetimi', 'uzaktan-izleme', 'yenilenebilir-enerji', 'limit-yonetimi', 'kompanzasyon', 'zero-injection'];
export function SolutionExperience() {
    _useLocale();
    const selected = solutions.filter(s=>s.featured===true||(s.featured===undefined&&slugs.includes(s.slug)));
    const [active, setActive] = useState(0);
    const safeActive=Math.min(active,Math.max(0,selected.length-1));
    const { reduced } = useExperience();
    const tabs = useRef<(HTMLButtonElement | null)[]>([]);
    if(!selected.length)return null;
    return <section data-cms-section="solutions" data-cms-collection="solutions" className="solution-editorial" id="cozumler" aria-labelledby="solution-editorial-title"><div className="film-wrap"><header className="solution-editorial-heading"><div><p className="film-label"><span />{_tx("SCADAWATT \u00C7\u00D6Z\u00DCMLER\u0130")}</p><h2 id="solution-editorial-title">{_tx("Teknoloji, i\u015Fletmenin")}<br /><em>{_tx("her noktas\u0131nda.")}</em></h2></div><p>{_tx("Enerji verisini anlamland\u0131r\u0131n. Cihazlar\u0131n\u0131z\u0131 izleyin. \u0130\u015Fletmenizin ihtiyac\u0131na uygun izleme ve kontrol kapsam\u0131n\u0131 ke\u015Ffedin.")}</p></header>
 <div className="solution-editorial-layout"><div className="solution-index"><div className="solution-index-label">{_tx("\u0130HT\u0130YACINIZI SE\u00C7\u0130N ")}<span>{`01 — ${String(selected.length).padStart(2,'0')}`}</span></div><div role="tablist" aria-label={_tx("ScadaWatt \u00E7\u00F6z\u00FCmleri")} aria-orientation="vertical">{_tx(selected.map((s, i) => <button data-cms-record={s.slug} key={s.slug} ref={el => { tabs.current[i] = el; }} role="tab" id={`solution-tab-${s.slug}`} aria-controls="solution-feature" aria-selected={safeActive === i} tabIndex={safeActive === i ? 0 : -1} onClick={() => setActive(i)} onFocus={() => setActive(i)} onKeyDown={e => { let next = safeActive; if (e.key === 'ArrowDown')
        next = (safeActive + 1) % selected.length;
    else if (e.key === 'ArrowUp')
        next = (safeActive - 1 + selected.length) % selected.length;
    else if (e.key === 'Home')
        next = 0;
    else if (e.key === 'End')
        next = selected.length - 1;
    else
        return; e.preventDefault(); setActive(next); tabs.current[next]?.focus(); }}><span>{_tx("0")}{_tx(i + 1)}</span><strong>{_tx(s.title)}</strong><ArrowUpRight size={19}/></button>))}</div><Link to="/cozumler" className="solution-all-link">{_tx("B\u00FCt\u00FCn \u00E7\u00F6z\u00FCmler ")}<ArrowRight size={17}/></Link></div>
 <div className="solution-feature-shell"><AnimatePresence mode="wait" initial={false}><SolutionFeature key={selected[safeActive]!.slug} solution={selected[safeActive]!} index={safeActive} reduced={reduced}/></AnimatePresence></div></div>
 </div></section>;
}
function SolutionFeature({ solution: s, index, reduced }: {
    solution: typeof solutions[number];
    index: number;
    reduced: boolean;
}) {
    _useLocale();
    const present = useIsPresent(), presentation = solutionPresentation[s.slug]??{screenId:screenGallery[0]?.id??'overview-detail',headline:s.title,caption:''}, screen = screenGallery.find(a => a.id === presentation.screenId)??screenGallery[0]!;
    return <motion.article data-cms-record={s.slug} id="solution-feature" role="tabpanel" tabIndex={0} aria-labelledby={`solution-tab-${s.slug}`} aria-hidden={!present} inert={!present} className="solution-feature" initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: reduced ? 0 : .23 }}>
 <div className="solution-feature-title"><span className="solution-edition">{_tx("0")}{_tx(index + 1)}{_tx(" / \u00C7\u00D6Z\u00DCM ODA\u011EI")}</span><h3>{_tx(s.headline||presentation.headline)}</h3><p>{_tx(s.short)}</p></div>
 <figure className="solution-app-view"><div className="solution-app-bar"><span><i />{_tx("SCADAWATT")}</span><span>{_tx(screen.title)} <ArrowUpRight size={12}/></span></div><CmsImage src={s.image||`/assets/screens/${screen.id}.webp`} alt={_tx(`ScadaWatt ${screen.title.toLocaleLowerCase('tr-TR')} uygulama ekranı`)} width="1440" height="810" loading="lazy"/><figcaption>{_tx(s.caption??presentation.caption)}</figcaption></figure>
 <div className="solution-feature-bottom"><p>{_tx(s.body[0])}</p><ul>{_tx(s.points.slice(0, 3).map((point, i) => <li key={point}><span>{_tx("0")}{_tx(i + 1)}</span>{_tx(point)}</li>))}</ul></div>
 <Link to="/cozumler/$slug" params={{ slug: s.slug }} className="solution-feature-link">{_tx("\u00C7\u00F6z\u00FCm\u00FC inceleyin ")}<ArrowRight size={18}/></Link>
 </motion.article>;
}
