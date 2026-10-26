import * as T from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
export type DeviceKit={geo:<G extends T.BufferGeometry>(g:G)=>G;mat:(c:T.ColorRepresentation,r?:number,m?:number)=>T.Material;basic:(c:T.ColorRepresentation)=>T.MeshBasicMaterial;bodyGeo:T.BufferGeometry;canvasMap:(w:number,h:number,paint:(c:CanvasRenderingContext2D)=>void)=>T.Texture|null;frontPhoto?:T.Texture|undefined;trackMap?:(t:T.Texture)=>void};
/** Physical enclosure with the actual S3000i photograph as its printed label.
 * UV crops preserve the factory logo, O/I, input, RS485 and power markings.
 * Normalized proportions are read from the reference, not a dimensional CAD drawing.
 */
export function buildScadaDevice(kit:DeviceKit,_code='S3000i',accent='#1766a3'){
 const {geo,mat,basic,bodyGeo}=kit,root=new T.Group();root.name='scada-reference-model';
 const black=mat('#171d21',.82),trim=mat(accent,.65,.15),green=mat('#4f8c4a',.85),silver=mat('#a8b7b9',.45,.5);
 const rounded=geo(new RoundedBoxGeometry(1,1,1,2,.04));
 const batches=new Map<T.BufferGeometry,Map<T.Material,T.Matrix4[]>>(),pose=new T.Object3D();
 function box(m:T.Material,p:number[],s:number[],round=false){const geometry=round?rounded:bodyGeo;let materials=batches.get(geometry);if(!materials){materials=new Map();batches.set(geometry,materials);}const matrices=materials.get(m)??[];pose.position.fromArray(p);pose.scale.fromArray(s);pose.rotation.set(0,0,0);pose.updateMatrix();matrices.push(pose.matrix.clone());materials.set(m,matrices);}
 box(black,[0,0,0],[1.2,.88,.46],true);
 for(const y of [-.435,.435])box(trim,[0,y,.025],[1.28,.075,.53],true);
 const paper=basic('#e5e5df');paper.toneMapped=false;box(paper,[0,0,.233],[1.09,.765,.012],true);
 function photoCrop(rect:[number,number,number,number]){if(!kit.frontPhoto)return null;const [x,y,w,h]=rect,tex=kit.frontPhoto.clone();tex.offset.set(x/900,1-(y+h)/900);tex.repeat.set(w/900,h/900);tex.needsUpdate=true;kit.trackMap?.(tex);return tex;}
 const label=photoCrop([113,202,674,473]);if(label){const m=basic('#ffffff');m.map=label;m.toneMapped=false;const face=new T.Mesh(geo(new T.PlaneGeometry(1.09,.765)),m);face.name='factory-printed-front-label';face.position.z=.241;root.add(face);}
 // Eight signal poles (inputs 1–3, Modbus A1/B1/GND, serial A2/B2), then a separate DC pair.
 const ports=[394,426,458,490,522,554,586,618,682,716].map(x=>(x-450)/674*1.09);
 const screwGeometry=geo(new T.CylinderGeometry(.016,.016,.008,8)),screws=new T.InstancedMesh(screwGeometry,silver,ports.length);
 for(const [i,x] of ports.entries()){box(green,[x,-.515,.10],[.050,.105,.18],true);pose.scale.set(1,1,1);pose.rotation.set(Math.PI/2,0,0);pose.position.set(x,-.50,.196);pose.updateMatrix();screws.setMatrixAt(i,pose.matrix);box(black,[x,-.50,.202],[.025,.003,.002]);}
 root.add(screws);
 const bezel=new T.Mesh(geo(new T.CylinderGeometry(.091,.091,.027,24)),black);bezel.name='round-power-rocker';bezel.rotation.x=Math.PI/2;bezel.position.set(.328,.23,.255);root.add(bezel);
 const rocker=basic('#242b30');rocker.toneMapped=false;const switchMap=photoCrop([604,248,101,101]);if(switchMap)rocker.map=switchMap;
 const switchFace=new T.Mesh(geo(new T.CircleGeometry(.079,24)),rocker);switchFace.position.set(.328,.23,.270);root.add(switchFace);
 // Actual RJ45 receptacle faces downwards. The front photograph is a printed legend.
 box(silver,[-.405,-.452,.02],[.16,.025,.19]);box(black,[-.405,-.467,.02],[.125,.006,.15]);
 for(const y of [-.217,-.305]){const led=new T.Mesh(geo(new T.CircleGeometry(.011,10)),basic('#759775'));led.position.set(-.263,y,.246);root.add(led);}
 for(const [geometry,materials] of batches)for(const [material,matrices] of materials){const mesh=new T.InstancedMesh(geometry,material,matrices.length);matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));root.add(mesh);}
 root.userData['terminalX']=ports;root.userData['terminalY']=-.5675;root.userData['ethernetSocket']=[-.405,-.471,.02];root.userData['ethernetDirection']=[0,-1,0];root.userData['portLabels']=['INPUT-1','INPUT-2','INPUT-3','MODBUS A1','MODBUS B1','GND','SERIAL A2','SERIAL B2','POWER V−','POWER V+'];root.userData['referenceProportions']=[1.28,1.003,.53];return root;
}
