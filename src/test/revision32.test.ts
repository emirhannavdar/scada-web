import {it,expect} from 'vitest';
import * as T from 'three';
import {planTables,MODULE_W,MODULE_H,TABLE_D,tableLength} from '@/lib/flight/field';
import {createFlightWorld} from '@/lib/flight/world';
import {loadTestGLTF} from './helpers/load-gltf';
it('uses two full-size modules in depth, no more than three table bands before the road, and keeps the kiosk clearance',()=>{
 expect(MODULE_W).toBe(1.134);expect(MODULE_H).toBe(2.28);expect(TABLE_D).toBe(2*MODULE_H+.03);
 for(const t of planTables()){
  expect(planTables().filter(a=>a.row===t.row&&a.side===t.side).length).toBeLessThanOrEqual(3);
  const x0=t.x-tableLength(t.n)/2,x1=t.x+tableLength(t.n)/2,z0=t.z-TABLE_D/2,z1=t.z+TABLE_D/2;
  expect(x1>-8&&x0<3&&z1>-63&&z0<-50).toBe(false);expect(z1).toBeLessThan(4);
 }
});
it('keeps the restored wood boards in one instanced draw at the furniture floor level',()=>{
 const w=createFlightWorld({textures:false}),floor=w.scene.getObjectByName('home-floorboards') as T.InstancedMesh;
 expect(floor).toBeInstanceOf(T.InstancedMesh);expect(floor.count).toBe(224);
 const m=new T.Matrix4();floor.getMatrixAt(0,m);expect(m.elements[13]).toBeCloseTo(-.003);
 expect(w.scene.getObjectByName('home-floor-joints')!.visible).toBe(false);w.dispose();
});
it('the shipped room excludes both extra displays and the embedded bed assembly',async()=>{
 const model=await loadTestGLTF('gaming_room');
 for(const name of ['Monitor_2_127','Tv_9','Busa_Kasur_0','Kasur_1']){
  let meshes=0;model.scene.getObjectByName(name)?.traverse(o=>{if(o instanceof T.Mesh)meshes++;});expect(meshes,name).toBe(0);
 }
});
