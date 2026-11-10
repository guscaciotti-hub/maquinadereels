import { AULAS, STATUS, json, bad, body, clean, cleanText, validEmail, validAula, repo, notifyAdmin, publicTicket, preview, siteUrl } from '../lib/support.js';

export default async function handler(req, res){
  try {
    const { token, action } = req.query || {};
    if (req.method === 'GET' && action === 'aulas') return json(res, 200, { aulas: AULAS });

    // Lista "Seus chamados" a partir dos tokens guardados no navegador
    if (req.method === 'POST' && action === 'mine'){
      const tokens = (body(req).tokens || []).filter(t => typeof t === 'string' && /^[A-Za-z0-9_-]{20,64}$/.test(t)).slice(0, 50);
      if (!tokens.length) return json(res, 200, { tickets: [] });
      const rows = await repo().summariesByTokens(tokens);
      return json(res, 200, { tickets: rows.map(t => ({ token: t.token, aula: t.aula, status: t.status, created_at: t.created_at, updated_at: t.updated_at, ...preview(t) })) });
    }

    // Ler um ticket pelo token
    if (req.method === 'GET' && token){
      const t = await repo().getByToken(String(token));
      if (!t) return bad(res, 'Chamado não encontrado.', 404);
      return json(res, 200, { ticket: publicTicket(t) });
    }

    // Aluno responde no ticket
    if (req.method === 'POST' && token){
      const texto = cleanText(body(req).texto, 1000);
      if (texto.length < 2) return bad(res, 'Escreva sua resposta.');
      const t = await repo().getByToken(String(token));
      if (!t) return bad(res, 'Chamado não encontrado.', 404);
      const m = await repo().addMessage(t.id, 'aluno', texto, 'aberto');
      await notifyAdmin(req, { subject: `[Suporte] ${t.nome} respondeu no chamado #${t.id}`, text: `${t.nome} (${t.email})${t.aula ? ' · aula ' + t.aula : ''}:\n\n${texto}`, ticket: t });
      return json(res, 200, { ok: true, message: m, status: 'aberto' });
    }

    // Abrir chamado
    if (req.method === 'POST'){
      const b = body(req);
      if (clean(b.website, 50)) return json(res, 200, { ok: true, token: null }); // honeypot: finge sucesso
      const nome = clean(b.nome, 80), email = clean(b.email, 120).toLowerCase(), aula = clean(b.aula, 5), texto = cleanText(b.texto, 1000);
      if (nome.length < 2) return bad(res, 'Diga seu nome.');
      if (!validEmail(email)) return bad(res, 'Use o e-mail da compra, no formato nome@dominio.com.');
      if (texto.length < 10) return bad(res, 'Descreva a dúvida com um pouco mais de detalhe (mínimo 10 caracteres).');
      if (!validAula(aula)) return bad(res, 'Aula inválida.');
      if (await repo().countRecentByEmail(email, 24) >= 5) return bad(res, 'Você já abriu 5 chamados nas últimas 24h. Responda em um chamado existente ou tente amanhã.', 429);
      const t = await repo().createTicket({ nome, email, aula, texto });
      await notifyAdmin(req, { subject: `[Suporte] Novo chamado #${t.id} de ${nome}${aula ? ' · aula ' + aula : ''}`, text: `${nome} (${email})${aula ? ' · aula ' + aula : ''}:\n\n${texto}`, ticket: t });
      return json(res, 201, { ok: true, token: t.token, url: `${siteUrl(req)}/suporte/t/${t.token}` });
    }
    return bad(res, 'Método não permitido.', 405);
  } catch (e) {
    console.error(e);
    if (/não configuradas/.test(e?.message||'')) return bad(res, 'Suporte em configuração. Tente de novo mais tarde.', 503);
    return bad(res, 'Erro interno. Tente de novo em instantes.', 500);
  }
}
