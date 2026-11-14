const state = { catalog: [], selected: new Set(), category: 'all', risk: 'all', query: '', running: false, system: null, recommendedRamId: null, pendingMode: 'apply', pendingIds: [], beforeStats: null };
const $ = (selector) => document.querySelector(selector);
const labels = { all: 'Todas as otimizações', performance: 'Performance', fps: 'Jogos e FPS', internet: 'Internet', gpu: 'Placa de vídeo', ram: 'Memória RAM', programs: 'Ferramentas' };
const riskLabels = { safe: 'Seguro', moderate: 'Moderado', advanced: 'Avançado' };
lucide.createIcons({ attrs: { 'stroke-width': 1.8 } });

function escapeHtml(value) { const node = document.createElement('span'); node.textContent = value; return node.innerHTML; }
function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.hidden = false; clearTimeout(showToast.timer); showToast.timer = setTimeout(() => { toast.hidden = true; }, 2800); }
function updateSelection() {
  $('#selected-count').textContent = state.selected.size;
  $('#apply').disabled = !state.selected.size || state.running;
  $('#restore').disabled = state.running || ![...state.selected].some((id) => state.catalog.find((item) => item.id === id)?.restorable);
}

function filteredItems() {
  return state.catalog.filter((item) => ((state.category === 'all' && item.category !== 'programs') || item.category === state.category) && (state.risk === 'all' || item.risk === state.risk) && (!state.query || `${item.title} ${item.description} ${item.group}`.toLowerCase().includes(state.query)));
}

function compatibility(item) {
  if (!state.system) return { ok: true, label: '' };
  if (item.category === 'ram' && item.id !== state.recommendedRamId) return { ok: false, label: `Seu PC possui ${state.system.memoryGb} GB` };
  const gpu = state.system.gpu.toLowerCase();
  if (item.group === 'NVIDIA' && !gpu.includes('nvidia')) return { ok: false, label: 'Requer GPU NVIDIA' };
  if (item.group === 'AMD' && !gpu.includes('amd') && !gpu.includes('radeon')) return { ok: false, label: 'Requer GPU AMD' };
  return { ok: true, label: '' };
}

function render() {
  const items = filteredItems();
  $('#cards').innerHTML = items.map((item) => { const compatible = compatibility(item); return `
    <article class="optimization-card ${state.selected.has(item.id) ? 'selected' : ''} ${item.available ? '' : 'unavailable'} ${compatible.ok ? '' : 'incompatible'}" data-id="${item.id}">
      <button class="card-select" ${item.available || item.restorable ? '' : 'disabled'} aria-pressed="${state.selected.has(item.id)}">
        <span class="check">${state.selected.has(item.id) ? '✓' : ''}</span>
        <span class="card-copy"><span class="card-top"><small>${escapeHtml(item.group)}</small><em class="risk ${item.risk}">${riskLabels[item.risk]}</em>${item.requiresAdmin ? '<em class="admin-badge">Administrador</em>' : ''}${item.restart ? '<em class="restart">Reinicia</em>' : ''}${item.id === state.recommendedRamId ? '<em class="recommended-badge">Ideal para este PC</em>' : ''}</span><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.description)}</p></span>
        <span class="availability-badge">${compatible.ok ? (item.available ? 'Disponível' : 'Arquivo ausente') : escapeHtml(compatible.label)}</span>
      </button>
      <button class="details-button" aria-label="Ver detalhes de ${escapeHtml(item.title)}"><i data-lucide="info"></i></button>
    </article>`; }).join('');
  $('#empty').hidden = items.length > 0;
  $('#catalog-title').textContent = labels[state.category];
  document.querySelectorAll('.card-select').forEach((button) => button.addEventListener('click', () => {
    const id = button.closest('[data-id]').dataset.id;
    const item = state.catalog.find((entry) => entry.id === id);
    if (state.selected.has(id)) state.selected.delete(id);
    else { if (item?.category === 'programs') state.selected.clear(); state.selected.add(id); }
    render(); updateSelection();
  }));
  document.querySelectorAll('.details-button').forEach((button) => button.addEventListener('click', () => showDetails(button.closest('[data-id]').dataset.id)));
  lucide.createIcons({ attrs: { 'stroke-width': 1.8 } });
}

async function showDetails(id) {
  const item = await window.kkj.getDetails(id); if (!item) return;
  $('#details-title').textContent = item.title; $('#details-description').textContent = item.description; $('#details-command').textContent = item.preview;
  $('#details-badges').innerHTML = `<em class="risk ${item.risk}">${riskLabels[item.risk]}</em>${item.requiresAdmin ? '<em class="admin-badge">Administrador</em>' : ''}${item.restart ? '<em class="restart">Requer reinicialização</em>' : ''}`;
  lucide.createIcons({ attrs: { 'stroke-width': 1.8 } }); $('#details-dialog').showModal();
}

