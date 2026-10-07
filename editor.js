import { globalEstablishments, saveEstablishmentToLocal, deleteEstablishmentFromLocal, initializeDB, getSafeHttpUrl } from './database.js';

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
        this.cepGroup = this.cepInput.closest('.form-group');
        this.addressGroup = this.addressInput.closest('.form-group');
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
        this.cepInput.required = true;
        this.addressInput.required = true;
        this.cepGroup.classList.remove('hidden');
        this.addressGroup.classList.remove('hidden');
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
        this.cepInput.value = '';
        this.addressInput.value = '';
        this.cepInput.required = false;
        this.addressInput.required = false;
        this.cepGroup.classList.add('hidden');
        this.addressGroup.classList.add('hidden');

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
            const meta = document.createElement('div');
            meta.className = 'establishment-meta';
            const name = document.createElement('strong');
            name.textContent = place.name;
            const hours = document.createElement('small');
            hours.textContent = place.hours || 'Sem horário informado';
            meta.append(name, document.createElement('br'), hours);

            const actions = document.createElement('div');
            actions.className = 'establishment-actions';
            ['edit', 'delete'].forEach((action) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = `mini-btn ${action}`;
                button.dataset.action = action;
                button.dataset.id = String(place.id);
                button.textContent = action === 'edit' ? 'Editar' : 'Excluir';
                actions.appendChild(button);
            });

            item.append(meta, actions);
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

        try {
            deleteEstablishmentFromLocal(id);
        } catch (error) {
            console.error("Erro ao excluir estabelecimento:", error);
            alert(error instanceof Error ? error.message : String(error));
            return;
        }
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
            if (!res.ok) throw new Error(`A consulta de CEP respondeu com status ${res.status}.`);
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
            this.addressInput.placeholder = "Rua, Número, Bairro, Cidade - UF";
            alert("Não foi possível consultar o CEP. Confira sua conexão ou preencha o endereço manualmente.");
        }
    },

    async handleCreate(e) {
        e.preventDefault();
        const btn = this.submitButton;
        btn.disabled = true;
        btn.innerText = "🌍 Convertendo Endereço e Cadastrando...";

        try {
            const editingId = this.editingIdInput.value;
            const existing = editingId
                ? globalEstablishments.find((item) => String(item.id) === String(editingId))
                : null;
            if (editingId && !existing) throw new Error("O estabelecimento selecionado não foi encontrado. Atualize a lista e tente novamente.");

            let coords = existing?.coords;
            if (!coords) {
                const addressStr = this.addressInput.value.trim();
                if (addressStr.toLowerCase().includes("número") || addressStr.toLowerCase().includes("numero")) {
                    throw new Error("Você esqueceu de preencher o número! Substitua a palavra 'Número' pelo número exato da rua.");
                }

                const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressStr)}&countrycodes=br&limit=1`);
                if (!geoRes.ok) throw new Error(`A consulta de endereço respondeu com status ${geoRes.status}.`);
                const geoData = await geoRes.json();
                if (!geoData?.length) {
                    throw new Error("Não encontramos as coordenadas desse endereço. Confira o endereço e tente novamente.");
                }

                coords = [parseFloat(geoData[0].lat), parseFloat(geoData[0].lon)];
                if (!coords.every(Number.isFinite)) {
                    throw new Error("O serviço de endereço retornou coordenadas inválidas.");
                }
            }

            let hoursText = document.getElementById('new-hours-text').value.trim();
            if (!hoursText.includes("🕒")) hoursText = "🕒 " + hoursText;

            const scheduleValues = this.readScheduleValues();
            const iconValue = document.getElementById('new-icon').value.trim();
            const websiteValue = document.getElementById('new-site').value.trim();
            const icon = getSafeHttpUrl(iconValue);
            const website = getSafeHttpUrl(websiteValue);
            if (iconValue && !icon) throw new Error("A URL do ícone precisa começar com http:// ou https://.");
            if (websiteValue && !website) throw new Error("A URL do site precisa começar com http:// ou https://.");

            const newPlace = {
                id: existing ? existing.id : Date.now(),
                name: document.getElementById('new-name').value.trim(),
                coords,
                icon,
                website,
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

            if (existing) {
                newPlace.offers = existing.offers || [];
                newPlace.status = existing.status || 'chill';
                newPlace.color = existing.color || '#3498db';
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
            console.error("Erro ao salvar estabelecimento:", err);
            const message = err instanceof Error ? err.message : String(err);
            alert("Não foi possível salvar o estabelecimento: " + message);
        } finally {
            btn.disabled = false;
            btn.innerText = this.editingIdInput.value ? '💾 Salvar Alterações' : '💾 Cadastrar Loja no Mapa';
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
}).catch((error) => {
    console.error("DIVE Admin: falha ao carregar os dados locais.", error);
    alert(error instanceof Error ? error.message : String(error));
});
