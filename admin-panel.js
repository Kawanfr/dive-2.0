import { globalEstablishments, saveEstablishmentToLocal, deleteEstablishmentFromLocal, initializeDB } from './database.js';

// Objeto que encapsula toda a lógica do painel de forma isolada
const AdminApp = {
    init() {
        this.cacheDOM();
        this.bindEvents();
    },

    cacheDOM() {
        this.createForm = document.getElementById('create-form');
        this.cepInput = document.getElementById('new-cep');
        this.addressInput = document.getElementById('new-address');
    },

    bindEvents() {
        this.createForm.addEventListener('submit', (e) => this.handleCreate(e));
        
        // Aciona a busca do ViaCEP assim que 8 números forem digitados
        this.cepInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            if (val.length === 8) this.fetchAddress(val);
        });
    },

    async fetchAddress(cep) {
        try {
            this.addressInput.placeholder = "Buscando endereço...";
            const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await res.json();
            
            if (data.erro) {
                alert("⚠️ CEP não encontrado na base dos Correios!");
                this.addressInput.placeholder = "Rua, Número, Bairro, Cidade - UF";
                return;
            }
            
            // Preenche o endereço, deixando a palavra "Número" selecionada para o usuário digitar em cima
            this.addressInput.value = `${data.logradouro}, Número, ${data.bairro}, ${data.localidade} - ${data.uf}`;
            this.addressInput.focus();
            
            const numPos = data.logradouro.length + 2; // Calcula a posição da palavra "Número"
            this.addressInput.setSelectionRange(numPos, numPos + 6);
        } catch (e) {
            console.error("Erro ViaCEP:", e);
        }
    },

    async handleCreate(e) {
        e.preventDefault();
        const btn = this.createForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerText = "🌍 Convertendo Endereço e Cadastrando...";

        try {
            const addressStr = this.addressInput.value.trim();
            
            // Impede que o endereço seja enviado com a palavra "Número" genérica
            if (addressStr.toLowerCase().includes("número") || addressStr.toLowerCase().includes("numero")) {
                throw new Error("Você esqueceu de preencher o número! Por favor, substitua a palavra 'Número' pelo número exato da rua.");
            }
            
            // Consulta a API de satélite OpenStreetMap (Nominatim) para achar Coordenadas Reais do Endereço
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressStr)}&countrycodes=br&limit=1`);
            const geoData = await geoRes.json();

            if (!geoData || geoData.length === 0) {
                throw new Error("Não conseguimos achar as coordenadas (Lat/Lng) com base nesse endereço. Tente conferir o nome da rua ou número e salve novamente.");
            }

            const lat = parseFloat(geoData[0].lat);
            const lng = parseFloat(geoData[0].lon);

            let hoursText = document.getElementById('new-hours-text').value.trim();
            if (!hoursText.includes("🕒")) hoursText = "🕒 " + hoursText;

            const newPlace = {
                id: Date.now(),
                name: document.getElementById('new-name').value.trim(),
                coords: [lat, lng],
                icon: document.getElementById('new-icon').value.trim(),
                website: document.getElementById('new-site').value.trim(),
                hours: hoursText,
                schedule: {
                    week: [
                        parseInt(document.getElementById('week-open').value) || 0,
                        parseInt(document.getElementById('week-close').value) || 0
                    ],
                    sun: [
                        parseInt(document.getElementById('sun-open').value) || 0,
                        parseInt(document.getElementById('sun-close').value) || 0
                    ]
                },
                status: "chill",
                color: "#3498db",
                offers: [] // Array Waze zerado
            };

            saveEstablishmentToLocal(newPlace);
            
            const irProMapa = confirm("🎉 SUCESSO!\nA nova loja foi adicionada!\n\nDeseja ir para o mapa agora para visualizá-la?");
            
            this.createForm.reset();
            
            if (irProMapa) {
                window.location.href = "index.html";
            }
            
        } catch (err) {
            alert("❌ Erro fatal ao criar: " + err.message);
        } finally {
            btn.disabled = false;
            btn.innerText = "💾 Cadastrar Loja no Mapa";
        }
    }
};

// --- 🚀 INICIALIZAÇÃO DO SISTEMA (DEVE FICAR NO FINAL) ---
// Como usamos type="module", o arquivo já carrega com segurança no final.
initializeDB(() => {
    try {
        AdminApp.init();
    } catch (err) {
        alert("❌ Erro Fatal no Painel: " + err.message);
        console.error("DIVE Admin Error:", err);
    }
});
