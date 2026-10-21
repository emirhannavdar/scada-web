import {useEffect,useLayoutEffect} from 'react';
const key='scadawatt-home-position-v1';
type HomePosition={y:number;progress:number;anchor:string;offset:number};
let progress=0;
export function rememberJourneyProgress(value:number){if(Number.isFinite(value))progress=Math.max(0,Math.min(1,value));}
export function readHomePosition():HomePosition|null{
 if(typeof window==='undefined'||location.hash||document.documentElement.dataset['cmsPreview']==='true')return null;
 try{const stored=sessionStorage.getItem(key);if(!stored)return null;const value=JSON.parse(stored);return value&&Number.isFinite(value.y)&&value.y>=0&&Number.isFinite(value.progress)&&value.progress>=0&&value.progress<=1&&typeof value.anchor==='string'&&/^(?:#[\w-]+|\.film-footer)?$/.test(value.anchor)&&Number.isFinite(value.offset)?value:null;}catch{return null;}
}
export function saveHomePosition(){
 if(document.documentElement.dataset['cmsPreview']==='true'||!document.querySelector('.cinematic-home'))return;
 const y=window.scrollY;let anchor='',offset=y;
 for(const element of document.querySelectorAll<HTMLElement>('.cinematic-home > [id], .film-footer')){
  const top=element.getBoundingClientRect().top+y;
  if(top<=y+1){anchor=element.id?`#${element.id}`:'.film-footer';offset=y-top;}
 }
 try{sessionStorage.setItem(key,JSON.stringify({y,progress,anchor,offset}));}catch{}
}
/** Restore after the lazy journey has established its full scroll height. */
export function useHomePosition(mobile:boolean){
 useLayoutEffect(()=>{
  const saved=readHomePosition();if(!saved)return;
  let frame=0,settle=0,stopped=false;
  const stop=()=>{stopped=true;cancelAnimationFrame(frame);cancelAnimationFrame(settle);};
  const restore=()=>{
   if(stopped)return;
   if(!mobile&&!document.querySelector('.data-voyage')){frame=requestAnimationFrame(restore);return;}
   settle=requestAnimationFrame(()=>{
    if(stopped)return;
    const element=saved.anchor?document.querySelector<HTMLElement>(saved.anchor):null;
    const y=element?element.getBoundingClientRect().top+window.scrollY+saved.offset:saved.y;
    window.scrollTo({top:Math.max(0,y),behavior:'instant'});
    window.dispatchEvent(new Event('scadawatt:home-restored'));
   });
  };
  frame=requestAnimationFrame(restore);
  return stop;
 },[mobile]);
 useEffect(()=>{window.addEventListener('pagehide',saveHomePosition);return()=>window.removeEventListener('pagehide',saveHomePosition);},[]);
}
