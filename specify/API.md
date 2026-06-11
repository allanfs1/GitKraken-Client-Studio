# API e Integração de Eventos (API Reference)

Este documento especifica a interface de comunicação (API) utilizada na ponte entre o Frontend React e o Servidor de Comandos Nativo (Express Node). 

Ao contrário de APIs convencionais (RESTful HTTP `GET`/`POST`), o fluxo principal da nossa aplicação é **Baseado em Eventos via WebSockets**.

## 🔌 1. Conexão Base (Socket.IO)
A comunicação em tempo real é estabelecida usando o protocolo WebSocket encapsulado pelo `socket.io`.

- **Servidor (Backend):** `ws://localhost:3101`
- **Frontend Client:** Injeta evento `io("http://localhost:3101")` ao renderizar os componentes terminais.

---

## 📡 2. Mapa de Eventos (Event Dictionary)

### 2.1. Frontend -> Backend (Client to Server)

#### Evento: `terminal-command`
- **Descrição:** Disparado pelo componente do Terminal UI (no navegador) quando o usuário aperta `Enter`.
- **Payload / Argumentos:**
  - `command: string` -> A string exata digitada pelo usuário no terminal simulado.
- **Exemplo de Envio (React):**
  ```typescript
  socket.emit("terminal-command", "git status");
  ```

#### Evento: `disconnect`
- Disparado naturalmente quando o usuário fecha a aba do PWA ou a aplicação cai.

---

### 2.2. Backend -> Frontend (Server to Client)

#### Evento: `terminal-output`
- **Descrição:** Disparado pelo Servidor Node (`server.ts`) assim que o processo de sistema (child_process) devolve qualquer pedaço de texto no canal stdout ou stderr (fluxo contínuo).
- **Payload / Argumentos:**
  - `data: string` -> Bloco de texto gerado pelo terminal (incluindo quebras de linha e buffers).
- **Exemplo de Escuta (React):**
  ```typescript
  socket.on("terminal-output", (data: string) => {
    appendLineToTerminal(data);
  });
  ```

---

## 🖥️ 3. Tratamento no Backend (`server.ts`)

O servidor utiliza a API embutida nativa do Node (`child_process.spawn`) em detrimento de `exec` ou APIs estritas, por quê?
- **Streaming:** O `spawn` cria um "pipe" direto e vai cuspindo (streaming) o output em tempo real, enquanto o `exec` seguraria a resposta do comando num buffer e só mandaria via Socket no final, o que daria a impressão de terminal travado se fosse um comando longo.
- **Isolamento de Erros:** Stderr não quebra a conexão WebSocket, ele simplesmente converte o buffer em string vermelha e transita o evento `terminal-output` do mesmo jeito.

### 3.1 Exemplo da Camada Provedora (Node)
```typescript
socket.on("terminal-command", (command: string) => {
  // Parsing inteligente para suportar Windows (cmd /c) e Linux (sh -c)
  const isWindows = process.platform === "win32";
  const shell = isWindows ? "cmd.exe" : "sh";
  const shellArgs = isWindows ? ["/c", command] : ["-c", command];

  const child = spawn(shell, shellArgs, { cwd: process.cwd() });

  // Stream do Output padrão
  child.stdout.on("data", (data) => {
    socket.emit("terminal-output", data.toString());
  });

  // Stream do Erro
  child.stderr.on("data", (data) => {
    socket.emit("terminal-output", data.toString());
  });
});
```

## 🔒 4. Considerações de Segurança (Limitações)
- A API está desenhada especificamente com **CORS Irrestrito** (`cors: { origin: "*" }`) pois seu foco primário é um ambiente **Local**.
- O parâmetro `cwd` na API define sempre a pasta raiz do próprio projeto/aplicação, não injetando permissões arbitrárias no HD inteiro do usuário por questões de Sandbox de navegação.
