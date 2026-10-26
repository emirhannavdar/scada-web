import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import manifest from '@/lib/flight/model-manifest.json';
import {modelCacheControl} from '@/lib/asset-cache';
it('uses verified content hashes and applies immutable caching only to versioned assets',()=>{for(const path of Object.values(manifest)){const bytes=readFileSync('public'+path),digest=createHash('sha256').update(bytes).digest('hex').slice(0,12);expect(path).toContain('.'+digest+'.glb');expect(modelCacheControl(path)).toContain('immutable');expect(bytes.readUInt32LE(8)).toBe(bytes.length);}expect(modelCacheControl('/assets/screens/live.webp')).toBeNull();expect(modelCacheControl('/index.html')).toBeNull();});
