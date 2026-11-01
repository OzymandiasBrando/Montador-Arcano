# Project: Vondrag — Montador Arcano Simples v3.1

Esta versão simplifica o Montador e **não inclui simulação de combate**.

## Como abrir

1. Extraia o arquivo `.zip`.
2. Deixe `index.html`, `styles.css`, `script.js` e `favicon.svg` **na mesma pasta**.
3. Abra `index.html` no navegador (Chrome, Firefox, Edge etc.).
4. Caso o navegador mostre arquivos antigos, use `Ctrl + F5`.

Não é necessário instalar Node, Python ou bibliotecas externas. O site funciona localmente.

## Três abas

- **Montador** — crie uma magia escolhendo forma, elemento e efeito; adicione armazenamento ou controle se desejar. A prévia geométrica atualiza automaticamente. Exporte o desenho em `.svg` ou copie a ficha.
- **Como funciona** — guia de regras simples, dividido em assuntos curtos.
- **Magias** — cards de exemplos e do seu próprio Grimório, com busca por nome, elemento e Tier.

## Grimório

- As magias salvas ficam no navegador (`localStorage`), não em um servidor.
- O Grimório é **individual para cada navegador**. Seus amigos não verão automaticamente as suas magias.
- Para fazer backup ou compartilhar, use **Magias > Exportar Grimório** e **Importar JSON**.
- A importação aceita arquivos de Grimório da versão anterior do Montador Arcano.
- Antes de substituir uma versão antiga, **exporte o Grimório antigo em JSON** para garantir que os registros não se percam caso a pasta/endereço do site seja alterado.

## Regras aplicadas

- Até 1/2/3 formas por Tier; até 4/8/12 aprimoramentos.
- Elementos podem ser diferentes entre camadas, sem fusão automática.
- Fusão de Fogo + Raio = Plasma; Fogo + Água é incompatível.
- Armazenamentos aplicam efeito sem dano direto adicional.
- Projétil libera efeito armazenado no impacto; parede, no toque/na quebra, conforme escolhido.
- A parede reaplica efeito enquanto existir.
- Duração de parede/estrutura = 2 + Hexágonos turnos.
- Duração de condição = 1 + Estrelas turnos.
- Triângulo só controla manifestações do mesmo elemento.
- Diamante só altera elementos puros.

**Ainda em teste:** a tabela 3/5/7 de dano mágico (+1 por fusão), muitas fusões propostas, repetição da condição no mesmo alvo e algumas combinações avançadas. O site marca essas incertezas como tais.

## Publicar no Cloudflare Pages

Suba os quatro arquivos principais (`index.html`, `styles.css`, `script.js`, `favicon.svg`) ao seu projeto no Cloudflare Pages. Se o projeto estiver protegido por Cloudflare Access, mantenha sua política de acesso antes e depois da publicação.


## Correções da versão 3.1

- O resultado final mostra todos os detalhes de cada camada, seus efeitos, fusões, aprimoramentos, gatilhos, durações, alcance e escala, quando aplicável. A ficha copiada também é completa.
- SVG mostra cada Estrela e Hexágono até o limite do Tier (4/8/12), além de Diamantes; os círculos extras de escala também são desenhados até 8.
- Ao mudar uma magia para uma combinação que não admite certo aprimoramento, Estrelas ou Hexágonos incompatíveis são removidos automaticamente. Para configurações antigas, os seletores permitem reduzir valores inválidos e há botões para zerar os aprimoramentos da camada ou da fórmula inteira.
- Mantidos o visual simplificado, as três abas e a ausência do simulador.

Os arquivos permanecem na mesma pasta. Recomendamos exportar o Grimório em JSON antes de atualizar os arquivos. O armazenamento e o formato do Grimório seguem os mesmos da versão 3.0.
