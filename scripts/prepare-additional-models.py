from pathlib import Path
from PIL import Image
import json,struct,io,argparse
p=argparse.ArgumentParser();p.add_argument('source',type=Path);src=p.parse_args().source;out=Path('public/assets/models');out.mkdir(parents=True,exist_ok=True)
for name,source_name in {'landscape':'75_acres_land_w_creek_shelbyville_pinkston_rd','desktop_monitor':'monitor','office_chair':'office_chair','living_sofa':'sofa','detached_house':'detached_house_example_16','service_pickup':'conquer_89_pickup_-_low_poly_model','peel_building':'peel_center_-_building_block_t'}.items():
 b=(src/(source_name+'.glb')).read_bytes();n=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+n]);binary=b[28+n:];replacements={};limit=2048 if name in ['landscape','living_sofa'] else 1024
 for image in j.get('images',[]):
  v=j['bufferViews'][image['bufferView']];data=binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]
  with Image.open(io.BytesIO(data)) as im:
   im.load();im.thumbnail((limit,limit),Image.Resampling.LANCZOS);f=io.BytesIO();im.save(f,format='PNG',optimize=True);replacements[image['bufferView']]=f.getvalue();image['mimeType']='image/png'
 for m in j.get('materials',[]):
  ext=m.get('extensions',{}).pop('KHR_materials_pbrSpecularGlossiness',None)
  if ext:
   pbr={'baseColorFactor':ext.get('diffuseFactor',[1,1,1,1]),'metallicFactor':0,'roughnessFactor':max(.6,1-ext.get('glossinessFactor',0))}
   if 'diffuseTexture'in ext:pbr['baseColorTexture']=ext['diffuseTexture']
   m['pbrMetallicRoughness']=pbr
  if name=='solar_panel':
   m['pbrMetallicRoughness']['metallicFactor']=0;m['pbrMetallicRoughness']['roughnessFactor']=1;m['pbrMetallicRoughness'].pop('metallicRoughnessTexture',None)
   m.get('extensions',{}).pop('KHR_materials_specular',None)
 for field in ['extensionsRequired','extensionsUsed']:
  if field in j:j[field]=[x for x in j[field] if x!='KHR_materials_pbrSpecularGlossiness' and not(name=='solar_panel' and x=='KHR_materials_specular')]
 rebuilt=bytearray()
 for i,v in enumerate(j['bufferViews']):
  while len(rebuilt)%4:rebuilt.append(0)
  data=replacements.get(i,binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]);v['byteOffset']=len(rebuilt);v['byteLength']=len(data);rebuilt.extend(data)
 while len(rebuilt)%4:rebuilt.append(0)
 j['buffers']=[{'byteLength':len(rebuilt)}];j['asset']['copyright']='CC BY 4.0. Original author/source preserved in asset.extras; see /model-credits.html. Textures resized for web delivery. Geometry preserved.'
 js=json.dumps(j,separators=(',',':')).encode();js+=b' '*((-len(js))%4);result=struct.pack('<III',0x46546c67,2,12+8+len(js)+8+len(rebuilt))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(rebuilt),0x004e4942)+rebuilt;(out/(name+'.glb')).write_bytes(result);print(name,len(result),flush=True)
