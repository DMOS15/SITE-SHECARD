# SHECARD

Aplicacao estatica para geracao de crachas corporativos. Funciona diretamente no navegador, sem Node.js, npm, Python, banco de dados ou instalacao de dependencias.

## Executar

Abra `index.html` diretamente no navegador. QRCode.js, html2canvas e jsPDF sao carregados por CDN, portanto e necessaria conexao com a internet.

## Fluxo

1. Informe Nome e Nome_Arquivo, ou use Colar dados para importar varias linhas do Excel.
2. Para colagem do Excel, cole uma tabela com colunas separadas por TAB e linhas separadas por ENTER. O sistema aceita tanto `Nome<TAB>Nome_Arquivo` quanto `Nome_Arquivo<TAB>Nome`.
3. O sistema mostra o cracha automaticamente.
4. Use Imprimir ou selecione registros em `historico.html` e clique em Gerar PDF.

## Regras

`index.html`, `historico.html`, `css/style.css`, `css/print.css`, `js/app.js`, `js/storage.js`, `js/qrcode.js`, `js/pdf.js`, `js/historico.js`, `assets/logo.png`.
- QR Code com tamanho fixo.
- Fundo verde oliva, nome branco, linha de predios, faixa branca inclinada e logo no canto inferior esquerdo.
- Historico persistente com `localStorage`.
- Duplicidade por NOME_ARQUIVO, com confirmacao para substituir.
- PDF unico com uma pagina por cracha, preservando a ordem da selecao.
- PDFs consolidados sao somente baixados e nunca armazenados.
- A logo deve estar em `assets/logo.png`.
- O editor de layout oferece os modelos Corporativo, Industrial, Minimalista, Executivo e Personalizado.
- O editor permite ajustar posição X/Y, tamanhos, alinhamento, cores, borda, raio e espaçamento com preview ao vivo.
- Configuracoes persistentes para nome da empresa, logo, cores e elementos visiveis.
- Logo desativada por padrao; QR Code ampliado para 270 px quando desativada.
- `NOME_ARQUIVO` fica oculto por padrao e nunca aparece na URL visual do cracha.

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

A versao sem backend nao acessa SharePoint diretamente. Para usar dados do Excel, copie as duas colunas e cole no cadastro em massa.
