# DIVE 2.0 📍 (Enterprise Cloud Edition)

O **DIVE 2.0** evoluiu de um projeto protótipo para um Aplicativo Georreferenciado Profissional (PWA) de mapa interativo, operando de forma modular e conectado integralmente à nuvem através do Google Firebase.

> ℹ️ **Status do Projeto:** A infraestrutura de Nuvem e Service Workers já está em pleno funcionamento. A aplicação dispensa totalmente um banco de dados local. Toda atualização nos painéis Master ou Business reflete ao vivo (via WebSocket) nos aparelhos dos usuários finais.

## 🚀 Novas Super Funcionalidades (V2)

*   **100% Nuvem (Firebase Firestore):** Os marcadores não existem mais em arquivos `.js`. Tudo vive em um servidor Global, sincronizando promoções ao vivo.
*   **Abolição de "Refresh":** Leituras feitas no Firebase Firebase atrelam Listeners WebSockets. Quando um mercado é fundado ou lança promoção na nuvem, o aplicativo do usuário se repinta sozinho instantaneamente.
*   **Offline-First de Alto Nível:** O Service worker novo (`sw.js`) agora salva as peças de ruas do *OpenStreetMap* em um cofre no próprio celular. Se perder a internet, toda a cidade do mapa vai ligar mesmo assim, com fundos desenhados.
*   **Notificações de Proximidade:** Caminhando na rua, o celular cruza a distância vetorial sua com aos pontos do Firebase e atira Toasts nativos na tela quando se aproxima do estabelecimento.

## 👑 O Ecossistema Administrativo (Sem Códigos)
Não é mais necessário abrir o seu editor de códigos (VS Code) para programar um marcador de um supermercado, agora temos sistemas em interfaces:

*   **O Painel Master (`/adicionar.html` e `/editar.html`):** Para fundar novas filiais e unidades. Lá você diz o Nome, Fuso-horário e Coordenadas do GPS de uma só vez, criando um Documento ID único blindado.
*   **O Painel dos Parceiros/Gerentes (`/cadastro.html`):** Uma tela limitada apenas aos donos e gerentes do momento para alterarem rapidamente se a loja está *Agitada/Tranquila*, ou para colarem cupons de Descontos que aparecem no mapa na mesma hora.

## 🛠️ Tecnologias Utilizadas (Avançadas)
*   Google Firebase SDK v10 (Firestore Database)
*   Módulos Nativos `ES Modules` (import/export JS)
*   Leaflet.js com algoritmos agressivos de Clusterização 
*   Estratégia de Cache Mista (Stale-While-Revalidate + Cache-First)

## 📂 Nova Estrutura Arquitetural (Modular)
Uma grande reforma cortou o gigantesco "app.js" em pequenos agentes especialistas:
*   **`app.js`**: O grande "Maestro". Ele não possui mais regras, apenas importa os componentes e coordena quem vai trabalhar e em que momento.
*   **`database.js`**: O comunicador exclusivo com o Google. Puxa os dados dos supermercados para injetar no sistema.
*   **`gps.js`**: Monitora via satélite os passos do cliente e faz a matemática vetorial dos raios de alerta.
*   **`map.js`**: Entende apenas de pincel. Cuida do Leaflet, desenhando marcadores, o fundo claro/escuro e o Cluster de números na tela.
*   **`notifications.js`**: Controlador puro dos Toasts visuais e das futuras vibrações de tela.
*   **`firebase-config.js`**: Chaves secretas de passaporte para a sua nuvem.
*   **`sw.js`**: O Interceptador de internet que dá a imunidade Offline pro app.

## 💻 Como Rodar o Projeto (Para Desenvolvedores)
1. Certifique-se de que está usando um Ambiente de Servidor Local (`Live Server` no VSCode) visto que a política de Strict Mime Type trava a exportação de módulos puros via duplo-clique.
2. Certifique-se também de que suas credenciais do Firebase estão em dia dentro do `firebase-config.js`.

## 🔮 O Futuro de DIVE
*   [ ] Autenticação Robusta (Restringir Painéis Master com Conta/Senha Firebase Auth).
*   [ ] Push Notifications (Para avisar a cidade inteira quando o app está fechado via *FCM*).
*   [ ] Sistema de Trajeto e Rotas nativos da rua ate o Supermercado desejado.