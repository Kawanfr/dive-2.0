import { db } from './firebase-config.js';
import { doc, getDoc, setDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { requireAuth, attachLogoutHandler } from './auth.js';

requireAuth((user) => {
    const btnLogout = document.getElementById('logout-btn');
    if (btnLogout) attachLogoutHandler(btnLogout);
});

// Referências aos elementos
const form = document.getElementById('business-form');
const placeSelect = document.getElementById('place-select');

// 1. Preencher o Dropdown dinamicamente via Nuvem
async function populateDropdown() {
    placeSelect.innerHTML = '<option value="" disabled selected>Carregando lojas da nuvem...</option>';
    try {
        const snapshot = await getDocs(collection(db, 'establishments'));
        const establishments = [];
        snapshot.forEach(docSnap => establishments.push(docSnap.data()));

        placeSelect.innerHTML = '';
        if (establishments.length === 0) {
            placeSelect.innerHTML = '<option value="" disabled selected>Nenhuma loja encontrada</option>';
            return;
        }

        // Ordena por nome
        establishments.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        establishments.forEach(place => {
            const option = document.createElement('option');
            option.value = place.id;
            option.textContent = place.name;
            placeSelect.appendChild(option);
        });

        // Dispara o evento ao carregar
        placeSelect.dispatchEvent(new Event('change'));
    } catch (err) {
        console.error("Erro ao carregar lojas:", err);
        placeSelect.innerHTML = '<option value="" disabled selected>Erro de conexão</option>';
    }
}
populateDropdown();

// 2. Função para carregar dados salvos ao selecionar um local da Nuvem
placeSelect.addEventListener('change', async () => {
    const selectedId = placeSelect.value;

    // Mostra loading no botão 
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerText = "Carregando...";
    submitBtn.disabled = true;

    try {
        const docRef = doc(db, "establishments", String(selectedId));
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('place-status').value = data.status || "fire";
            document.getElementById('place-msg').value = data.msg || "";
        } else {
            // Padrão se nunca foi alterado
            document.getElementById('place-status').value = "fire";
            document.getElementById('place-msg').value = "";
        }
    } catch (err) {
        console.error("Erro ao buscar dados na nuvem:", err);
        document.getElementById('place-status').value = "fire";
        document.getElementById('place-msg').value = "";
    } finally {
        submitBtn.innerText = "🚀 Atualizar Status";
        submitBtn.disabled = false;
    }
});



// 3. Salvar Atualização na Nuvem
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const selectedId = parseInt(placeSelect.value);
    const selectedName = placeSelect.options[placeSelect.selectedIndex].text;
    const status = document.getElementById('place-status').value;
    const duration = document.getElementById('place-duration').value;
    
    // Define a cor baseada no status
    let color = 'red';
    if (status === 'chill') color = '#3498db';
    else if (status === 'live') color = '#f1c40f';

    let expiresAt = null;
    if (duration !== 'perm') {
       expiresAt = Date.now() + parseInt(duration) * 60000;
    }

    const updateData = {
        id: selectedId,
        name: selectedName,
        status: status,
        msg: document.getElementById('place-msg').value.trim().slice(0, 150),
        color: color,
        expiresAt: expiresAt,
        updatedAt: new Date().toISOString()
    };

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerText = "☁️ Salvando na nuvem...";
    submitBtn.disabled = true;

    try {
        await setDoc(doc(db, "establishments", String(selectedId)), updateData, { merge: true });
        alert(`🎉 Status de "${selectedName}" atualizado com sucesso na nuvem!`);
    } catch (err) {
        console.error(err);
        alert(`❌ Erro ao salvar: ${err.message}`);
    } finally {
        submitBtn.innerText = "🚀 Atualizar Status";
        submitBtn.disabled = false;
    }
});