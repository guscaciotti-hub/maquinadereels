# Checklist — o que você precisa fazer

## Antes de anunciar (hoje)
- [ ] **Contato:** editar `site/contato.html` e trocar `SEU-EMAIL@DOMINIO.COM` e `NOME / CNPJ OU CPF` pelos seus dados (a Meta e a Kiwify exigem contato visível). Também vale colocar o e-mail no rodapé dos termos.
- [ ] **Testar a compra real:** abrir a página no celular, clicar em "Quero a máquina", concluir um Pix de teste e confirmar que o e-mail da Kiwify chega.
- [ ] **Pixel:** abrir a página com a extensão Meta Pixel Helper (ou Gerenciador de Eventos > Testar eventos) e confirmar PageView, ViewContent (25/50/75% da VSL) e InitiateCheckout. Depois, no Gerenciador de Eventos, marcar InitiateCheckout como evento de conversão/otimização (ou Purchase se você ativar o pixel/CAPI dentro da Kiwify).
- [ ] **Purchase:** dentro da Kiwify, em Apps > Pixel do Facebook, cadastrar o pixel 1124095767280326 pra disparar Purchase no obrigado (a página de vendas só consegue disparar até o InitiateCheckout).
- [ ] **Domínio:** comprar/apontar um domínio (ex.: maquinadereels.com.br) e adicioná-lo no projeto da Vercel (Settings > Domains). Anúncio com domínio próprio converte melhor e sofre menos bloqueio do que `*.vercel.app`.
- [ ] **UTMs no anúncio:** usar na URL do anúncio parâmetros como `?utm_source=meta&utm_medium=cpc&utm_campaign={{campaign.name}}&utm_content={{ad.name}}`. A página repassa tudo pro checkout e a Kiwify mostra nos relatórios.

## Assets
- [ ] Se quiser trocar os mockups CSS por prints reais do curso, coloque as imagens em `site/assets/img/` (WebP, até 720 px de largura) e substitua os blocos `.phone` em `site/index.html`.
- [ ] A VSL em 1080x1920 (`vsl-maquina-de-reels-1080x1920.mp4`) serve também como criativo do anúncio. Pra regerar com outro texto, siga o README.

## Ambiente
- [ ] Ambiente `maquinadereels` criado na nuvem com acesso a ElevenLabs e token da Vercel salvo como segredo (nunca no código). Se quiser usar a API da ElevenLabs direto no pipeline, defina `ELEVENLABS_API_KEY` como variável de ambiente nesse ambiente.
- [ ] Conectar o repositório GitHub ao projeto da Vercel (Settings > Git) com Root Directory = `site`, pra cada push na branch principal publicar sozinho.
