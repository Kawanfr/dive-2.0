import { globalEstablishments, saveEstablishmentToLocal, deleteEstablishmentFromLocal, initializeDB } from './database.js';

// Objeto que encapsula toda a lógica do painel de forma isolada
const AdminApp = {
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.resetScheduleTabs();
    },

    cacheDOM() {
        this.createForm = document.getElementById('create-form');
        this.cepInput = document.getElementById('new-cep');
        this.addressInput = document.getElementById('new-address');
        this.editingIdInput = document.getElementById('editing-id');
        this.submitButton = document.getElementById('submit-button');
        this.establishmentList = document.getElementById('establishments-list');
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.schedule-tab-content');
    },

    bindEvents() {
        this.createForm.addEventListener('submit', (e) => this.handleCreate(e));

        this.tabButtons.forEach((button) => {
            button.addEventListener('click', () => {
                this.selectTab(button.dataset.tab);
            });
        });

        this.establishmentList.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;

            const { action, id } = btn.dataset;
            if (action === 'edit') this.editEstablishment(id);
            if (action === 'delete') this.deleteEstablishment(id);
        });
        
        // Aciona a busca do ViaCEP assim que 8 números forem digitados
        this.cepInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            if (val.length === 8) this.fetchAddress(val);
        });
    },

    selectTab(tabKey) {
        this.tabButtons.forEach((btn) => {
            const isActive = btn.dataset.tab === tabKey;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', String(isActive));
        });

        this.tabContents.forEach((content) => {
            const isActive = content.id === `tab-${tabKey}`;
            content.classList.toggle('active', isActive);
        });
    },

    resetScheduleTabs() {
        this.selectTab('weekdays');
    },

    clearEditingState() {
        this.editingIdInput.value = '';
        this.submitButton.textContent = '💾 Cadastrar Loja no Mapa';
    },

    getScheduleValues(collection) {
        if (!collection) return [0, 0];
        if (Array.isArray(collection)) return collection;
        if (typeof collection === 'object') return collection[0] || collection[1] ? [Object.values(collection)[0], Object.values(collection)[1]] : [0, 0];
        return [0, 0];
    },

    populateFormForEdit(place) {
        const name = place.name || '';
        const icon = place.icon || '';
        const website = place.website || '';
        const hours = place.hours || '';

        document.getElementById('new-name').value = name;
        document.getElementById('new-icon').value = icon;
        document.getElementById('new-site').value = website;
        document.getElementById('new-hours-text').value = hours.replace(/^🕒\s*/, '');
        this.editingIdInput.value = place.id;
        this.submitButton.textContent = '💾 Salvar Alterações';

        const schedule = place.schedule || {};
        const weekdaySchedule = this.getScheduleValues(schedule.weekdays || schedule.week || [0, 0]);
        const saturdaySchedule = this.getScheduleValues(schedule.saturday || schedule.sat || [0, 0]);
        const sundaySchedule = this.getScheduleValues(schedule.sunday || schedule.sun || [0, 0]);

        document.getElementById('weekday-open').value = weekdaySchedule[0] ?? 0;
        document.getElementById('weekday-close').value = weekdaySchedule[1] ?? 0;
        document.getElementById('saturday-open').value = saturdaySchedule[0] ?? 0;
        document.getElementById('saturday-close').value = saturdaySchedule[1] ?? 0;
        document.getElementById('sunday-open').value = sundaySchedule[0] ?? 0;
        document.getElementById('sunday-close').value = sundaySchedule[1] ?? 0;
    },

    renderEstablishmentList() {
        this.establishmentList.innerHTML = '';

        if (!globalEstablishments.length) {
            this.establishmentList.innerHTML = '<div class="establishment-item"><div class="establishment-meta">Nenhum estabelecimento cadastrado.</div></div>';
            return;
        }

        globalEstablishments.forEach((place) => {
            const item = document.createElement('div');
            item.className = 'establishment-item';
            item.innerHTML = `
                <div class="establishment-meta">
                    <strong>${place.name}</strong><br>
                    <small>${place.hours || 'Sem horário informado'}</small>
                </div>
                <div class="establishment-actions">
                    <button type="button" class="mini-btn edit" data-action="edit" data-id="${place.id}">Editar</button>
                    <button type="button" class="mini-btn delete" data-action="delete" data-id="${place.id}">Excluir</button>
                </div>
            `;
            this.establishmentList.appendChild(item);
        });
    },

    editEstablishment(id) {
        const place = globalEstablishments.find((item) => String(item.id) === String(id));
        if (!place) return;
        this.populateFormForEdit(place);
        this.selectTab('weekdays');
        this.createForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    deleteEstablishment(id) {
        const place = globalEstablishments.find((item) => String(item.id) === String(id));
        if (!place) return;

        const confirmed = window.confirm(`Excluir "${place.name}" do mapa?`);
        if (!confirmed) return;

        deleteEstablishmentFromLocal(id);
        this.renderEstablishmentList();

        if (String(this.editingIdInput.value) === String(id)) {
            this.createForm.reset();
            this.clearEditingState();
        }
    },

    readScheduleValues() {
        const schedule = {
            weekdays: [
                parseInt(document.getElementById('weekday-open').value, 10) || 0,
                parseInt(document.getElementById('weekday-close').value, 10) || 0
            ],
            saturday: [
                parseInt(document.getElementById('saturday-open').value, 10) || 0,
                parseInt(document.getElementById('saturday-close').value, 10) || 0
            ],
            sunday: [
                parseInt(document.getElementById('sunday-open').value, 10) || 0,
                parseInt(document.getElementById('sunday-close').value, 10) || 0
            ]
        };

        const validateSchedule = (label, values) => {
            const [open, close] = values;
            if (open < 0 || open > 23 || close < 0 || close > 23) {
                throw new Error(`${label}: os horários devem estar entre 0 e 23.`);
            }
            if (open !== 0 && close !== 0 && open >= close) {
                throw new Error(`${label}: a abertura precisa ser menor que o fechamento.`);
            }
        };

        validateSchedule('Seg. a Sex.', schedule.weekdays);
        validateSchedule('Sábado', schedule.saturday);
        validateSchedule('Domingo', schedule.sunday);

        return schedule;
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

            const scheduleValues = this.readScheduleValues();

            const editingId = this.editingIdInput.value ? Number(this.editingIdInput.value) : Date.now();

            const newPlace = {
                id: editingId,
                name: document.getElementById('new-name').value.trim(),
                coords: [lat, lng],
                icon: document.getElementById('new-icon').value.trim(),
                website: document.getElementById('new-site').value.trim(),
                hours: hoursText,
                schedule: {
                    weekdays: scheduleValues.weekdays,
                    saturday: scheduleValues.saturday,
                    sunday: scheduleValues.sunday,
                    week: scheduleValues.weekdays,
                    sat: scheduleValues.saturday,
                    sun: scheduleValues.sunday
                },
                status: "chill",
                color: "#3498db",
                offers: [] // Array Waze zerado
            };

            if (this.editingIdInput.value) {
                const existing = globalEstablishments.find((item) => String(item.id) === String(editingId));
                if (existing) {
                    newPlace.coords = existing.coords || [lat, lng];
                    newPlace.offers = existing.offers || [];
                    newPlace.status = existing.status || 'chill';
                    newPlace.color = existing.color || '#3498db';
                }
            }

            saveEstablishmentToLocal(newPlace);
            this.renderEstablishmentList();
            
            const modeText = this.editingIdInput.value ? 'atualizada' : 'adicionada';
            const irProMapa = confirm(`🎉 SUCESSO!\nA loja foi ${modeText}!\n\nDeseja ir para o mapa agora para visualizá-la?`);
            
            this.createForm.reset();
            this.clearEditingState();
            this.resetScheduleTabs();
            
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
        AdminApp.renderEstablishmentList();
    } catch (err) {
        alert("❌ Erro Fatal no Painel: " + err.message);
        console.error("DIVE Admin Error:", err);
    }
});
