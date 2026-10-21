import files from './model-manifest.json';
export function modelUrl(kind:keyof typeof files){return files[kind];}
/** Detach replaced drawables instead of leaving both model generations in the render tree. */
export function removeReplaced(root:import('three').Object3D,name:string){const list:import('three').Object3D[]=[];root.traverse(o=>{if(o.name===name)list.push(o)});for(const o of list){o.userData['superseded']=true;o.visible=false;o.removeFromParent();if('isInstancedMesh'in o&&(o as import('three').InstancedMesh).isInstancedMesh)(o as import('three').InstancedMesh).dispose();}}
