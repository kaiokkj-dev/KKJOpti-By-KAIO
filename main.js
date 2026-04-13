const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let logPath = null;

function log(mensagem) {
  try {
    if (!logPath) return;

    const pasta = path.dirname(logPath);
    if (!fs.existsSync(pasta)) {
      fs.mkdirSync(pasta, { recursive: true });
    }

    const texto = `[${new Date().toLocaleString()}] ${mensagem}\n`;
    fs.appendFileSync(logPath, texto, 'utf8');
  } catch (error) {
    console.error('Erro ao escrever no log:', error.message);
  }
}

function mostrarErroCritico(titulo, erro) {
  const mensagem = erro?.stack || erro?.message || String(erro);
  console.error(titulo, mensagem);
  log(`${titulo}: ${mensagem}`);

  try {
    dialog.showErrorBox(titulo, mensagem);
  } catch {}
}

process.on('uncaughtException', (err) => {
  mostrarErroCritico('Erro não tratado', err);
});

process.on('unhandledRejection', (err) => {
  mostrarErroCritico('Promise rejeitada', err);
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    autoHideMenuBar: true,
    backgroundColor: '#050816',
    icon: path.join(__dirname, 'assets', 'kkjopti_icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    log(`Falha ao carregar janela: ${errorCode} - ${errorDescription}`);
  });

  win.loadFile('index.html')
    .then(() => {
      console.log('index.html carregado com sucesso');
      log('index.html carregado com sucesso');
    })
    .catch((err) => {
      mostrarErroCritico('Erro ao carregar index.html', err);
    });
}

function getScriptPath(nomeArquivo) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'scripts', nomeArquivo);
  }
  return path.join(__dirname, 'scripts', nomeArquivo);
}

function validarArquivo(arquivo, event, tipoLabel) {
  if (!fs.existsSync(arquivo)) {
    const msg = `${tipoLabel} não encontrado: ${arquivo}`;
    console.error(msg);
    log(msg);
    if (event?.sender) {
      event.sender.send('status', `Erro: arquivo não encontrado (${path.basename(arquivo)})`);
    }
    return false;
  }
  return true;
}

function executarProcesso(comando, args, event, nomeExibicao, mensagem, options = {}) {
  if (mensagem) {
    event.sender.send('status', mensagem);
    log(`Status enviado: ${mensagem}`);
  }

  log(`Executando: ${comando} ${args.join(' ')}`);

  const processo = spawn(comando, args, {
    shell: true,
    windowsHide: options.windowsHide ?? true
  });

  processo.on('error', (error) => {
    console.error(`Erro ao executar ${nomeExibicao}:`, error.message);
    log(`Erro ao executar ${nomeExibicao}: ${error.stack || error.message}`);
    event.sender.send('status', `Erro ao executar ${nomeExibicao}`);
  });

  processo.on('close', (code) => {
    console.log(`${nomeExibicao} finalizado com código ${code}`);
    log(`${nomeExibicao} finalizado com código ${code}`);

    if (code !== 0) {
      event.sender.send('status', `Erro ao executar ${nomeExibicao} (código ${code})`);
    }
  });

  return processo;
}

function executarBat(nomeArquivo, event, mensagem) {
  const arquivo = getScriptPath(nomeArquivo);
  if (!validarArquivo(arquivo, event, 'BAT')) return;

  log(`Iniciando BAT: ${nomeArquivo}`);
  log(`Caminho BAT: ${arquivo}`);

  executarProcesso(arquivo, [], event, nomeArquivo, mensagem, {
    windowsHide: true
  });
}

function executarReg(nomeArquivo, event, mensagem) {
  const arquivo = getScriptPath(nomeArquivo);
  if (!validarArquivo(arquivo, event, 'REG')) return;

  log(`Iniciando REG: ${nomeArquivo}`);
  log(`Caminho REG: ${arquivo}`);

  executarProcesso('reg', ['import', arquivo], event, nomeArquivo, mensagem, {
    windowsHide: true
  });
}

function executarArquivo(nomeArquivo, event, mensagem) {
  const arquivo = getScriptPath(nomeArquivo);
  if (!validarArquivo(arquivo, event, 'Arquivo')) return;

  log(`Iniciando arquivo: ${nomeArquivo}`);
  log(`Caminho arquivo: ${arquivo}`);

  executarProcesso(arquivo, [], event, nomeArquivo, mensagem, {
    windowsHide: false
  });
}

