# Checklist — o que você precisa fazer

## Antes de anunciar (hoje)
- [ ] **Contato:** editar `site/contato.html` e trocar `SEU-EMAIL@DOMINIO.COM` e `NOME / CNPJ OU CPF` pelos seus dados (a Meta e a Kiwify exigem contato visível). Também vale colocar o e-mail no rodapé dos termos.
- [ ] **Testar a compra real:** abrir a página no celular, clicar em "Quero a máquina", concluir um Pix de teste e confirmar que o e-mail da Kiwify chega.
- [ ] **Pixel:** abrir a página com a extensão Meta Pixel Helper (ou Gerenciador de Eventos > Testar eventos) e confirmar PageView, ViewContent (25/50/75% da VSL) e InitiateCheckout. Depois, no Gerenciador de Eventos, marcar InitiateCheckout como evento de conversão/otimização (ou Purchase se você ativar o pixel/CAPI dentro da Kiwify).
- [ ] **Purchase:** dentro da Kiwify, em Apps > Pixel do Facebook, cadastrar o pixel 1124095767280326 pra disparar Purchase no obrigado (a página de vendas só consegue disparar até o InitiateCheckout).
- [ ] **Domínio:** a página está em https://maquinadereels-site.vercel.app. Comprar/apontar um domínio (ex.: maquinadereels.com.br) e adicioná-lo no projeto da Vercel (Settings > Domains). Anúncio com domínio próprio converte melhor e sofre menos bloqueio do que `*.vercel.app`.
- [ ] **UTMs no anúncio:** usar na URL do anúncio parâmetros como `?utm_source=meta&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{ad.name}}`. A página repassa tudo pro checkout e a Kiwify mostra nos relatórios.

## Assets
- [ ] Se quiser trocar os mockups CSS por prints reais do curso, coloque as imagens em `site/assets/img/` (WebP, até 720 px de largura) e substitua os blocos `.phone` em `site/index.html`.
- [ ] A VSL em 1080x1920 (`vsl-maquina-de-reels-1080x1920.mp4`) serve também como criativo do anúncio. Pra regerar com outro texto, siga o README.

## Ambiente
- [ ] Ambiente `maquinadereels` criado na nuvem com acesso a ElevenLabs e token da Vercel salvo como segredo (nunca no código). Se quiser usar a API da ElevenLabs direto no pipeline, defina `ELEVENLABS_API_KEY` como variável de ambiente nesse ambiente.
- [x] Repositório conectado ao projeto `maquinadereels-site` na Vercel (Root Directory `site`, branch `claude/determined-keller-x986v3`): cada push publica sozinho.

## Suporte online (/suporte e /admin)
Variáveis de ambiente do projeto `maquinadereels-site` na Vercel (Settings > Environment Variables, ambiente Production):
- [ ] `SUPABASE_URL` = URL do projeto Supabase "Claude" (https://gmycqvvvglexbtbqkjzi.supabase.co)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = chave service_role do mesmo projeto (Supabase > Project Settings > API Keys). Só no servidor; nunca vai pro navegador.
- [ ] `ADMIN_EMAIL` = o único e-mail que pode entrar em /admin
- [ ] `RESEND_API_KEY` = chave do Resend (resend.com), pra receber o aviso de novo chamado. Opcional: `SUPPORT_FROM` = remetente verificado (ex.: Suporte <suporte@seudominio.com>). Sem domínio verificado, o Resend só entrega do remetente de teste pro e-mail da própria conta Resend.
- [ ] Depois de salvar as variáveis, faça um Redeploy (Deployments > ⋯ > Redeploy) pra elas valerem.

Supabase (projeto "Claude"), em Authentication > URL Configuration:
- [ ] Adicionar `https://maquinadereels-site.vercel.app/admin` em Redirect URLs (ou como Site URL). Sem isso o link mágico volta pra localhost.

Como funciona a segurança: tabelas `tickets` e `messages` com RLS ligado e sem política pra anon/authenticated (nenhum acesso direto pelo navegador). O aluno só lê/escreve pelo token do link, via /api/tickets. O /admin só aceita o e-mail de `ADMIN_EMAIL`, validado no servidor a cada requisição.
