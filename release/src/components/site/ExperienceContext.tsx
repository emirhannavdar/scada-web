import {translate as _tx,useLocale as _useLocale} from '@/lib/i18n';
import { createContext, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { MotionConfig, useReducedMotion } from 'motion/react';
const ExperienceContext = createContext({ reduced: false, compact: false, journeyActive: false, setJourneyActive: (_active: boolean) => { }, fieldNight: false, setFieldNight: (_night: boolean) => { }, menuOpen: false, setMenuOpen: (_open: boolean) => { } });
export function ExperienceProvider({ children }: {
    children: ReactNode;
}) {
    _useLocale();
    const reduced = Boolean(useReducedMotion());
    const [compact, setCompact] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 760px), (max-height: 560px)').matches);
    const [menuOpen, setMenuOpen] = useState(false);
    const [journeyActive, setJourneyActive] = useState(false);
    const [fieldNight, setFieldNight] = useState(()=>{try{return localStorage.getItem('scadawatt-theme')==='dark'}catch{return false}});
 useLayoutEffect(()=>{document.documentElement.dataset['theme']=fieldNight?'dark':'light';document.documentElement.style.colorScheme=fieldNight?'dark':'light';document.documentElement.classList.toggle('dark',fieldNight);try{localStorage.setItem('scadawatt-theme',fieldNight?'dark':'light')}catch{}},[fieldNight]);
    useEffect(() => { try {
        sessionStorage.removeItem('scadawatt-motion');
    }
    catch { } const media = matchMedia('(max-width: 760px), (max-height: 560px)'); const update = () => setCompact(media.matches); update(); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, []);
    return <ExperienceContext.Provider value={{ reduced, compact, journeyActive, setJourneyActive, menuOpen, setMenuOpen, fieldNight, setFieldNight }}><MotionConfig reducedMotion="user"><div data-experience-motion={reduced ? 'reduced' : 'full'}>{_tx(children)}</div></MotionConfig></ExperienceContext.Provider>;
}
export const useExperience = () => useContext(ExperienceContext);