ipcMain.on('executar-lote', (event, tipos) => {
  if (!Array.isArray(tipos)) {
    log('Executar lote recebido inválido');
    return;
  }

  log(`Executar lote recebido: ${JSON.stringify(tipos)}`);

  tipos.forEach((tipo) => {
    if (tipo === 'limpeza') executarBat('limpeza.bat', event, 'Limpando arquivos temporários...');
    if (tipo === 'cache') executarBat('cache.bat', event, 'Limpando cache...');
    if (tipo === 'cleanwindows') executarBat('cleanwindows.bat', event, 'Limpando sistema...');
    if (tipo === 'flushdns') executarBat('flushdns.bat', event, 'Atualizando DNS...');
    if (tipo === 'networkboost') executarBat('networkboost.bat', event, 'Otimizando rede...');
    if (tipo === 'startup') executarBat('startup.bat', event, 'Otimizando inicialização...');
    if (tipo === 'cpu') executarBat('cpu.bat', event, 'Otimizando uso de CPU...');
    if (tipo === 'decreaseload') executarBat('decreaseload.bat', event, 'Ativando modo desempenho...');

    if (tipo === 'telemetria') executarReg('telemetria.reg', event, 'Desativando telemetria...');
    if (tipo === 'responsiveness') executarReg('responsiveness.reg', event, 'Ajustando responsividade...');
    if (tipo === 'inputdelay') executarReg('inputdelay.reg', event, 'Reduzindo input delay...');
    if (tipo === 'processorscheduling') executarReg('processorscheduling.reg', event, 'Ajustando prioridade do processador...');

    if (tipo === 'fpsboost') executarBat('fpsboost.bat', event, 'Aplicando FPS Boost...');
    if (tipo === 'gameboost') executarBat('gameboost.bat', event, 'Ativando Game Boost Mode...');
    if (tipo === 'disablegamedvr') executarReg('disablegamedvr.reg', event, 'Desativando Game DVR...');
    if (tipo === 'fullscreenoff') executarReg('fullscreenoff.reg', event, 'Desativando otimização de tela cheia...');
    if (tipo === 'timerresolution') executarBat('timerresolution.bat', event, 'Aplicando Timer Resolution Boost...');
    if (tipo === 'cpupriority') executarBat('cpupriority.bat', event, 'Aumentando prioridade da CPU...');
    if (tipo === 'coreparking') executarReg('coreparking.reg', event, 'Desativando Core Parking...');
    if (tipo === 'memoryopt') executarBat('memoryopt.bat', event, 'Otimizando memória RAM...');
    if (tipo === 'memorycompression') executarBat('memorycompression.bat', event, 'Desativando compressão de memória...');
    if (tipo === 'cacheboost') executarBat('cacheboost.bat', event, 'Aplicando Cache Boost...');
    if (tipo === 'tcpopt') executarBat('tcpopt.bat', event, 'Otimizando TCP...');
    if (tipo === 'networkthrottling') executarReg('networkthrottling.reg', event, 'Desativando Network Throttling...');
    if (tipo === 'mousefix') executarReg('mousefix.reg', event, 'Aplicando Mouse Fix...');
    if (tipo === 'keyboardboost') executarReg('keyboardboost.reg', event, 'Aplicando Keyboard Response Boost...');
    if (tipo === 'trackingoff') executarReg('trackingoff.reg', event, 'Desativando rastreamento...');
    if (tipo === 'cortanaoff') executarReg('cortanaoff.reg', event, 'Desativando Cortana...');
    if (tipo === 'animationsoff') executarReg('animationsoff.reg', event, 'Desativando animações...');
    if (tipo === 'explorerspeed') executarReg('explorerspeed.reg', event, 'Otimizando Explorer...');
    if (tipo === 'fastshutdown') executarReg('fastshutdown.reg', event, 'Aplicando desligamento rápido...');
    if (tipo === 'notificationsoff') executarReg('notificationsoff.reg', event, 'Desativando notificações...');

    if (tipo === 'nvidia_thread_priority') executarReg('nvidia_thread_priority.reg', event, 'Aplicando prioridade NVIDIA...');
    if (tipo === 'revert_nvidia') executarReg('revert_nvidia.reg', event, 'Revertendo configurações NVIDIA...');
    if (tipo === 'amd_thread_priority') executarReg('amd_thread_priority.reg', event, 'Aplicando prioridade AMD...');
    if (tipo === 'revert_amd') executarReg('revert_amd.reg', event, 'Revertendo configurações AMD...');

    if (tipo === 'networklimitoff') executarReg('networklimitoff.reg', event, 'Desativando limitação de rede...');
    if (tipo === 'netspeedboost') executarBat('netspeedboost.bat', event, 'Aplicando Net Speed Boost...');
    if (tipo === 'internetcmd') executarBat('internetcmd.bat', event, 'Executando otimização de internet...');
    if (tipo === 'pingboost') executarBat('pingboost.bat', event, 'Aplicando Ping Boost...');
    if (tipo === 'networkpriority') executarReg('networkpriority.reg', event, 'Aplicando prioridade de rede...');
    if (tipo === 'dnsboost') executarBat('dnsboost.bat', event, 'Aplicando DNS Boost...');

    if (tipo === 'ram2gb') executarReg('ram2gb.reg', event, 'Aplicando perfil para 2GB de RAM...');
    if (tipo === 'ram4gb') executarReg('ram4gb.reg', event, 'Aplicando perfil para 4GB de RAM...');
    if (tipo === 'ram6gb') executarReg('ram6gb.reg', event, 'Aplicando perfil para 6GB de RAM...');
    if (tipo === 'ram8gb') executarReg('ram8gb.reg', event, 'Aplicando perfil para 8GB de RAM...');
    if (tipo === 'ram12gb') executarReg('ram12gb.reg', event, 'Aplicando perfil para 12GB de RAM...');
    if (tipo === 'ram16gb') executarReg('ram16gb.reg', event, 'Aplicando perfil para 16GB de RAM...');
    if (tipo === 'ram24gb') executarReg('ram24gb.reg', event, 'Aplicando perfil para 24GB de RAM...');
    if (tipo === 'ram32gb') executarReg('ram32gb.reg', event, 'Aplicando perfil para 32GB de RAM...');
  });

  setTimeout(() => {
    event.sender.send('status', '✔ Otimização concluída');
    log('✔ Otimização concluída');
  }, 1500);
});

