"""Offline lossless WebP packing. Retains dimensions and verifies decoded RGBA bytes."""
from pathlib import Path
import json,struct,hashlib,io
from PIL import Image
root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/'src/lib/flight/model-manifest.json').read_text());report={}
for kind,url in manifest.items():
 path=root/('public'+url);original=path.read_bytes();n=struct.unpack_from('<I',original,12)[0];j=json.loads(original[20:20+n]);binary=original[28+n:];replacements={};webp=set();verified=[]
 for idx,image in enumerate(j.get('images',[])):
  view=j['bufferViews'][image['bufferView']];raw=binary[view.get('byteOffset',0):view.get('byteOffset',0)+view['byteLength']]
  im=Image.open(io.BytesIO(raw))
  if im.info.get('icc_profile'):continue
  pixels=im.convert('RGBA').tobytes();out=io.BytesIO();im.save(out,'WEBP',lossless=True,method=4,exact=True)
  data=out.getvalue()
  if len(data)>=len(raw) or Image.open(io.BytesIO(data)).convert('RGBA').tobytes()!=pixels:continue
  replacements[image['bufferView']]=data;image['mimeType']='image/webp';webp.add(idx);verified.append({'image':idx,'width':im.width,'height':im.height,'rgbaSHA256':hashlib.sha256(pixels).hexdigest(),'before':len(raw),'after':len(data)})
 if replacements:
  chunks=[];offset=0
  for idx,view in enumerate(j['bufferViews']):
   ext=view.get('extensions',{}).get('EXT_meshopt_compression')
   if ext:
    raw=binary[ext.get('byteOffset',0):ext.get('byteOffset',0)+ext['byteLength']];ext['byteOffset']=offset
   else:
    raw=replacements.get(idx,binary[view.get('byteOffset',0):view.get('byteOffset',0)+view['byteLength']]);view['byteOffset']=offset;view['byteLength']=len(raw)
   chunks.append(raw);offset+=len(raw);pad=(-offset)%4;chunks.append(b'\0'*pad);offset+=pad
  for texture in j.get('textures',[]):
   if texture.get('source') in webp:texture.setdefault('extensions',{})['EXT_texture_webp']={'source':texture.pop('source')}
  for key in ['extensionsUsed','extensionsRequired']:j[key]=sorted(set(j.get(key,[]))|{'EXT_texture_webp'})
  binary=b''.join(chunks);j['buffers'][0]['byteLength']=len(binary);header=json.dumps(j,separators=(',',':')).encode();header+=b' '*((-len(header))%4)
  result=struct.pack('<III',0x46546c67,2,28+len(header)+len(binary))+struct.pack('<II',len(header),0x4e4f534a)+header+struct.pack('<II',len(binary),0x004e4942)+binary
  newurl='/assets/models/optimized/'+kind+'.'+hashlib.sha256(result).hexdigest()[:12]+'.glb';(root/('public'+newurl)).write_bytes(result);manifest[kind]=newurl
 else:result=original
 report[kind]={'before':len(original),'after':len(result),'verifiedImages':verified}
 print(kind,len(original),'->',len(result),flush=True)
(root/'src/lib/flight/model-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(root/'TEXTURE_METRICS_V34.json').write_text(json.dumps(report,indent=2)+'\n')
