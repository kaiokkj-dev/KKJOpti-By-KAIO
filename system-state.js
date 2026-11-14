// Descobre o estado atual do Windows para cada ação do catálogo
// ("já aplicado" ou não) e quais ações alteram o mesmo ajuste com valores diferentes.
// Tudo aqui é somente leitura: nada é alterado no sistema.
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCHEME_HIGH_PERFORMANCE = '8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c';

/** Lê um .reg e devolve a lista de valores que ele grava ou apaga. */
function parseRegFile(file) {
  const settings = [];
  let key = null;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith(';') || line.startsWith('Windows Registry Editor')) continue;
    const keyMatch = line.match(/^\[(-?)(HKEY_[^\]]+)\]$/);
    if (keyMatch) { key = keyMatch[1] ? null : keyMatch[2]; continue; }
    const valueMatch = line.match(/^"([^"]+)"=(.*)$/);
    if (!key || !valueMatch) continue;
    const [, name, data] = valueMatch;
    let expected;
    if (data === '-') expected = null; // valor removido
    else if (data.startsWith('dword:')) expected = String(parseInt(data.slice(6), 16)); // sempre sem sinal (0 a 4294967295)
    else if (data.startsWith('"')) expected = data.slice(1, -1);
    else continue; // hex/binário: não comparável de forma confiável
    settings.push({ key, name, expected });
  }
  return settings;
}

/**
 * Prepara as informações estáticas do catálogo: valores de registro de cada
 * ação e a lista de conflitos entre ações.
 */
function analyzeCatalog(catalog, scriptsDir) {
  const regSettings = {};
  for (const item of catalog) {
    if (!item.file || !item.file.toLowerCase().endsWith('.reg')) continue;
    const file = path.join(scriptsDir, item.file);
    if (fs.existsSync(file)) regSettings[item.id] = parseRegFile(file);
  }

  // Duas ações conflitam quando gravam o MESMO valor de registro com dados diferentes.
  const conflicts = {};
  const ids = Object.keys(regSettings);
  for (let a = 0; a < ids.length; a += 1) {
    for (let b = a + 1; b < ids.length; b += 1) {
      const shared = [];
      for (const sa of regSettings[ids[a]]) {
        const sb = regSettings[ids[b]].find((entry) => entry.key.toLowerCase() === sa.key.toLowerCase() && entry.name.toLowerCase() === sa.name.toLowerCase());
        if (sb && sb.expected !== sa.expected) shared.push(sa.name);
      }
      if (shared.length) {
        (conflicts[ids[a]] ||= []).push({ id: ids[b], settings: shared });
        (conflicts[ids[b]] ||= []).push({ id: ids[a], settings: shared });
      }
    }
  }
  return { regSettings, conflicts };
}

function runPowerShell(script, timeoutMs = 20000) {
  return new Promise((resolve) => {
    const encoded = Buffer.from(script, 'utf16le').toString('base64');
    const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded], { shell: false, windowsHide: true });
    let stdout = '';
    const timer = setTimeout(() => child.kill(), timeoutMs);
    child.stdout.on('data', (data) => { stdout += data.toString('utf8'); });
    child.once('error', () => { clearTimeout(timer); resolve(''); });
    child.once('close', () => { clearTimeout(timer); resolve(stdout.trim()); });
  });
}

/** Coleta, em uma única chamada ao PowerShell, tudo que precisa ser lido do sistema. */
async function readSnapshot(regSettings) {
  const wanted = [];
  const seen = new Set();
  for (const list of Object.values(regSettings)) {
    for (const { key, name } of list) {
      const id = `${key}|${name}`.toLowerCase();
      if (!seen.has(id)) { seen.add(id); wanted.push({ key, name }); }
    }
  }
  const json = JSON.stringify(wanted).replace(/'/g, "''");
  const script = `
$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$wanted = ConvertFrom-Json '${json}'
$reg = @{}
foreach ($w in $wanted) {
  $props = Get-ItemProperty -LiteralPath ('Registry::' + $w.key) -Name $w.name
  if ($props -and $null -ne $props.($w.name)) { $reg[($w.key + '|' + $w.name).ToLower()] = [string]$props.($w.name) }
}
$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
$tcp = Get-NetTCPSetting -SettingName Internet
$offload = Get-NetOffloadGlobalSetting
$bcd = $null; $mm = $null
if ($admin) {
  $bcd = (bcdedit /enum '{current}') -join "\`n"
  $agent = Get-MMAgent
  if ($agent) { $mm = [bool]$agent.MemoryCompression }
}
[pscustomobject]@{
  admin = $admin
  reg = $reg
  scheme = ((powercfg /getactivescheme) -join ' ')
  cpm = ((powercfg /qh scheme_current sub_processor CPMINCORES) -join "\`n")
  tcp = [pscustomobject]@{
    autotuning = [string]$tcp.AutoTuningLevelLocal
    ecn = [string]$tcp.EcnCapability
    timestamps = [string]$tcp.Timestamps
    nonsack = [string]$tcp.NonSackRttResiliency
    rss = [string]$offload.ReceiveSideScaling
  }
  bcd = $bcd
  mm = $mm
} | ConvertTo-Json -Depth 4 -Compress
`;
  const output = await runPowerShell(script);
  try { return JSON.parse(output.slice(output.indexOf('{'))); } catch { return null; }
}

/** true = já aplicado, false = não aplicado, null = não se aplica / não dá para saber. */
function itemStatus(item, snapshot, regSettings) {
  if (!snapshot || item.kind !== 'script' || item.id.startsWith('revert_')) return null;

  const settings = regSettings[item.id];
  if (settings && settings.length) {
    return settings.every(({ key, name, expected }) => {
      let current = snapshot.reg?.[`${key}|${name}`.toLowerCase()];
      // DWORD pode vir como Int32 com sinal (-1) ou sem sinal (4294967295): normaliza.
      if (current !== undefined && /^-?\d+$/.test(current) && /^\d+$/.test(expected ?? '')) current = String(Number(current) >>> 0);
      return expected === null ? current === undefined : current === expected;
    });
  }

  const tcp = snapshot.tcp || {};
  const is = (value, wanted) => String(value || '').toLowerCase() === wanted;
  const highPerformance = String(snapshot.scheme || '').toLowerCase().includes(SCHEME_HIGH_PERFORMANCE);
  const dynamicTickOff = snapshot.bcd == null ? null : /disabledynamictick\s+(yes|sim)/i.test(snapshot.bcd);
  const cpmValues = String(snapshot.cpm || '').match(/0x[0-9a-f]+/gi) || [];
  const cpmAc = cpmValues.length >= 2 ? parseInt(cpmValues[cpmValues.length - 2], 16) : null;

  switch (item.id) {
    case 'decreaseload': return highPerformance;
    case 'fpsboost': return !highPerformance ? false : dynamicTickOff;
    case 'timerresolution': return dynamicTickOff;
    case 'coreparking': return cpmAc == null ? null : cpmAc === 100;
    case 'memorycompression': return snapshot.mm == null ? null : snapshot.mm === false;
    case 'tcpopt':
    case 'networkboost': return is(tcp.autotuning, 'normal') && is(tcp.rss, 'enabled');
    case 'netspeedboost': return is(tcp.autotuning, 'normal') && is(tcp.rss, 'enabled') && is(tcp.ecn, 'disabled') && is(tcp.timestamps, 'disabled');
    case 'pingboost': return is(tcp.autotuning, 'normal') && is(tcp.nonsack, 'disabled');
    default: return null; // limpezas e ações pontuais não têm "estado"
  }
}

module.exports = { analyzeCatalog, readSnapshot, itemStatus };
