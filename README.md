# DIVE 2.0 📍 (Waze de Ofertas Edition)

O **DIVE 2.0** evoluiu drasticamente. Deixamos para trás a era dos "Robôs de Web Scraping" e "Painéis Engessados de Gerentes" para nos tornarmos oficialmente um aplicativo 100% focado no poder da comunidade: O **Waze de Supermercados**.

> ℹ️ **Status do Projeto:** A infraestrutura Serverless Cloud (Firebase Firestore) trabalha em conjunto com o poderoso PWA (Progressive Web App). Agora, os próprios consumidores nas ruas alimentam o mapa em tempo real. Se uma loja "bomba" de preços baixos, o mapa acende; se a loja esvazia de promoções, ele esfria.

## 🚀 Novas Super Funcionalidades (O Motor Waze)

*   **Crowdsourcing Nativo:** A página de promoções agora possui um radar comunitário da galera. Qualquer pessoa, de dentro do mercado, preenche anonimamente um "Produto" e "Preço". A oferta sobe para a nuvem na mesma hora!
*   **Inteligência Termométrica Visual:** As lojas no mapa trocam de vida e cor sozinhas baseadas na febre orgânica:
    *   `🧊 Tranquilo (Azul)`: Nenhuma oferta postada.
    *   `✨ Movimento Moderado (Laranja)`: 1 a 4 pessoas reportaram preços.
    *   `🔥 Fogo Intenso (Vermelho Pulsante)`: Quando bater um combo de 5 promoções válidas ativas do povo. Dispara notificações PUSH no bolso de quem estiver num raio de 1.5km.
*   **Tribunal da Comunidade (Auditoria UP/DOWN):** Como tudo é comunitário, o DIVE é regido pelo coletivo. Se um engraçadinho reporta o "Miojo a 1 centavo", os usuários de verdade apertam 👎. Se uma oferta receber **3 Deslikes**, ela desaparece misteriosamente do banco de dados global para sempre.
*   **Time-Sense de Urgência:** Promoções têm vida curta. O sistema calcula a idade viva da inserção (`"Há 15 min"`, `"Agora mesmo!"`) empurrando os clientes com gatilho mental para a loja. Ao bater 4 horas, o alerta se autodestrói como no Mercado Real.

## 👑 O Painel Master Consolidado
Cortamos excessos e complexidades de subcamadas:

*   **A Morte dos Gerentes:** Os donos dos supermercados não precisam mais ganhar contas manuais. O sistema depende dos clientes da loja deles. 
*   **Super Aba Master (`/admin-panel.html`):** Um arquivo unificando Criação e Pulverização de mercado do banco de dados geral. Esse ambiente é blindado de ponta a ponta e exige a Chave Mestra para entrar (arquivos de validação em `auth.js`). 

## 🛡️ Camadas de Guerra Sistêmica e Segurança Integral
Criamos uma blindagem formidável, dado o fato que anônimos brincam com pacotes de dados reais o tempo todo:
1.  **Datalist & Rate Limit:** O sistema tem limite biológico de clique em cache. Meninos maldosos não conseguirão apertar "F5 Send" seguidamente, há fadigas severas contra DDOS orgânicos com barreiras de 1 minuto inteiras (`localStorage`). E auto-completamento guiado no UX acelera relatos sem estragar dados usando `<datalist>`.
2.  **Lava de XSS `DOMPurify`:** Todo código injetado livremente no preenchimento é derretido por regras severas de sanitização JS antes de chegar a renderização visual das páginas (Previne Hijack de cookie visual de usuários normais).
3.  **O Algoritmo do Detector de Metais (`firestore.rules`):** As diretivas do database console agora são implacáveis, trancando via Node Google os hackers fora da mudança do mapa. Qualquer payload submetido por fora que encostar numa string proibida de base (Ex: Coordenadas e Nomes Fixos de Supermercado) são defletidos pela regra: *Modifique Ofertas/Termômetros, ou volte de onde veio*.

## 📂 Nova Estrutura Arquitetural (Modular)
*   **`app.js` e `map.js` e `gps.js`**: Os generais e maestros das camadas da física, satélite e pintura vetorial do MapBox/Leaflet. Responsivos aos gatilhos vindos da nova `database.js` WebSocket Listener.
*   **`promocao.html`**: A página rainha das dinâmicas Waze. O berço de toda as injeções orgânicas do Firebase.
*   **`firestore.rules`**: Blueprint Oficial pra trancar a chave de sua conta do Google (Copiar lá).

## 🔮 O Futuro de DIVE
*   [ ] Pop-up Instalador Direto PWA (Para facilitar adoção na Tela Inicial dos Smartphones).
*   [ ] Botão de Direcionamento Nativo (Waze de Rota) direto das ofertas.
*   [ ] Algoritmos Avançados de Clustering quando cidades transbordarem para +10.000 mercados no mapa de uma vez.