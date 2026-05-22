import { globalEstablishments, saveEstablishmentToLocal, deleteEstablishmentFromLocal } from './database.js';

// Carrega lojas diretamente, sem autenticação
loadPlaces();

// === ABA: CRIAR LOJA ===
const createForm = document.getElementById('create-form');
createForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = createForm.querySelector('button[type="submit"]');
    submitBtn.innerText = "💾 Salvando Localmente...";
    submitBtn.disabled = true;

    try {
        const newId = Date.now();
        const name = document.getElementById('new-name').value.trim().slice(0, 30);
        const lat = parseFloat(document.getElementById('new-lat').value);
        const lng = parseFloat(document.getElementById('new-lng').value);
        const icon = (document.getElementById('new-icon').value || "").trim().slice(0, 120);
        const website = (document.getElementById('new-site').value || "").trim().slice(0, 120);
        let hoursText = document.getElementById('new-hours-text').value.trim().slice(0, 15);

        if (!hoursText.includes("🕒")) hoursText = "🕒 " + hoursText;

        const newEstablishmentData = {
            id: newId,
            name: name,
            coords: [lat, lng],
            icon: icon,
            website: website,
            hours: hoursText,
            schedule: {
                week: [parseInt(document.getElementById('week-open').value), parseInt(document.getElementById('week-close').value)],
                sun: [parseInt(document.getElementById('sun-open').value), parseInt(document.getElementById('sun-close').value)]
            },
            status: "chill",
            color: "#3498db",
            offers: [] // Array Waze vazio para comunidade alimentar
        };

        saveEstablishmentToLocal(newEstablishmentData);

        alert(`🎉 SUCESSO!\nA loja "${name}" foi adicionada!`);
        createForm.reset();
        loadPlaces(); // Atualiza a aba de gerenciamento

    } catch (err) {
        alert(`❌ Erro ao salvar: ${err.message}`);
    } finally {
        submitBtn.innerText = "💾 Cadastrar Loja no Mapa";
        submitBtn.disabled = false;
    }
});


// === ABA: GERENCIAR LOJAS ===
const editForm = document.getElementById('edit-form');
const select = document.getElementById('edit-select');
const btnSave = document.getElementById('btn-save');
const btnDelete = document.getElementById('btn-delete');

let currentPlaces = [];

const inputs = {
    name: document.getElementById('edit-name'),
    lat: document.getElementById('edit-lat'),
    lng: document.getElementById('edit-lng'),
    icon: document.getElementById('edit-icon'),
    site: document.getElementById('edit-site'),
    hoursText: document.getElementById('edit-hours-text'),
    weekOpen: document.getElementById('edit-week-open'),
    weekClose: document.getElementById('edit-week-close'),
    sunOpen: document.getElementById('edit-sun-open'),
    sunClose: document.getElementById('edit-sun-close')
};

function enableInputs() {
    Object.values(inputs).forEach(i => i.disabled = false);
    btnSave.disabled = false;
    btnDelete.disabled = false;
}

// 1. Busca Lojas
async function loadPlaces() {
    try {
        currentPlaces = [...globalEstablishments];
        select.innerHTML = '<option value="" disabled selected>Escolha uma loja...</option>';
        currentPlaces.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        currentPlaces.forEach(place => {
            const option = document.createElement('option');
            option.value = place.id;
            option.textContent = `${place.name} (ID: ${place.id})`;
            select.appendChild(option);
        });
    } catch (e) {
        select.innerHTML = '<option value="" disabled selected>Erro ao carregar da nuvem</option>';
        console.error(e);
    }
}

// 2. Preenche os campos
select.addEventListener('change', () => {
    const selectedId = select.value;
    const place = currentPlaces.find(p => String(p.id) === String(selectedId));
    if (!place) return;

    inputs.name.value = place.name || "";
    inputs.lat.value = place.coords ? place.coords[0] : "";
    inputs.lng.value = place.coords ? place.coords[1] : "";
    inputs.icon.value = place.icon || "";
    inputs.site.value = place.website || "";
    inputs.hoursText.value = place.hours ? place.hours.replace("🕒", "").trim() : "";

    if (place.schedule) {
        inputs.weekOpen.value = place.schedule.week ? place.schedule.week[0] : "";
        inputs.weekClose.value = place.schedule.week ? place.schedule.week[1] : "";
        inputs.sunOpen.value = place.schedule.sun ? place.schedule.sun[0] : "";
        inputs.sunClose.value = place.schedule.sun ? place.schedule.sun[1] : "";
    } else {
        inputs.weekOpen.value = ""; inputs.weekClose.value = "";
        inputs.sunOpen.value = ""; inputs.sunClose.value = "";
    }

    enableInputs();
});

// 3. Salvar Edição
editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!select.value) return;

    btnSave.innerText = "💾 Salvando...";
    btnSave.disabled = true;

    try {
        const idStr = String(select.value);
        let hoursText = inputs.hoursText.value;
        if (!hoursText.includes("🕒")) hoursText = "🕒 " + hoursText;

        const updatePayload = {
            name: inputs.name.value.trim().slice(0, 30),
            coords: [parseFloat(inputs.lat.value), parseFloat(inputs.lng.value)],
            icon: inputs.icon.value.trim().slice(0, 120),
            website: inputs.site.value.trim().slice(0, 120),
            hours: hoursText.trim().slice(0, 15),
            schedule: {
                week: [parseInt(inputs.weekOpen.value), parseInt(inputs.weekClose.value)],
                sun: [parseInt(inputs.sunOpen.value), parseInt(inputs.sunClose.value)]
            }
        };

        const place = currentPlaces.find(p => String(p.id) === idStr);
        saveEstablishmentToLocal({ ...place, ...updatePayload });

        alert("✅ Loja editada com Sucesso!");
        loadPlaces();
        
        editForm.reset();
        Object.values(inputs).forEach(i => i.disabled = true);
        btnSave.disabled = true;
        btnDelete.disabled = true;
        btnSave.innerText = "💾 Salvar Alterações";

    } catch (err) {
        alert("❌ Erro: " + err.message);
        btnSave.disabled = false;
        btnSave.innerText = "💾 Salvar Alterações";
    }
});

// 4. Deleção
btnDelete.addEventListener('click', async () => {
    if (!select.value) return;
    const place = currentPlaces.find(p => String(p.id) === String(select.value));

    const confirm1 = confirm(`CUIDADO: Deseja apagar a loja "${place.name}"?`);
    if (!confirm1) return;
    const confirm2 = prompt(`TERTEZA? Escreva "DELETAR" para confirmar a exclusão de ${place.name}:`);
    if (confirm2 !== "DELETAR") return;

    btnDelete.innerText = "Apagando...";
    btnDelete.disabled = true;

    try {
        deleteEstablishmentFromLocal(select.value);
        alert("💥 Loja pulverizada do mapa global!");
        loadPlaces();
        editForm.reset();
        Object.values(inputs).forEach(i => i.disabled = true);
        btnSave.disabled = true;
        btnDelete.disabled = true;
    } catch (err) {
        alert("❌ Erro ao deletar: " + err.message);
    } finally {
        btnDelete.innerText = "🗑️ Excluir Loja Permanentemente";
    }
});
