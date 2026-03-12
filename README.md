# DIVE 2.0 📍

O **DIVE 2.0** é um Progressive Web App (PWA) de mapa interativo com atualizações em tempo real.

> ℹ️ **Fase de Testes:** Atualmente, os testes estão sendo realizados **apenas em supermercados**, devido ao alto volume de circulação de pessoas nesses locais, além de serem ambientes onde os usuários buscam ativamente **economizar**.

## 🚀 Funcionalidades

*   **Mapa Interativo:** Navegação fluida usando Leaflet.js.
*   **Filtros Avançados:**
    *   🔥 **Agitado:** Locais com lotação alta, filas ou muitas promoções.
    *   🧊 **Tranquilo:** Locais vazios, ideais para compras rápidas.
    *   🔍 **Busca:** Pesquisa instantânea por nome do estabelecimento.
    *   📏 **Raio:** Filtre locais por distância (1km, 3km, 5km).
*   **Geolocalização:** Mostra sua posição atual e calcula a distância até os locais.
*   **Página de Ofertas:** Detalhes completos com horário de funcionamento, status em tempo real (Aberto/Fechado) e lista de produtos.
*   **Animações e Efeitos:** Confetes nas promoções, marcadores pulsantes no mapa e "Toasts" visuais.
*   **Modo Noturno Automático:** O tema muda automaticamente entre 18h e 06h, invertendo as cores do mapa para conforto visual.
*   **Clustering:** Agrupamento de marcadores próximos para evitar poluição visual no mapa.
*   **PWA (Offline):** Funciona sem internet após o primeiro acesso e pode ser instalado no celular.
*   **Painel Administrativo:** Área exclusiva para estabelecimentos atualizarem seu status e promoções em tempo real (`cadastro.html`).
*   **Notificações Inteligentes:**
    *   🔔 **Promoções:** Receba alertas quando um local lança uma oferta.
    *   📍 **Proximidade:** O app avisa quando você passa perto de um local parceiro.

## 🛠️ Tecnologias Utilizadas

*   HTML5, CSS3, JavaScript (Vanilla)
*   [Leaflet.js](https://leafletjs.com/) (Mapas)
*   [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) (Agrupamento)
*   Service Workers (Cache e Offline)

## 📂 Estrutura do Projeto

*   **`index.html`**: Estrutura principal, importa as bibliotecas e define o layout base.
*   **`style.css`**: Contém todos os estilos, animações (pulso, flutuação) e regras do Modo Noturno.
*   **`app.js`**: O "cérebro" do app. Contém a lógica do mapa, os dados dos locais (mock), filtros e geolocalização.
*   **`data.js`**: Banco de dados compartilhado (Single Source of Truth). Contém a lista de locais, horários e produtos.
*   **`promocao.html`**: Página de detalhes do estabelecimento, com lógica de horário (Aberto/Fechado) e botões de ação.
*   **`admin.js`**: Lógica do painel administrativo para atualizar status via LocalStorage.
*   **`sw.js`**: Service Worker. Gerencia o cache para que o app funcione offline e carregue rápido.
*   **`manifest.json`**: Arquivo de configuração que permite o app ser instalado no celular (ícone, nome, cores).

## 💻 Como Rodar o Projeto

Como este projeto utiliza **Service Workers** e **Geolocalização**, ele precisa ser servido via **HTTPS** ou **localhost** para funcionar corretamente.

1.  Clone ou baixe a pasta do projeto.
2.  Use uma extensão como "Live Server" no VS Code ou rode um servidor simples (ex: `python -m http.server`).
3.  Abra o arquivo `index.html` no navegador.
4.  Permita o acesso à localização quando solicitado.

## 📱 Instalação (Mobile)

1.  Acesse o projeto pelo navegador do celular (Chrome no Android ou Safari no iOS).
2.  Toque no menu e selecione **"Adicionar à Tela Inicial"** ou **"Instalar App"**.
3.  O DIVE 2.0 funcionará como um aplicativo nativo em tela cheia.

## 🎨 Como Personalizar

Para adicionar novos locais, abra o arquivo **`data.js`** e adicione um novo objeto ao array `sharedEstablishments`:

```javascript
{
    id: 99,
    name: "Novo Local Incrível",
    coords: [-23.550520, -46.633308], // Latitude e Longitude
    status: "fire", // Opções: "fire", "chill", "live"
    msg: "<b>OFERTA:</b> Cerveja 350ml R$ 2,99",
    color: "red", // Cor do ícone
    icon: "https://site.com/logo.png",
    hours: "Seg-Sex: 08:00 - 18:00"
}
```

## 🔮 Melhorias Futuras

*   [ ] Sistema de Favoritos (LocalStorage).
*   [ ] Integração com Backend Real (Node.js/Firebase).
*   [ ] Sistema de Login para usuários e estabelecimentos.
*   [ ] Rotas traçadas diretamente no mapa.
*   [ ] Chat entre usuários no mesmo local.