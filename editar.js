import { db } from './firebase-config.js';
import { doc, getDocs, collection, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { requireAuth, attachLogoutHandler } from './auth.js';

// Tranca a página
requireAuth((user) => {
    const btnLogout = document.getElementById('logout-btn');
    if (btnLogout) attachLogoutHandler(btnLogout);
});

const form = document.getElementById('edit-form');
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
    ownerEmail: document.getElementById('edit-owner-email'),
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

// 1. Busca todas as Lojas da Nuvem
async function loadPlaces() {
    try {
        const snapshot = await getDocs(collection(db, 'establishments'));
        currentPlaces = [];
        snapshot.forEach(d => currentPlaces.push(d.data()));

        select.innerHTML = '<option value="" disabled selected>Escolha uma loja...</option>';
        currentPlaces.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        currentPlaces.forEach(place => {
            const option = document.createElement('option');
            option.value = place.id;
            option.textContent = `${place.name} (ID: ${place.id})`;
            select.appendChild(option);
        });
    } catch (e) {
        select.innerHTML = '<option value="" disabled selected>Erro ao carregar da nuvem (F5)</option>';
        console.error(e);
    }
}

// 2. Preenche os campos assim que selecionado
select.addEventListener('change', () => {
    const selectedId = select.value;
    const place = currentPlaces.find(p => String(p.id) === String(selectedId));
    if (!place) return;

    inputs.name.value = place.name || "";
    inputs.lat.value = place.coords ? place.coords[0] : "";
    inputs.lng.value = place.coords ? place.coords[1] : "";
    inputs.icon.value = place.icon || "";
    inputs.site.value = place.website || "";
    inputs.ownerEmail.value = place.ownerEmail || "";
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

// 3. Salvar Edições de Sobrescrita Merge
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!select.value) return;

    btnSave.innerText = "☁️ Sincronizando na Google Cloud...";
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
            ownerEmail: inputs.ownerEmail.value.trim(),
            hours: hoursText.trim().slice(0, 15),
            schedule: {
                week: [parseInt(inputs.weekOpen.value), parseInt(inputs.weekClose.value)],
                sun: [parseInt(inputs.sunOpen.value), parseInt(inputs.sunClose.value)]
            }
        };

        // Usa o flag Merge para não deletar Status e MSG do admin manager
        await setDoc(doc(db, "establishments", idStr), updatePayload, { merge: true });

        alert("✅ Loja editada com Sucesso no Mapa Global!");
        loadPlaces(); // Recarrega

        form.reset();
        Object.values(inputs).forEach(i => i.disabled = true);
        btnSave.disabled = true;
        btnDelete.disabled = true;
        btnSave.innerText = "💾 Salvar Alterações Raiz";

    } catch (err) {
        alert("❌ Erro ao Salvar Edições: " + err.message);
        btnSave.disabled = false;
        btnSave.innerText = "💾 Salvar Alterações Raiz";
    }
});

// 4. Protocolo de Deleção Máxima
btnDelete.addEventListener('click', async () => {
    if (!select.value) return;
    const place = currentPlaces.find(p => String(p.id) === String(select.value));

    // Dupla checagem de Segurança
    const confirm1 = confirm(`CUIDADO: Deseja ATOMICAMENTE apagar a loja "${place.name}" de todos os celulares?`);
    if (!confirm1) return;
    const confirm2 = prompt(`TERTEZA ABSOLUTA? Escreva a palavra "DELETAR" para confirmar a exclusão de ${place.name}:`);
    if (confirm2 !== "DELETAR") {
        alert("Operação cancelada para segurança.");
        return;
    }

    btnDelete.innerText = "Apagando do mapa...";
    btnDelete.disabled = true;

    try {
        await deleteDoc(doc(db, "establishments", String(select.value)));
        alert("💥 Loja pulverizada do Google!");
        loadPlaces(); // Recarrega o array para sumir da lista
        form.reset();
        Object.values(inputs).forEach(i => i.disabled = true);
        btnSave.disabled = true;
        btnDelete.disabled = true;
    } catch (err) {
        alert("❌ Erro ao deletar: " + err.message);
    } finally {
        btnDelete.innerText = "🗑️ Excluir Loja Permanentemente";
    }
});

// Start Hook
loadPlaces();
