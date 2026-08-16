# AJT-Frontend

Front-end do sistema receptivo da **AJT Viagens e Turismo** (antiga SOS Viale), desenvolvido em Angular 18 (standalone components) com Tailwind CSS. Consome a API REST do [AJT-Backend](https://github.com/guiPinheiroAfK/AJT-Backend).

## Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | Angular 18 (standalone components) |
| Estilo | Tailwind CSS (principal) + Bootstrap |
| Formulários | Angular Reactive Forms |
| Autenticação | JWT (mockado nesta fase) |

## Requisitos

- Node.js 18+
- npm 9+

## Configuração rápida

```bash
npm install
npm start
```

A aplicação sobe por padrão em `http://localhost:4200`.

## Estrutura do projeto

```
src/app/
├── core/            # modelos, autenticação (guards, interceptor), dados mockados
├── shared/          # componentes reutilizáveis (layout, dialogs)
├── features/        # módulos de domínio (auth, passageiros, ...)
├── app.routes.ts     # rotas principais (com children)
└── app.config.ts      # configuração da aplicação (providers)
```

## Status da entrega

### Fase 1 — concluída
- Autenticação (login mockado, guard de rotas)
- CRUD de Passageiros (mockado, com persistência em `localStorage`)
- Layout com navbar (Bootstrap) e sidebar (Tailwind)
- Roteamento com rotas filhas (`children`)
- Dialog de confirmação customizado em CSS (sem `window.confirm`)

### Usuários de teste
| E-mail | Senha | Perfil |
| --- | --- | --- |
| admin@ajt.com | 123456 | ADMIN |
| gerente@ajt.com | 123456 | GERENTE |
| motorista@ajt.com | 123456 | MOTORISTA |

## Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `npm start` | inicia o servidor de desenvolvimento (`ng serve`) |
| `npm run build` | gera o build de produção em `dist/` |
| `npm test` | executa os testes unitários (Karma) |

## Repositórios relacionados

- Backend (Spring Boot): [AJT-Backend](https://github.com/guiPinheiroAfK/AJT-Backend)
