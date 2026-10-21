"""Reproducible local GLB geometry/image optimization. No external decoder/runtime dependency."""
from pathlib import Path
import numpy as np,json,struct,io,hashlib,re,argparse
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'public/assets/models/optimized';OUT.mkdir(exist_ok=True)
parser=argparse.ArgumentParser();parser.add_argument('--source-models',type=Path,required=True);parser.add_argument('--new-models',type=Path,required=True);parser.add_argument('--only');args=parser.parse_args();UPLOAD=args.new_models
configs={
 'landscape':('landscape',2048,0), 'gravel_road':('gravel_road',2048,0),
 'solar_panel':('solar_panel',1024,0), 'pete':('pete',768,0), 'walker':('walker',768,0),
 'worker_hat':('worker',512,0), 'operator':('operator',1024,0), 'service_pickup':('service_pickup',2048,0),
 'simple_house':('simple_house',2048,0),'korean_apartment':('korean_apartment',1024,0),
 'small_villa':('small_villa',2048,0),'gaming_room':('gaming_room',2048,0),
}
# Villa exterior walls, roof, windows and doors; interior furnishings, dense hedge and scan plinth omitted.
VILLA={'Material8','Material9','Material7','Material24','Material31','Material32','Material32_1','Material47','Material48','Material57','Material61','Material62','Material73'}
DT={5120:np.dtype('i1'),5121:np.dtype('u1'),5122:np.dtype('<i2'),5123:np.dtype('<u2'),5125:np.dtype('<u4'),5126:np.dtype('<f4')};WIDTH={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
report=json.loads((ROOT/'MODEL_METRICS_V32.json').read_text())['models'] if args.only else {};manifest=json.loads((ROOT/'src/lib/flight/model-manifest.json').read_text()) if args.only else {}
for name,(source,limit,step) in configs.items():
 if args.only and name!=args.only:continue
 path=(UPLOAD/(source+'.glb')) if source in ['small_villa','gaming_room'] else args.source_models/f'{source}.glb'
 blob=path.read_bytes();n=struct.unpack_from('<I',blob,12)[0];j=json.loads(blob[20:20+n]);binary=blob[28+n:]
 before=sum(j['accessors'][p.get('indices',p['attributes']['POSITION'])]['count']//3 for m in j.get('meshes',[]) for p in m['primitives'])
 def read(i):
  a=j['accessors'][i];v=j['bufferViews'][a['bufferView']];dtype=DT[a['componentType']];width=WIDTH[a['type']];stride=v.get('byteStride',width*dtype.itemsize);start=v.get('byteOffset',0)+a.get('byteOffset',0)
  return np.ndarray((a['count'],width),dtype=dtype,buffer=binary,offset=start,strides=(stride,dtype.itemsize)).copy()
 # Mesh filtering leaves the source node names/hierarchy available to the scene installer.
 for node in j.get('nodes',[]):
  if 'mesh' not in node:continue
  keep=True;label=node.get('name','')
  if name=='worker_hat':keep=bool(re.search('hardhat|Cylinder',label,re.I))
  if name=='small_villa':keep=label in VILLA
  if name=='gaming_room':
   parents=[p.get('name','') for p in j['nodes'] if j['nodes'].index(node) in p.get('children',[])]
   parent=parents[0] if parents else ''
   # Omit enclosing walls/window planes (existing camera aperture), bed blanket and most repeated books.
   keep=not re.search(r'Lantai|Tembok|List_|Pintu|Jendela|Gorden|Gantungan|Selimut|Bantal|Busa[ _]Kasur|Kasur|Monitor[ _]2|Tv_9',parent,re.I)
   if re.search(r'Cube\.0(?:2[5-9]|[3-5]\d)',parent):keep=bool(re.search(r'Cube\.02[5-7]_',parent))
   # Tiny plant leaf pieces collapse into a single material batch later; retain the recognizable vase/foliage.
  if not keep:node.pop('mesh')
 if name in ['pete','small_villa','gaming_room']:j.pop('animations',None)
 # New buffer views are appended virtually then the final reachability pass removes original dead buffers.
 extra={}
 def add_array(arr,typ='VEC3',component=5126):
  arr=np.ascontiguousarray(arr,dtype=DT[component]);view=len(j['bufferViews']);j['bufferViews'].append({'buffer':0,'byteLength':arr.nbytes});extra[view]=arr.tobytes();idx=len(j['accessors']);a={'bufferView':view,'componentType':component,'count':len(arr),'type':typ};
  if typ!='SCALAR':a.update(min=arr.min(axis=0).astype(float).tolist(),max=arr.max(axis=0).astype(float).tolist())
  j['accessors'].append(a);return idx
 used_meshes={node['mesh'] for node in j['nodes'] if 'mesh'in node}
 if step:
  for mi in used_meshes:
   for p in j['meshes'][mi]['primitives']:
    attrs=p['attributes']
    if 'JOINTS_0'in attrs or p.get('mode',4)!=4 or j['accessors'][attrs['POSITION']]['count']<300:continue
    values={k:read(v) for k,v in attrs.items()};pos=values['POSITION'];keys=[np.round(pos/step).astype(np.int32)]
    if 'NORMAL'in values:keys.append(np.round(values['NORMAL']/.4).astype(np.int32))
    if 'TEXCOORD_0'in values:keys.append(np.floor(values['TEXCOORD_0']*16).astype(np.int32))
    key=np.concatenate(keys,axis=1);_,inv=np.unique(key,axis=0,return_inverse=True);count=int(inv.max())+1
    if count>len(pos)*.97:continue
    weights=np.bincount(inv);idx=read(p['indices']).reshape(-1) if 'indices'in p else np.arange(len(pos));faces=inv[idx].reshape(-1,3);faces=faces[(faces[:,0]!=faces[:,1])&(faces[:,0]!=faces[:,2])&(faces[:,1]!=faces[:,2])]
    if len(faces)==0:continue
    _,unique=np.unique(np.sort(faces,axis=1),axis=0,return_index=True);faces=faces[np.sort(unique)]
    p['attributes']={}
    for k,arr in values.items():
     out=np.column_stack([np.bincount(inv,weights=arr[:,c],minlength=count)/weights for c in range(arr.shape[1])]).astype(np.float32)
     if k=='NORMAL':out/=np.maximum(np.linalg.norm(out,axis=1,keepdims=True),1e-8)
     if k=='TANGENT':continue
     p['attributes'][k]=add_array(out,j['accessors'][attrs[k]]['type'])
    p['indices']=add_array(faces.reshape(-1,1),'SCALAR',5123 if count<65536 else 5125)
 # Materials/textures/images and accessors are garbage-collected, not merely hidden in the GLB.
 def remap(items,used):
  mapping={old:new for new,old in enumerate(sorted(used))};return [items[old] for old in sorted(used)],mapping
 j['meshes'],meshmap=remap(j['meshes'],used_meshes)
 for node in j['nodes']:
  if 'mesh'in node:node['mesh']=meshmap[node['mesh']]
 usedmat={p['material'] for m in j['meshes'] for p in m['primitives'] if 'material'in p}
 j['materials'],mm=remap(j.get('materials',[]),usedmat)
 for m in j['meshes']:
  for p in m['primitives']:
   if 'material'in p:p['material']=mm[p['material']]
 texrefs=[]
 def refs(o):
  if not isinstance(o,dict):return
  for k,v in o.items():
   if k.endswith('Texture') and isinstance(v,dict) and 'index'in v:texrefs.append(v)
   elif isinstance(v,dict):refs(v)
 for m in j['materials']:refs(m)
 j['textures'],tm=remap(j.get('textures',[]),{v['index'] for v in texrefs})
 for v in texrefs:v['index']=tm[v['index']]
 imgrefs=[]
 for t in j['textures']:
  if 'source'in t:imgrefs.append(t)
  for ext in t.get('extensions',{}).values():
   if isinstance(ext,dict) and 'source'in ext:imgrefs.append(ext)
 j['images'],im=remap(j.get('images',[]),{v['source'] for v in imgrefs})
 for v in imgrefs:v['source']=im[v['source']]
 dataimages=set()
 for m in j['materials']:
  for k in ['normalTexture','occlusionTexture']:
   if k in m:dataimages.add(j['textures'][m[k]['index']]['source'])
  pbr=m.get('pbrMetallicRoughness',{})
  if 'metallicRoughnessTexture'in pbr:dataimages.add(j['textures'][pbr['metallicRoughnessTexture']['index']]['source'])
 # JPEG for opaque color, PNG for data/alpha: fully standard glTF, no browser extensions needed.
 texturebytes=0
 for i,image in enumerate(j.get('images',[])):
  vi=image['bufferView'];v=j['bufferViews'][vi];raw=binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]
  with Image.open(io.BytesIO(raw)) as pic:
   pic.load();cap=min(limit,1024) if i in dataimages else limit;pic.thumbnail((cap,cap),Image.Resampling.LANCZOS);texturebytes+=pic.width*pic.height*4*4//3;f=io.BytesIO();alpha='A'in pic.getbands() and pic.getchannel('A').getextrema()[0]<255
   if i in dataimages:pic.save(f,format='PNG',optimize=True);image['mimeType']='image/png'
   else:pic.save(f,format='WEBP',quality=94,method=3);image['mimeType']='image/webp'
   extra[vi]=f.getvalue()
 for texture in j.get('textures',[]):
  si=texture.get('source')
  if si is not None and j['images'][si]['mimeType']=='image/webp':
   texture.setdefault('extensions',{})['EXT_texture_webp']={'source':si};texture.pop('source')
   for key in ['extensionsUsed','extensionsRequired']:
    if 'EXT_texture_webp' not in j.setdefault(key,[]):j[key].append('EXT_texture_webp')
 usedacc=set()
 for m in j['meshes']:
  for p in m['primitives']:
   usedacc.update(p['attributes'].values())
   if 'indices'in p:usedacc.add(p['indices'])
   for target in p.get('targets',[]):usedacc.update(target.values())
 for s in j.get('skins',[]):
  if 'inverseBindMatrices'in s:usedacc.add(s['inverseBindMatrices'])
 for anim in j.get('animations',[]):
  for s in anim['samplers']:usedacc.update([s['input'],s['output']])
 # Compact referenced accessor ranges out of shared/interleaved source buffers.
 for ai in sorted(usedacc):
  a=j['accessors'][ai];oldview=a.get('bufferView')
  if oldview is not None and oldview not in extra:
   array=read(ai);view=len(j['bufferViews']);j['bufferViews'].append({'buffer':0,'byteLength':array.nbytes});extra[view]=array.tobytes();a['bufferView']=view;a.pop('byteOffset',None)
 j['accessors'],am=remap(j['accessors'],usedacc)
 for m in j['meshes']:
  for p in m['primitives']:
   p['attributes']={k:am[v] for k,v in p['attributes'].items()}
   if 'indices'in p:p['indices']=am[p['indices']]
   for t in p.get('targets',[]):
    for k in t:t[k]=am[t[k]]
 for s in j.get('skins',[]):
  if 'inverseBindMatrices'in s:s['inverseBindMatrices']=am[s['inverseBindMatrices']]
 for a in j.get('animations',[]):
  for s in a['samplers']:s['input']=am[s['input']];s['output']=am[s['output']]
 views={a['bufferView'] for a in j['accessors'] if 'bufferView'in a}|{i['bufferView'] for i in j.get('images',[])}
 oldviews=j['bufferViews'];rebuilt=bytearray();j['bufferViews'],vm=remap(oldviews,views)
 for old,new in vm.items():
  view=j['bufferViews'][new];data=extra.get(old)
  if data is None:data=binary[view.get('byteOffset',0):view.get('byteOffset',0)+view['byteLength']]
  rebuilt.extend(b'\0'*((-len(rebuilt))%4));view['byteOffset']=len(rebuilt);view['byteLength']=len(data);rebuilt.extend(data)
 for a in j['accessors']:
  if 'bufferView'in a:a['bufferView']=vm[a['bufferView']]
 for image in j.get('images',[]):image['bufferView']=vm[image['bufferView']]
 rebuilt.extend(b'\0'*((-len(rebuilt))%4));j['buffers']=[{'byteLength':len(rebuilt)}];j['asset']['copyright']=j['asset'].get('extras',{}).get('license',j['asset'].get('copyright','See MODEL_SOURCES.md'))+'; web adaptation: resized/compressed textures, optional mesh simplification and removal of unseen parts.'
 js=json.dumps(j,separators=(',',':')).encode();js+=b' '*((-len(js))%4);result=struct.pack('<III',0x46546c67,2,28+len(js)+len(rebuilt))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(rebuilt),0x004e4942)+rebuilt
 digest=hashlib.sha256(result).hexdigest()[:12];filename=f'{name}.{digest}.glb';(OUT/filename).write_bytes(result);manifest[name]='/assets/models/optimized/'+filename
 after=sum(j['accessors'][p.get('indices',p['attributes']['POSITION'])]['count']//3 for m in j['meshes'] for p in m['primitives']);report[name]={'downloadBytes':len(result),'sourceBytes':len(blob),'triangles':after,'sourceTriangles':before,'estimatedTextureGPUBytes':texturebytes};print(name,report[name],flush=True)
(ROOT/'src/lib/flight/model-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');(ROOT/'MODEL_METRICS_V32.json').write_text(json.dumps({'models':report,'totalDownloadBytes':sum(v['downloadBytes'] for v in report.values()),'estimatedTextureGPUBytes':sum(v['estimatedTextureGPUBytes'] for v in report.values())},indent=2)+'\n')
# Remove obsolete hashed copies after generating the complete new manifest.
for p in OUT.glob('*.glb'):
 if '/assets/models/optimized/'+p.name not in manifest.values():p.unlink()
