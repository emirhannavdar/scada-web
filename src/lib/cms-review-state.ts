import type {VisualWorkspace} from './cms-visual-model';
import {useSyncExternalStore} from 'react';
let state:{workspace:VisualWorkspace|null;enabled:boolean}={workspace:null,enabled:false};
const listeners=new Set<()=>void>();
export function setPreviewReview(workspace:VisualWorkspace|null,enabled=true){state={workspace,enabled};listeners.forEach(fn=>fn());}
export function usePreviewReview(){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn)},()=>state,()=>state);}

export function getPreviewReview(){return state;}
