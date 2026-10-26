import {Link} from '@tanstack/react-router';
import {CmsImage} from '@/components/site/CmsImage';
import {translate as _tx,useLocale as _useLocale} from '@/lib/i18n';
import { useState, useRef, useEffect, useMemo, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpRight, Maximize2, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { screenGallery, images } from '@/content/site';
import { fitMonitor } from '@/lib/monitor-fit';
import { useExperience } from './ExperienceContext';
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function cursorPath(index: number) {
    const paths: [
        number,
        number
    ][][] = [
        [[18, 16], [46, 24], [74, 28], [63, 68]],
        [[14, 18], [19, 37], [18, 54], [78, 22]],
        [[17, 18], [17, 65], [36, 64], [74, 24]],
        [[18, 18], [70, 22], [68, 74], [83, 30]],
        [[18, 18], [24, 33], [57, 42], [74, 20]],
        [[18, 18], [19, 70], [46, 66], [76, 20]],
        [[18, 18], [24, 38], [52, 34], [71, 70]],
        [[18, 18], [22, 41], [78, 32], [77, 62]],
        [[20, 18], [54, 26], [72, 24], [66, 63]],
    ];
    return paths[index % paths.length] ?? paths[0]!;
}
function interpolatePath(points: [
    number,
    number
][], t: number) {
    const safe = clamp(t) * (points.length - 1);
    const i = Math.min(points.length - 2, Math.floor(safe));
    const f = safe - i;
    const a = points[i]!, b = points[i + 1]!;
    return [lerp(a[0], b[0], f), lerp(a[1], b[1], f)] as const;
}
export function ScreenExplorer() {
    _useLocale();
    const [selected, setSelected] = useState(0);
    const [mobile, setMobile] = useState(false);
    const [zoom, setZoom] = useState(false);
    const [demoProgress, setDemoProgress] = useState(0);
    const { reduced } = useExperience();
    const trigger = useRef<HTMLButtonElement>(null);
    const close = useRef<HTMLButtonElement>(null);
    const story = useRef<HTMLDivElement>(null);
    const layout = useRef<HTMLDivElement>(null);
    const sticky = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => { const el = layout.current, holder = sticky.current; if (!el || !holder)
        return; const resize = () => { const header = document.querySelector('.film-header')?.getBoundingClientRect().height || 84; const viewport = window.visualViewport?.height || window.innerHeight; holder.style.setProperty('--monitor-top', `${header}px`); const available = el.parentElement?.clientWidth || window.innerWidth - 104; const desktop = window.innerWidth > 1100; const width = fitMonitor(Math.min(1100, available - (desktop ? 292 : 0)), desktop ? viewport - header - 32 : Math.max(300, viewport - header - 32)).width; el.style.setProperty('--monitor-width', `${width}px`); }; resize(); const observer = new ResizeObserver(resize); observer.observe(el.parentElement!); window.addEventListener('resize', resize); window.visualViewport?.addEventListener('resize', resize); return () => { observer.disconnect(); window.removeEventListener('resize', resize); window.visualViewport?.removeEventListener('resize', resize); }; }, []);
    const item = screenGallery[selected]!;
    const src = mobile ? images.app : `/assets/screens/${item.id}.webp`;
    const alt = mobile ? 'Mevcut ScadaWatt mobil uygulama tanıtım görseli' : `ScadaWatt ${item.title} gerçek ekran görüntüsü`;
    const count = screenGallery.length;
    useEffect(() => { if (!zoom)
        return; const old = document.body.style.overflow; document.body.style.overflow = 'hidden'; close.current?.focus(); const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape')
        setZoom(false); if (e.key === 'Tab') {
        e.preventDefault();
        close.current?.focus();
    } }; document.addEventListener('keydown', onKey); return () => { document.body.style.overflow = old; document.removeEventListener('keydown', onKey); trigger.current?.focus(); }; }, [zoom]);
    useEffect(() => {
        if (mobile || reduced || !story.current)
            return;
        const el = story.current;
        const onScroll = () => {
            const rect = el.getBoundingClientRect();
            const distance = Math.max(1, rect.height - window.innerHeight);
            const progress = clamp(-rect.top / distance);
            setDemoProgress(progress);
            const next = Math.min(count - 1, Math.floor(progress * count));
            setSelected(next);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
    }, [count, mobile, reduced]);
    function choose(i: number) { setSelected(i); setMobile(false); if (!reduced && story.current && window.innerWidth > 1100) {
        const el = story.current, travel = el.offsetHeight - window.innerHeight;
        if (travel > 0)
            window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top + travel * ((i + .08) / count), behavior: 'smooth' });
    } }
    function cycle(step: number) { choose((selected + step + count) % count); }
    const stage = useMemo(() => {
        const local = clamp(demoProgress * count - selected);
        const [cursorX, cursorY] = interpolatePath(cursorPath(selected), local);
        const click = (local > .27 && local < .36) || (local > .62 && local < .71);
        const progressLabel = `${String(selected + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}`;
        return { cursorX, cursorY, click, progressLabel, local };
    }, [count, demoProgress, mobile, selected]);
    return <section className={`screen-explorer${reduced ? ' reduced-explorer' : ''}`} id="yazilim">
  <div className="film-wrap">
   <div className="explorer-heading"><div><p className="film-label"><span />{_tx("SCADAWATT YAZILIMI / GER\u00C7EK EKRANLAR")}</p><h2>{_tx("Art\u0131k ScadaWatt\u2019\u0131n")}<br /><em>{_tx("i\u00E7indesiniz.")}</em></h2></div><div><p>{_tx("Sahadaki verinin ekrandaki kar\u015F\u0131l\u0131\u011F\u0131.")}<br />{_tx("Kayd\u0131rarak ger\u00E7ek ScadaWatt aray\u00FCzlerini ke\u015Ffedin.")}</p><div className="film-app-tabs"><button aria-pressed={!mobile} onClick={() => setMobile(false)}>{_tx("Web aray\u00FCz\u00FC")}</button><button aria-pressed={mobile} onClick={() => setMobile(true)}>{_tx("Mobil uygulama")}</button></div></div></div>
  </div>
  <div className="explorer-story" ref={story}>
   <div className="explorer-sticky" ref={sticky}>
    <div className="film-wrap">
     <div className="monitor-layout" ref={layout}>
      <div className="monitor-shell">
       <div className="monitor-cabinet"/>
       <div className="monitor-frame">
        <div className="screen-chrome"><span><i /><i /><i /></span><span>{_tx("SCADAWATT / ")}{_tx(mobile ? 'MOBİL UYGULAMA' : item.title.toLocaleUpperCase('tr'))}</span><div className="screen-chrome-actions"><button ref={trigger} onClick={() => setZoom(true)} aria-label={_tx("Ekran\u0131 b\u00FCy\u00FCt")}><Maximize2 size={17}/></button></div></div>
        <div className="screen-bezel">
         <div className="monitor-camera"/>
         <div className="screen-frame">
          <div className="screen-frame-depth"/>
          {_tx(!mobile && !reduced && <motion.div className={`screen-cursor${stage.click ? ' is-clicking' : ''}`} animate={{ left: `${stage.cursorX}%`, top: `${stage.cursorY}%` }} transition={{ type: 'spring', stiffness: 80, damping: 16, mass: .85 }}><span /><i /><b /></motion.div>)}
          <AnimatePresence initial={false} mode="wait"><motion.img key={src} src={src} alt={_tx(alt)} loading="lazy" width="1920" height="1080" initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .24 }}/></AnimatePresence>
          <div className="screen-frame-reflection"/><div className="screen-frame-glow"/>
         </div>
        </div>
        <div className="monitor-logo">{_tx("SCADAWATT")}</div>
       </div>
       <div className="monitor-stand"/><div className="monitor-base"/>
      </div>
      <aside className="monitor-sidebar">
       <div className="monitor-step"><span>{_tx(stage.progressLabel)}</span><strong>{_tx(item.title)}</strong></div>
       <h3>{_tx(mobile ? 'Mobil uygulama' : item.title)}</h3>
       <p>{_tx(mobile ? 'ScadaWatt mobil uygulamasının şirket tanıtım görseli.' : item.text)}</p>
       <div className="monitor-progress" aria-label={_tx("Uygulama ekranlar\u0131")}>{_tx(screenGallery.map((s, i) => <button key={s.id} className={i === selected ? 'is-active' : ''} onClick={() => choose(i)} aria-label={_tx(`${String(i + 1).padStart(2, '0')} ${s.title}`)} aria-pressed={selected === i}/>))}</div>
       <div className="screen-arrows"><button aria-label={_tx("\u00D6nceki ekran")} onClick={() => cycle(-1)}><ArrowLeft size={19}/></button><button aria-label={_tx("Sonraki ekran")} onClick={() => cycle(1)}><ArrowRight size={19}/></button></div>
      </aside>
     </div>
    </div>
   </div>
  </div>
  <div className="film-wrap"><div className="explorer-foot"><span>{_tx("Ger\u00E7ek uygulama g\u00F6r\u00FCnt\u00FCleri. De\u011Ferler \u00E7ekim an\u0131na aittir; bu tan\u0131t\u0131m canl\u0131 veri g\u00F6stermez.")}</span><Link className="film-text-link" to="/iletisim" search={{tur:"demo"}}>{_tx("Canl\u0131 demo talebi ")}<ArrowUpRight size={17}/></Link></div></div>
  {_tx(zoom && <div className="screen-lightbox" role="dialog" aria-modal="true" aria-label={_tx("B\u00FCy\u00FCt\u00FClm\u00FC\u015F uygulama ekran\u0131")}><div><p>{_tx(mobile ? 'Mobil uygulama' : item.title)}{_tx(" \u00B7 Kayd\u0131rarak ayr\u0131nt\u0131lar\u0131 inceleyin")}</p><button ref={close} onClick={() => setZoom(false)} aria-label={_tx("B\u00FCy\u00FCt\u00FClm\u00FC\u015F ekran\u0131 kapat")}><X size={23}/></button></div><div className="lightbox-scroll"><CmsImage src={src} alt={_tx(alt)}/></div></div>)}
 </section>;
}
