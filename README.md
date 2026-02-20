# DIVE 2.0 📍

O **DIVE 2.0** é um Progressive Web App (PWA) de mapa interativo focado em ajudar usuários a encontrarem o local ideal para sair, seja um ambiente agitado (🔥) ou tranquilo (🧊).

## 🚀 Funcionalidades

*   **Mapa Interativo:** Navegação fluida usando Leaflet.js.
*   **Filtros em Tempo Real:**
    *   🔥 **Agitado:** Bares e baladas com lotação alta ou música ao vivo.
    *   🧊 **Tranquilo:** Cafés e locais para conversar.
    *   🔍 **Busca:** Pesquisa por nome do estabelecimento.
*   **Geolocalização:** Mostra sua posição atual e calcula a distância até os locais.
*   **Modo Noturno Automático:** O tema muda automaticamente entre 18h e 06h, invertendo as cores do mapa para conforto visual.
*   **Clustering:** Agrupamento de marcadores próximos para evitar poluição visual no mapa.
*   **PWA (Offline):** Funciona sem internet após o primeiro acesso e pode ser instalado no celular.

## 🛠️ Tecnologias Utilizadas

*   HTML5, CSS3, JavaScript (Vanilla)
*   [Leaflet.js](https://leafletjs.com/) (Mapas)
*   [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) (Agrupamento)
*   Service Workers (Cache e Offline)

## 📂 Estrutura do Projeto

*   **`index.html`**: Estrutura principal, importa as bibliotecas e define o layout base.
*   **`style.css`**: Contém todos os estilos, animações (pulso, flutuação) e regras do Modo Noturno.
*   **`app.js`**: O "cérebro" do app. Contém a lógica do mapa, os dados dos locais (mock), filtros e geolocalização.
*   **`sw.js`**: Service Worker. Gerencia o cache para que o app funcione offline e carregue rápido.
*   **`manifest.json`**: Arquivo de configuração que permite o app ser instalado no celular (ícone, nome, cores).

## � Como Rodar o Projeto

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

Para adicionar novos locais, abra o arquivo `app.js` e adicione um novo objeto ao array `mockEstablishments`:

```javascript
{
    id: 99,
    name: "Novo Local Incrível",
    coords: [-23.550520, -46.633308], // Latitude e Longitude
    status: "fire", // Opções: "fire", "chill", "live"
    msg: "Descrição que aparece no popup.",
    color: "red" // Cor do ícone
}
```

## 🔮 Melhorias Futuras

*   [ ] Integração com Backend/API Real.
*   [ ] Sistema de Favoritos (LocalStorage).
*   [ ] Rotas traçadas diretamente no mapa.
*   [ ] Filtro por raio de distância (ex: "apenas locais a 1km").