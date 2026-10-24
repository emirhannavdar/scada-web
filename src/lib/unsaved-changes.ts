import {useEffect,useId,useSyncExternalStore} from 'react';
import {useBlocker} from '@tanstack/react-router';
const sources=new Set<string>(),listeners=new Set<()=>void>();
const notify=()=>listeners.forEach(fn=>fn());
export function setUnsavedSource(id:string,dirty:boolean){const before=sources.size;if(dirty)sources.add(id);else sources.delete(id);if(before!==sources.size)notify()}
export const hasUnsavedChanges=()=>sources.size>0;
export function useUnsavedChanges(dirty:boolean){const id=useId();useEffect(()=>{setUnsavedSource(id,dirty);return()=>setUnsavedSource(id,false)},[id,dirty]);}
export function useUnsavedNavigationGuard(){
 const dirty=useSyncExternalStore(fn=>{listeners.add(fn);return()=>{listeners.delete(fn)}},hasUnsavedChanges,()=>false);
 useBlocker({shouldBlockFn:()=>dirty&&!window.confirm('Kaydedilmemiş değişiklikleriniz var. Bu sayfadan ayrılmak istiyor musunuz?'),enableBeforeUnload:false});
}
