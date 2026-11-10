// Camada compartilhada das rotas de API do suporte (roda só no servidor da Vercel).
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

export const AULAS = [
  ['1.1','Escolhendo o nicho'],['1.2','Montando a página do zero'],
  ['2.1','Criando o Projeto no Claude'],['2.2','Memória e tom de voz da página'],
  ['3.1','Conectores: ElevenLabs, Drive e Metricool'],['3.2','Seu primeiro reel sem aparecer'],['3.3','Modo lote e vídeos liberados'],
  ['4.1','Lendo as métricas no Metricool'],['4.2','Formatos validados'],
  ['5.1','Tarefas agendadas no Claude'],['5.2','Rotina diária no piloto automático'],['5.3','Revisão e aprovação em minutos'],
  ['6.1','ManyChat: link automático na DM'],['6.2','Palavras-chave e fluxos'],
  ['7.1','Afiliado: Shopee e TikTok Shop'],['7.2','Produto próprio'],
];
export const STATUS = ['aberto','respondido','fechado'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function json(res, status, body){ res.status(status).setHeader('Cache-Control','no-store'); res.json(body); }
export function bad(res, msg, status=400){ return json(res, status, { error: msg }); }
export function body(req){
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body) { try { return JSON.parse(req.body); } catch { return {}; } }
  return {};
}
export function clean(s, max){ return String(s ?? '').replace(/\s+/g,' ').trim().slice(0, max); }
export function cleanText(s, max){ return String(s ?? '').replace(/\r\n?/g,'\n').trim().slice(0, max); }
export function validEmail(e){ return EMAIL_RE.test(e) && e.length <= 120; }
export function validAula(a){ return !a || AULAS.some(([k]) => k === a); }
export function newToken(){ return crypto.randomBytes(24).toString('base64url'); }
export function siteUrl(req){
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/,'');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`;
}
export function adminEmail(){ return (process.env.ADMIN_EMAIL || '').trim().toLowerCase(); }

/* ---------- Banco: Supabase (service role) ou memória (SUPPORT_DB=memory, só pra testes locais) ---------- */
let _sb;
function sb(){
  if (_sb) return _sb;
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configuradas');
  _sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _sb;
}
const memory = { tickets: [], messages: [], seq: 1 };

const supabaseRepo = {
  async createTicket({ nome, email, aula, texto }){
    const token = newToken();
    const { data: t, error } = await sb().from('tickets').insert({ token, nome, email, aula: aula || null }).select().single();
    if (error) throw error;
    const { error: e2 } = await sb().from('messages').insert({ ticket_id: t.id, autor: 'aluno', texto });
    if (e2) throw e2;
    return t;
  },
  async countRecentByEmail(email, hours=24){
    const since = new Date(Date.now() - hours*3600e3).toISOString();
    const { count, error } = await sb().from('tickets').select('id', { count: 'exact', head: true }).ilike('email', email).gte('created_at', since);
    if (error) throw error; return count || 0;
  },
  async getByToken(token){
    const { data, error } = await sb().from('tickets').select('*, messages(id,autor,texto,created_at)').eq('token', token).order('created_at', { referencedTable: 'messages', ascending: true }).maybeSingle();
    if (error) throw error; return data;
  },
  async getById(id){
    const { data, error } = await sb().from('tickets').select('*, messages(id,autor,texto,created_at)').eq('id', id).order('created_at', { referencedTable: 'messages', ascending: true }).maybeSingle();
    if (error) throw error; return data;
  },
  async summariesByTokens(tokens){
    const { data, error } = await sb().from('tickets').select('token,aula,status,created_at,updated_at,messages(autor,texto,created_at)').in('token', tokens).order('updated_at', { ascending: false });
    if (error) throw error; return data;
  },
  async list(status){
    let q = sb().from('tickets').select('id,nome,email,aula,status,created_at,updated_at,messages(autor,texto,created_at)').order('created_at', { ascending: true });
    if (status) q = q.eq('status', status);
    const { data, error } = await q; if (error) throw error; return data;
  },
  async counts(){
    const { data, error } = await sb().from('tickets').select('status'); if (error) throw error;
    return data.reduce((a, r) => (a[r.status] = (a[r.status]||0)+1, a), {});
  },
  async addMessage(ticketId, autor, texto, status){
    const { data: m, error } = await sb().from('messages').insert({ ticket_id: ticketId, autor, texto }).select().single(); if (error) throw error;
    if (status) { const { error: e2 } = await sb().from('tickets').update({ status }).eq('id', ticketId); if (e2) throw e2; }
    return m;
  },
  async setStatus(id, status){ const { error } = await sb().from('tickets').update({ status }).eq('id', id); if (error) throw error; },
  async getUserByJwt(jwt){ const { data, error } = await sb().auth.getUser(jwt); if (error) return null; return data.user; },
  async sendMagicLink(email, redirectTo){ const { error } = await sb().auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } }); if (error) throw error; },
  async refresh(refresh_token){ const { data, error } = await sb().auth.refreshSession({ refresh_token }); if (error) throw error; return data.session; },
};

const memoryRepo = {
  _withMsgs(t){ return t && { ...t, messages: memory.messages.filter(m => m.ticket_id === t.id) }; },
  async createTicket({ nome, email, aula, texto }){
    const now = new Date().toISOString();
    const t = { id: memory.seq++, token: newToken(), nome, email, aula: aula || null, status: 'aberto', created_at: now, updated_at: now };
    memory.tickets.push(t); memory.messages.push({ id: memory.seq++, ticket_id: t.id, autor: 'aluno', texto, created_at: now }); return t;
  },
  async countRecentByEmail(email, hours=24){ const since = Date.now()-hours*3600e3; return memory.tickets.filter(t => t.email.toLowerCase()===email.toLowerCase() && Date.parse(t.created_at) >= since).length; },
  async getByToken(token){ return this._withMsgs(memory.tickets.find(t => t.token === token)); },
  async getById(id){ return this._withMsgs(memory.tickets.find(t => t.id === Number(id))); },
  async summariesByTokens(tokens){ return memory.tickets.filter(t => tokens.includes(t.token)).map(t => this._withMsgs(t)).sort((a,b)=>b.updated_at.localeCompare(a.updated_at)); },
  async list(status){ return memory.tickets.filter(t => !status || t.status===status).map(t => this._withMsgs(t)); },
  async counts(){ return memory.tickets.reduce((a, r) => (a[r.status] = (a[r.status]||0)+1, a), {}); },
  async addMessage(ticketId, autor, texto, status){
    const t = memory.tickets.find(x => x.id === Number(ticketId)); const now = new Date().toISOString();
    const m = { id: memory.seq++, ticket_id: t.id, autor, texto, created_at: now }; memory.messages.push(m); t.updated_at = now; if (status) t.status = status; return m;
  },
  async setStatus(id, status){ const t = memory.tickets.find(x => x.id === Number(id)); t.status = status; t.updated_at = new Date().toISOString(); },
  async getUserByJwt(jwt){ return jwt === 'dev-admin' ? { email: adminEmail() } : null; },
  async sendMagicLink(){ /* no-op em memória */ },
  async refresh(){ return { access_token: 'dev-admin', refresh_token: 'dev-admin', expires_in: 3600 }; },
};

export function repo(){ return process.env.SUPPORT_DB === 'memory' ? memoryRepo : supabaseRepo; }

/* ---------- Admin: só o e-mail da variável ADMIN_EMAIL ---------- */
export async function requireAdmin(req, res){
  const h = req.headers.authorization || '';
  const jwt = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!jwt) { bad(res, 'Faça login.', 401); return null; }
  const user = await repo().getUserByJwt(jwt);
  const email = (user?.email || '').toLowerCase();
  if (!email || !adminEmail() || email !== adminEmail()) { bad(res, 'Sem permissão.', 403); return null; }
  return user;
}

/* ---------- Aviso por e-mail (Resend) ---------- */
export async function notifyAdmin(req, { subject, text, ticket }){
  const key = process.env.RESEND_API_KEY, to = adminEmail();
  if (!key || !to) return { skipped: true };
  const from = process.env.SUPPORT_FROM || 'Suporte Máquina de Reels <onboarding@resend.dev>';
  const link = `${siteUrl(req)}/admin?id=${ticket.id}`;
  const html = `<p>${escapeHtml(text).replace(/\n/g,'<br>')}</p><p><a href="${link}">Abrir no painel de suporte</a></p>`;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text: `${text}\n\n${link}`, html }),
      signal: AbortSignal.timeout(5000),
    });
    return { ok: r.ok, status: r.status };
  } catch (e) { console.error('notify failed', e?.message); return { ok: false }; }
}
export function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
export function publicTicket(t){
  if (!t) return null;
  return { token: t.token, nome: t.nome, aula: t.aula, status: t.status, created_at: t.created_at, updated_at: t.updated_at,
    messages: (t.messages||[]).map(m => ({ id: m.id, autor: m.autor, texto: m.texto, created_at: m.created_at })) };
}
export function preview(t){ const ms = (t.messages||[]).slice().sort((a,b)=>a.created_at.localeCompare(b.created_at)); const first = ms[0], last = ms[ms.length-1]; return { first: first?.texto?.slice(0,140) || '', last_autor: last?.autor || null, last_at: last?.created_at || t.updated_at, count: ms.length }; }
