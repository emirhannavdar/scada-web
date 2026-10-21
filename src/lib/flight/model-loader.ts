import {GLTFLoader,type GLTF} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import type {LoadingManager} from 'three';
let workersStarted=false;
export function createModelLoader(manager?:LoadingManager){
 if(!workersStarted&&typeof Worker!=='undefined'){try{MeshoptDecoder.useWorkers(2);workersStarted=true;}catch{/* Decoder fallback for restricted browsers. */}}
 return new GLTFLoader(manager).setMeshoptDecoder(MeshoptDecoder);
}
const controllers=new WeakMap<LoadingManager,AbortController>();
export function abortModelLoads(manager:LoadingManager){controllers.get(manager)?.abort();}
const preparers=new WeakMap<LoadingManager,(model:GLTF)=>Promise<void>>();
export function setModelPreparer(manager:LoadingManager,prepare:(model:GLTF)=>Promise<void>){preparers.set(manager,prepare);}
let lastInteraction=-Infinity,progress=0;
export function markModelInteraction(p:number){lastInteraction=performance.now();progress=p;}
type Job={url:string;priority:number;manager:LoadingManager|undefined;bytes?:ArrayBuffer|undefined;resolve:(g:GLTF)=>void;reject:(e:unknown)=>void};
const downloads:Job[]=[],parses:Job[]=[];let fetching=0,parsing=false;
const rank=(j:Job)=>j.priority+(progress>.45&&j.priority>=6?-20:0);
/** Parallel network, serialized parsing/installation; large arrivals wait for a scroll pause. */
function pumpDownloads(){downloads.sort((a,b)=>rank(a)-rank(b));while(fetching<2&&fetching+parses.length<2&&downloads.length){const job=downloads.shift()!;const signal=job.manager?controllers.get(job.manager)?.signal:undefined;if(signal?.aborted){job.reject(new Error('Model loading cancelled'));continue;}fetching++;fetch(job.url,signal?{signal}:undefined).then(response=>{if(!response.ok)throw Error(`Model HTTP ${response.status}`);return response.arrayBuffer()}).then(bytes=>{job.bytes=bytes;parses.push(job);pumpParses();},job.reject).finally(()=>{fetching--;pumpDownloads()});}}
function pumpParses(){if(parsing||!parses.length)return;parsing=true;const queued=performance.now();
 const start=()=>{if(performance.now()-lastInteraction<140&&performance.now()-queued<1200){setTimeout(start,80);return;}parses.sort((a,b)=>rank(a)-rank(b));const job=parses.shift()!;const base=job.url.slice(0,job.url.lastIndexOf('/')+1);createModelLoader(job.manager).parseAsync(job.bytes!,base).then(async model=>{if(job.manager&&controllers.get(job.manager)?.signal.aborted)throw new Error('Model loading cancelled');const prepare=job.manager?preparers.get(job.manager):undefined;if(prepare)await prepare(model);return model}).then(job.resolve,job.reject).finally(()=>{job.bytes=undefined;parsing=false;pumpDownloads();setTimeout(pumpParses,32)});};setTimeout(start,0);
}
export function loadModel(url:string,manager:LoadingManager|undefined,priority:number){if(manager&&!controllers.has(manager))controllers.set(manager,new AbortController());return new Promise<GLTF>((resolve,reject)=>{downloads.push({url,priority,manager,resolve,reject});setTimeout(pumpDownloads,0)});}
