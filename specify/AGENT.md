# Especificação do Projeto: GitKraken Client Studio (PWA)

Este documento centraliza e especifica todas as funcionalidades, a arquitetura e os recursos do clone do GitKraken Client desenvolvido neste projeto. Ele serve como o "Cérebro" (AGENT.md) para documentar tudo que foi construído e integrado até o momento.

---

## 1. Visão Geral
O projeto é uma aplicação web rica (SPA) que imita a experiência visual e a interface do famoso cliente Git **GitKraken**. Foi construído para rodar localmente no navegador, mas possui capacidades nativas instaláveis devido à sua integração como **Progressive Web App (PWA)**.

A aplicação se divide entre um front-end interativo moderno e um back-end leve escrito em Node.js (Express + Socket.IO) para permitir a execução de comandos nativos do Git na máquina host.

---

## 2. Arquitetura do Sistema

### 2.1. Frontend (React + Vite)
- **Linguagem:** TypeScript (TSX).
- **Estilização:** TailwindCSS, focando em um design fluido, translúcido ("glassmorphism" leve), com sombras intensas e interfaces responsivas. Temas Claro (Light) e Escuro (Dark).
- **Motor Gráfico de Commits:** Utiliza representações vetorizadas nativas (SVG) em conjunto com React para criar a árvore/grafo de commits conectada, simulando fielmente a visualização do GitKraken.
- **Grades Arrastáveis:** Utiliza `react-grid-layout` (v2) e `react-resizable` para gerenciar a área de trabalho flexível, permitindo que o usuário crie seu próprio Layout IDE.

### 2.2. Backend & Integração do Sistema Operacional (`server.ts`)
- **Frameworks:** Express.js e Socket.IO.
- **Propósito:** O aplicativo front-end isolado não tem permissão para rodar comandos Git reais. O `server.ts` age como uma ponte segura.
- **Funcionamento:** O servidor Node fica escutando na porta `:3101` com WebSockets. Quando o terminal no frontend envia uma string (ex: `git status`), o servidor Node usa `child_process.spawn` do sistema operacional Windows/Linux, roda o comando, e cospe o output da saída padrão (stdout) via Socket.io byte a byte de volta para o React renderizar.

### 2.3. PWA (Progressive Web App)
- **Plugin:** `vite-plugin-pwa`.
- **Recursos:** Geração automática de Service Workers para suporte a offline caching de assets estáticos.
- **Manifesto:** Arquivo de manifesto embutido com ícones dinâmicos gerados e mapeados para permitir a instalação do App no Windows, macOS, Android e iOS diretamente da barra de navegação (Add to Homescreen).

---

## 3. Especificação de Funcionalidades e Componentes (Módulos)

### 3.1. Dashboard Arrastável (Workspace)
- **Componente Central:** `DraggableDashboard.tsx`
- **Comportamento:** A interface divide a visualização em 5 grandes painéis: **Repositório/Sidebar**, **Grafo de Commits**, **Propriedades**, **Diff Viewer**, e **Terminal**.
- **Motor de Layout:** Baseia-se numa malha de 12 colunas (`cols={12}`). O layout não se empilha verticalmente para manter o estilo de IDE Desktop, e os painéis são redimensionados proporcionalmente ao tamanho da janela (ResizeObserver acoplado).
- **Persistência:** A posição e o tamanho escolhido pelo usuário para cada painel ficam salvos em `localStorage`.

### 3.2. Grafo de Commits (Commit Graph Visualizer)
- Renderiza uma tabela complexa interligada com linhas retas e curvas desenhadas via `<svg>` puro, permitindo visualizar os "branches" se fundindo (merge) e separando de forma orgânica.
- Suporta múltiplos nós com descrições, autores, datas e hash SHA simplificado.

### 3.3. Terminal Integrado
- Console embutido na aplicação que imita o terminal nativo.
- Possui modo **Simulação** (para testar os comandos via lógica em memória) e modo **Live/Socket** (onde comandos batem diretamente no SO da máquina).

### 3.4. Diff Viewer (Visualizador de Diferenças)
- Painel focado em mostrar linha a linha o que foi adicionado (`+` verde) ou removido (`-` vermelho) em um arquivo, igualando a funcionalidade do GitKraken de revisão de código.

### 3.5. Fuzzy Finder
- Barra superior flutuante semelhante à "Palette" de comandos do VSCode ou GitKraken, invocada para busca rápida de ações ou arquivos.

### 3.6. Sidebar (Repositórios e Árvore de Arquivos)
- Seleção de Repositórios e exibição dos branchs locais ativos.
- Inclui formulários estilizados de commit com atalhos.

---

## 4. Gerenciamento de Dependências (Ecossistema)
- `react-grid-layout` v2 & `react-resizable` -> Controle geométrico e manipulação arrastável.
- `lucide-react` -> Biblioteca universal e leve de ícones baseados em SVG.
- `vite-plugin-pwa` -> Capacidade nativa de instalação.
- `socket.io` & `socket.io-client` -> Comunicação bidirecional Server-Client.
- `express` -> Servidor estático e de API.

---

## 5. Instruções de Desenvolvimento
Para rodar este ambiente em modo desenvolvedor (Local):
1. Inicie o servidor Express: `npx tsx server.ts` (ou `npm run server`) - Aguarde o aviso de porta 3101 aberta.
2. Inicie o Vite Frontend: `npm run dev` - Porta 3100.
3. Acesse via Chrome/Edge para suporte 100% PWA.
