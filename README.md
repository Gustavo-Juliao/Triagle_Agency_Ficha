# Ficha de Agente — Triangle Agency (Fase 1)

Site estático: HTML + CSS + JavaScript puro. Sem servidor, sem build, sem dependências.

## Como usar
- Abra `index.html` no navegador (duplo clique) ou publique a pasta.
- A ficha é salva automaticamente no LocalStorage do navegador.
- **Exportar JSON** baixa a ficha; **Importar JSON** restaura (substitui a atual).
- **Imprimir** gera todas as seções em sequência (use "Salvar como PDF").

> Atenção: o LocalStorage é por navegador/dispositivo. Limpar dados do site apaga a ficha. Exporte backups.

## Publicar no GitHub Pages (grátis)
1. Crie um repositório no GitHub e envie `index.html`, `style.css`, `app.js`.
2. Settings → Pages → Source: `main` / root.
3. O site fica em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

## Estrutura dos dados
Todo o estado fica em um único objeto (`state` em `app.js`), criado por `novo()`.
Na Fase 2, o mesmo objeto vai para o Firestore (`setDoc`/`getDoc`) sem mudar a interface.

## Ajustes pendentes de conferência com o livro
- `CODES` em `app.js`: códigos de cada caixa dos medidores de Equilíbrio.
- `CARGOS` em `app.js`: faixas dos cargos no medidor de Competência (aproximadas).