function selectProfile(profile) {
  state.selected.clear();
  const rules = {
    recommended: (item) => item.available && item.category !== 'programs' && item.id !== 'restorepoint' && (item.risk === 'safe' || ['disablegamedvr','animationsoff',state.recommendedRamId].includes(item.id)),
    gaming: (item) => item.available && item.category === 'fps' && item.risk !== 'advanced',
    advanced: (item) => item.available && item.category !== 'programs' && item.id !== 'restorepoint' && !item.id.startsWith('revert_') && compatibility(item).ok
  };
  state.catalog.filter(rules[profile]).forEach((item) => state.selected.add(item.id)); render(); updateSelection();
  const message = profile === 'advanced' ? `Perfil avançado: ${state.selected.size} ações compatíveis selecionadas. Revise antes de aplicar.` : `Perfil selecionado: ${state.selected.size} ações.`;
  showToast(state.selected.size ? message : 'Este perfil ainda não possui scripts disponíveis.');
}

function readProfiles() {
  try { return JSON.parse(localStorage.getItem('kkj-custom-profiles') || '{}'); } catch { return {}; }
}

function renderSavedProfiles() {
  const profiles = readProfiles();
  $('#saved-profiles').innerHTML = '<option value="">Meus perfis…</option>' + Object.keys(profiles).sort().map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');
  $('#delete-profile').hidden = true;
}

function saveCurrentProfile() {
  if (!state.selected.size) return showToast('Selecione algumas ações antes de salvar.');
  const name = prompt('Nome do perfil personalizado:')?.trim(); if (!name) return;
  const profiles = readProfiles(); profiles[name.slice(0, 40)] = [...state.selected];
  localStorage.setItem('kkj-custom-profiles', JSON.stringify(profiles)); renderSavedProfiles(); showToast(`Perfil “${name.slice(0, 40)}” salvo.`);
}

function loadSavedProfile(name) {
  if (!name) { $('#delete-profile').hidden = true; return; }
  const ids = readProfiles()[name] || []; state.selected = new Set(ids.filter((id) => state.catalog.some((item) => item.id === id && item.category !== 'programs')));
  $('#delete-profile').hidden = false; render(); updateSelection(); showToast(`Perfil “${name}” carregado.`);
}

function deleteSavedProfile() {
  const name = $('#saved-profiles').value; if (!name) return;
  const profiles = readProfiles(); delete profiles[name]; localStorage.setItem('kkj-custom-profiles', JSON.stringify(profiles)); renderSavedProfiles(); showToast('Perfil removido.');
}

async function showHistory() {
  const history = await window.kkj.getHistory();
  $('#history-list').innerHTML = history.length ? history.map((run) => {
    const date = new Date(run.date).toLocaleString('pt-BR');
    const details = run.results.map((result) => `<li class="${result.ok ? 'ok' : 'fail'}"><span>${result.ok ? '✓' : '!'}</span><b>${escapeHtml(result.title)}</b>${result.backupFiles?.length ? `<button class="snapshot-button" data-run="${run.id}" data-item="${result.id}">Restaurar snapshot</button>` : ''}</li>`).join('');
    return `<details class="history-run"><summary><div><strong>${run.mode === 'restore' ? 'Restauração' : 'Otimização'}</strong><span>${escapeHtml(date)}</span></div><em class="${run.failed ? 'has-fail' : ''}">${run.success} ok • ${run.failed} falha(s)</em></summary><ul>${details}</ul></details>`;
  }).join('') : '<p class="empty">Nenhuma execução registrada ainda.</p>';
  document.querySelectorAll('.snapshot-button').forEach((button) => button.addEventListener('click', async () => {
    if (!confirm('Restaurar os valores de registro salvos antes desta ação?')) return;
    const result = await window.kkj.restoreSnapshot(button.dataset.run, button.dataset.item);
    showToast(result.ok ? 'Snapshot restaurado com sucesso.' : result.reason);
  }));
  $('#history-dialog').showModal();
}

