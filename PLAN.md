# Toasting — Plano da V2

> Clube de benefícios privado para uma rede de restaurantes. Nasce como app pra ~50 amigos do grupo, evolui pra SaaS multi-tenant vendável a outras redes.

## Princípio guia

Construir **single-tenant por fora, multi-tenant por dentro**. O MVP vê só o cliente piloto, mas o modelo de dados (com `tenant_id` em tudo) e o isolamento via Supabase Row Level Security já estão prontos pra escalar.

---

## Stack

| Camada | Escolha | Por quê |
|---|---|---|
| Frontend | Next.js 15 (App Router) | App do membro + admin + PWA do garçom no mesmo repo |
| Auth + DB + Storage | Supabase | Postgres + auth + RLS + storage (fotos) num só lugar, $0 inicial |
| Hospedagem | Vercel | Deploy automático via Git, preview por branch |
| Fonte de marca | Schoolbell (Google Fonts) | Combina com a vibe manuscrita das logos |
| Fonte de UI | Inter | Legível em texto corrido (Schoolbell só em destaque) |

---

## Restaurantes do piloto

1. Giancarlo
2. Quartinho
3. Dainer
4. Pope
5. Chanchada
6. Guadalupe
7. Café 18 do Forte
8. Deja Vu
9. Fatchia
10. *(falta confirmar o 10º)*

---

## Modelo de dados (Postgres / Supabase)

```
tenants
  id, name, slug, branding_json, created_at

venues                          ← restaurantes
  id, tenant_id, name, slug, address, phone, logo_url, active

tiers                           ← Friends, Staff, Press, Partner
  id, tenant_id, slug, name, discount_percent, max_uses_per_day, validity_days

members                         ← os amigos / funcionários / etc
  id, tenant_id, tier_id, email, name, phone, photo_url, status,
  joined_at, valid_until, invited_by

admins                          ← donos / gerentes do tenant
  id, tenant_id, email, name, role

staff                           ← garçons que validam
  id, venue_id, name, pin_hash

invites                         ← links únicos de convite
  id, tenant_id, tier_id, code, max_uses, used_count,
  expires_at, created_by_admin_id

redemptions                     ← códigos + histórico unificado
  id, member_id, tenant_id, code (6 dígitos), status,
  generated_at, expires_at,
  redeemed_at, venue_id, staff_id, applied_percent
```

**Regras de negócio (no banco/policy):**
- Membro só pode ter 1 código com status `pending` por vez (gerar novo invalida anterior).
- Limite: 1 redemption com status `used` por membro por dia.
- Cooldown: 5min após `redeemed_at` antes de gerar novo código.
- Código expira em 5min se não usado.
- RLS: cada tenant só enxerga seus próprios membros, venues, redemptions.

---

## Telas (3 frentes)

### App do Membro (`app.toasting.app`)

1. **Login** — email + senha (ou magic link Supabase)
2. **Onboarding** — aceitar termos, subir foto (obrigatório pra validação visual)
3. **Home** — botão grande "Gerar código" + último uso
4. **Código ativo** — 6 dígitos, timer regressivo, foto, nome, tier, %
5. **Histórico** — usos por mês, breakdown por restaurante
6. **Restaurantes** — cards com logo, endereço, horário
7. **Perfil** — editar foto/dados

### PWA do Garçom (`garcom.toasting.app`)

1. **Login** — PIN do staff + escolher restaurante (1x/turno)
2. **Validar** — digitar 6 dígitos
3. **Confirmar** — mostra foto + nome + % → botão "Aplicar desconto"
4. **Meu turno** — quantos códigos validei hoje

### Painel Admin (`admin.toasting.app`)

1. **Login admin**
2. **Dashboard** — membros ativos, usos no mês, top restaurantes
3. **Membros** — listar, criar, desativar, editar tier
4. **Convites** — gerar link único, ver status, revogar
5. **Tiers** — configurar % e regras (futuro V1)
6. **Restaurantes** — cadastrar venue, gerar PINs de staff
7. **Relatórios** — uso por período, exportar CSV

---

## Roadmap em sprints (1-2 dias cada)

### Sprint 0 — Setup (1-2 dias)
- Criar projeto Next.js com TypeScript + Tailwind
- Conectar Supabase (auth + db)
- Migrations das tabelas + RLS policies
- Setup Vercel + domínio
- Schoolbell + Inter carregadas

### Sprint 1 — Auth + Membro Core (3 dias)
- Login + signup via convite
- Home + botão gerar código
- API `POST /redemptions` (com regras de cooldown/limite)
- Tela do código ativo com timer

### Sprint 2 — Garçom (2-3 dias)
- PWA do garçom (rotas separadas)
- Login PIN + escolha de restaurante
- API `POST /redemptions/:code/redeem`
- Tela de confirmação com foto

### Sprint 3 — Admin básico (3 dias)
- Login admin (role-based)
- CRUD de membros
- CRUD de convites com links únicos
- CRUD de restaurantes + PINs

### Sprint 4 — Histórico + perfil (2 dias)
- Tela de histórico do membro
- Tela de restaurantes
- Edit perfil + upload de foto (Supabase Storage)

### Sprint 5 — Polish + beta (3 dias)
- Identidade visual: cores, logos, Schoolbell nos destaques
- Onboarding pós-convite
- Beta com 5-10 amigos
- Bugs + ajustes
- Deploy prod

**Total estimado: ~15 dias úteis (3 semanas)** pra MVP rodando com amigos reais.

---

## Evolução pós-MVP (visão de produto vendável)

- **V1** — Tiers adicionais (Staff, Press, Partner) + importação em massa + validade automática
- **V2** — Multi-tenant exposto: outras redes contratam o Toasting, white-label
- **V3** — Integrações com PDVs (iFood, Saipos), app de validação direto no caixa
- **V4** — Engajamento: pontos, cashback, indicação rastreada, reservas, eventos privados

---

## O que ainda preciso da Amanda

- [ ] Logos dos 10 restaurantes em PNG/SVG (a pasta `~/Desktop/friends-and-family/` está bloqueada pelo macOS)
- [ ] Confirmar 10º restaurante
- [ ] Documentos da V1 protótipo (se existirem)
- [ ] Conta Supabase + Vercel + GitHub (eu posso guiar a criação)
- [ ] Domínio: `toasting.app`? `toastingclub.com`? outro?
