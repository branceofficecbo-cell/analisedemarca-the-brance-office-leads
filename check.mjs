import {readdir, readFile, access} from 'node:fs/promises';
import {resolve, dirname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=fileURLToPath(new URL('./',import.meta.url));
const files=[];
async function collect(dir){
  for(const item of await readdir(dir,{withFileTypes:true})){
    const path=resolve(dir,item.name);
    if(item.isDirectory())await collect(path);
    else files.push(path);
  }
}
for(const folder of ['public','api','server','netlify/functions'])await collect(resolve(root,folder));
let count=0;
for(const file of files){
  if(!/\.(js|mjs)$/.test(file))continue;
  const check=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(check.error)throw check.error;
  if(check.status!==0)throw new Error(check.stderr||'Sintaxe inválida: '+file);
  const content=await readFile(file,'utf8');
  for(const match of content.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)){
    const target=resolve(dirname(file),match[1]);
    if(!target.startsWith(root.endsWith(sep)?root:root+sep))throw new Error('Import fora do site');
    await access(target);
  }
  count++;
}
const pkg=JSON.parse(await readFile(resolve(root,'package.json'),'utf8'));
if(pkg.type!=='module')throw new Error('Configuração de módulos ausente');
const config=await readFile(resolve(root,'netlify.toml'),'utf8');
if(!config.includes('publish = "public"')||!config.includes('directory = "netlify/functions"'))throw new Error('Publicação Netlify inválida');
console.log(count+' arquivos de código conferidos. Imports e configuração de publicação presentes.');
