# Scripts do KKJOpti

Cada arquivo aqui é cadastrado em `optimizations.js`. O app só habilita uma ação se o arquivo existir.

## Convenções

- `nome.bat` / `nome.reg`: aplica a ação.
- `restore_nome.*` (ou `revert_*`, `animationson.reg`): volta ao padrão do Windows.
- `.bat` com vários comandos usam `|| set "FALHA=1"` em cada linha, para o app saber se **qualquer** comando falhou.
- Nada de janelas interativas (`pause`, `cleanmgr /verylowdisk`): a fila tem tempo limite de 5 minutos.

## Regras de segurança

- Revise e teste cada script numa máquina virtual antes de distribuir.
- Evite comandos destrutivos e crie sempre um arquivo de reversão.
- O executor não usa `shell: true` e só aceita `.bat`, `.cmd` e `.reg`.
