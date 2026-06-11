# Checklist de Funcionalidades e Recursos (Features)

Este documento detalha todas as funcionalidades, componentes interativos e recursos da interface gráfica e do motor lógico construídos no GitKraken Client PWA.

## 🗂️ 1. Gerenciamento de Repositórios e Árvore (Sidebar)
- [x] **Seletor de Repositório Simulado**: Dropdown ou interface para trocar entre projetos simulados/virtuais ou repositórios monitorados.
- [x] **Painel de Branchs**: Exibe o branch atual (`HEAD`) e a listagem de branchs disponíveis.
- [x] **Ações Rápidas de Pull/Push**: Botões interativos na barra superior simulando a comunicação remota (`git pull`, `git push`).
- [x] **Formulário de Commit**: Interface embutida na barra lateral contendo input para mensagem de commit e um botão de submissão rápida imitando o fluxo natural de commit local.
- [x] **Fuzzy Finder (Busca Rápida)**: Modal acessível via botão `Fuzzy Finder` na barra superior superior imitando uma paleta de comandos para busca ágil.

## 🎨 2. Workspace Arrastável e Personalizável
- [x] **Malha Grid 12-Colunas**: Layout fluido e modular suportado pelo `react-grid-layout` em sua versão moderna.
- [x] **Drag & Drop Livre**: Painéis do Workspace podem ser arrastados livremente clicando no título/header do painel.
- [x] **Redimensionamento Proporcional (Resize)**: Bordas e cantos inferiores direitos dos painéis permitem ajuste de altura e largura de forma orgânica.
- [x] **Cálculo de Altura e Largura Automáticos**: Utiliza `ResizeObserver` para evitar colapsos ("telas vazias") e adaptar o layout 100% à viewport atual do navegador sem empilhamento (sem "mobile stacking").
- [x] **Persistência de Cache**: O estado, a posição e a escala de cada painel ficam salvos no cache de sessão do usuário no navegador.

## 🌳 3. Motor de Grafo de Commits
- [x] **Visualização via Tabela Conectada**: Histórico cronológico interativo desenhado como uma tabela de commits.
- [x] **Desenho Vetorial SVG**: Linhas de merge, branchs bifurcados e caminhos complexos são renderizados utilizando matemática nativa `<svg>` e `<path>` sobrepostos.
- [x] **Metadados dos Commits**: Mostra Hash, Mensagem do Commit, Nome do Autor, Avatar e Data relativa.
- [x] **Interatividade de Nós**: Identificação visual com nós e badges flutuantes simulando branchs locais apontando para o HEAD.

## 📝 4. Visualizador de Diff (Diff Viewer)
- [x] **Exibição Paralela / Inline**: Demonstração simulada de alterações no código (diff).
- [x] **Syntax Highlighting Simulado**: Cores distintas para linhas adicionadas (`+`, verde) e linhas removidas (`-`, vermelho).
- [x] **Resumo do Arquivo**: Cabeçalho informando qual arquivo está selecionado e a quantidade de linhas que sofreram patch.

## 💻 5. Terminal Integrado e Motor de Linha de Comando
- [x] **Terminal Gráfico (UI)**: Janela de terminal responsiva, com rolagem limpa (`custom-scrollbar`) e interface limpa `user@machine $`.
- [x] **Suporte a Múltiplos Modos**:
  - *Modo Simulação*: O terminal responde em memória local no navegador a comandos como `git status`, `git init` e mensagens falsas para testes.
  - *Modo Live / Socket*: Conexão transparente via WebSockets para redirecionar as linhas digitadas direto para o Terminal nativo do Sistema Operacional rodando o servidor Express.
- [x] **Output em Tempo Real**: Linhas recebidas do servidor são impressas sequencialmente mantendo um log limpo.

## ⚙️ 6. Tema e PWA
- [x] **Dark / Light Mode**: Motor de tema nativo manipulando as propriedades do TailwindCSS (ex: fundos pretos/azuis escuros contra texturas de vidro).
- [x] **Progressive Web App (PWA)**: Registros de Manifest JSON permitindo instalação offline da plataforma como um "Desktop App" nativo no Windows ou Mac.
- [x] **Geração Dinâmica de Ícone PWA**: Ferramenta embutida gerando avatares em alta definição como ícone para desktop (com badges GitKraken).
