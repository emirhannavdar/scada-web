import ts from 'typescript';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
const code=ts.transpileModule(readFileSync('src/content/site.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const data=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const pages={};
for(const file of readdirSync('src/routes')){
 if(!file.endsWith('.tsx')||file.includes('$')||file.startsWith('__')||file==='admin.tsx'||file==='demo.tsx')continue;
 const source=ts.createSourceFile(file,readFileSync('src/routes/'+file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 function visit(n){if(ts.isCallExpression(n)&&n.expression.getText(source)==='seo'&&n.arguments.slice(0,2).every(ts.isStringLiteral)){const path=file==='index.tsx'?'/':'/'+file.replace('.index','').replace('.tsx','');pages[path]={title:n.arguments[0].text+' | ScadaWatt',description:n.arguments[1].text};}ts.forEachChild(n,visit)}visit(source);
}
writeFileSync('server/seo-manifest.json',JSON.stringify({pages,contact:data.contact,images:data.images},null,2)+'\n');
