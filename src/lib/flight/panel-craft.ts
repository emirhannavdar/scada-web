import * as T from 'three';
import type {DeviceKit} from './scada-device';
/** One coherent panel, measured in metres. No legacy equipment overlays or scaled duplicates. */
export function buildPanelCraft(panel:T.Group,{mat,basic,bodyGeo}:DeviceKit){
 const root=new T.Group();root.name='control-panel-din-equipment';root.position.set(-3,2.15,-44.90);panel.add(root);
 const frame=mat('#b8c3c1',.8),back=mat('#687b80',.9),white=mat('#e7e8dc',.8),dark=mat('#203038',.85),steel=mat('#a2afb1',.5,.35),green=basic('#79ac8b'),yellow=mat('#c3a149'),red=mat('#b05c43');
 green.name='panel-signal-indicators';
 const batches=new Map<T.Material,T.Matrix4[]>(),pose=new T.Object3D();
 function add(m:T.Material,p:number[],s:number[]){pose.position.fromArray(p);pose.scale.fromArray(s);pose.updateMatrix();const a=batches.get(m)??[];a.push(pose.matrix.clone());batches.set(m,a);}
 // Deep enclosure rim, darker steel backplate and a contrasting raised mounting surface.
 add(dark,[0,0,-.05],[.96,1.12,.08]);add(back,[0,0,0],[.88,1.04,.035]);
 for(const x of [-.47,.47])add(frame,[x,0,.065],[.035,1.13,.20]);for(const y of [-.55,.55])add(frame,[0,y,.065],[.96,.035,.20]);
 for(const x of [-.405,.405])add(white,[x,0,.085],[.048,1.01,.07]);
 for(const y of [-.45,-.21,.17,.46]){add(white,[0,y,.085],[.79,.045,.07]);for(let i=0;i<32;i++)add(dark,[-.38+i*.024,y,.123],[.008,.025,.004]);}
 for(const y of [-.34,0,.30]){add(dark,[0,y,.027],[.76,.085,.018]);add(steel,[0,y,.04],[.76,.032,.035]);}
 // Separate breakers: body, metal terminals, deep lever recess, high-contrast switch.
 for(let i=0;i<7;i++){const x=-.315+i*.069;add(white,[x,.31,.094],[.057,.157,.09]);add(dark,[x,.31,.144],[.028,.07,.014]);add(i%3===0?red:dark,[x,.315,.159],[.022,.033,.023]);for(const y of [.254,.365])add(steel,[x,y,.146],[.022,.016,.008]);}
 for(let i=0;i<3;i++){const x=.22+i*.066;add(dark,[x,.325,.10],[.054,.09,.08]);add(i===2?red:green,[x,.325,.147],[.029,.029,.012]);}
 // PLC/I-O left of S3000i. Power supply at the right. Clear centre reserved for the hero product.
 for(const x of [-.32,-.235]){add(dark,[x,-.006,.092],[.07,.17,.105]);add(white,[x,.025,.15],[.045,.034,.008]);for(const y of [-.075,.072])add(green,[x,y,.15],[.058,.018,.022]);}
 add(dark,[.29,0,.085],[.13,.19,.09]);add(white,[.29,.03,.135],[.095,.08,.015]);for(let i=0;i<5;i++)add(steel,[.246+i*.022,-.065,.142],[.009,.04,.007]);
 // Terminal row and tidy conductor runs, all supported by ducts and DIN rails.
 for(let i=0;i<22;i++){const x=-.35+i*.033;add(i>18?yellow:white,[x,-.34,.085],[.027,.105,.075]);add(dark,[x,-.34,.125],[.011,.023,.005]);for(const y of [-.384,-.293])add(steel,[x,y,.125],[.012,.01,.007]);}
 for(let i=0;i<14;i++){const x=-.33+i*.048;add(i%3===0?red:i%3===1?yellow:dark,[x,-.265,.04],[.0035,.065,.005]);add(dark,[x,.205,.04],[.0035,.04,.005]);}
 // Bottom cable opening, gland and earth bar are aligned with the external conduit.
 add(dark,[0,-.539,.045],[.10,.026,.08]);add(steel,[0,-.54,.045],[.075,.045,.07]);add(yellow,[0,-.49,.06],[.67,.021,.025]);
 for(const x of [-.34,-.26,-.18,-.1,.1,.18,.26,.34])add(steel,[x,-.49,.077],[.014,.014,.008]);
 const leaf=new T.Group();leaf.name='panel-schedule-label';root.add(leaf);
 for(const [m,a] of batches){const mesh=new T.InstancedMesh(bodyGeo,m,a.length);a.forEach((v,i)=>mesh.setMatrixAt(i,v));mesh.name='panel-equipment-batch';mesh.castShadow=false;mesh.receiveShadow=true;root.add(mesh);}
 root.userData['cabinetBounds']={min:[-.49,-.57,-.1],max:[.49,.57,.17]};
}