function onProgress(payload) {
  $('#run-panel').hidden = false;
  if (payload.phase === 'running') {
    $('#run-title').textContent = `${payload.mode === 'restore' ? 'Restaurando' : 'Aplicando'} ${payload.index} de ${payload.total}`;
    $('#run-message').textContent = payload.label;
    $('#progress-bar').style.width = `${((payload.index - 1) / payload.total) * 100}%`;
  } else if (payload.phase === 'success' || payload.phase === 'error') {
    const item = state.catalog.find((entry) => entry.id === payload.id);
    const successMessage = payload.result.launched ? 'Programa aberto com sucesso.' : 'Concluído com sucesso.';
    $('#results').insertAdjacentHTML('beforeend', `<div class="result ${payload.phase}"><span>${payload.phase === 'success' ? '✓' : '!'}</span><div><strong>${escapeHtml(item?.title || payload.id)}</strong><p>${payload.phase === 'success' ? successMessage : escapeHtml(payload.result.error || 'A execução falhou.')}</p></div></div>`);
  } else if (payload.phase === 'complete') {
    $('#progress-bar').style.width = '100%'; $('#run-title').textContent = 'Execução concluída'; $('#run-message').textContent = `${payload.success} concluída(s), ${payload.failed} falha(s).`;
  }
}

function prepareExecution(mode) {
  const ids = [...state.selected].filter((id) => {
    const item = state.catalog.find((entry) => entry.id === id);
    if (state.category === 'programs') return mode === 'apply' && item?.category === 'programs' && item.available;
    return mode === 'apply' ? item?.category !== 'programs' && item?.available : item?.category !== 'programs' && item?.restorable;
  });
  if (!ids.length) return showToast(mode === 'restore' ? 'Nenhuma opção selecionada possui reversão disponível.' : 'Selecione ao menos uma ação disponível.');
  const items = ids.map((id) => state.catalog.find((item) => item.id === id));
  state.pendingMode = mode; state.pendingIds = ids;
  if (state.category === 'programs') { runPending(); return; }
  $('#review-count').textContent = items.length;
  $('#review-admin').textContent = items.filter((item) => item.requiresAdmin).length;
  $('#review-restart').textContent = items.filter((item) => item.restart).length;
  $('#review-list').innerHTML = items.map((item) => `<div class="review-item"><span class="review-icon ${item.risk}"><i data-lucide="${item.risk === 'advanced' ? 'triangle-alert' : item.risk === 'moderate' ? 'shield-alert' : 'shield-check'}"></i></span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.description)}</p></div><em class="risk ${item.risk}">${riskLabels[item.risk]}</em></div>`).join('');
  $('#auto-restore-row').hidden = mode === 'restore' || !items.some((item) => item.risk === 'advanced' || item.requiresAdmin);
  $('#confirm-run').textContent = mode === 'restore' ? 'Confirmar restauração' : 'Confirmar e executar';
  lucide.createIcons({ attrs: { 'stroke-width': 1.8 } });
  $('#review-dialog').showModal();
}

async function runPending() {
  let ids = [...state.pendingIds];
  if (state.pendingMode === 'apply' && !$('#auto-restore-row').hidden && $('#auto-restore').checked && !ids.includes('restorepoint')) ids.unshift('restorepoint');
  $('#review-dialog').close();
  state.running = true; updateSelection(); $('#results').innerHTML = ''; $('#comparison').hidden = true; $('#progress-bar').style.width = '0'; $('#run-panel').hidden = false;
  state.beforeStats = await window.kkj.getSystemStats();
  try {
    const result = await window.kkj[state.pendingMode](ids); if (result.reason) showToast(result.reason);
    const after = await window.kkj.getSystemStats();
    const memoryDelta = Math.round((after.freeMemoryGb - state.beforeStats.freeMemoryGb) * 10) / 10;
    $('#comparison').innerHTML = `<div><span>CPU antes</span><strong>${state.beforeStats.cpuUsage}%</strong></div><div><span>CPU depois</span><strong>${after.cpuUsage}%</strong></div><div><span>RAM livre</span><strong>${memoryDelta >= 0 ? '+' : ''}${memoryDelta} GB</strong></div>`;
    $('#comparison').hidden = false;
  }
  catch (error) { showToast(`Falha na comunicação: ${error.message}`); }
  finally { state.running = false; state.selected.clear(); updateSelection(); render(); }
}

function applyLiveStats(stats) {
  $('#cpu-meter').style.width = `${stats.cpuUsage}%`;
  $('#memory-meter').style.width = `${stats.memoryUsage}%`;
  $('#cores').textContent = `${stats.cpuUsage}% em uso • ${state.system?.cores || '—'} processadores lógicos`;
  $('#memory-live').textContent = `${stats.memoryUsage}% em uso • ${stats.freeMemoryGb} GB livres`;
  $('#disk').textContent = stats.disk ? `${stats.disk.freeGb} GB livres` : 'Não disponível';
  $('#uptime').textContent = `Tempo ligado: ${stats.uptimeHours} h`;
  const recommendations = [];
  if (stats.memoryUsage >= 80) recommendations.push({ icon: 'memory-stick', text: `Memória em ${stats.memoryUsage}% — feche aplicativos pesados antes de jogar.` });
  if (stats.disk && stats.disk.freeGb < 30) recommendations.push({ icon: 'hard-drive', text: `Somente ${stats.disk.freeGb} GB livres — execute a limpeza de armazenamento.` });
  if (stats.cpuUsage >= 85) recommendations.push({ icon: 'cpu', text: `CPU em ${stats.cpuUsage}% — verifique processos no Gerenciador de Tarefas.` });
  if (stats.uptimeHours >= 72) recommendations.push({ icon: 'refresh-cw', text: `PC ligado há ${stats.uptimeHours} horas — uma reinicialização pode concluir atualizações.` });
  $('#recommendations').innerHTML = recommendations.slice(0, 3).map((item) => `<div><i data-lucide="${item.icon}"></i><span>${escapeHtml(item.text)}</span></div>`).join('');
  $('#recommendations').hidden = recommendations.length === 0;
  if (recommendations.length) lucide.createIcons({ attrs: { 'stroke-width': 1.8 } });
}

