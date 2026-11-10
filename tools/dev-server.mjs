// Servidor local pra testar o site + rotas de API como na Vercel. Uso: SUPPORT_DB=memory ADMIN_EMAIL=x node tools/dev-server.mjs 8090
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
const root = path.resolve(new URL('../site', import.meta.url).pathname); const port = Number(process.argv[2]||8090);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.mp4':'video/mp4', '.webp':'image/webp', '.jpg':'image/jpeg', '.woff2':'font/woff2', '.json':'application/json', '.svg':'image/svg+xml' };
const rewrites = [[/^\/suporte\/t\/[^/]+$/, '/suporte/ticket']];
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x'); let p = u.pathname;
  if (p.startsWith('/api/')) {
    const mod = await import(pathToFileURL(path.join(root, p + '.js')).href + '?t=' + Date.now());
    let raw=''; for await (const c of req) raw += c; let body = raw; try { body = JSON.parse(raw); } catch {}
    const vreq = Object.assign(req, { query: Object.fromEntries(u.searchParams), body });
    const vres = Object.assign(res, { status(c){ res.statusCode = c; return vres; }, json(o){ res.setHeader('Content-Type','application/json'); res.end(JSON.stringify(o)); }, send(s){ res.end(s); } });
    return mod.default(vreq, vres);
  }
  for (const [re, to] of rewrites) if (re.test(p)) p = to;
  let f = path.join(root, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
  if (!fs.existsSync(f)) { res.statusCode = 404; return res.end('not found'); }
  res.setHeader('Content-Type', types[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(res);
}).listen(port, () => console.log('dev server on', port));
