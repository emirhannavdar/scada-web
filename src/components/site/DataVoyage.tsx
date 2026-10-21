import { translate as _tx, useLocale as _useLocale } from "@/lib/i18n";
import { advanceJourney } from "@/lib/journey-gate";
import type { CSSProperties } from "react";
import { installJourneyGate } from "@/lib/journey-gate";
import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useMotionValue, useTransform, useMotionValueEvent } from "motion/react";
import { ArrowDown, ArrowUpRight, Plus, Minus } from "lucide-react";
import { fieldJourney } from "@/content/site";
import { useExperience } from "./ExperienceContext";
import { journeyIndex, voyageStops } from "@/lib/voyage";
import { FlightCanvas } from "./FlightCanvas";
export function DataVoyage() {
  _useLocale();
  const [active, setActive] = useState(0),
    [detail, setDetail] = useState(false),
    [copyHidden, setCopyHidden] = useState(false);
  const seen =
    typeof window !== "undefined" && sessionStorage.getItem("scadawatt-journey-seen") === "1";
  const ref = useRef<HTMLElement>(null),
    painted = useRef(seen),
    completed = useRef(seen),
    skipping = useRef(seen);
  const homeScreens = [
    "/assets/screens/monitor-dashboard-1.png",
    "/assets/screens/monitor-live-v69-2.png",
    "/assets/screens/monitor-live-v69-3.png",
  ];
  const [homeScreenIndex, setHomeScreenIndex] = useState(0);
  const homeScreen = homeScreens[homeScreenIndex]!;
  const { reduced, fieldNight = false } = useExperience();
  const [editorPaused, setEditorPaused] = useState(false);
  const editorPausedRef = useRef(false);
  const [fallback, setFallback] = useState(false),
    [sceneReady, setSceneReady] = useState(false);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const timeline = useMotionValue(seen ? 1 : 0),
    camera = useMotionValue(seen ? 1 : 0),
    manual = useMotionValue(seen ? 1 : 0),
    progress = reduced ? manual : camera;
  function scrollToTime(value: number) {
    if (ref.current)
      window.scrollTo({
        top:
          ref.current.getBoundingClientRect().top +
          window.scrollY +
          (ref.current.offsetHeight - window.innerHeight) * value,
        behavior: "smooth",
      });
  }
  useMotionValueEvent(timeline, "change", (value) => camera.set(value));
  useMotionValueEvent(progress, "change", (p) => {
    setActive(journeyIndex(p));
    setCopyHidden(p > 0.96);
    completed.current = p >= 0.9999 && painted.current;
    if (completed.current) sessionStorage.setItem("scadawatt-journey-seen", "1");
  });
  useEffect(() => {
    let frame = 0;
    const remember = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        sessionStorage.setItem("scadawatt-home-scroll", String(window.scrollY)),
      );
    };
    window.addEventListener("scroll", remember, { passive: true });
    window.addEventListener("pagehide", remember);
    return () => {
      sessionStorage.setItem("scadawatt-home-scroll", String(window.scrollY));
      window.removeEventListener("scroll", remember);
      window.removeEventListener("pagehide", remember);
      cancelAnimationFrame(frame);
    };
  }, []);
  useEffect(() => {
    if (!seen || !ref.current) return;
    setActive(fieldJourney.length - 1);
    setCopyHidden(true);
    const savedY = Number(sessionStorage.getItem("scadawatt-home-scroll"));
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (!ref.current) return;
        const start = ref.current.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top:
            Number.isFinite(savedY) && savedY > 0
              ? savedY
              : start + Math.max(0, ref.current.offsetHeight - window.innerHeight) - 1,
          behavior: "instant",
        });
        skipping.current = false;
      }),
    );
  }, []);
  useEffect(() => {
    if (reduced) manual.set(skipping.current ? 1 : voyageStops[active]!);
  }, [reduced, manual, active]);
  useEffect(() => {
    if (editorPaused || reduced || (!sceneReady && !fallback)) return;
    let frame = 0,
      last = performance.now();
    const tick = (now: number) => {
      frame = 0;
      if (editorPausedRef.current) return;
      const raw = scrollYProgress.get(),
        target = skipping.current ? 1 : raw > 0.999 ? 1 : raw,
        current = timeline.get();
      const next = skipping.current ? 1 : advanceJourney(current, target, (now - last) / 1000);
      last = now;
      timeline.set(next);
      if (next !== target && next !== current) frame = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    const unsubscribe = scrollYProgress.on("change", wake);
    wake();
    return () => {
      unsubscribe();
      cancelAnimationFrame(frame);
    };
  }, [editorPaused, reduced, sceneReady, fallback, scrollYProgress, timeline]);
  useEffect(() => {
    if (
      document.documentElement.dataset["cmsVisual"] === "true" ||
      reduced ||
      fallback ||
      !sceneReady ||
      !ref.current
    )
      return;
    return installJourneyGate(ref.current, () => completed.current);
  }, [reduced, fallback, sceneReady]);
  useEffect(() => {
    if (document.documentElement.dataset["cmsVisual"] !== "true") return;
    const handle = (event: Event) => {
      const data = (event as CustomEvent).detail;
      if (typeof data?.paused === "boolean") {
        editorPausedRef.current = data.paused;
        setEditorPaused(data.paused);
      }
      if (Number.isInteger(data?.stage) && data.stage >= 0 && data.stage < fieldJourney.length) {
        const time = voyageStops[data.stage]!;
        timeline.set(time);
        camera.set(time);
        manual.set(time);
        setActive(data.stage);
        setCopyHidden(data.stage === fieldJourney.length - 1);
        setDetail(false);
        if (ref.current) {
          const start = ref.current.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({
            top: start + (ref.current.offsetHeight - window.innerHeight) * time,
            behavior: "instant",
          });
        }
      }
    };
    window.addEventListener("scadawatt:visual", handle);
    return () => window.removeEventListener("scadawatt:visual", handle);
  }, [timeline, camera, manual]);
  useEffect(() => {
    homeScreens.forEach((src) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
    });
  }, []);
  useEffect(() => {
    if (active < fieldJourney.length - 3) {
      setHomeScreenIndex(0);
      return;
    }
    const timer = window.setInterval(
      () => setHomeScreenIndex((current) => (current + 1) % homeScreens.length),
      2000,
    );
    return () => window.clearInterval(timer);
  }, [active]);
  useEffect(() => {
    painted.current = false;
    completed.current = false;
  }, [homeScreenIndex]);
  useEffect(() => {
    if (document.documentElement.dataset["cmsVisual"] === "true")
      window.dispatchEvent(
        new CustomEvent("scadawatt:visual-stage", { detail: { stage: active } }),
      );
  }, [active]);
  const c = fieldJourney[active]!;
  const introWords = _tx(fieldJourney[0]!.title).trim().split(/\s+/),
    introLast = introWords.pop(),
    introLead = introWords.join(" ");
  const last = fieldJourney.length - 1;
  const ascentVeil = useTransform(progress, [0.5, 0.53, 0.56], [0, 1, 0]);
  const descentVeil = useTransform(progress, [0.755, 0.78, 0.805], [0, 1, 0]);
  const copyOpacity = useTransform(progress, [0.945, 0.96], [1, 0]);
  function skipToEnd() {
    skipping.current = true;
    painted.current = false;
    completed.current = false;
    setActive(fieldJourney.length - 1);
    setDetail(false);
    setCopyHidden(true);
    timeline.set(1);
    camera.set(1);
    manual.set(1);
    if (ref.current) {
      const start = ref.current.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: start + Math.max(0, ref.current.offsetHeight - window.innerHeight) - 1,
        behavior: "instant",
      });
    }
    if (fallback) {
      painted.current = true;
      completed.current = true;
      skipping.current = false;
    }
  }
  function select(i: number) {
    setActive(i);
    setDetail(false);
    if (reduced) manual.set(voyageStops[i]!);
    else scrollToTime(voyageStops[i]!);
  }
  return (
    <section
      ref={ref}
      className={`data-voyage drone-journey ${reduced ? "simple-journey" : ""}`}
      id="enerji"
      style={{ "--monitor-chapter-height": "0svh" } as CSSProperties}
      data-active-step={active}
      data-field-night={fieldNight}
      data-screen-index={0}
      tabIndex={0}
      aria-label={_tx("ScadaWatt veri yolculu\u011Fu")}
    >
      <span id="teknoloji" />
      <div className="drone-sticky">
        <FlightCanvas
          editorPaused={editorPaused}
          fieldNight={fieldNight}
          captureScroll={false}
          onReady={() => setSceneReady(true)}
          arrivalReady={false}
          onFallback={() => setFallback(true)}
          onRendered={(p, url) => {
            if (p >= 0.999 && url === homeScreen) {
              painted.current = true;
              completed.current = progress.get() >= 0.9999;
              if (skipping.current) skipping.current = false;
            }
          }}
          progress={progress}
          screenUrl={homeScreen}
        />
        <motion.div
          className="flight-scale-veil ascent"
          style={{ opacity: ascentVeil }}
          aria-hidden="true"
        />
        <motion.div
          className="flight-scale-veil descent"
          style={{ opacity: descentVeil }}
          aria-hidden="true"
        />
        <div className="drone-vignette" />
        <div className="drone-kicker">
          <span>{_tx("SCADAWATT / YAZILIM & ELEKTRON\u0130K")}</span>
          <span className="drone-location">
            <i />
            {_tx(active >= 6 && active <= 8 ? "ŞEHRİ KEŞFET" : "VERİNİN İZİNİ SÜR")}
          </span>
        </div>

        <motion.div
          className="drone-copy"
          aria-hidden={copyHidden}
          inert={copyHidden}
          style={active === last ? { opacity: copyOpacity } : { opacity: 1 }}
        >
          <p className="film-label">
            <span />
            {_tx(c.eyebrow)}
          </p>
          <h1 data-cms-field="data.fieldJourney.0.title" className={active === 0 ? "" : "sr-only"}>
            {introLead}
            {introLead && <br />}
            <em>{introLast}</em>
          </h1>
          {_tx(
            active !== 0 && (
              <h2 data-cms-field={`data.fieldJourney.${active}.title`}>{_tx(c.title)}</h2>
            ),
          )}
          <p data-cms-field={`data.fieldJourney.${active}.body`} className="drone-body">
            {_tx(c.body)}
          </p>
          <button
            className="drone-learn"
            aria-expanded={detail}
            aria-controls="journey-detail"
            onClick={() => setDetail(!detail)}
          >
            {_tx(detail ? <Minus size={15} /> : <Plus size={15} />)}
            {_tx("Bu a\u015Famada ne oluyor?")}
          </button>
          {_tx(
            detail && (
              <p
                data-cms-field={`data.fieldJourney.${active}.detail`}
                id="journey-detail"
                className="drone-detail"
              >
                {_tx(c.detail)}
              </p>
            ),
          )}
        </motion.div>

        <div className="drone-navigation">
          {_tx(
            reduced && (
              <div className="reduced-journey-controls">
                <button disabled={active === 0} onClick={() => select(active - 1)}>
                  {_tx("\u00D6nceki g\u00F6r\u00FCn\u00FCm")}
                </button>
                <button disabled={active === last} onClick={() => select(active + 1)}>
                  {_tx("Sonraki g\u00F6r\u00FCn\u00FCm")}
                </button>
              </div>
            ),
          )}
          <div className="drone-bottom">
            <a
              onClick={(e) => {
                if (!completed.current) {
                  e.preventDefault();
                  skipToEnd();
                }
              }}
              href={active === last ? "#donanim" : "#yazilim"}
            >
              {_tx(active === last ? "Donanımları keşfet" : "Yolculuğu geç")}
              {_tx(active === last ? <ArrowUpRight size={14} /> : <ArrowDown size={14} />)}
            </a>
          </div>
          <motion.div
            className="drone-progress"
            style={{ scaleX: reduced ? progress : timeline }}
          />
        </div>
      </div>
      <span id="yazilim" className="voyage-screen-anchor" />
    </section>
  );
}
