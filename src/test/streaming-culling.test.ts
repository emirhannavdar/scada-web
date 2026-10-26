import {it,expect,vi} from 'vitest';
import * as T from 'three';
import {prepareScene} from '@/lib/flight/prepare-scene';
import {createInstanceCuller} from '@/lib/flight/instance-culling';
import {createFlightWorld,type FlightWorld} from '@/lib/flight/world';
it('keeps the opening locked until every essential model is ready',async()=>{
 let resolve!:()=>void;const startStreaming=vi.fn(),world={scene:new T.Scene(),camera:new T.PerspectiveCamera(),update:vi.fn(),startStreaming,textureReady:new Promise<void>(r=>{resolve=r})} as unknown as FlightWorld;
 const renderer={compileAsync:vi.fn().mockResolvedValue(undefined)} as unknown as T.WebGLRenderer;let finished=false;
 const ready=prepareScene(renderer,world,16/9,()=>{},()=>false).then(()=>{finished=true});await Promise.resolve();expect(startStreaming).toHaveBeenCalledOnce();expect(finished).toBe(false);expect(renderer.compileAsync).not.toHaveBeenCalled();resolve();await ready;expect(finished).toBe(true);expect(world.update).toHaveBeenCalledExactlyOnceWith(0,16/9);expect(renderer.compileAsync).toHaveBeenCalledOnce();
});
it('restores culled houses and their colors when reversing the camera',()=>{
 const scene=new T.Scene(),mesh=new T.InstancedMesh(new T.BoxGeometry(),new T.MeshBasicMaterial(),8);scene.add(mesh);
 for(let i=0;i<8;i++){mesh.setMatrixAt(i,new T.Matrix4().makeTranslation(i*20,0,0));mesh.setColorAt(i,new T.Color(i===0?'red':'blue'));}
 const c=createInstanceCuller(scene);c.scan();const camera=new T.PerspectiveCamera(40,1,.1,100);camera.position.set(0,0,10);camera.lookAt(0,0,0);c.update(camera);expect(mesh.count).toBe(1);const color=new T.Color();mesh.getColorAt(0,color);expect(color.getHexString()).toBe('ff0000');
 camera.position.x=140;camera.lookAt(140,0,0);c.update(camera);expect(mesh.count).toBe(1);mesh.getColorAt(0,color);expect(color.getHexString()).toBe('0000ff');const m=new T.Matrix4();mesh.getMatrixAt(0,m);expect(m.elements[12]).toBe(140);
 camera.position.x=0;camera.lookAt(0,0,0);c.update(camera);mesh.getMatrixAt(0,m);expect(m.elements[12]).toBe(0);camera.lookAt(0,0,20);c.update(camera);expect(mesh.count).toBe(0);c.clear();mesh.dispose();mesh.geometry.dispose();(mesh.material as T.Material).dispose();
});
it('hides interiors during skyline approach and exterior after entering the room',()=>{
 const w=createFlightWorld({textures:false}),city=w.scene.getObjectByName('night-city')!,room=w.scene.getObjectByName('remote-home')!;
 w.update(.85,16/9);expect(room.visible).toBe(false);expect(city.visible).toBe(true);w.update(.93,16/9);expect(room.visible).toBe(true);w.update(.96,16/9);expect(city.children.filter(o=>o!==room&&o.visible)).toHaveLength(0);w.update(.6,16/9);expect(city.visible).toBe(false);w.dispose();
});
