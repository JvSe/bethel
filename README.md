# Bethel — Gestão do lar

O Bethel é um site para a família cuidar da casa e da vida de fé no mesmo lugar: finanças, compras, despensa, tarefas, manutenção, calendário, devocional, oração e gratidão.

Cada família tem o seu espaço. Quem cria a casa convida os demais com um link.

---

## Como publicar na internet (gratuito)

Você não precisa programar. São três contas grátis e alguns copiar e colar.

### 1. Banco de dados — Neon

1. Acesse [neon.tech](https://neon.tech) e crie uma conta (pode usar Google ou GitHub).
2. Crie um projeto. Pode deixar o nome **bethel**.
3. Na tela do projeto, copie **duas** connection strings (as duas começam com `postgresql://`):
   - **Pooled** (host com `-pooler`) — o site usa esta.
   - **Direct** (sem `-pooler`) — o Prisma usa esta para criar as tabelas (`DIRECT_URL`).

Não rode `prisma db seed` no banco da internet. O seed apaga todos os dados e só existe para o computador.

### 2. E-mail — Resend

1. Acesse [resend.com](https://resend.com) e crie uma conta.
2. Em **API Keys**, crie uma chave e copie. Guarde no bloco de notas.
3. Em **Domains**, valide o domínio do seu e-mail (ex.: `seudominio.com`). Sem isso, o Resend só entrega para o e-mail da sua conta — as outras famílias não recebem convite nem “esqueci a senha”.
4. Use um remetente desse domínio, por exemplo `Bethel <ola@seudominio.com>`.

### 3. Site — Cloudflare Workers

O Bethel é um monorepo. No painel da Cloudflare, deixe o **root** na pasta do repositório (não em `apps/web`) e use estes comandos:

| Campo | Valor |
|-------|--------|
| Install command | `pnpm install --frozen-lockfile` |
| Build command | `pnpm run build` |
| Deploy command | `npx wrangler deploy` |

Não deixe o painel rodar `wrangler` “migrate” ou criar o projeto sozinho: o npm não entende o `catalog:` do pnpm. A configuração já está no repositório (`wrangler.jsonc`).

Em **Settings → Variables and Secrets** (Production), cadastre:

| Nome | O que colar |
|------|-------------|
| `DATABASE_URL` | Connection string **pooled** do Neon (host com `-pooler`) |
| `DIRECT_URL` | Connection string **direta** do Neon (sem `-pooler`) |
| `BETTER_AUTH_SECRET` | Um texto com pelo menos 32 caracteres. Gere em [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32) e cole |
| `BETTER_AUTH_URL` | Deixe `https://placeholder.workers.dev` por agora — você corrige depois do primeiro deploy |
| `CORS_ORIGIN` | O mesmo valor de `BETTER_AUTH_URL` |
| `RESEND_API_KEY` | A chave do Resend |
| `EMAIL_FROM` | `Bethel <ola@seudominio.com>` — precisa ser um endereço do domínio validado no Resend |

Depois do primeiro deploy, o Cloudflare mostra o endereço (algo como `https://bethel.<sua-conta>.workers.dev`). Atualize `BETTER_AUTH_URL` e `CORS_ORIGIN` para **esse endereço** (sem barra no final) e faça um novo deploy.

O `next build` não precisa das variáveis para *compilar*, mas o site **não funciona** sem elas em runtime.

### Alternativa — Vercel

1. Coloque este projeto no GitHub (um repositório privado serve).
2. Acesse [vercel.com](https://vercel.com), entre com a mesma conta do GitHub e clique em **Add New → Project**.
3. Importe o repositório do Bethel.
4. Em **Root Directory**, clique em **Edit** e escolha `apps/web`.
5. Em **Environment Variables**, adicione (uma de cada vez):

| Nome | O que colar |
|------|-------------|
| `DATABASE_URL` | Connection string **pooled** do Neon (host com `-pooler`) |
| `DIRECT_URL` | Connection string **direta** do Neon (sem `-pooler`) |
| `BETTER_AUTH_SECRET` | Um texto com pelo menos 32 caracteres. Gere em [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32) e cole |
| `BETTER_AUTH_URL` | Deixe `https://placeholder.vercel.app` por agora — você corrige no passo 7 |
| `CORS_ORIGIN` | O mesmo valor de `BETTER_AUTH_URL` |
| `RESEND_API_KEY` | A chave do Resend |
| `EMAIL_FROM` | `Bethel <ola@seudominio.com>` — precisa ser um endereço do domínio validado no Resend |

6. Clique em **Deploy**.
7. Quando terminar, a Vercel mostra o endereço do site, algo como `https://bethel-xxxx.vercel.app`.
8. Volte em **Settings → Environment Variables** e atualize `BETTER_AUTH_URL` e `CORS_ORIGIN` para **esse endereço real** (sem barra no final).
9. Em **Deployments**, abra o último deploy e clique em **Redeploy**. Sem isso o login não funciona.

Pronto. Abra o endereço, clique em **Começar grátis**, crie a sua família e convide as pessoas pelo menu no canto da tela.

Não use as contas de teste da Família Nunes no site publicado. Elas existem só no computador, para desenvolvimento. Nunca rode o seed contra o Neon de produção.

---

## No computador (opcional)

Se quiser ver o Bethel na sua máquina:

1. Instale [Node.js](https://nodejs.org) (versão 22 ou mais nova) e [pnpm](https://pnpm.io/installation).
2. Use um banco Neon também aqui (o site não fala com Postgres local).
3. No terminal, na pasta do projeto:

```bash
pnpm install
```

4. Copie `apps/web/.env.example` para `apps/web/.env` e preencha os valores. No computador, use:

```
BETTER_AUTH_URL="http://localhost:3001"
CORS_ORIGIN="http://localhost:3001"
```

5. Crie as tabelas e (se quiser) os dados de demonstração:

```bash
pnpm db:migrate
cd packages/db && pnpm exec prisma db seed
```

6. Suba o site:

```bash
pnpm dev:web
```

Abra [http://localhost:3001](http://localhost:3001).

Contas de demonstração (só depois do seed): `joaovitor@familianunes.dev`, `sara@familianunes.dev` ou `eliza@familianunes.dev` — senha `Senha@123`.

---

## O que o produto faz

- **Início** — resumo do mês, contas, tarefas e leitura do dia
- **Finanças** — receitas, despesas, orçamento, contas a pagar, dízimo e ofertas
- **Compras e despensa** — lista do mercado e o que está acabando em casa
- **Tarefas** — quadro para a família (a fazer, em andamento, concluído)
- **Manutenção** — o que vence na casa, com o botão Feito para remarcar
- **Calendário** — semana da família
- **Devocional, oração e gratidão** — hábitos de fé compartilhados

No celular, abra o site no navegador. No Safari (iPhone) ou Chrome (Android) você pode **Adicionar à tela de início** e usar como um aplicativo.

---

## Scripts úteis

- `pnpm dev:web` — site no computador
- `pnpm db:migrate` — cria ou atualiza as tabelas (desenvolvimento)
- `pnpm db:migrate:deploy` — aplica as tabelas no banco da internet
- `pnpm db:studio` — ver os dados em uma tela
- `pnpm test` — testes automáticos
