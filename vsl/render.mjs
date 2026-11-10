// Renders the VSL: Playwright screenshots of render.html at 30fps -> ffmpeg mp4 with narration + music.
import { createRequire } from 'node:module'; const { chromium } = createRequire(import.meta.url)('playwright');
import fs from 'node:fs'; import path from 'node:path'; import { execSync } from 'node:child_process';
const here=path.dirname(new URL(import.meta.url).pathname);
const tl=JSON.parse(fs.readFileSync(path.join(here,'build/timeline.json'),'utf8'));
const FPS=30, W=1080, H=1920, OUT=path.join(here,'build/frames'); fs.rmSync(OUT,{recursive:true,force:true}); fs.mkdirSync(OUT,{recursive:true});
const SCALE=Number(process.env.SCALE||0.5); // render at half res for speed, upscale is crisp enough for text? no: render full res.
const browser=await chromium.launch(); const page=await browser.newPage({viewport:{width:W,height:H},deviceScaleFactor:1});
await page.goto('file://'+path.join(here,'render.html')); await page.evaluate(()=>document.fonts.ready);
await page.evaluate(({words,scenes,dur})=>window.setup(words,scenes,dur),tl);
const total=Math.ceil(tl.dur*FPS); const t0=Date.now();
for(let i=0;i<total;i++){ await page.evaluate(t=>window.seek(t),i/FPS); await page.screenshot({path:path.join(OUT,String(i).padStart(5,'0')+'.jpg'),type:'jpeg',quality:92}); if(i%150===0) console.log(`frame ${i}/${total} ${(Date.now()-t0)/1000|0}s`); }
await browser.close();
console.log('frames done');
