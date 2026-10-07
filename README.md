# DIVE 2.0

Mapa comunitário de estabelecimentos e promoções. O DIVE permite localizar lojas, consultar ofertas reportadas, contribuir com preços e visualizar informações úteis diretamente no mapa.

> **Estado atual:** protótipo web progressivo (PWA). Estabelecimentos, promoções e votos são guardados no `localStorage` do navegador. Não existe backend ou sincronização entre usuários; os dados não são compartilhados entre dispositivos ou navegadores.

## Funcionalidades

### Mapa

- Exibe os estabelecimentos em um mapa Leaflet com agrupamento de marcadores.
- Permite pesquisar lojas por nome e filtrar por categoria ou distância.
- O filtro **Promoções** mostra estabelecimentos com ofertas ativas.
- Cada marcador pode mostrar a quantidade de promoções válidas da loja.
- Ao tocar em um marcador, abre-se um painel inferior com distância aproximada, situação de funcionamento, horário e ofertas ativas.
- O painel oferece acesso à página de detalhes, à rota no Google Maps e, quando disponível, ao site do estabelecimento.
- A distância exige permissão de localização do navegador. Sem GPS, as informações que dependem da localização não são exibidas.

### Promoções da comunidade

- A página `promocao.html` exibe o produto, o preço, o tempo desde o reporte e os votos.
- É possível reportar produto e preço. Uma oferta permanece ativa por até quatro horas.
- O navegador limita novos reports a um por minuto.
- Cada navegador recebe um identificador local para limitar votos repetidos. Três votos negativos removem a oferta dos dados daquele navegador.
- O formulário de reporte recebe produto e preço; não há envio de fotos pela interface atual.
- O DIVE pode exibir uma imagem se uma oferta já possuir uma URL de imagem válida.

### Cadastro de estabelecimentos

O painel `admin-panel.html` permite cadastrar, editar e excluir lojas. O cadastro pode consultar o CEP pelo ViaCEP e obter coordenadas do endereço pelo Nominatim/OpenStreetMap. Também permite informar horários, um ícone e o site oficial.

O painel é chamado de “Painel Master”, mas **não possui autenticação**. Alterações afetam somente os dados locais do navegador em que são feitas.

### PWA e notificações

- O manifesto `manifest.json` permite instalar o DIVE em navegadores compatíveis.
- O service worker `sw.js` armazena os arquivos principais e pode manter em cache partes do mapa já acessadas.
- A localização e as notificações do navegador dependem de permissão do usuário.
- Bibliotecas do mapa e alguns serviços externos são carregados por CDN; a primeira utilização requer conexão com a internet.

## Como executar

O projeto é composto por HTML, CSS e módulos JavaScript e não possui um processo de build ou gerenciador de dependências configurado.

1. Abra a pasta do projeto em um servidor HTTP local, por exemplo, usando a extensão **Live Server** do Visual Studio Code.
2. Acesse `index.html` pelo endereço local fornecido pelo servidor.
3. Para testar cadastro, acesse `admin-panel.html`.
4. Para consultar ou reportar ofertas, abra o painel de uma loja no mapa e escolha **Ver detalhes e contribuir**.

Não abra o projeto diretamente por `file://`: módulos JavaScript, geolocalização, service worker e instalação PWA dependem de um contexto HTTP seguro. `localhost` é considerado seguro pelos navegadores modernos.

## Armazenamento e dados de teste

Os dados são serializados na chave `dive_db` do `localStorage`. A chave `dive_uid` identifica o navegador para a lógica de votação e `dive_last_post` registra o intervalo entre reports. O armazenamento pode ser inspecionado nas ferramentas de desenvolvedor do navegador.

Na primeira inicialização do banco local, o protótipo adiciona três promoções de exemplo às lojas presentes naquele momento. Essas ofertas são marcadas internamente com `isDemo: true`, expiram em quatro horas e não são adicionadas novamente quando a inicialização já foi registrada. As ofertas servem para avaliação visual e podem ser removidas posteriormente dos dados locais usando essa marca. Limpar todo o armazenamento do site também remove os estabelecimentos e outras informações salvas nesse navegador.

## Estrutura do projeto

| Arquivo | Responsabilidade |
| --- | --- |
| `index.html` | Página principal do mapa, filtros e painel de loja. |
| `app.js` | Inicialização da aplicação, filtros, integração com GPS e atualizações da interface. |
| `map.js` | Criação do mapa Leaflet, marcadores e painel inferior. |
| `map-panel.css` | Estilos do painel de loja e do contador de ofertas nos marcadores. |
| `gps.js` | Solicitação e acompanhamento da localização do usuário. |
| `database.js` | Dados iniciais, validação, persistência local e sincronização entre abas do mesmo navegador. |
| `admin-panel.html` | Interface de cadastro e manutenção de estabelecimentos. |
| `editor.js` | Comportamento do painel administrativo e consultas de endereço. |
| `promocao.html` | Detalhes e contribuição de ofertas para uma loja. |
| `notifications.js` | Notificações do navegador e mensagens temporárias na interface. |
| `pwa-installer.js` | Comportamento do botão de instalação do PWA. |
| `manifest.json` | Metadados de instalação do aplicativo. |
| `sw.js` | Cache de recursos, suporte offline limitado e eventos do service worker. |
| `style.css` | Estilos compartilhados da aplicação. |

## Limitações conhecidas

- O uso de `localStorage` significa que os dados não são uma fonte compartilhada nem uma base remota.
- A sincronização entre abas usa o evento `storage` e não sincroniza navegadores, dispositivos ou usuários.
- O painel administrativo não autentica nem autoriza usuários.
- Geocodificação, consulta de CEP, mapas e recursos externos dependem de serviços de terceiros e de conexão.
- A interface de report não inclui upload de fotos.
- O projeto não define testes automatizados, lint ou build em um `package.json`.

## Tecnologias

- HTML, CSS e JavaScript com módulos ES.
- [Leaflet](https://leafletjs.com/) e [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster).
- [DOMPurify](https://github.com/cure53/DOMPurify) na página de promoções.
- OpenStreetMap, Nominatim e ViaCEP como serviços externos.
