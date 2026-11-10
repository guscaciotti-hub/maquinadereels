import { STATUS, json, bad, body, clean, cleanText, validEmail, repo, requireAdmin, adminEmail, siteUrl, preview } from '../lib/support.js';

export default async function handler(req, res){
  try {
    const { action, id, status } = req.query || {};

    // Login: só manda o link mágico se for o e-mail do admin
    if (req.method === 'POST' && action === 'login'){
      const email = clean(body(req).email, 120).toLowerCase();
      if (!validEmail(email)) return bad(res, 'E-mail inválido.');
      if (!adminEmail()) return bad(res, 'ADMIN_EMAIL não configurado na Vercel.', 500);
      // resposta igual pra qualquer e-mail, pra não revelar qual é o admin
      if (email === adminEmail()) await repo().sendMagicLink(email, `${siteUrl(req)}/admin`);
      return json(res, 200, { ok: true });
    }
    if (req.method === 'POST' && action === 'refresh'){
      const rt = clean(body(req).refresh_token, 500);
      if (!rt) return bad(res, 'Sem refresh token.', 401);
      try { const s = await repo().refresh(rt); return json(res, 200, { access_token: s.access_token, refresh_token: s.refresh_token, expires_in: s.expires_in }); }
      catch { return bad(res, 'Sessão expirada. Faça login de novo.', 401); }
    }

    const user = await requireAdmin(req, res); if (!user) return;

    if (req.method === 'GET' && id){
      const t = await repo().getById(Number(id)); if (!t) return bad(res, 'Chamado não encontrado.', 404);
      return json(res, 200, { ticket: t });
    }
    if (req.method === 'GET'){
      const st = STATUS.includes(status) ? status : null;
      const [rows, counts] = await Promise.all([repo().list(st), repo().counts()]);
      return json(res, 200, { me: user.email, counts, tickets: rows.map(t => ({ id: t.id, nome: t.nome, email: t.email, aula: t.aula, status: t.status, created_at: t.created_at, updated_at: t.updated_at, ...preview(t) })) });
    }
    if (req.method === 'POST' && id && action === 'reply'){
      const texto = cleanText(body(req).texto, 4000); if (texto.length < 2) return bad(res, 'Escreva a resposta.');
      const t = await repo().getById(Number(id)); if (!t) return bad(res, 'Chamado não encontrado.', 404);
      const m = await repo().addMessage(t.id, 'suporte', texto, 'respondido');
      return json(res, 200, { ok: true, message: m, status: 'respondido' });
    }
    if (req.method === 'POST' && id && action === 'status'){
      const st = clean(body(req).status, 20); if (!STATUS.includes(st)) return bad(res, 'Status inválido.');
      await repo().setStatus(Number(id), st); return json(res, 200, { ok: true, status: st });
    }
    return bad(res, 'Rota não encontrada.', 404);
  } catch (e) {
    console.error(e);
    if (/não configuradas/.test(e?.message||'')) return bad(res, 'Suporte em configuração. Tente de novo mais tarde.', 503);
    return bad(res, 'Erro interno. Tente de novo em instantes.', 500);
  }
}
