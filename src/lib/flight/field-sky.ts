import * as T from 'three';
import type {DeviceKit} from './scada-device';
// Scene axes: +X east, +Z south. Representative Türkiye latitude, equinox,
// 16:00 apparent solar time (hour angle +60°). Fixed world-space sun; not screen-pinned.
// DOE: https://www.energy.gov/cmei/systems/solar-photovoltaic-system-design-basics
const latitude=T.MathUtils.degToRad(39),hourAngle=T.MathUtils.degToRad(60);
export const fieldSunDirection=new T.Vector3(-Math.sin(hourAngle),Math.cos(latitude)*Math.cos(hourAngle),Math.sin(latitude)*Math.cos(hourAngle)).normalize();
export function sunDirectionForAspect(_aspect:number){return fieldSunDirection.clone();}
const moonDirection=new T.Vector3(-.24,.28,-1).normalize();
/** Art-directed distant sky objects. No extra lights, bloom passes or panel gloss. */
export function buildFieldSky({geo,basic,mat,canvasMap}:DeviceKit){
 const root=new T.Group();root.name='field-celestials';
 const sunDirection=fieldSunDirection.clone();let previousAspect=0;
 const sunMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,toneMapped:false,
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
 fragmentShader:`varying vec2 vUv;
 void main(){
  vec2 q=(vUv-.5)*2.;float r=length(q);
  float disk=1.-smoothstep(.72,.77,r);
  float haze=exp(-r*r*5.)*.10;
  float edge=smoothstep(.15,.8,r);
  vec3 c=mix(vec3(1.,.90,.59),vec3(1.,.64,.23),edge*.3);
  
  gl_FragColor=vec4(c,max(disk*.96,haze)*(1.-smoothstep(.88,1.,r)));
 }`});
 const sun=new T.Mesh(geo(new T.PlaneGeometry(180,180)),sunMaterial);sun.name='field-sun';sun.position.copy(fieldSunDirection).multiplyScalar(700);root.add(sun);
 const haloMat=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,uniforms:{},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec2 vUv;void main(){vec2 q=(vUv-.5)*2.;float r=length(q);float a=exp(-r*r*6.)*.20*(1.-smoothstep(.65,1.,r));gl_FragColor=vec4(1.,.42,.12,a);}'});
 const halo=new T.Mesh(geo(new T.PlaneGeometry(440,440)),haloMat);halo.name='field-sun-corona';halo.position.copy(sun.position);root.add(halo);
 const flareMaterial=new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,uniforms:{uStrength:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`varying vec2 vUv;uniform float uStrength;void main(){vec2 q=(vUv-.5)*2.;float r=length(q);float ghost=exp(-r*r*9.)*.28+exp(-pow((r-.6)*15.,2.))*.075;float streak=exp(-q.y*q.y*850.)*exp(-q.x*q.x*4.)*.26;gl_FragColor=vec4(1.,.62,.30,(ghost+streak)*uStrength*(1.-smoothstep(.8,1.,r)));}`});
 const flares=[0,1,2].map(i=>{const m=new T.Mesh(geo(new T.PlaneGeometry(1,1)),flareMaterial);m.name='field-lens-ghost-'+i;m.renderOrder=20;root.add(m);return m;});
 const projected=new T.Vector3(),forward=new T.Vector3(),offset=new T.Vector3();
 const moonMaterial=mat('#c1ceda',1) as T.MeshStandardMaterial;moonMaterial.fog=false;moonMaterial.emissive.set('#71859d');moonMaterial.emissiveIntensity=.16;const map=canvasMap(256,256,c=>{c.fillStyle='#bbc5cd';c.fillRect(0,0,256,256);for(let i=0;i<140;i++){const x=(i*73)%256,y=(i*131)%256,r=2+(i*17)%12;c.fillStyle=i%3?'#66758135':'#f0f4f033';c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}});if(map){moonMaterial.map=map;moonMaterial.emissiveMap=map;moonMaterial.bumpMap=map;moonMaterial.bumpScale=.10;}
 const moon=new T.Mesh(geo(new T.SphereGeometry(9,24,16)),moonMaterial);moon.name='field-moon';moon.position.copy(moonDirection).multiplyScalar(700);root.add(moon);
 const positions=new Float32Array(650*3);for(let i=0;i<650;i++){const angle=i*2.399963,y=.08+.92*((i*137)%650)/650,r=Math.sqrt(1-y*y);positions.set([Math.cos(angle)*r*740,y*740,Math.sin(angle)*r*740],i*3);}const starGeo=geo(new T.BufferGeometry());starGeo.setAttribute('position',new T.BufferAttribute(positions,3));const starMaterial=new T.PointsMaterial({color:'#c6d8ed',size:1.2,sizeAttenuation:true,depthWrite:false});starMaterial.fog=false;starMaterial.toneMapped=false;const stars=new T.Points(starGeo,starMaterial);stars.name='field-stars';root.add(stars);
 return {root,materials:[sunMaterial,haloMat,flareMaterial,starMaterial],update(night:boolean,p:number,camera:T.Camera){const aspect=(camera as T.PerspectiveCamera).aspect||1909/946;if(aspect!==previousAspect){sunDirection.copy(sunDirectionForAspect(aspect));sun.position.copy(sunDirection).multiplyScalar(700);halo.position.copy(sun.position);previousAspect=aspect;}root.position.copy(camera.position);sun.visible=halo.visible=!night&&p<.53;moon.visible=stars.visible=night&&p<.53;sun.quaternion.copy(camera.quaternion);halo.quaternion.copy(camera.quaternion);
 camera.updateMatrixWorld(true);camera.getWorldDirection(forward);
 projected.copy(sunDirection).multiplyScalar(700).add(camera.position).project(camera);
 const alignment=T.MathUtils.smoothstep(forward.dot(sunDirection),.55,.98);
 flareMaterial.uniforms['uStrength']!.value=(.18+alignment*.7)*(1.-T.MathUtils.smoothstep(p,.08,.16));
 const halfHeight=Math.tan(T.MathUtils.degToRad((camera as T.PerspectiveCamera).fov/2))*400;
 flares.forEach((m,i)=>{m.visible=!night&&p<.16&&projected.z<1;const t=.22+i*.36;offset.set(-projected.x*t*halfHeight*aspect,-projected.y*t*halfHeight,-400).applyQuaternion(camera.quaternion);m.position.copy(offset);m.quaternion.copy(camera.quaternion);m.scale.setScalar(halfHeight*(i===1?.4:.22));});
 root.updateMatrixWorld(true);},direction(night:boolean){return night?moonDirection:sunDirection;}};
}
