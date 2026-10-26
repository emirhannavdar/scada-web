import {it,expect} from 'vitest';
import * as T from 'three';
import {createFlightWorld} from '@/lib/flight/world';
import {HERO_INVERTER,ROAD_EAST,ROW_Z0,ROW_PITCH} from '@/lib/flight/field';
import {createInstanceCuller} from '@/lib/flight/instance-culling';
it('spaces auxiliary inverter cabinets every third row and puts the hero at the right panel facing the road',()=>{
 const w=createFlightWorld({textures:false});const rows=w.scene.getObjectByName('solar-field')!.userData['stringCabinetRows'] as number[];
 expect(rows.length).toBeGreaterThan(0);expect(rows.every(n=>n%3===0)).toBe(true);expect([...new Set(rows)].sort((a,b)=>a-b)).toEqual([0,3,6,12,15]);
 expect(HERO_INVERTER[0]).toBeLessThan(ROAD_EAST);expect(HERO_INVERTER[0]).toBeGreaterThan(15);
 expect(Math.abs(HERO_INVERTER[2]-(ROW_Z0+10*ROW_PITCH-.9))).toBeLessThan(.01);expect(w.inverter.rotation.y).toBeCloseTo(-Math.PI/2);
 const forward=new T.Vector3(0,0,1).applyQuaternion(w.inverter.quaternion);expect(forward.x).toBeLessThan(-.99);
 expect(w.scene.getObjectByName('local-data-cable')).toBeUndefined();w.dispose();
});
it('keeps traffic signal indices stable across instance culling and reversals',()=>{
 const w=createFlightWorld({textures:false}),bulbs=w.scene.getObjectByName('traffic-signal-lights') as T.InstancedMesh;
 const c=createInstanceCuller(w.scene);c.scan();for(const p of [.81,.9,.85]){w.update(p,16/9);c.update(w.camera);expect(bulbs.count).toBe(48);expect(bulbs.instanceColor).not.toBeNull();}w.dispose();
});