async function init() {
  if (!window.kkj) return showToast('Abra o projeto pelo Electron para usar as funções do sistema.');
  window.kkj.onProgress(onProgress);
  const [catalog, system] = await Promise.all([window.kkj.getCatalog(), window.kkj.getSystemInfo()]); state.catalog = catalog; state.system = system;
  const ramSizes = [2, 4, 6, 8, 12, 16, 24, 32];
  const closestRam = ramSizes.reduce((best, value) => Math.abs(value - system.memoryGb) < Math.abs(best - system.memoryGb) ? value : best, ramSizes[0]);
  state.recommendedRamId = `ram${closestRam}gb`;
  $('#cpu').textContent = system.cpu; $('#memory').textContent = `${system.memoryGb} GB`; $('#windows').textContent = `Windows ${system.release}`; $('#architecture').textContent = `${system.architecture} • ${system.hostname}`; $('#gpu').textContent = system.gpu;
  applyLiveStats(system);
  const available = catalog.filter((item) => item.available).length; $('#availability').textContent = `${available} de ${catalog.length} ações disponíveis`; $('#system-status').textContent = available === catalog.length ? 'Tudo pronto' : 'Configuração incompleta'; $('#notice').hidden = available === catalog.length;
  render(); updateSelection();
  renderSavedProfiles();
  setInterval(async () => { if (!state.running) applyLiveStats(await window.kkj.getSystemStats()); }, 3000);
}

$('#navigation').addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]'); if (!button) return;
  state.category = button.dataset.category;
  const toolsPage = state.category === 'programs';
  document.querySelectorAll('.nav-item[data-category]').forEach((item) => item.classList.toggle('active', item === button));
  $('#page-title').textContent = labels[state.category] === 'Todas as otimizações' ? 'Visão geral' : labels[state.category];
  $('#page-subtitle').textContent = toolsPage ? 'Ferramentas confiáveis do Windows para manutenção e diagnóstico.' : 'Diagnóstico e otimizações transparentes para o seu PC.';
  $('#profiles-section').hidden = toolsPage;
  $('#restore').hidden = toolsPage;
  $('#apply-label').textContent = toolsPage ? 'Abrir ferramenta' : 'Aplicar selecionadas';
  render();
});
$('#search').addEventListener('input', (event) => { state.query = event.target.value.trim().toLowerCase(); render(); });
$('#risk-filter').addEventListener('change', (event) => { state.risk = event.target.value; render(); });
document.querySelectorAll('[data-profile]').forEach((button) => button.addEventListener('click', () => selectProfile(button.dataset.profile)));
$('#save-profile').addEventListener('click', saveCurrentProfile);
$('#saved-profiles').addEventListener('change', (event) => loadSavedProfile(event.target.value));
$('#delete-profile').addEventListener('click', deleteSavedProfile);
$('#clear').addEventListener('click', () => { state.selected.clear(); render(); updateSelection(); });
$('#apply').addEventListener('click', () => prepareExecution('apply')); $('#restore').addEventListener('click', () => prepareExecution('restore'));
$('#close-review').addEventListener('click', () => $('#review-dialog').close());
$('#confirm-run').addEventListener('click', runPending);
$('#close-details').addEventListener('click', () => $('#details-dialog').close());
$('#close-run').addEventListener('click', () => { if (!state.running) $('#run-panel').hidden = true; });
$('#show-history').addEventListener('click', () => showHistory().catch((error) => showToast(error.message)));
$('#close-history').addEventListener('click', () => $('#history-dialog').close());
$('#open-log').addEventListener('click', async () => { const result = await window.kkj.openLog(); if (!result.ok) showToast(result.reason); });
$('#open-site').addEventListener('click', () => window.kkj.openWebsite());
init().catch((error) => showToast(`Não foi possível iniciar: ${error.message}`));
