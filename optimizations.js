// Catálogo de ações do KKJOpti.
// Formato: [id, título, descrição, categoria, risco, grupo, arquivo, arquivoDeReversão, tipo]
//  - categoria: performance | fps | internet | gpu | ram | programs
//  - risco: safe | moderate | advanced
//  - arquivo / arquivoDeReversão: nomes dentro de scripts/ (.bat, .cmd ou .reg)
//  - tipo: 'script' (padrão) ou 'system' (ferramenta do Windows aberta pelo main.js)
const entries = [
  // Limpeza
  ['limpeza', 'Limpar arquivos temporários', 'Remove os arquivos temporários da sua conta (%TEMP%).', 'performance', 'safe', 'Limpeza', 'limpeza.bat'],
  ['cache', 'Limpar cache de shaders', 'Apaga o cache de shaders do DirectX, NVIDIA e AMD. Os jogos recriam o cache na próxima abertura (o primeiro carregamento fica mais lento).', 'performance', 'safe', 'Limpeza', 'cache.bat'],
  ['cleanwindows', 'Limpeza do Windows', 'Remove temporários do Windows e downloads antigos do Windows Update.', 'performance', 'moderate', 'Limpeza', 'cleanwindows.bat'],

  // Sistema
  ['telemetria', 'Reduzir telemetria', 'Define a política de diagnóstico no mínimo. No Windows Home/Pro o mínimo efetivo é "Necessário".', 'performance', 'moderate', 'Privacidade', 'telemetria.reg', 'restore_telemetria.reg'],
  ['responsiveness', 'Responsividade do sistema', 'Reserva menos CPU para tarefas em segundo plano de multimídia.', 'performance', 'moderate', 'Sistema', 'responsiveness.reg', 'restore_responsiveness.reg'],
  ['cpu', 'Fechar Cortana e Seu Telefone', 'Encerra os processos da Cortana e do app Seu Telefone até a próxima reinicialização.', 'performance', 'safe', 'CPU', 'cpu.bat'],
  ['decreaseload', 'Plano Alto desempenho', 'Ativa o plano de energia "Alto desempenho" do Windows.', 'performance', 'moderate', 'Energia', 'decreaseload.bat', 'restore_powerplan.bat'],
  ['cortanaoff', 'Desativar Cortana', 'Desativa a Cortana por política do Windows.', 'performance', 'moderate', 'Sistema', 'cortanaoff.reg', 'restore_cortana.reg'],
  ['explorerspeed', 'Menus mais rápidos', 'Remove o atraso de abertura dos menus do Explorer.', 'performance', 'safe', 'Sistema', 'explorerspeed.reg', 'restore_explorerspeed.reg'],
  ['notificationsoff', 'Desativar notificações', 'Desativa as notificações pop-up do Windows.', 'performance', 'moderate', 'Sistema', 'notificationsoff.reg', 'restore_notifications.reg'],
  ['animationsoff', 'Reduzir efeitos visuais', 'Ativa "Ajustar para obter melhor desempenho" nos efeitos visuais. Pode exigir sair e entrar na conta.', 'performance', 'safe', 'Visual', 'animationsoff.reg', 'animationson.reg'],

  // Jogos e FPS
  ['fpsboost', 'Perfil FPS', 'Ativa o plano Alto desempenho e desativa o dynamic tick (requer reiniciar).', 'fps', 'advanced', 'Jogos', 'fpsboost.bat', 'restore_fpsboost.bat'],
  ['gameboost', 'Fechar serviços do app Xbox', 'Encerra o processo XboxAppServices até a próxima reinicialização.', 'fps', 'safe', 'Jogos', 'gameboost.bat'],
  ['disablegamedvr', 'Desativar gravação em segundo plano', 'Desativa a captura do Game DVR / Xbox Game Bar.', 'fps', 'moderate', 'Jogos', 'disablegamedvr.reg', 'restore_gamedvr.reg'],
  ['fullscreenoff', 'Desativar otimização de tela cheia', 'Usa tela cheia exclusiva em vez da otimização do Windows.', 'fps', 'moderate', 'Jogos', 'fullscreenoff.reg', 'restore_fullscreen.reg'],
  ['timerresolution', 'Desativar dynamic tick', 'Mantém o timer do sistema constante (requer reiniciar).', 'fps', 'advanced', 'Jogos', 'timerresolution.bat', 'restore_timerresolution.bat'],
  ['processorscheduling', 'Agendamento do processador', 'Dá mais tempo de CPU ao programa em primeiro plano.', 'fps', 'advanced', 'CPU', 'processorscheduling.reg', 'restore_processorscheduling.reg'],
  ['coreparking', 'Desativar Core Parking', 'Mantém todos os núcleos ativos no plano de energia atual (aumenta consumo e temperatura).', 'fps', 'advanced', 'CPU', 'coreparking.bat'],
  ['memorycompression', 'Desativar compressão de memória', 'Desliga a compressão de RAM. Só vale a pena com 16 GB ou mais.', 'fps', 'advanced', 'Memória', 'memorycompression.bat', 'restore_memorycompression.bat'],
  ['inputdelay', 'Mouse e teclado (combo)', 'Aplica de uma vez "Remover aceleração do mouse" e "Resposta do teclado".', 'fps', 'moderate', 'Entrada', 'inputdelay.reg', 'restore_inputdelay.reg'],
  ['mousefix', 'Remover aceleração do mouse', 'Desativa "Aumentar precisão do ponteiro".', 'fps', 'moderate', 'Entrada', 'mousefix.reg', 'restore_mouse.reg'],
  ['keyboardboost', 'Resposta do teclado', 'Menor atraso e repetição mais rápida de teclas.', 'fps', 'moderate', 'Entrada', 'keyboardboost.reg', 'restore_keyboard.reg'],

  // Internet
  ['flushdns', 'Renovar cache DNS', 'Limpa endereços DNS armazenados localmente.', 'internet', 'safe', 'Rede', 'flushdns.bat'],
  ['dnsboost', 'Renovar e registrar DNS', 'Limpa o cache DNS e registra o PC novamente no servidor DNS.', 'internet', 'safe', 'Rede', 'dnsboost.bat'],
  ['networkboost', 'Ajustes gerais de rede', 'Garante auto-tuning TCP normal, RSS ligado e limpa o DNS.', 'internet', 'moderate', 'Rede', 'networkboost.bat'],
  ['tcpopt', 'Ajustes TCP', 'Garante auto-tuning TCP normal e RSS ligado (padrões recomendados).', 'internet', 'moderate', 'Rede', 'tcpopt.bat'],
  ['netspeedboost', 'Net Speed Boost', 'Ajustes TCP + desativa ECN e timestamps.', 'internet', 'advanced', 'Rede', 'netspeedboost.bat'],
  ['pingboost', 'Perfil de latência', 'Ajustes TCP voltados a latência.', 'internet', 'advanced', 'Rede', 'pingboost.bat'],
  ['networkthrottling', 'Desativar Network Throttling', 'Remove a limitação de rede durante reprodução multimídia.', 'internet', 'advanced', 'Rede', 'networkthrottling.reg', 'restore_networkthrottling.reg'],
  ['networkpriority', 'Prioridade de rede', 'Network Throttling desligado + nenhuma CPU reservada para multimídia.', 'internet', 'advanced', 'Rede', 'networkpriority.reg', 'restore_networkpriority.reg'],
  ['networklimitoff', 'Remover banda reservada (QoS)', 'Libera os 20% de banda que o QoS pode reservar.', 'internet', 'advanced', 'Rede', 'networklimitoff.reg', 'restore_networklimit.reg'],

  // Placa de vídeo
  ['nvidia_thread_priority', 'Prioridade de jogos (NVIDIA)', 'Aumenta a prioridade de CPU e E/S da tarefa multimídia "Games".', 'gpu', 'advanced', 'NVIDIA', 'nvidia_thread_priority.reg', 'revert_nvidia.reg'],
  ['revert_nvidia', 'Restaurar padrão (NVIDIA)', 'Volta a tarefa "Games" para os valores padrão do Windows.', 'gpu', 'moderate', 'NVIDIA', 'revert_nvidia.reg'],
  ['amd_thread_priority', 'Prioridade de jogos (AMD)', 'Aumenta a prioridade de CPU e E/S da tarefa multimídia "Games".', 'gpu', 'advanced', 'AMD', 'amd_thread_priority.reg', 'revert_amd.reg'],
  ['revert_amd', 'Restaurar padrão (AMD)', 'Volta a tarefa "Games" para os valores padrão do Windows.', 'gpu', 'moderate', 'AMD', 'revert_amd.reg'],

  // Perfis de RAM (só um deve ser aplicado; o app recomenda o do seu PC)
  ...[2, 4, 6, 8, 12, 16, 24, 32].map((gb) => [
    `ram${gb}gb`, `Perfil para ${gb} GB`,
    `Ajusta a prioridade de jogos e a CPU reservada para multimídia com valores pensados para PCs com ${gb} GB de RAM.`,
    'ram', 'advanced', 'Memória', `ram${gb}gb.reg`, 'revert_ramprofile.reg'
  ]),

  // Segurança
  ['restorepoint', 'Criar ponto de restauração', 'Cria um ponto de restauração do Windows antes das mudanças (máximo 1 a cada 24h).', 'performance', 'safe', 'Segurança', null, null, 'system'],

  // Ferramentas e reparos
  ['internetcmd', 'Reparar rede', 'Redefine Winsock e TCP/IP. Use só se a internet estiver com problema: apaga IP fixo e configurações de rede personalizadas (requer reiniciar).', 'programs', 'advanced', 'Reparos', 'internetcmd.bat'],
  ['limpezawindows', 'Limpeza Windows', 'Remove temporários do usuário e do Windows e limpa o DNS.', 'programs', 'moderate', 'Ferramentas', 'limpeza_windows.bat'],
  ['limpardisco', 'Limpeza de Disco do Windows', 'Abre a ferramenta oficial de limpeza do Windows.', 'programs', 'safe', 'Ferramentas', null, null, 'system'],
  ['storage_sense', 'Sensor de Armazenamento', 'Abre a limpeza automática e o gerenciamento de espaço do Windows.', 'programs', 'safe', 'Windows', null, null, 'system'],
  ['startup_apps', 'Aplicativos de Inicialização', 'Gerencie com segurança os programas iniciados junto com o Windows.', 'programs', 'safe', 'Windows', null, null, 'system'],
  ['installed_apps', 'Aplicativos Instalados', 'Abra a página moderna para reparar, redefinir ou remover aplicativos.', 'programs', 'safe', 'Windows', null, null, 'system'],
  ['task_manager', 'Gerenciador de Tarefas', 'Monitore processos, desempenho e aplicativos em execução.', 'programs', 'safe', 'Diagnóstico', null, null, 'system'],
  ['resource_monitor', 'Monitor de Recursos', 'Analise detalhadamente CPU, memória, disco e rede.', 'programs', 'safe', 'Diagnóstico', null, null, 'system'],
  ['windows_security', 'Segurança do Windows', 'Abra a proteção contra vírus, firewall e integridade do dispositivo.', 'programs', 'safe', 'Segurança', null, null, 'system'],
  ['system_protection', 'Proteção do Sistema', 'Gerencie pontos de restauração e proteção das unidades.', 'programs', 'safe', 'Segurança', null, null, 'system'],
  ['dxdiag', 'Diagnóstico do DirectX', 'Veja informações e problemas de vídeo, áudio e drivers.', 'programs', 'safe', 'Diagnóstico', null, null, 'system'],
  ['power_options', 'Opções de Energia', 'Gerencie planos de energia e comportamento de suspensão.', 'programs', 'safe', 'Windows', null, null, 'system']
];

