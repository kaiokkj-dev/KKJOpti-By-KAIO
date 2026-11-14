# 🚀 KKJOpti 2.0

Painel desktop de **otimização para Windows** feito em Electron. Cada ação mostra exatamente o que vai executar, tem nível de risco, e a maioria pode ser **revertida** pelo próprio app.

## ⚙️ O que o app faz

- **Performance:** limpeza de temporários e cache de shaders, telemetria, plano de energia, efeitos visuais
- **Jogos e FPS:** Game DVR, tela cheia, dynamic tick, core parking, mouse e teclado
- **Internet:** DNS, ajustes TCP, Network Throttling, QoS
- **Placa de vídeo:** prioridade da tarefa multimídia "Games" (NVIDIA / AMD)
- **Memória RAM:** perfil recomendado conforme a RAM detectada
- **Ferramentas:** atalhos para ferramentas oficiais do Windows e "Reparar rede"

### Inteligência

- **"Já aplicado":** o app lê o registro, o plano de energia, o `bcdedit` e as configurações TCP e marca o que já está ativo no PC (somente leitura, em `system-state.js`)
- **Administrador:** detecta se o app foi aberto sem administrador, bloqueia as ações que precisam disso e oferece **"Reabrir como administrador"**
- **Conflitos:** ações que gravam o mesmo valor com dados diferentes (ex.: `SystemResponsiveness`) são avisadas na seleção e na revisão, e os perfis rápidos não escolhem ações que se anulam

### Segurança

- Execução em **fila** (uma ação por vez), com **tempo limite** de 5 minutos por ação
- **Snapshot do registro** (`reg export`) antes de cada `.reg` aplicado, restaurável pelo **Histórico**
- **Arquivo de reversão** (`restore_*.bat` / `restore_*.reg`) para quase todas as ações
- Opção de **ponto de restauração** do Windows antes de aplicar
- Somente ações cadastradas em `optimizations.js` podem rodar; nada usa `shell: true`

## 📁 Estrutura

```text
KKJOpti-2.0/
├── assets/            # Ícone e logo
├── scripts/           # .bat e .reg de cada ação + arquivos restore_*
├── optimizations.js   # Catálogo: título, risco, categoria, arquivo e reversão de cada ação
├── main.js            # Processo principal: fila, backups, histórico, IPC
├── system-state.js    # Leitura do estado do Windows ("já aplicado") e conflitos
├── preload.js         # Ponte segura entre a interface e o main (window.kkj)
├── renderer.js        # Interface
├── index.html
├── style.css
└── package.json
```

## ▶️ Como rodar

Use **Node.js 20 ou 22 (LTS)**. Em versões muito novas do Node o download do Electron pode falhar no `npm install`.

```bash
npm install
```

```bash
npm start
```

As ações marcadas como **Administrador** só funcionam com o app aberto como administrador. O instalador gerado já pede isso automaticamente.

## 📦 Gerar o instalador

```bash
npm run build
```

O instalador `.exe` fica em `dist/`.

## ➕ Adicionar uma otimização

1. Crie o script em `scripts/` (por exemplo `minhaacao.reg`) e, se possível, o de reversão (`restore_minhaacao.reg`).
2. Adicione uma linha em `optimizations.js`:
   ```js
   ['minhaacao', 'Título', 'O que faz, de forma honesta.', 'fps', 'moderate', 'Grupo', 'minhaacao.reg', 'restore_minhaacao.reg'],
   ```
3. Se mexer em `HKLM`, `bcdedit`, `netsh` ou `powercfg`, inclua o id em `adminActions`.

## ⚠️ Aviso

O app altera configurações do Windows. Os ganhos variam conforme o hardware. Crie um ponto de restauração antes de usar ações **avançadas** e teste scripts novos numa máquina virtual.

## 👨‍💻 Autor

Desenvolvido por **Kaio**. Licença MIT.
