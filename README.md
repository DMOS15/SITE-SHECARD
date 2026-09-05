# SHECARD

Aplicação estática para geração de crachás corporativos. Funciona diretamente no navegador, sem Node.js, npm, Python, banco de dados ou instalação de dependências.

## Executar

Abra `index.html` diretamente no navegador. QRCode.js, html2canvas e jsPDF são carregados por CDN, portanto é necessária conexão com a internet.

## Fluxo

1. Informe Nome e Nome_Arquivo, ou use Colar dados para importar várias linhas do Excel.
2. Para colagem do Excel, cole uma tabela com colunas separadas por TAB e linhas separadas por ENTER. O sistema aceita tanto `Nome<TAB>Nome_Arquivo` quanto `Nome_Arquivo<TAB>Nome`.
3. O sistema mostra o crachá automaticamente.
4. Use Imprimir ou selecione registros em `historico.html` e clique em Gerar PDF.

## Regras

`index.html`, `historico.html`, `css/style.css`, `css/print.css`, `js/app.js`, `js/storage.js`, `js/qrcode.js`, `js/pdf.js`, `js/historico.js`, `assets/logo.png`.
- QR Code com tamanho fixo.
- Fundo verde oliva, nome branco, linha de prédios, faixa branca inclinada e logo no canto inferior esquerdo.
- Histórico persistente com `localStorage`.
- Duplicidade por NOME_ARQUIVO, com confirmação para substituir.
- PDF único com uma página por crachá, preservando a ordem da seleção.
- PDFs consolidados são somente baixados e nunca armazenados.
- A logo deve estar em `assets/logo.png`.
- O editor de layout oferece os modelos Corporativo, Industrial, Minimalista, Executivo e Personalizado.
- O editor permite ajustar posição X/Y, tamanhos, alinhamento, cores, borda, raio e espaçamento com preview ao vivo.
- Configurações persistentes para nome da empresa, logo, cores e elementos visíveis.
- Logo desativada por padrão; QR Code ampliado para 270 px quando desativada.
- `NOME_ARQUIVO` fica oculto por padrão e nunca aparece na URL visual do crachá.

## Estrutura

```text
index.html
historico.html
configuracoes.html
css/style.css
css/print.css
css/badge-premium.css
css/badge-settings.css
js/app.js
js/storage.js
js/qrcode.js
js/pdf.js
js/historico.js
assets/logo.png
```

## Histórico compartilhado

O histórico usa Google Sheets + Google Apps Script como armazenamento compartilhado. Ele não depende do `localStorage`, portanto os registros ficam disponíveis para toda a equipe, mesmo após limpar o navegador ou trocar de computador.

1. Crie uma planilha no Google Drive.
2. Abra **Extensões > Apps Script**, cole o conteúdo de `backend/Code.gs` e salve.
3. Em **Implantar > Nova implantação**, escolha **Aplicativo da web**, execute como sua conta e permita acesso a **Qualquer pessoa**.
4. Copie a URL `/exec` gerada para `js/shared-config.js`, substituindo `COLE_A_URL_DO_GOOGLE_APPS_SCRIPT_AQUI`.
5. Publique os arquivos no GitHub Pages. A planilha será criada automaticamente com a aba `Historico`.

O histórico oferece pesquisa por nome, empresa e NOME_ARQUIVO, exclusão individual, exclusão em massa, seleção de todos, exportação CSV e geração de PDF.

## Layouts compartilhados

Os layouts também usam o mesmo Google Apps Script. A aba `Layouts` é criada automaticamente com estas colunas:

`id`, `nome`, `empresa`, `mostrarLogo`, `logoUrl`, `corPrimaria`, `corSecundaria`, `qrSize`, `template`, `criadoEm`, `atualizadoEm`, `isDefault`.

O editor permite criar, editar, excluir, duplicar, usar e definir o layout padrão. Ao criar um crachá, o site carrega automaticamente o layout marcado como padrão. O `localStorage` só é usado como cache temporário quando a API fica indisponível; a fonte oficial permanece no Google Apps Script.

Depois de atualizar o arquivo `backend/Code.gs`, é necessário criar uma nova versão da implantação do Apps Script em **Implantar > Gerenciar implantações > Editar > Nova versão**. A URL `/exec` pode permanecer a mesma.
