import {useLayoutEffect} from 'react';
import {useLocale} from '@/lib/i18n';
import {useCmsDesign,designCss} from '@/lib/cms-design';
import {installWordStyles} from '@/lib/cms-words';
export function SiteDesign({path}:{path:string}){const design=useCmsDesign(),language=useLocale();useLayoutEffect(()=>{let stop=()=>{};const media=window.matchMedia('(max-width:760px)');const apply=()=>{stop();stop=installWordStyles(design,path,media.matches?'mobile':'desktop',language)};apply();media.addEventListener('change',apply);return()=>{media.removeEventListener('change',apply);stop()}},[design,path,language]);return <style data-cms-design-sheet>{designCss(design,path)}</style>}
