# Toasting

Clube de benefícios privado para uma rede de restaurantes. MVP para ~50 amigos do grupo piloto, com arquitetura multi-tenant pronta pra virar SaaS.

Ver [PLAN.md](./PLAN.md) para a visão completa de produto e roadmap.

## Estrutura

```
toasting/
├── PLAN.md                  ← plano de produto e sprints
├── README.md                ← este arquivo (setup)
├── supabase/
│   └── migrations/          ← schema SQL + seed
└── web/                     ← Next.js 16 + Supabase + Tailwind 4
    ├── app/                 ← rotas (membro, garçom, admin)
    ├── lib/supabase/        ← clients (server, browser, middleware)
    └── lib/types/           ← tipos TS do banco
```

## Setup (primeira vez)

### 1. Criar projeto Supabase

1. Vai em [supabase.com](https://supabase.com) → cria conta (login com GitHub é mais rápido).
2. **New project** → nome `toasting-mvp`, região `South America (São Paulo)`, senha forte do DB.
3. Depois de criado, vai em **Project Settings → API** e copia:
   - `Project URL`
   - `anon` `public` key
   - `service_role` `secret` key

### 2. Configurar variáveis locais

```bash
cd web
cp .env.local.example .env.local
# edita .env.local com as keys que copiou
```

### 3. Rodar as migrations

Na dashboard do Supabase → **SQL Editor** → **New query** → cola o conteúdo de:

1. `supabase/migrations/0001_initial_schema.sql` → roda
2. `supabase/migrations/0002_seed_pilot.sql` → roda

Verifica em **Table Editor** que apareceram as tabelas `tenants`, `venues`, `tiers`, etc., e que tem 1 tenant + 9 venues + 1 tier.

### 4. Rodar localmente

```bash
cd web
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Deploy

1. Cria conta no [Vercel](https://vercel.com) (login com GitHub).
2. Push do repo pro GitHub.
3. Vercel → **Add New → Project** → importa o repo → seleciona pasta `web` como root.
4. Em **Environment Variables**, cola as 3 chaves do `.env.local`.
5. Deploy.

URL grátis: `toasting-xxx.vercel.app`. Domínio próprio só quando lançar pros amigos de verdade.
