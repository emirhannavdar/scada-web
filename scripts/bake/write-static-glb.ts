import * as T from 'three';
import {MeshoptEncoder} from 'meshoptimizer';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
/** Offline only: preserve material/image bytes, bake geometry and encode indexed buffers. */
export async function writeStaticGLB(root:T.Object3D,source:any,original:Buffer,tag:string,geometryOnly=false){
 await MeshoptEncoder.ready;
 const n=original.readUInt32LE(12),old=JSON.parse(original.subarray(20,20+n).toString()),bin=original.subarray(28+n);
 const j:any={asset:{version:'2.0',generator:'ScadaWatt offline scene bake V34'},scene:0,scenes:[{nodes:[],extras:{prebakedV34:tag}}],nodes:[],meshes:[],materials:old.materials??[],textures:old.textures??[],samplers:old.samplers??[],images:[],accessors:[],bufferViews:[],buffers:[],extensionsUsed:[...new Set([...(old.extensionsUsed??[]),'EXT_meshopt_compression'])],extensionsRequired:['EXT_meshopt_compression']};
 const chunks:Buffer[]=[];let offset=0,fallback=0;
 function append(raw:Uint8Array,stride=0,mode='ATTRIBUTES'){
  let bytes:Uint8Array=raw;const v:any={buffer:0,byteOffset:offset,byteLength:raw.byteLength};
  if(stride){bytes=MeshoptEncoder.encodeGltfBuffer(raw,raw.byteLength/stride,stride,mode as any);v.buffer=1;v.byteOffset=fallback;v.extensions={EXT_meshopt_compression:{buffer:0,byteOffset:offset,byteLength:bytes.byteLength,byteStride:stride,count:raw.byteLength/stride,mode}};fallback+=raw.byteLength;}
  const id=j.bufferViews.length;j.bufferViews.push(v);chunks.push(Buffer.from(bytes));offset+=bytes.byteLength;const pad=(4-offset%4)%4;if(pad){chunks.push(Buffer.alloc(pad));offset+=pad;}return id;
 }
 if(geometryOnly){j.images=[];j.textures=[];const strip=(v:any)=>{if(!v||typeof v!=='object')return;for(const k of Object.keys(v)){if(k.endsWith('Texture'))delete v[k];else strip(v[k]);}};strip(j.materials);}
 for(const image of geometryOnly?[]:old.images??[]){const v=old.bufferViews[image.bufferView];j.images.push({...image,bufferView:append(bin.subarray(v.byteOffset??0,(v.byteOffset??0)+v.byteLength))});}
 function attribute(a:T.BufferAttribute,type:string,index=false){
  const array=index?new Uint32Array(a.array):new Float32Array(a.array),view=append(new Uint8Array(array.buffer),a.itemSize*4,index?'INDICES':'ATTRIBUTES');
  const result:any={bufferView:view,componentType:index?5125:5126,count:a.count,type};
  if(type==='VEC3'){result.min=[Infinity,Infinity,Infinity];result.max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<a.count;i++)for(let c=0;c<3;c++){result.min[c]=Math.min(result.min[c],array[i*3+c]!);result.max[c]=Math.max(result.max[c],array[i*3+c]!);}}
  j.accessors.push(result);return j.accessors.length-1;
 }
 const originalMaterials:number[]=[];source.scene.traverse((o:T.Object3D)=>{if(o instanceof T.Mesh)originalMaterials.push(source.parser.associations.get(Array.isArray(o.material)?o.material[0]:o.material)?.materials??0);});let meshIndex=0;
 root.traverse(o=>{if(!(o instanceof T.Mesh))return;const g=o.geometry.index?o.geometry:mergeVertices(o.geometry,1e-8);const material=Array.isArray(o.material)?o.material[0]:o.material;let mi=source.parser.associations.get(material)?.materials;
  if(tag==='landscape'&&mi===undefined){mi=originalMaterials[meshIndex];const mat=j.materials[mi];delete mat.extensions;mat.pbrMetallicRoughness.metallicFactor=0;mat.pbrMetallicRoughness.roughnessFactor=1;mat.doubleSided=true;}meshIndex++;
  if(mi===undefined){mi=j.materials.length;j.materials.push({pbrMetallicRoughness:{baseColorFactor:[...material.color.toArray(),1],metallicFactor:0,roughnessFactor:1},doubleSided:material.side===T.DoubleSide});}
  const attrs:any={};for(const [key,semantic,type]of [['position','POSITION','VEC3'],['normal','NORMAL','VEC3'],['uv','TEXCOORD_0','VEC2'],['color','COLOR_0','VEC3']])if(g.getAttribute(key!))attrs[semantic!]=attribute(g.getAttribute(key!) as T.BufferAttribute,type!);
  const primitive:any={attributes:attrs,material:mi};if(g.index)primitive.indices=attribute(g.index,'SCALAR',true);
  j.meshes.push({primitives:[primitive]});j.nodes.push({name:o.name,mesh:j.meshes.length-1,extras:o.userData});j.scenes[0].nodes.push(j.nodes.length-1);if(g!==o.geometry)g.dispose();
 });
 j.buffers=[{byteLength:offset},{byteLength:fallback,extensions:{EXT_meshopt_compression:{fallback:true}}}];
 const encoded=Buffer.from(JSON.stringify(j)),json=Buffer.concat([encoded,Buffer.alloc((4-encoded.length%4)%4,32)]),binary=Buffer.concat(chunks),out=Buffer.alloc(28+json.length+binary.length);
 out.writeUInt32LE(0x46546c67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);out.writeUInt32LE(json.length,12);out.writeUInt32LE(0x4e4f534a,16);json.copy(out,20);out.writeUInt32LE(binary.length,20+json.length);out.writeUInt32LE(0x004e4942,24+json.length);binary.copy(out,28+json.length);return out;
}