ipcMain.on('instalar-programas', (event, tipos) => {
  if (!Array.isArray(tipos)) {
    log('Instalar programas recebido inválido');
    return;
  }

  log(`Instalar programas recebido: ${JSON.stringify(tipos)}`);

  tipos.forEach((tipo) => {
    if (tipo === '10appsmanager') {
      executarArquivo('10AppsManager.exe', event, 'Abrindo 10AppsManager...');
    }

    if (tipo === 'bleachbit') {
      executarArquivo('BleachBit-5.0.2-setup.exe', event, 'Abrindo instalador do BleachBit...');
    }

    if (tipo === 'limpardisco') {
      event.sender.send('status', 'Abrindo Limpeza de Disco...');
      log('Abrindo cleanmgr.exe');

      executarProcesso('cleanmgr.exe', [], event, 'cleanmgr.exe', 'Abrindo Limpeza de Disco...', {
        windowsHide: false
      });
    }

    if (tipo === 'limpezawindows') {
      executarBat('limpeza_windows.bat', event, 'Executando Limpeza Windows...');
    }

    if (tipo === 'otimizadormemoria') {
      executarBat('otimizador_memoria.bat', event, 'Executando Otimizador de Memória...');
    }

    if (tipo === 'adwcleaner') {
      executarArquivo('adwcleaner.exe', event, 'Abrindo AdwCleaner...');
    }
  });

  setTimeout(() => {
    event.sender.send('status', '✔ Programas processados');
    log('✔ Programas processados');
  }, 1500);
});

ipcMain.on('abrir-log', async () => {
  try {
    if (logPath && fs.existsSync(logPath)) {
      await shell.openPath(logPath);
    }
  } catch (error) {
    console.error('Erro ao abrir log:', error.message);
    log(`Erro ao abrir log: ${error.message}`);
  }
});

ipcMain.on('abrir-link', (_event, url) => {
  shell.openExternal(url);
});

app.whenReady().then(() => {
  logPath = path.join(app.getPath('userData'), 'logs', 'KKJOpti-log.txt');
  log('App iniciado com sucesso');
  log(`Arquivo de log: ${logPath}`);
  log(`app.isPackaged = ${app.isPackaged}`);
  log(`process.resourcesPath = ${process.resourcesPath}`);
  log(`__dirname = ${__dirname}`);

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      log('Nova janela criada');
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  log('App fechado');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});