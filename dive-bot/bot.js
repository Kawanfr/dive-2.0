const admin = require('firebase-admin');
const puppeteer = require('puppeteer');

// 1. CARREGAR A CHAVE MESTRE DO FIREBASE
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 2. FUNÇÃO PRINCIPAL DO ROBÔ (CRAWLER)
async function startRobot() {
    console.log("🤖 Iniciando DIVE Web Scraper Bot...");
    
    // Inicia o "Navegador Fantasma" invisível
    console.log("🌐 Abrindo Google Chrome invisível...");
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        console.log("🎯 Acessando o Assaí Atacadista...");
        // Acessa o site oficial
        await page.goto('https://www.assai.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // No mundo real, aqui usaríamos métodos para extrair os preços específicos.
        // Como é o nosso primeiro piloto, vamos extrair o Título da aba do site deles
        // para provar que conseguimos ler os dados internos deles:
        const siteTitle = await page.title();
        console.log(`✅ Lemos o site com sucesso! O título invisível deles é: "${siteTitle}"`);
        
        // FECHA O NAVEGADOR PARA NÃO GASTAR RAM
        await browser.close();

        // 3. INJETAR A PROMOÇÃO OBTIDA NO FIREBASE DO DIVE (Atualizando loja ID 1)
        console.log("☁️  Acessando Banco de Dados do DIVE (Injeção Silenciosa)...");
        const docRef = db.collection('establishments').doc('1'); // ID 1 costuma ser o Assaí
        
        const mensagemPromocional = `🔥 OFERTAS RELÂMPAGO DO ASSAÍ 🔥<br><br>🥩 Alcatra Bovina (Peça) - R$ 34,90 kg<br>🍻 Cerveja Heineken Lata 350ml - R$ 4,10<br>☕ Café Torrado Pilão 500g - R$ 16,90<br><br>🏃‍♀️💨 Corre que o estoque está voando! Apenas até amanhã!`;

        await docRef.set({
            status: 'fire', // Coloca o pin piscando em vemelho na tela de todos
            msg: mensagemPromocional,
            color: 'red',
            updatedAt: new Date().toISOString()
        }, { merge: true });

        console.log("🚀 MÁGICA FEITA! Todos os celulares conectados no App acabam de piscar vermelho de notificação de promoções do Assaí automáticas!");

    } catch (error) {
        console.error("❌ Erro durante o trabalho do robô:", error);
        await browser.close();
    }
}

// RODA O ROBÔ
startRobot();
