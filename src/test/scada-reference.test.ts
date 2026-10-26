import {it,expect} from 'vitest';
import * as T from 'three';
import {buildScadaDevice} from '@/lib/flight/scada-device';
it('matches real label UVs, a round O/I rocker, eight signal terminals and a separate DC pair',()=>{
 const textures:T.Texture[]=[],photo=new T.Texture(),root=buildScadaDevice({geo:g=>g,mat:c=>new T.MeshStandardMaterial({color:c}),basic:c=>new T.MeshBasicMaterial({color:c}),bodyGeo:new T.BoxGeometry(1,1,1),canvasMap:()=>null,frontPhoto:photo,trackMap:t=>textures.push(t)});
 const face=root.getObjectByName('factory-printed-front-label') as T.Mesh;expect(face).toBeTruthy();const map=(face.material as T.MeshBasicMaterial).map!;expect(map.image).toBe(photo.image);expect(map.offset.x).toBeCloseTo(113/900);expect(map.repeat.y).toBeCloseTo(473/900);const rocker=root.getObjectByName('round-power-rocker') as T.Mesh;expect(rocker.geometry.type).toBe('CylinderGeometry');expect(root.userData['portLabels']).toHaveLength(10);const ports=root.userData['terminalX'] as number[];expect(ports[8]!-ports[7]!).toBeGreaterThan((ports[1]!-ports[0]!)*1.5);expect(root.children.length).toBeLessThan(16);expect(textures).toHaveLength(2);
 root.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose()}});textures.forEach(t=>t.dispose());photo.dispose();
});
