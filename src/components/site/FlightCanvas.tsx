import { acquireFlight, hasPreparedFlight } from "@/lib/flight/session";
import { CmsImage } from "@/components/site/CmsImage";
import { translate as _tx, useLocale as _useLocale } from "@/lib/i18n";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { useMotionValueEvent, type MotionValue } from "motion/react";
import type { FlightRenderer } from "@/lib/flight/render";
import { useExperience } from "./ExperienceContext";
export function FlightCanvas({
  editorPaused = false,
  progress,
  screenUrl = "/assets/screens/overview-detail.webp",
  onNavigate,
  onScreenPoint,
  onRendered,
  onFallback,
  onReady,
  arrivalReady = true,
  captureScroll = true,
  fieldNight = false,
}: {
  editorPaused?: boolean;
  fieldNight?: boolean;
  arrivalReady?: boolean;
  captureScroll?: boolean;
  onRendered?: (p: number, url: string) => void;
  onFallback?: () => void;
  onReady?: () => void;
  progress: MotionValue<number>;
  screenUrl?: string;
  onNavigate?: (step: number) => boolean;
  onScreenPoint?: (uv: { u: number; v: number }) => void;
}) {
  _useLocale();
  const nightRef = useRef(fieldNight);
  nightRef.current = fieldNight;
  const interactions = useRef({
    onNavigate,
    onScreenPoint,
    onRendered,
    onFallback,
    onReady,
    arrivalReady,
  });
  interactions.current = {
    onNavigate,
    onScreenPoint,
    onRendered,
    onFallback,
    onReady,
    arrivalReady,
  };
  const selectedUrl = useRef(screenUrl);
  selectedUrl.current = screenUrl;
  const surface = useRef<HTMLDivElement>(null),
    host = useRef<HTMLDivElement>(null),
    engine = useRef<FlightRenderer | null>(null);
  const [loaded, setLoaded] = useState(0);
  const [targetLoaded, setTargetLoaded] = useState(0);
  const [engineReady, setEngineReady] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">(() =>
    hasPreparedFlight() ? "ready" : "loading",
  );
  const { menuOpen } = useExperience();
  const progressRef = useRef(progress.get());
  const menuRef = useRef(menuOpen);
  const editorRef = useRef(editorPaused);
  editorRef.current = editorPaused;
  menuRef.current = menuOpen;
  useMotionValueEvent(progress, "change", (p) => {
    progressRef.current = p;
    engine.current?.setProgress(p);
  });
  useEffect(() => {
    if (status === "fallback") interactions.current.onFallback?.();
    if (status === "ready") interactions.current.onReady?.();
  }, [status]);
  useEffect(() => {
    if (status !== "loading" || loaded >= targetLoaded) return;
    const timer = window.setTimeout(
      () => setLoaded((value) => Math.min(value + 1, targetLoaded)),
      22,
    );
    return () => window.clearTimeout(timer);
  }, [loaded, targetLoaded, status]);
  useEffect(() => {
    if (!engineReady || loaded < 100 || status !== "loading") return;
    const timer = window.setTimeout(() => setStatus("ready"), 180);
    return () => window.clearTimeout(timer);
  }, [engineReady, loaded, status]);
  useEffect(() => {
    if (status === "ready") engine.current?.setScreen?.(screenUrl);
  }, [screenUrl, status]);
  useEffect(() => {
    if (status === "ready") engine.current?.setDayNight?.(fieldNight);
  }, [fieldNight, status]);
  useEffect(() => {
    engine.current?.setPaused(menuOpen);
    engine.current?.setEffectsPaused?.(editorPaused);
  }, [menuOpen, editorPaused]);
  useEffect(() => {
    if (status !== "loading") return;
    const old = document.body.style.overflow,
      root = document.getElementById("root"),
      oldInert = root?.inert ?? false;
    document.body.style.overflow = "hidden";
    if (root) root.inert = true;
    return () => {
      document.body.style.overflow = old;
      if (root) root.inert = oldInert;
    };
  }, [status]);
  useEffect(() => {
    if (!surface.current) return;
    if (typeof WebGL2RenderingContext === "undefined") {
      setStatus("fallback");
      return;
    }
    const lease = acquireFlight(surface.current, {
      ready: () => {
        engine.current = lease.engine;
        engine.current?.setDayNight?.(nightRef.current);
        engine.current?.setProgress(progressRef.current);
        engine.current?.setScreen?.(selectedUrl.current);
        engine.current?.setEffectsPaused?.(editorRef.current);
        engine.current?.setPaused(menuRef.current);
        engine.current?.paint?.();
        setTargetLoaded(100);
        setEngineReady(true);
      },
      error: () => {
        engine.current = null;
        setStatus("fallback");
      },
      progress: (value) => setTargetLoaded(Math.max(0, Math.min(99, Math.round(value * 100)))),
      frame: (p, url) => interactions.current.onRendered?.(p, url),
    });
    engine.current = lease.engine;
    if (engine.current) {
      engine.current.setDayNight?.(nightRef.current);
      engine.current.setProgress(progressRef.current);
      engine.current.setEffectsPaused?.(editorRef.current);
      engine.current.setPaused(menuRef.current);
      engine.current.paint?.();
    }
    return () => {
      lease.release();
      engine.current = null;
    };
  }, []);
  useEffect(() => {
    if (!captureScroll) return;
    let lastWheel = -Infinity,
      accumulated = 0;
    const wheel = (e: WheelEvent) => {
      const rect = host.current?.getBoundingClientRect();
      if (
        !interactions.current.arrivalReady ||
        e.ctrlKey ||
        menuRef.current ||
        status !== "ready" ||
        progressRef.current < 0.974 ||
        !rect ||
        rect.top > 100 ||
        rect.bottom < innerHeight * 0.8 ||
        Math.abs(e.deltaY) < 1
      )
        return;
      if (performance.now() - lastWheel < 420) {
        e.preventDefault();
        return;
      }
      accumulated += e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
      if (Math.abs(accumulated) < 35) {
        e.preventDefault();
        return;
      }
      const step = Math.sign(accumulated);
      accumulated = 0;
      if (interactions.current.onNavigate?.(step)) {
        e.preventDefault();
        lastWheel = performance.now();
      }
    };
    let interactive = progress.get() >= 0.974;
    const bind = () => {
      if (interactive) window.addEventListener("wheel", wheel, { passive: false });
    };
    bind();
    const unsubscribe = progress.on("change", (value) => {
      const next = value >= 0.974;
      if (next === interactive) return;
      window.removeEventListener("wheel", wheel);
      interactive = next;
      accumulated = 0;
      bind();
    });
    return () => {
      unsubscribe();
      window.removeEventListener("wheel", wheel);
    };
  }, [progress, status, captureScroll]);
  const [pointer, setPointer] = useState<{
    x: number;
    y: number;
  } | null>(null);
  return (
    <div ref={host} className="flight-render" data-render-status={status}>
      <div
        ref={surface}
        className="flight-canvas-surface"
        style={{ position: "absolute", inset: 0 }}
        onPointerMove={(e) => {
          const uv = engine.current?.screenUV?.(e.clientX, e.clientY),
            box = host.current?.getBoundingClientRect();
          setPointer(uv && box ? { x: e.clientX - box.left, y: e.clientY - box.top } : null);
        }}
        onPointerLeave={() => setPointer(null)}
        onClick={(e) => {
          const uv = engine.current?.screenUV?.(e.clientX, e.clientY);
          if (uv) interactions.current.onScreenPoint?.(uv);
        }}
      />

      {_tx(
        pointer && (
          <span
            className="voyage-real-cursor"
            style={{ left: pointer.x, top: pointer.y }}
            aria-hidden="true"
          >
            {_tx("\u2196")}
          </span>
        ),
      )}
      {_tx(
        status === "loading" &&
          createPortal(
            <div className="flight-loading" role="status" aria-live="polite">
              <div className="flight-loading-grid" aria-hidden="true" />
              <div className="flight-loading-head">
                <span>ϟ</span>
                <small>{_tx("SCADAWATT / DİJİTAL ENERJİ")}</small>
              </div>
              <div className="flight-loading-content">
                <div className="flight-loading-logo">
                  <CmsImage src="/assets/scadawatt-loader-logo.png" alt={_tx("ScadaWatt")} />
                </div>
                <div
                  className="flight-loading-battery"
                  role="progressbar"
                  aria-label={_tx("Sahne yükleniyor")}
                  aria-valuenow={loaded}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div>
                    {Array.from({ length: 10 }, (_, index) => (
                      <i key={index} className={loaded >= (index + 1) * 10 ? "is-full" : ""} />
                    ))}
                  </div>
                  <span />
                </div>
                <div className="flight-loading-percent">
                  <strong>{_tx(String(loaded).padStart(2, "0"))}</strong>
                  <small>%</small>
                </div>
                <p className="flight-loading-caption">{_tx("Sistem yükleniyor...")}</p>
              </div>
              <svg className="flight-loading-renewables" viewBox="0 0 1400 330" aria-hidden="true">
                <g className="loader-land">
                  <path d="M0 285c145-55 260-35 385-68 148-38 250-29 362 11 126 45 251-50 391-22 95 19 165 55 262 25v99H0z" />
                  <path d="M0 294c190-20 306-7 474-35 152-26 260 32 403 21 215-17 314-63 523-20" />
                </g>
                <g className="loader-solar" transform="translate(90 173)">
                  <path d="m0 72 46-69 190 6-43 75zM12 56l193 8M29 31l193 7M72 5l-43 73M122 7 80 81M173 8l-42 77M218 9l-43 77M54 86l-9 43m117-41 13 43m-151 0h180" />
                </g>
                <g className="loader-city" transform="translate(475 120)">
                  <path d="M0 165V76h44v89M52 165V38h54v127m9 0V91h40v74m9 0V12h63v153m9 0V62h44v103m9 0V99h31v66M15 95h13m-13 22h13m42-58h18m-18 24h18m-18 25h18m93-71h18m-18 27h18m-18 27h18m46-8h18m-18 25h18" />
                </g>
                {[0, 1, 2].map((index) => (
                  <g
                    key={index}
                    className={`loader-turbine turbine-${index + 1}`}
                    transform={`translate(${930 + index * 160} ${index === 1 ? 92 : 122}) scale(${index === 1 ? 1.14 : 0.92})`}
                  >
                    <path className="loader-tower" d="M0 0-12 224h24L0 0" />
                    <g className="loader-blades">
                      <circle className="loader-rotation-anchor" r="112" />
                      <circle r="9" />
                      <path d="M0-8C-11-41-8-78 2-109c9 31 9 67 4 101M7 4c34-5 67 7 94 28-32 2-67-7-96-21M-7 4c-22 27-51 48-84 58 18-27 47-50 79-62" />
                    </g>
                  </g>
                ))}
              </svg>
            </div>,
            document.body,
          ),
      )}
      {_tx(
        status === "fallback" && (
          <div className="flight-fallback">
            <span>{_tx("SCADAWATT / KE\u015E\u0130F")}</span>
            <p>
              {_tx("3B g\u00F6r\u00FCn\u00FCm bu taray\u0131c\u0131da a\u00E7\u0131lamad\u0131.")}
              <br />
              {_tx(
                "A\u015Famalar\u0131 a\u015Fa\u011F\u0131daki d\u00FC\u011Fmelerle inceleyebilirsiniz.",
              )}
            </p>
            <CmsImage src={screenUrl} alt={_tx("ScadaWatt ger\u00E7ek uygulama ekran\u0131")} />
          </div>
        ),
      )}
    </div>
  );
}
