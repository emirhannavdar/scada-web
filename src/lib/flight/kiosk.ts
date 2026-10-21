import {buildPanelCraft} from './panel-craft';
import {applySurface} from './surface-materials';
import * as T from 'three';
import {ease,type Vec3} from './path';
export function kioskOpening(p:number){return ease((p-.25)/.05)*(1-ease((p-.405)/.045));}
type Kit={scene:T.Scene;geo:<G extends T.BufferGeometry>(g:G)=>G;mat:(c:T.ColorRepresentation,r?:number,m?:number)=>T.MeshStandardMaterial;basic:(c:T.ColorRepresentation)=>T.MeshBasicMaterial;bodyGeo:T.BufferGeometry;canvasMap:(w:number,h:number,paint:(c:CanvasRenderingContext2D)=>void)=>T.Texture|null;placard:(parent:T.Object3D,text:string,pos:Vec3,w:number,h:number,bg?:string,fg?:string)=>T.Mesh};
export function buildKiosk({scene,geo,mat,basic,bodyGeo,placard,canvasMap}:Kit){
 const root=new T.Group();root.name='electrical-kiosk';root.position.z=-14;root.userData['bounds']={min:[-7,0,-45.4],max:[1,4.7,-40.6]};scene.add(root);
 const wall=mat('#c7c4b5',1),edge=mat('#ba703f',.9),steel=mat('#b9c2bb',.85,.15),dark=mat('#28363c',1),plinth=mat('#3c4548',1),board=mat('#d0d4cc',.95),blue=mat('#335e70',.85),cableMat=mat('#25343c',1),hazard=basic('#e2b948');
 applySurface(wall,'concrete',canvasMap,3);applySurface(steel,'zinc',canvasMap,2);
 function box(parent:T.Object3D,m:T.Material,p:Vec3,s:Vec3){const mesh=new T.Mesh(bodyGeo,m);mesh.position.set(...p);mesh.scale.set(...s);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 box(root,plinth,[-3,.27,-43],[8.3,.54,5]);box(root,wall,[-3,2.55,-45.4],[8,4,.2]);for(const x of [-7,1])box(root,wall,[x,2.55,-43],[.2,4,4.8]);box(root,board,[-3,.57,-43],[7.8,.12,4.6]);box(root,wall,[-3,4.5,-43],[8.3,.26,5]);box(root,edge,[-3,4.7,-43],[8.7,.23,5.35]);
 // Cast concrete joints, drip-edge flashing, threshold and weather seals.
 for(const x of [-6.9,.9]){box(root,plinth,[x,2.5,-40.475],[.035,3.8,.018]);box(root,steel,[x,4.46,-43],[.04,.035,4.7]);}
 for(let i=0;i<12;i++)box(root,dark,[-6.75+i*.68,.4,-40.48],[.035,.12,.012]);
 for(const x of [-4.39,-1.61])box(root,dark,[x,2.25,-40.49],[.025,3.3,.04]);
 box(root,steel,[-3,4.51,-40.47],[8.4,.06,.25]);
 // Three service bays: switchgear, control panel, and transformer/cable compartment.
 const auxiliary:T.Group[]=[];for(const [x,w,side] of [[-6,1.8,-1],[-.2,2.2,1]] as const){for(const xx of [x-w/2,x+w/2])box(root,wall,[xx,2.55,-40.6],[.15,4,.18]);box(root,wall,[x,4.32,-40.6],[w,.35,.18]);const hinge=new T.Group();hinge.position.set(x+side*(w/2-.12),.65,-40.4);root.add(hinge);const center=-side*(w-.28)/2;box(hinge,steel,[center,1.7,0],[w-.28,3.4,.1]);box(hinge,dark,[center-side*.4,1.75,.09],[.045,.3,.05]);for(let i=0;i<10;i++)box(hinge,dark,[center,.25+i*.07,.067],[w*.68,.024,.025]);placard(hinge,'DİKKAT',[center,2.55,.068],.44,.22,'#dfb63a','#26343b');hinge.userData['side']=side;auxiliary.push(hinge);}
 for(const x of [-4.5,-1.5])box(root,wall,[x,2.55,-40.6],[.2,4,.2]);box(root,wall,[-3,4.32,-40.6],[2.9,.35,.2]);box(root,dark,[-3,.58,-40.5],[2.8,.15,.28]);
 const doors:T.Group[]=[];for(const side of [-1,1]){const pivot=new T.Group();pivot.name=side===-1?'kiosk-door-left':'kiosk-door-right';pivot.position.set(side===-1?-4.4:-1.6,.65,-40.4);root.add(pivot);const center=-side*.69;box(pivot,steel,[center,1.7,0],[1.37,3.4,.1]);for(const y of [.15,3.25])box(pivot,dark,[center,y,.065],[1.26,.035,.025]);box(pivot,dark,[center-side*.43,1.75,.09],[.04,.28,.05]);for(let i=0;i<9;i++)box(pivot,dark,[center,.25+i*.07,.065],[.95,.025,.025]);placard(pivot,'DİKKAT',[center,2.55,.067],.45,.22,'#dfb63a','#26343b');doors.push(pivot);}
 // Cable-entry recesses and side louvres reproduce the reference construction language.
 const holeGeo=geo(new T.CircleGeometry(.075,12));for(let i=0;i<16;i++){const hole=new T.Mesh(holeGeo,dark);hole.position.set(-6.6+i*.47,.26,-40.485);root.add(hole);}for(let i=0;i<17;i++)box(root,dark,[1.115,1.3+i*.09,-43],[.025,.035,2.1]);
 // A single control cabinet; other service bays retain their switchgear.
 const panel=new T.Group();panel.name='kiosk-scada-panel';panel.position.x=2.5;root.add(panel);
 placard(root,'VERİ TOPLAMA KÖŞKÜ',[-3,4.27,-40.48],2.1,.19,'#d4d8cf','#293b43');
 // Full-height switchgear cells, supply units and transformer mass populate all bays.
 const equipment=new T.Group();equipment.name='kiosk-interior-equipment';root.add(equipment);
 for(const x of [-6.35,-5.65]){box(equipment,steel,[x,2.2,-41.7],[.62,3.1,1.15]);box(equipment,dark,[x,2.75,-41.1],[.52,.5,.05]);box(equipment,board,[x,3.3,-41.08],[.46,.38,.04]);box(equipment,blue,[x,2.72,-41.04],[.3,.15,.05]);box(equipment,dark,[x,2.0,-41.08],[.08,.28,.07]);for(let k=0;k<6;k++)box(equipment,dark,[x-.22+k*.085,1.1,-41.1],[.035,.3,.02]);placard(equipment,'HÜCRE',[x,3.7,-41.09],.44,.14);}
 // Slim cabinets flank the central clear aisle, leaving the SCADA view and camera route open.
 for(const x of [-4.1,-1.9]){box(equipment,steel,[x,1.98,-43.65],[.48,2.65,.85]);box(equipment,dark,[x,2.8,-43.2],[.34,.27,.025]);for(let k=0;k<5;k++)box(equipment,blue,[x-.16+k*.08,2.2,-43.19],[.055,.38,.04]);box(equipment,board,[x,1.35,-43.19],[.32,.55,.04]);}
 const copper=mat('#8a6549',.85,.2);box(equipment,dark,[-5.8,.85,-44.2],[1.55,.55,1.65]);box(equipment,steel,[-5.8,1.7,-44.2],[1.4,1.25,1.35]);for(let i=0;i<13;i++)box(equipment,dark,[-6.48+i*.115,1.7,-43.47],[.035,1.15,.24]);for(const x of [-6.3,-5.8,-5.3]){box(equipment,board,[x,2.65,-44.15],[.18,.6,.18]);box(equipment,copper,[x,2.95,-44.15],[.26,.08,.22]);}
 const cableCurve=new T.CatmullRomCurve3([new T.Vector3(-5.5,3.9,-44.8),new T.Vector3(-5.3,3.5,-44.45),new T.Vector3(-5.3,2.9,-44.15)]);const thickCable=new T.Mesh(geo(new T.TubeGeometry(cableCurve,24,.055,8,false)),dark);equipment.add(thickCable);
 box(equipment,steel,[-3,4.03,-44.9],[7.3,.22,.2]);for(let i=0;i<20;i++)box(equipment,dark,[-6.5+i*.36,4.04,-44.78],[.06,.18,.015]);
 for(let i=0;i<8;i++)box(root,dark,[-3,.645,-44.6+i*.42],[2.45,.018,.025]);box(root,basic('#d9e1d9'),[-3,4.28,-41.1],[1.5,.04,.22]);
 // Floor cable trench, bonded earth bar and supported service wiring; keep the access aisle clear.
 const earthing=mat('#54715b',.85),earthCopper=mat('#9b7650',.65,.5);
 box(equipment,dark,[-.5,.64,-43.2],[.42,.035,3.5]);
 for(let i=0;i<22;i++)box(equipment,steel,[-.5,.665,-44.8+i*.15],[.44,.018,.035]);
 // Conduit ends overlap the cabinet gland; it no longer stops in mid-air.
 const conduit=new T.Mesh(geo(new T.CylinderGeometry(.025,.025,.98,10)),dark);conduit.name='panel-supply-conduit';conduit.position.set(-.5,1.135,-44.855);equipment.add(conduit);
 for(const y of [.82,1.20,1.52])box(equipment,steel,[-.5,y,-44.88],[.085,.018,.065]);
 placard(equipment,'TOPRAKLAMA',[-5.8,1.08,-43.34],.68,.12,'#e4cd58','#24343b');
 buildPanelCraft(panel,{geo,mat,basic,bodyGeo,canvasMap});
 placard(panel,'SCADAWATT / KONTROL',[-3,2.66,-44.765],.66,.033,'#e1e6df','#273c43');
 const light=new T.PointLight('#e3e9da',12,7,2);light.position.set(-3,3.8,-42.5);root.add(light);
 return {root,panel,update(p:number){const angle=kioskOpening(p)*Math.PI*.59;doors[0]!.rotation.y=-angle;doors[1]!.rotation.y=angle;for(const door of auxiliary)door.rotation.y=(door.userData['side'] as number)*angle;}};
}
