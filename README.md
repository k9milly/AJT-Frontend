# AJT-Frontend

Front-end do sistema receptivo da **AJT Viagens e Turismo** (antiga SOS Viale), desenvolvido em Angular 18 (standalone components) com Tailwind CSS. Consome a API REST do [AJT-Backend](https://github.com/guiPinheiroAfK/AJT-Backend).

O projeto tem duas áreas:

- **Site institucional** (`/`): landing page pública.
- **Painel administrativo** (`/login`, `/admin/...`): operação do receptivo, integrada ao backend. O visual segue o mesmo design system dos projetos internos `lancamentosVendas` e `autonomousapi`: paleta neutra, dourado AJT como único acento, sidebar escura e tema claro/escuro.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | Angular 18 (standalone components, signals) |
| Estilo | Tailwind CSS (painel) + Bootstrap (somente navbar da landing) |
| Formulários | Angular Reactive Forms |
| Autenticação | JWT emitido pelo AJT-Backend |
| Testes | Jasmine + Karma |

## Requisitos

- Node.js 18+
- npm 9+
- AJT-Backend rodando (padrão `http://localhost:8080`)

## Configuração rápida

```bash
npm install
npm start
```

A aplicação sobe em `http://localhost:4200`.

### Endereço da API

| Arquivo | Uso | `apiUrl`                        |
| --- | --- |---------------------------------|
| `src/environments/environment.ts` | `ng serve` e testes | `http://localhost:9090/api`     |
| `src/environments/environment.prod.ts` | `ng build` (produção) | `/api` (mesmo domínio do front) |

O backend libera CORS para `http://localhost:4200` por padrão (`AJT_CORS_ORIGINS`).

### Primeiro acesso

Usuário `admin` / senha `admin123` (seed do backend). O login devolve `trocarSenha: true` e o painel leva direto para a tela de troca de senha. Usuários criados pelo administrador também trocam a senha no primeiro acesso.

## Painel administrativo

| Seção | Tela | Rota |
| --- | --- | --- |
| Operação | Painel (indicadores e pendências) | `/admin/painel` |
| Operação | Transfers | `/admin/transfers` |
| Operação | Ordens de serviço e detalhe da rota (paradas) | `/admin/ordens-servico`, `/admin/ordens-servico/:id` |
| Operação | Pontos de coleta | `/admin/pontos-coleta` |
| Cadastros | Passageiros, Motoristas, Veículos | `/admin/passageiros`, `/admin/motoristas`, `/admin/veiculos` |
| Administração | Usuários (somente ADMIN) | `/admin/usuarios` |

Cadastro e edição abrem em modal dentro de cada tela. O perfil `MOTORISTA` vê um menu reduzido (Início e Ordens de serviço) e só pode alterar o status das paradas.

### Permissões por perfil

Espelho do `SecurityConfig` do backend, em `src/app/core/auth/permissoes.ts`. O backend continua sendo quem bloqueia (403); o front usa a matriz para esconder botões e menus.

| Recurso | Leitura | Escrita | Exclusão |
| --- | --- | --- | --- |
| usuários | ADMIN | ADMIN | ADMIN |
| motoristas, veículos, ordens de serviço | todos | ADMIN, GERENTE | ADMIN, GERENTE |
| paradas de OS | todos | ADMIN, GERENTE (MOTORISTA só status) | ADMIN, GERENTE |
| passageiros, transfers, pontos de coleta | todos | ADMIN, GERENTE, ATENDENTE | ADMIN, GERENTE |

### Tratamento de erros da API

Centralizado em `src/app/core/http/erro-api.ts` (formato `{ timestamp, status, erro, mensagem, detalhes[] }`):

| Status | Comportamento no front |
| --- | --- |
| 0 | aviso de que o backend está fora do ar |
| 400 | mensagem do backend + detalhes de validação por campo |
| 401 | interceptor desloga e redireciona para `/login?sessao=expirada` (exceto no próprio login) |
| 403 | aviso de falta de permissão, sem deslogar |
| 404 / 409 | mensagem do backend (ex: registro em uso) |
| 429 | aviso de login bloqueado por excesso de tentativas |
| 502 | aviso de cotação de câmbio indisponível |

## Estrutura do projeto

```
src/app/
├── core/
│   ├── auth/        # sessão (AuthService), interceptor, guards e matriz de permissões
│   ├── http/        # tradução de erros da api e montagem de query params
│   ├── layout/      # guards que ligam o bootstrap só na landing
│   ├── models/      # contratos da api (dtos, enums, página)
│   └── services/    # tema claro/escuro e avisos (toasts)
├── layout/shell/    # sidebar + topbar do painel
├── shared/
│   ├── components/  # ícone, modal, confirmação, paginação, badge, card de kpi, skeleton, toasts
│   └── utils/       # rótulos de enums e formatadores (data, hora, moeda)
├── features/
│   ├── site/        # landing page
│   ├── auth/        # login e troca de senha
│   ├── painel/      # dashboard
│   └── ...          # uma pasta por recurso: tela + service http
└── app.routes.ts    # rotas (landing, login, troca de senha e painel)
```

### Bootstrap x Tailwind

O Bootstrap é gerado como bundle separado (`angular.json`) e fica ativo **somente na landing page**. Várias classes dele têm o mesmo nome das do Tailwind (`bg-primary`, `border`, `p-4`, `gap-3`...), com `!important` e outra escala. Os guards em `core/layout/estilos-site.ts` desligam o arquivo no login e no painel.

## Testes

```bash
npm test                                            # modo observação
npx ng test --watch=false --browsers=ChromeHeadless  # roda uma vez (ci)
```

Cada arquivo `*.spec.ts` começa com um comentário explicando o que testa, como rodar e por que o teste existe. Nenhum teste precisa do backend no ar: as chamadas http usam `HttpTestingController`.

## Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `npm start` | inicia o servidor de desenvolvimento (`ng serve`) |
| `npm run build` | gera o build de produção em `dist/` |
| `npm test` | executa os testes unitários (Karma) |

## Repositórios relacionados

- Backend (Spring Boot): [AJT-Backend](https://github.com/guiPinheiroAfK/AJT-Backend)
