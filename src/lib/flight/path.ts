import {worldAtDestination,orbitPose,flightUp} from './geography';
export type Vec3=readonly [number,number,number];
export const flightStops=[.055,.175,.27,.365,.60,.735,.805,.885,.945,.995];
export const flightBreaks=[0,.12,.22,.335,.40,.69,.77,.85,.91,.965,1];
export const localRoute:Vec3[]=[[5.1,.85,-56.12],[5.8,.24,-54],[5,.24,-52.5],[-.5,.24,-52.5],[-.5,.24,-58.82],[-.5,.65,-58.82],[-.5,1.55,-58.82],[-.5,1.81,-58.83]];
export function bound(n:number){return Number.isFinite(n)?Math.max(0,Math.min(1,n)):0}
export function ease(n:number){const t=bound(n);return t*t*(3-2*t)}
export function routePoint(points:Vec3[],t:number):[number,number,number]{const v=bound(t)*(points.length-1),i=Math.min(points.length-2,Math.floor(v)),f=v-i;const a=points[Math.max(0,i-1)]!,b=points[i]!,c=points[i+1]!,d=points[Math.min(points.length-1,i+2)]!;return [0,1,2].map(k=>.5*((2*b[k]!)+(-a[k]!+c[k]!)*f+(2*a[k]!-5*b[k]!+4*c[k]!-d[k]!)*f*f+(-a[k]!+3*b[k]!-3*c[k]!+d[k]!)*f*f*f)) as [number,number,number]}
export function routePose(t:number){const q=routePoint(localRoute,t);return {eye:[q[0]-.25,q[1]+1.4,q[2]+2.5] as Vec3,target:q,fov:46}}
// Destination is tangent to the far, night-facing side of the same Earth.
export function nightToWorld(v:Vec3):[number,number,number]{return worldAtDestination(v)}
const night=(p:number,eye:Vec3,target:Vec3,fov=46)=>({p,eye:nightToWorld(eye),target:nightToWorld(target),fov});
export const flightFrames:ReadonlyArray<{p:number;eye:Vec3;target:Vec3;fov:number}>=[
 // Establish the entrance and kiosk from the front, then descend along the service aisle.
 {p:0,eye:[38,22,53],target:[-3,1.8,-57],fov:52},
 {p:.035,eye:[17,9,5],target:[-3,1.8,-57],fov:52},
 {p:.065,eye:[9,5,-23],target:[15.45,1.7,-47.9],fov:55},
 {p:.08,eye:[9,3.4,-35],target:[15.45,1.65,-47.9],fov:55},
 {p:.105,eye:[10,3.1,-41.5],target:[15.45,1.65,-47.9],fov:52},
 {p:.125,eye:[10.5,2.8,-45],target:[15.45,1.65,-47.9],fov:46},
 {p:.175,eye:[11.7,2.25,-47.9],target:[15.45,1.65,-47.9],fov:43},
 // Exterior establishing shot first. Door entry is its own, later movement.
 {p:.22,eye:[10,4.3,-48],target:[-3,2.3,-57],fov:49},
 {p:.245,eye:[13,5.2,-46.5],target:[-3,2.3,-57],fov:48},
 {p:.275,eye:[2.5,3.4,-48.8],target:[-3,2.4,-56.4],fov:48},
 {p:.30,eye:[-.5,2.9,-52.3],target:[-.5,2.2,-58.7],fov:46},
 {p:.325,eye:[-.5,2.8,-56.1],target:[-.5,2.15,-58.75],fov:46},
 {p:.365,eye:[-.5,2.20,-58.45],target:[-.5,2.15,-58.794],fov:42},
 {p:.40,eye:[-.5,2.7,-51],target:[-.5,2,-57],fov:45},
 {p:.425,eye:[8,6,-40],target:[-3,2,-57],fov:46},
 {p:.45,eye:[26,25,48],target:[-3,0,-57],fov:48},
 {p:.50,eye:[80,138,205],target:[0,-22,0],fov:49},
 // Fixed globe, one shortest geographic arc from Türkiye to the continental USA.
 {p:.55,...orbitPose(0)},{p:.74,...orbitPose(1)},
 night(.76,[170,650,700],[20,0,0],47),
 night(.81,[130,155,210],[8,5,0],49),
 night(.86,[80,80,135],[12,12,5],47),
 night(.90,[52,52,76],[20,19.7,6],43),
 night(.93,[21.5,20.2,11],[20.8,19.6,4],45),
 night(.95,[20.85,19.95,6.5],[20,19.016,3.121],43),
 night(.975,[20.32,19.25,4.17],[20,19.016,3.121],43),
 night(1,[20.32,19.25,4.17],[20,19.016,3.121],43),
];
export function phase(p:number){const t=bound(p);for(let i=flightBreaks.length-2;i>=0;i--)if(t>=flightBreaks[i]!)return i;return 0}
export function flightPose(progress:number){const p=bound(progress);let pose:{eye:Vec3;target:Vec3;fov:number};if(p>=.55&&p<=.74)pose=orbitPose(ease((p-.55)/.19));else{let i=0;while(i<flightFrames.length-2&&p>flightFrames[i+1]!.p)i++;const a=flightFrames[i]!,b=flightFrames[i+1]!,t=ease((p-a.p)/(b.p-a.p));const mix=(x:Vec3,y:Vec3):[number,number,number]=>[0,1,2].map(k=>x[k]!+(y[k]!-x[k]!)*t) as [number,number,number];pose={eye:mix(a.eye,b.eye),target:mix(a.target,b.target),fov:a.fov+(b.fov-a.fov)*t}}return {...pose,up:flightUp(p)}}
