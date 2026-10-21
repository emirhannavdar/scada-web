import * as T from 'three';
import type {FlightWorld} from './world';
/** Do not unlock scrolling while people, field assets or the operator are still arriving. */
export async function prepareScene(renderer:T.WebGLRenderer,world:FlightWorld,aspect:number,onProgress:(value:number)=>void,cancelled:()=>boolean){
 if(cancelled())return;onProgress(.1);world.startStreaming?.();await world.textureReady;
 if(cancelled())return;world.update(0,aspect);onProgress(.85);
 if(typeof renderer.compileAsync==='function')await renderer.compileAsync(world.scene,world.camera);
 if(cancelled())return;onProgress(.9);
}
