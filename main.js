const { app, BrowserWindow, ipcMain } = require('electron');
const { execFile } = require('child_process');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    autoHideMenuBar: true,
    backgroundColor: '#050816',
    icon: path.join(__dirname, 'assets', 'logo_bigger_transparent.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');
}

const { spawn } = require('child_process');
function executarBat(nomeArquivo) {
  const arquivo = path.join(__dirname, 'scripts', nomeArquivo);
  const processo = spawn(arquivo, [], {
    shell: true,
    windowsHide: true
  });
  processo.on('error', (error) => {
    console.error(`Erro ao executar ${nomeArquivo}:`, error.message);
  });
  processo.on('close', (code) => {
    console.log(`${nomeArquivo} finalizado com código ${code}`);
  });
}
function executarReg(nomeArquivo) {
  const arquivo = path.join(__dirname, 'scripts', nomeArquivo);

  const processo = spawn('reg', ['import', arquivo], {
    shell: true,
    windowsHide: true
  });

  processo.on('error', (error) => {
    console.error(`Erro ao aplicar ${nomeArquivo}:`, error.message);
  });

  processo.on('close', (code) => {
    console.log(`${nomeArquivo} finalizado com código ${code}`);
  });
}

ipcMain.on('executar-lote', (event, tipos) => {
  if (!Array.isArray(tipos)) return;

  const sendStatus = (msg) => {
    event.sender.send('status', msg);
  };

  tipos.forEach((tipo) => {
    if (tipo === 'limpeza') {
      sendStatus('Limpando arquivos temporários...');
      executarBat('limpeza.bat');
    }

    if (tipo === 'cache') {
      sendStatus('Limpando cache...');
      executarBat('cache.bat');
    }

    if (tipo === 'cleanwindows') {
      sendStatus('Limpando sistema...');
      executarBat('cleanwindows.bat');
    }

    if (tipo === 'flushdns') {
      sendStatus('Atualizando DNS...');
      executarBat('flushdns.bat');
    }

    if (tipo === 'networkboost') {
      sendStatus('Otimizando rede...');
      executarBat('networkboost.bat');
    }

    if (tipo === 'startup') {
      sendStatus('Otimizando inicialização...');
      executarBat('startup.bat');
    }

    if (tipo === 'cpu') {
      sendStatus('Otimizando uso de CPU...');
      executarBat('cpu.bat');
    }

    if (tipo === 'decreaseload') {
      sendStatus('Ativando modo desempenho...');
      executarBat('decreaseload.bat');
    }

    if (tipo === 'telemetria') {
      sendStatus('Desativando telemetria...');
      executarReg('telemetria.reg');
    }

    if (tipo === 'responsiveness') {
      sendStatus('Ajustando responsividade...');
      executarReg('responsiveness.reg');
    }

    if (tipo === 'inputdelay') {
      sendStatus('Reduzindo input delay...');
      executarReg('inputdelay.reg');
    }

    if (tipo === 'processorscheduling') {
      sendStatus('Ajustando prioridade do processador...');
      executarReg('processorscheduling.reg');
    }
  });

  sendStatus('✔ Otimização concluída');
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});