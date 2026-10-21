import {modelCacheControl} from './src/lib/asset-cache';
import type {Plugin} from 'vite';
import type {IncomingMessage,ServerResponse} from 'node:http';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import { fileURLToPath, URL } from 'node:url';
const cacheHeaders=(req:IncomingMessage,res:ServerResponse,next:()=>void)=>{const policy=modelCacheControl(req.url??'');if(policy){const set=res.setHeader.bind(res);res.setHeader=(name,value)=>set(name,name.toLowerCase()==='cache-control'?policy:value);res.setHeader('Cache-Control',policy);}next();};
const cachePlugin:Plugin={name:'scadawatt-model-cache',configureServer(server){server.middlewares.use(cacheHeaders);},configurePreviewServer(server){server.middlewares.use(cacheHeaders);}};
export default defineConfig({
 plugins:[cachePlugin,tanstackRouter({target:'react',autoCodeSplitting:true}),react(),tailwindcss()],
 build:{rollupOptions:{output:{manualChunks(id){if(id.includes('/node_modules/')){if(/\/(react|react-dom|scheduler)\//.test(id))return 'react';if(/\/(motion|framer-motion|motion-dom|motion-utils)\//.test(id))return 'motion';if(id.includes('/@tanstack/'))return 'router';}return undefined;}}}},
 resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}},
 server:{host:'127.0.0.1',port:5188,strictPort:true,proxy:{'/api':{target:'http://127.0.0.1:5189',changeOrigin:false},'/uploads':{target:'http://127.0.0.1:5189',changeOrigin:false}}},
 preview:{host:'127.0.0.1',port:5188,strictPort:true}
});
