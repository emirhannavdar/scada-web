import {spawn} from 'node:child_process';
const args=process.argv.slice(2),index=args.indexOf('--host');
const host=index>=0?(args[index+1]&&!args[index+1].startsWith('-')?args[index+1]:'0.0.0.0'):'127.0.0.1';
const children=[spawn(process.execPath,['server/index.mjs'],{stdio:'inherit',env:{...process.env,CMS_HOST:'127.0.0.1',CMS_PORT:'5189'}}),spawn(process.execPath,['node_modules/vite/bin/vite.js','--host',host,'--port','5188','--strictPort'],{stdio:'inherit'})];let stopping=false;function stop(code=0){if(stopping)return;stopping=true;children.forEach(c=>c.kill());process.exitCode=code}children.forEach(c=>{c.on('error',()=>stop(1));c.on('exit',code=>stop(code||0))});for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>stop());
