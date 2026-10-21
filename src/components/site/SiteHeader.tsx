import { CmsImage } from "@/components/site/CmsImage";
import { setLanguage } from "@/lib/i18n";
import { translate as _tx, useLocale as _useLocale } from "@/lib/i18n";
import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { ArrowUpRight, X, Sun, Moon } from "lucide-react";
import { contact, images } from "@/content/site";
import { useExperience } from "./ExperienceContext";
export function SiteHeader() {
  const language = _useLocale();
  const { menuOpen, setMenuOpen, reduced, fieldNight, setFieldNight } = useExperience();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const home = path === "/";
  const [scrolled, setScrolled] = useState(false);
  const pageLinks = [
    { to: "/", tr: "Ana sayfa", en: "Home" },
    { to: "/cozumler", tr: "Çözümler", en: "Solutions" },
    { to: "/urunler", tr: "Donanımlar", en: "Hardware" },
    { to: "/scada-yazilimi", tr: "SCADA yazılımı", en: "SCADA software" },
    { to: "/paketler", tr: "İzleme planları", en: "Monitoring plans" },
    { to: "/hakkimizda", tr: "Hakkımızda", en: "About us" },
    { to: "/iletisim", tr: "İletişim", en: "Contact" },
  ] as const;
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 80));
  useEffect(() => setMenuOpen(false), [path, setMenuOpen]);
  useEffect(() => {
    if (!menuOpen) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("a,button")?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        trigger.current?.focus();
      }
      if (e.key === "Tab") {
        const targets = panel.current?.querySelectorAll<HTMLElement>("a[href],button");
        if (!targets?.length) return;
        const first = targets[0],
          last = targets[targets.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", key);
    };
  }, [menuOpen, setMenuOpen]);
  function close() {
    setMenuOpen(false);
    trigger.current?.focus();
  }
  return (
    <>
      <header className={`film-header ${scrolled || !home || menuOpen ? "is-solid" : ""}`}>
        <div className="film-header-inner">
          <Link to="/" className="film-brand" aria-label={_tx("ScadaWatt ana sayfa")}>
            <CmsImage src={images.wordmark} alt={_tx("ScadaWatt")} width="196" height="56" />
          </Link>
          <nav className="film-header-chapters" aria-label={_tx("Ana menü")}>
            {pageLinks.slice(1, 4).map(item => (
              <Link to={item.to} key={item.to} aria-current={path === item.to ? "page" : undefined}>
                {_tx(language === "en" ? item.en : item.tr)}
              </Link>
            ))}
          </nav>
          <div className="film-header-actions">
            <Link className="film-header-contact" to="/iletisim">
              {_tx("\u0130leti\u015Fim ")}
              <ArrowUpRight size={15} />
            </Link>
            <button
              type="button"
              className="global-day-toggle"
              aria-pressed={fieldNight}
              aria-label={_tx(fieldNight ? "Gündüz temasına geç" : "Gece temasına geç")}
              title={_tx(
                fieldNight ? "Türkiye: Gece · ABD: Gündüz" : "Türkiye: Gündüz · ABD: Gece",
              )}
              onClick={() => setFieldNight(!fieldNight)}
            >
              {_tx(fieldNight ? <Moon size={19} /> : <Sun size={19} />)}
            </button>
            <div className="language-switch" role="group" aria-label={_tx("Dil seçimi")}>
              <button
                type="button"
                lang="tr"
                aria-pressed={language === "tr"}
                onClick={() => setLanguage("tr")}
              >
                TR
              </button>
              <span aria-hidden="true">/</span>
              <button
                type="button"
                lang="en"
                aria-pressed={language === "en"}
                onClick={() => setLanguage("en")}
              >
                EN
              </button>
            </div>
            <button
              ref={trigger}
              className="film-menu-trigger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-controls="film-navigation"
              aria-label={_tx(menuOpen ? "Menüyü kapat" : "Menüyü aç")}
            >
              <span>{_tx("Men\u00FC")}</span>
              <i />
              <i />
            </button>
          </div>
        </div>
      </header>
      <AnimatePresence>
        {_tx(
          menuOpen && (
            <motion.div
              ref={panel}
              className="film-navigation"
              id="film-navigation"
              role="dialog"
              aria-modal="true"
              aria-label={_tx("ScadaWatt navigasyonu")}
              initial={reduced ? false : { clipPath: "inset(0 0 100% 0)" }}
              animate={{ clipPath: "inset(0 0 0% 0)" }}
              exit={reduced ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <button
                className="film-navigation-close"
                onClick={close}
                aria-label={_tx("Gezinme men\u00FCs\u00FCn\u00FC kapat")}
              >
                <X size={24} />
              </button>
              <div className="film-wrap film-navigation-grid">
                <nav aria-label={_tx("Ana men\u00FC")}>
                  {pageLinks.map((item, i) => (
                    <Link to={item.to} key={item.to} onClick={close} aria-current={path === item.to ? "page" : undefined}>
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      {_tx(language === "en" ? item.en : item.tr)}
                      <ArrowUpRight size={36} />
                    </Link>
                  ))}
                </nav>
                <div>
                  <p className="film-label">{_tx("SCADAWATT / ANKARA")}</p>
                  <p>
                    {_tx("Yaz\u0131l\u0131m, elektronik")}
                    <br />
                    {_tx("ve enerji teknolojileri.")}
                  </p>
                  <Link to="/hakkimizda" onClick={close}>
                    {_tx("\u015Eirketimizi tan\u0131y\u0131n ")}
                    <ArrowUpRight size={16} />
                  </Link>
                  <Link to="/paketler" onClick={close}>
                    {_tx("\u0130zleme planlar\u0131 ")}
                    <ArrowUpRight size={16} />
                  </Link>
                  <Link to="/iletisim" onClick={close}>
                    {_tx("Demo talep edin ")}
                    <ArrowUpRight size={16} />
                  </Link>
                  <a href={`mailto:${contact.email}`}>{_tx(contact.email)}</a>
                  <a href={contact.phoneHref}>{_tx(contact.phone)}</a>
                </div>
              </div>
            </motion.div>
          ),
        )}
      </AnimatePresence>
    </>
  );
}
