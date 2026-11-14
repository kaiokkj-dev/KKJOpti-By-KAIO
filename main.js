const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const catalog = require('./optimizations');
const systemState = require('./system-state');

const scriptsDir = path.join(app.isPackaged ? process.resourcesPath : __dirname, 'scripts');
// Valores de registro de cada ação e conflitos entre ações (calculado uma vez).
const analysis = systemState.analyzeCatalog(catalog, scriptsDir);
// Resolvido no primeiro acesso: o app está rodando como administrador?
let adminCheck = null;
function isAdmin() {
  // "net session" só funciona com privilégios de administrador.
  adminCheck ||= new Promise((resolve) => {
    const child = spawn('net.exe', ['session'], { shell: false, windowsHide: true, stdio: 'ignore' });
    child.once('error', () => resolve(false));
    child.once('close', (code) => resolve(code === 0));
  });
  return adminCheck;
}

let mainWindow;
let logPath;
let historyPath;
let backupsPath;
let running = false;
let previousCpuSample = null;

function writeLog(message) {
  if (!logPath) return;
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`, 'utf8');
}

function readHistory() {
  try {
    if (!historyPath || !fs.existsSync(historyPath)) return [];
    const value = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    return Array.isArray(value) ? value.slice(0, 30) : [];
  } catch (error) {
    writeLog(`Falha ao ler histórico: ${error.message}`);
    return [];
  }
}

function saveRun(mode, summary, runId) {
  if (!historyPath) return;
  const entry = { id: runId, date: new Date().toISOString(), mode, success: summary.success, failed: summary.failed, results: summary.results.map(({ id, title, ok, error, backupFiles }) => ({ id, title, ok, error: error || '', backupFiles: backupFiles || [] })) };
  const history = [entry, ...readHistory()].slice(0, 30);
  fs.mkdirSync(path.dirname(historyPath), { recursive: true });
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf8');
}

async function backupRegistry(item, target, runId) {
  if (!backupsPath) return [];
  const text = fs.readFileSync(target, 'utf8');
  const keys = [...text.matchAll(/^\[([^\]-][^\]]*)\]$/gm)].map((match) => match[1]);
  const folder = path.join(backupsPath, runId, item.id);
  fs.mkdirSync(folder, { recursive: true });
  const files = [];
  for (let index = 0; index < keys.length; index += 1) {
    const file = path.join(folder, `${index + 1}.reg`);
    const result = await runProcess('reg.exe', ['export', keys[index], file, '/y']);
    if (result.ok && fs.existsSync(file)) files.push(file);
  }
  return files;
}

function resourcePath(item, mode = 'apply') {
  const file = mode === 'restore' ? item.restoreFile : item.file;
  if (!file) return null;
  const root = app.isPackaged ? process.resourcesPath : __dirname;
  return path.join(root, 'scripts', file);
}

function publicItem(item) {
  const applyPath = resourcePath(item);
  const restorePath = resourcePath(item, 'restore');
  return {
    ...item,
    available: item.kind === 'system' || Boolean(applyPath && fs.existsSync(applyPath)),
    restorable: Boolean(restorePath && fs.existsSync(restorePath)),
    conflicts: analysis.conflicts[item.id] || []
  };
}

function sendProgress(payload) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('run:progress', payload);
}

// Tempo máximo de cada ação. Evita que um script travado (ex.: uma janela
// esperando clique) deixe a fila presa para sempre em "running".
const PROCESS_TIMEOUT_MS = 5 * 60 * 1000;

function runProcess(command, args = [], options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { shell: false, windowsHide: true, ...options });
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      // /T encerra também os processos filhos (o cmd.exe sozinho deixaria os filhos rodando).
      spawn('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true });
    }, PROCESS_TIMEOUT_MS);
    child.stderr?.on('data', (data) => { stderr += data.toString(); });
    child.on('error', (error) => { clearTimeout(timer); resolve({ ok: false, code: -1, error: error.message }); });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (timedOut) resolve({ ok: false, code, error: `Tempo limite de ${PROCESS_TIMEOUT_MS / 60000} minutos excedido.` });
      else resolve({ ok: code === 0, code, error: stderr.trim() });
    });
  });
}

function captureProcess(command, args = []) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { shell: false, windowsHide: true });
    let stdout = '';
    child.stdout?.on('data', (data) => { stdout += data.toString(); });
    child.once('error', () => resolve(''));
    child.once('close', () => resolve(stdout.trim()));
  });
}

function cpuStats() {
  const current = os.cpus().reduce((sum, cpu) => {
    const total = Object.values(cpu.times).reduce((value, time) => value + time, 0);
    return { idle: sum.idle + cpu.times.idle, total: sum.total + total };
  }, { idle: 0, total: 0 });
  let usage = 0;
  if (previousCpuSample) {
    const idle = current.idle - previousCpuSample.idle;
    const total = current.total - previousCpuSample.total;
    usage = total > 0 ? Math.round((1 - idle / total) * 100) : 0;
  }
  previousCpuSample = current;
  return Math.max(0, Math.min(100, usage));
}

function liveStats() {
  const totalMemory = os.totalmem();
  const usedMemory = totalMemory - os.freemem();
  let disk = null;
  try {
    const drive = process.env.SystemDrive || 'C:';
    const values = fs.statfsSync(`${drive}\\`);
    disk = { freeGb: Math.round(values.bavail * values.bsize / 1024 ** 3), totalGb: Math.round(values.blocks * values.bsize / 1024 ** 3) };
  } catch {}
  return { cpuUsage: cpuStats(), memoryUsage: Math.round(usedMemory / totalMemory * 100), freeMemoryGb: Math.round(os.freemem() / 1024 ** 3 * 10) / 10, uptimeHours: Math.round(os.uptime() / 360) / 10, disk };
}

async function systemInfo() {
  const gpuCommand = "Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name | Select-Object -First 1";
  const gpu = await captureProcess('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', gpuCommand]);
  return { cpu: os.cpus()[0]?.model?.trim() || 'Não identificado', cores: os.cpus().length, memoryGb: Math.round(os.totalmem() / 1024 ** 3), platform: os.platform(), release: os.release(), hostname: os.hostname(), architecture: os.arch(), gpu: gpu || 'Não identificada', ...liveStats() };
}

function launchProcess(command, args = []) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { shell: false, windowsHide: false, detached: true, stdio: 'ignore' });
    let settled = false;
    child.once('error', (error) => {
      if (settled) return;
      settled = true;
      resolve({ ok: false, code: -1, error: error.message });
    });
    child.once('spawn', () => {
      if (settled) return;
      settled = true;
      child.unref();
      resolve({ ok: true, code: 0, launched: true });
    });
  });
}

function runBatch(target) {
  return runProcess('cmd.exe', ['/d', '/s', '/c', `""${target}""`], { windowsVerbatimArguments: true });
}

async function executeItem(item, mode, runId) {
  if (item.kind === 'system' && item.id === 'limpardisco') return launchProcess('cleanmgr.exe');
  const systemTools = {
    storage_sense: { uri: 'ms-settings:storagesense' },
    startup_apps: { uri: 'ms-settings:startupapps' },
    installed_apps: { uri: 'ms-settings:appsfeatures' },
    windows_security: { uri: 'windowsdefender:' },
    task_manager: { command: 'taskmgr.exe' },
    resource_monitor: { command: 'resmon.exe' },
    system_protection: { command: 'SystemPropertiesProtection.exe' },
    dxdiag: { command: 'dxdiag.exe' },
    power_options: { command: 'control.exe', args: ['/name', 'Microsoft.PowerOptions'] }
  };
  if (item.kind === 'system' && systemTools[item.id]) {
    const tool = systemTools[item.id];
    if (tool.uri) {
      try { await shell.openExternal(tool.uri); return { ok: true, code: 0, launched: true }; }
      catch (error) { return { ok: false, code: -1, error: error.message }; }
    }
    return launchProcess(tool.command, tool.args || []);
  }
  if (item.kind === 'system' && item.id === 'restorepoint') {
    const command = "Checkpoint-Computer -Description 'KKJOpti' -RestorePointType 'MODIFY_SETTINGS' -ErrorAction Stop";
    return runProcess('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command]);
  }
  const target = resourcePath(item, mode);
  if (!target || !fs.existsSync(target)) return { ok: false, code: -1, error: `Arquivo não encontrado: ${path.basename(target || 'não configurado')}` };
  const extension = path.extname(target).toLowerCase();
  const backupFiles = mode === 'apply' && extension === '.reg' ? await backupRegistry(item, target, runId) : [];
  if (extension === '.reg') return { ...await runProcess('reg.exe', ['import', target]), backupFiles };
  if (extension === '.bat' || extension === '.cmd') return runBatch(target);
  if (extension === '.exe') return launchProcess(target);
  return { ok: false, code: -1, error: 'Tipo de arquivo não permitido.' };
}

async function runQueue(ids, mode = 'apply') {
  if (running) return { ok: false, reason: 'Já existe uma operação em andamento.' };
  const items = [...new Set(Array.isArray(ids) ? ids : [])].slice(0, 50).map((id) => catalog.find((entry) => entry.id === id)).filter(Boolean);
  if (!items.length) return { ok: false, reason: 'Nenhuma ação válida foi selecionada.' };
  running = true;
  const runId = `${Date.now()}`;
  const results = [];
  try {
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      sendProgress({ phase: 'running', id: item.id, index: index + 1, total: items.length, label: item.title, mode });
      writeLog(`${mode.toUpperCase()} ${item.id} iniciado`);
      const result = item.requiresAdmin && !(await isAdmin())
        ? { ok: false, code: -1, error: 'Requer administrador. Reabra o KKJOpti como administrador.' }
        : await executeItem(item, mode, runId);
      results.push({ id: item.id, title: item.title, ...result });
      writeLog(`${mode.toUpperCase()} ${item.id} ${result.ok ? 'sucesso' : `falha: ${result.error || result.code}`}`);
      sendProgress({ phase: result.ok ? 'success' : 'error', id: item.id, result });
    }
  } finally { running = false; }
  const success = results.filter((result) => result.ok).length;
  const summary = { ok: success === results.length, success, failed: results.length - success, results };
  saveRun(mode, summary, runId);
  sendProgress({ phase: 'complete', ...summary });
  return summary;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440, height: 920, minWidth: 980, minHeight: 680, autoHideMenuBar: true, backgroundColor: '#050907',
    icon: path.join(__dirname, 'assets', 'kkjopti_icon.ico'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  mainWindow.loadFile('index.html');
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
}

ipcMain.handle('catalog:list', () => catalog.map(publicItem));

// Estado atual do Windows: { admin, statuses: { id: true | false } }.
// Ações sem estado (limpezas, ferramentas) ficam de fora.
ipcMain.handle('catalog:status', async () => {
  const [admin, snapshot] = await Promise.all([isAdmin(), systemState.readSnapshot(analysis.regSettings)]);
  const statuses = {};
  for (const item of catalog) {
    const status = systemState.itemStatus(item, snapshot, analysis.regSettings);
    if (status !== null) statuses[item.id] = status;
  }
  return { admin, statuses };
});

ipcMain.handle('app:is-admin', () => isAdmin());

// Reabre o app pedindo permissão de administrador (UAC) e fecha esta janela.
ipcMain.handle('app:relaunch-admin', async () => {
  if (running) return { ok: false, reason: 'Aguarde a operação atual terminar.' };
  const quote = (value) => `'${String(value).replace(/'/g, "''")}'`;
  // Em desenvolvimento o electron.exe precisa receber a pasta do projeto.
  const args = app.isPackaged ? '' : ` -ArgumentList ${quote(`"${app.getAppPath()}"`)}`;
  const command = `Start-Process -FilePath ${quote(process.execPath)}${args} -Verb RunAs -ErrorAction Stop`;
  // Libera o bloqueio de instância única para a nova janela conseguir abrir.
  app.releaseSingleInstanceLock();
  const result = await runProcess('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command]);
  if (result.ok) {
    writeLog('Reaberto como administrador');
    app.quit();
    return { ok: true };
  }
  app.requestSingleInstanceLock();
  return { ok: false, reason: 'A permissão de administrador não foi concedida.' };
});
ipcMain.handle('catalog:details', (_event, id) => {
  const item = catalog.find((entry) => entry.id === id);
  if (!item) return null;
  const target = resourcePath(item);
  let preview = item.kind === 'system' ? 'Ferramenta integrada do Windows.' : `Arquivo: ${item.file}`;
  if (target && fs.existsSync(target) && ['.bat', '.cmd', '.reg'].includes(path.extname(target).toLowerCase())) {
    const lines = fs.readFileSync(target, 'utf8').split(/\r?\n/)
      .map((line) => line.replace(/\s*\|\|\s*set "FALHA=1"$/i, '').trim())
      .filter((line) => line && !/^(@echo|echo |::|;|rem |setlocal|set "FALHA|Windows Registry Editor|exit)/i.test(line));
    preview = lines.slice(0, 18).join('\n') || `Arquivo: ${item.file}`;
  }
  return { ...publicItem(item), preview: preview.slice(0, 5000) };
});
ipcMain.handle('system:info', () => systemInfo());
ipcMain.handle('system:stats', () => liveStats());
ipcMain.handle('run:apply', (_event, ids) => runQueue(ids, 'apply'));
ipcMain.handle('run:restore', (_event, ids) => runQueue(ids, 'restore'));
ipcMain.handle('log:open', async () => {
  if (!logPath || !fs.existsSync(logPath)) return { ok: false, reason: 'O log ainda está vazio.' };
  const error = await shell.openPath(logPath);
  return { ok: !error, reason: error };
});
ipcMain.handle('history:list', () => readHistory());
ipcMain.handle('history:restore-snapshot', async (_event, runId, itemId) => {
  if (running) return { ok: false, reason: 'Já existe uma operação em andamento.' };
  const run = readHistory().find((entry) => entry.id === runId);
  const result = run?.results.find((entry) => entry.id === itemId);
  if (!result?.backupFiles?.length) return { ok: false, reason: 'Esta ação não possui snapshot disponível.' };
  const root = path.resolve(backupsPath);
  for (const file of result.backupFiles) {
    const resolved = path.resolve(file);
    if (!resolved.startsWith(`${root}${path.sep}`) || !fs.existsSync(resolved)) return { ok: false, reason: 'Snapshot inválido ou removido.' };
    const restored = await runProcess('reg.exe', ['import', resolved]);
    if (!restored.ok) return { ok: false, reason: restored.error || 'Não foi possível restaurar o registro.' };
  }
  writeLog(`SNAPSHOT ${runId}/${itemId} restaurado`);
  return { ok: true };
});
ipcMain.handle('external:open', async (_event, value) => {
  if (value !== 'https://kaiohenrique.dev/') return { ok: false, reason: 'Link não permitido.' };
  await shell.openExternal(value); return { ok: true };
});

const sessionPath = path.join(app.getPath('userData'), 'Session');
fs.mkdirSync(sessionPath, { recursive: true });
app.setPath('sessionData', sessionPath);

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) app.quit();
app.on('second-instance', () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

app.whenReady().then(() => {
  if (!hasSingleInstanceLock) return;
  logPath = path.join(app.getPath('userData'), 'logs', 'KKJOpti-log.txt');
  historyPath = path.join(app.getPath('userData'), 'logs', 'history.json');
  backupsPath = path.join(app.getPath('userData'), 'backups');
  writeLog('Aplicativo iniciado'); createWindow();
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow());
});
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit());
process.on('uncaughtException', (error) => writeLog(`Erro não tratado: ${error.stack || error.message}`));
process.on('unhandledRejection', (error) => writeLog(`Rejeição não tratada: ${error?.stack || error}`));