// Ações que mexem em HKLM, bcdedit, netsh, powercfg ou pastas do sistema.
const adminActions = new Set([
  'cleanwindows', 'telemetria', 'responsiveness', 'cortanaoff', 'processorscheduling', 'timerresolution', 'fpsboost',
  'coreparking', 'memorycompression', 'disablegamedvr', 'tcpopt', 'netspeedboost', 'pingboost', 'networkboost',
  'networkthrottling', 'networkpriority', 'networklimitoff', 'internetcmd', 'nvidia_thread_priority', 'revert_nvidia',
  'amd_thread_priority', 'revert_amd', 'limpezawindows', 'restorepoint',
  'ram2gb', 'ram4gb', 'ram6gb', 'ram8gb', 'ram12gb', 'ram16gb', 'ram24gb', 'ram32gb'
]);

// Ações que só têm efeito completo depois de reiniciar o PC.
const restartActions = new Set(['fpsboost', 'timerresolution', 'memorycompression', 'telemetria', 'cortanaoff', 'internetcmd']);

module.exports = entries.map(([id, title, description, category, risk, group, file, restoreFile, kind = 'script']) => ({
  id,
  title,
  description,
  category,
  risk,
  group,
  file,
  restoreFile,
  kind,
  requiresAdmin: adminActions.has(id),
  restart: restartActions.has(id)
}));
