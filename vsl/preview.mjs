import { createRequire } from 'node:module'; const { chromium } = createRequire(import.meta.url)('playwright'); import fs from 'node:fs'; import path from 'node:path';
const here=path.dirname(new URL(import.meta.url).pathname);
const tl=JSON.parse(fs.readFileSync(path.join(here,'build/timeline.json'),'utf8'));
const browser=await chromium.launch(); const page=await browser.newPage({viewport:{width:1080,height:1920}});
page.on('pageerror',e=>console.log('PAGEERROR',e.message)); page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});
await page.goto('file://'+path.join(here,'render.html')); await page.evaluate(()=>document.fonts.ready);
await page.evaluate(({words,scenes,dur})=>window.setup(words,scenes,dur),tl);
fs.mkdirSync(path.join(here,'build/preview'),{recursive:true});
for(const t of (process.argv[2]||'2,10,14.5,17,24,29.5,32,38,46,50').split(',').map(Number)){ await page.evaluate(t=>window.seek(t),t); await page.screenshot({path:path.join(here,`build/preview/t${t}.jpg`),type:'jpeg',quality:80}); }
await browser.close(); console.log('previews ok');
