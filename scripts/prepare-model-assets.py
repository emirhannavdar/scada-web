"""Repack locally downloaded CC0 GLBs; keep geometry/rig/clips, resize embedded textures."""
from pathlib import Path
from PIL import Image
import struct,json,io,argparse
parser=argparse.ArgumentParser();parser.add_argument('source',type=Path,help='Folder holding pickup.glb, worker.glb, walker.glb, operator.glb and sofa.glb');source=parser.parse_args().source
out=Path('public/assets/models');out.mkdir(parents=True,exist_ok=True)
for name in ['pickup','worker','walker','operator','sofa']:
 b=(source/(name+'.glb')).read_bytes();n=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+n]);binstart=20+n+8;binary=b[binstart:];replacements={}
 for image in j.get('images',[]):
  view=j['bufferViews'][image['bufferView']];data=binary[view.get('byteOffset',0):view.get('byteOffset',0)+view['byteLength']]
  with Image.open(io.BytesIO(data)) as im:
   im.load();im.thumbnail((1024,1024),Image.Resampling.LANCZOS);f=io.BytesIO()
   # PNG is retained for every data map and alpha channel; no gamma operations.
   im.save(f,format='PNG',optimize=True);replacements[image['bufferView']]=f.getvalue();image['mimeType']='image/png'
 rebuilt=bytearray()
 for i,v in enumerate(j['bufferViews']):
  while len(rebuilt)%4:rebuilt.append(0)
  data=replacements.get(i,binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]);v['byteOffset']=len(rebuilt);v['byteLength']=len(data);rebuilt.extend(data)
 while len(rebuilt)%4:rebuilt.append(0)
 j['buffers']=[{'byteLength':len(rebuilt)}];j.setdefault('asset',{})['copyright']='CC0 — Innerscene; MakeHuman/MPFB sources for people. See MODEL_SOURCES.md. Textures resized to 1024px; geometry and animation retained.'
 js=json.dumps(j,separators=(',',':')).encode();js+=b' '*((-len(js))%4)
 result=struct.pack('<III',0x46546c67,2,12+8+len(js)+8+len(rebuilt))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(rebuilt),0x004e4942)+rebuilt
 (out/(name+'.glb')).write_bytes(result);print(name,len(b),'->',len(result),'animations',len(j.get('animations',[])),flush=True)
