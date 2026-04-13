# 🚀 KKJOpti by Kaio

Aplicativo desktop focado em **otimização de desempenho do Windows**, com ajustes rápidos para **FPS**, **internet**, **sistema** e **inicialização**, tudo em uma interface simples e moderna.

---

## 🧠 Sobre o projeto

O **KKJOpti** foi criado para facilitar a aplicação de otimizações no Windows sem que o usuário precise alterar manualmente registros, serviços e configurações avançadas do sistema.

O projeto usa uma interface feita em **Electron** com páginas em **HTML, CSS e JavaScript**, além de scripts `.bat` e `.reg` responsáveis por aplicar as otimizações no sistema operacional.

---

## ⚙️ Funcionalidades

### 🟢 Otimização Geral
- Ajustes para melhorar o desempenho do sistema
- Redução de processos desnecessários
- Melhor aproveitamento de recursos do PC

### 🎮 FPS Boost
- Tweaks para jogos
- Redução de input lag
- Ajustes no Windows para melhorar estabilidade e desempenho

### 🖥️ Otimizações do Windows
- Desativação de efeitos visuais
- Ajustes de resposta do sistema
- Melhorias gerais de fluidez

### 🌐 Otimização de Internet
- Redução de latência
- Ajustes de rede
- Melhor estabilidade de conexão

### ⚡ Inicialização
- Melhor gerenciamento da inicialização do sistema
- Redução de carregamentos desnecessários ao ligar o PC

---

## 🧱 Tecnologias utilizadas

- **Electron.js**
- **HTML5**
- **CSS3**
- **JavaScript**
- **Scripts `.bat`**
- **Scripts `.reg`**

---

## 📁 Estrutura do projeto

```text
KKJOpti/
├── assets/          # Logos, ícones e imagens
├── scripts/         # Scripts .bat e .reg usados nas otimizações
├── index.html       # Página principal
├── fps.html         # Página de FPS
├── windows.html     # Página de otimizações do Windows
├── internet.html    # Página de otimizações de internet
├── style.css        # Estilos globais
├── main.js          # Processo principal do Electron
├── preload.js       # Comunicação segura entre front-end e Electron
├── renderer.js      # Scripts da interface
├── package.json     # Configuração do projeto
└── README.md        # Documentação do projeto
```

---

## ▶️ Como executar o projeto

### 1. Instale as dependências

```bash
npm install
```

### 2. Inicie o aplicativo

```bash
npm start
```

---

## ⚠️ Aviso

Este aplicativo realiza alterações no sistema operacional por meio de scripts.

**Recomendações:**
- Execute o app como **Administrador**
- Crie um **ponto de restauração** antes de aplicar otimizações
- Revise os scripts antes de usar em máquina principal

---

## 💡 Objetivo do projeto

O objetivo do **KKJOpti** é centralizar otimizações úteis em um único aplicativo, com foco em:

- desempenho
- praticidade
- interface amigável
- aplicação rápida de tweaks no Windows

---

## 🚧 Melhorias futuras

- Sistema de feedback dentro do app
- Mais páginas de otimização
- Organização por categorias
- Exportação de logs
- Sistema de chave/licença
- Atualizador automático

---

## 👨‍💻 Autor

Desenvolvido por **Kaio**  
Projeto: **KKJOpti**

---

## 📌 Observação

Este projeto é voltado para estudo, testes e uso prático de otimizações no Windows através de uma interface desktop personalizada.
