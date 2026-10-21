import {Vector3} from 'three/src/math/Vector3.js';
import {Matrix4} from 'three/src/math/Matrix4.js';
import {Quaternion} from 'three/src/math/Quaternion.js';
export const globeCenter=new Vector3(0,-1000,0);
// Representative anchors inside the user's ranges; not a claim about customer addresses.
export const geographicAnchors={turkiye:{lat:39,lon:35.5},usa:{lat:38,lon:-97}};
/** Three SphereGeometry + equirectangular map: u=(lon+180)/360, v=(lat+90)/180. */
export function geographicNormal(lat:number,lon:number){const a=lat*Math.PI/180,b=lon*Math.PI/180;return new Vector3(Math.cos(a)*Math.cos(b),Math.sin(a),-Math.cos(a)*Math.sin(b));}
function basis(lat:number,lon:number){const a=lat*Math.PI/180,b=lon*Math.PI/180;const up=geographicNormal(lat,lon),east=new Vector3(-Math.sin(b),0,-Math.cos(b)),north=new Vector3(-Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b));return {up,east,north};}
const tr=basis(geographicAnchors.turkiye.lat,geographicAnchors.turkiye.lon);
export const globeOrientation=new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(tr.east,tr.up,tr.north.clone().negate())).invert();
const us=basis(geographicAnchors.usa.lat,geographicAnchors.usa.lon);
export const turkeyUp=tr.up.clone().applyQuaternion(globeOrientation),turkeyNorth=tr.north.clone().applyQuaternion(globeOrientation);
export const usaUp=us.up.clone().applyQuaternion(globeOrientation),usaNorth=us.north.clone().applyQuaternion(globeOrientation),usaEast=us.east.clone().applyQuaternion(globeOrientation);
export const destinationOrientation=new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(usaEast,usaUp,usaNorth.clone().negate()));
export const destinationOrigin=globeCenter.clone().addScaledVector(usaUp,1000);
export const travelAngle=turkeyUp.angleTo(usaUp);
export function shortestArc(t:number){const u=Math.max(0,Math.min(1,t)),a=Math.sin((1-u)*travelAngle)/Math.sin(travelAngle),b=Math.sin(u*travelAngle)/Math.sin(travelAngle);return turkeyUp.clone().multiplyScalar(a).addScaledVector(usaUp,b).normalize();}
export function worldAtDestination(v:readonly[number,number,number]):[number,number,number]{return new Vector3(...v).applyQuaternion(destinationOrientation).add(destinationOrigin).toArray() as [number,number,number];}
export function orbitPose(t:number){const u=Math.max(0,Math.min(1,t)),radius=2800-400*u;const eye=shortestArc(u).multiplyScalar(radius).add(globeCenter);return {eye:eye.toArray() as [number,number,number],target:globeCenter.toArray() as [number,number,number],fov:48};}
export function flightUp(p:number):[number,number,number]{const ease=(n:number)=>{const t=Math.max(0,Math.min(1,n));return t*t*(3-2*t)};let up:Vector3;if(p<.55)up=new Vector3(0,1,0).lerp(turkeyNorth,ease((p-.50)/.05));else if(p<=.74)up=turkeyNorth.clone().lerp(usaNorth,ease((p-.55)/.19));else up=usaNorth.clone().lerp(usaUp,ease((p-.74)/.06));return up.normalize().toArray() as [number,number,number];}
