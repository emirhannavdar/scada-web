import {fieldHeight} from './field';
function noise(x:number,z:number){const hash=(a:number,b:number)=>{const n=Math.sin(a*127.1+b*311.7)*43758.5453;return n-Math.floor(n)};const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);const a=hash(ix,iz)*(1-u)+hash(ix+1,iz)*u,b=hash(ix,iz+1)*(1-u)+hash(ix+1,iz+1)*u;return a*(1-v)+b*v;}
/** Flat plant pad blends into stony foothills instead of an empty plane. */
export function terrainHeight(x:number,z:number){
 const dx=Math.max(0,Math.abs(x)-83),dz=Math.max(0,-131-z,z-8),distance=Math.hypot(dx,dz);
 const ramp=Math.max(0,Math.min(1,(distance-17)/105));
 const ridge=12+9*Math.sin(x*.013+z*.008)**2+12*Math.sin(z*.011-x*.007)**2;
 const detail=(Math.sin(x*.071)*Math.cos(z*.053)+Math.sin((x+z)*.037)+.35*Math.sin(x*.19+z*.13))*Math.min(4,distance*.035);
 let height=fieldHeight(x,z)+ramp*ramp*ridge+detail*ramp+ramp*(5*(noise(x/27,z/27)-.5)+1.7*(noise(x/9,z/9)-.5));
 if(x>17&&x<31&&z>8&&z<23)height=0;
 if(Math.abs(x-9)<6&&z>-135&&z<28)height=0;
 return height;
}
