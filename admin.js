import { db } from './firebase-config.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Referências aos elementos
const form = document.getElementById('business-form');
const placeSelect = document.getElementById('place-select');

// Usa os dados carregados do array estático base (já puxados do global)
const establishments = window.sharedEstablishments || [];

// 1. Preencher o Dropdown
establishments.forEach(place => {
    const option = document.createElement('option');
    option.value = place.id;
    option.textContent = place.name;
    placeSelect.appendChild(option);
});

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
    } catch(err) {
        console.error("Erro ao buscar dados na nuvem:", err);
        document.getElementById('place-status').value = "fire"; 
        document.getElementById('place-msg').value = "";
    } finally {
        submitBtn.innerText = "🚀 Atualizar Status";
        submitBtn.disabled = false;
    }
});

// Dispara o evento ao carregar
placeSelect.dispatchEvent(new Event('change'));

// 3. Salvar Atualização na Nuvem
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const selectedId = parseInt(placeSelect.value);
    const selectedName = placeSelect.options[placeSelect.selectedIndex].text;
    const status = document.getElementById('place-status').value;
    
    // Define a cor baseada no status
    let color = 'red';
    if (status === 'chill') color = '#3498db';
    else if (status === 'live') color = '#f1c40f';

    const updateData = {
        id: selectedId,
        name: selectedName,
        status: status,
        msg: document.getElementById('place-msg').value,
        color: color,
        updatedAt: new Date().toISOString()
    };

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerText = "☁️ Salvando na nuvem...";
    submitBtn.disabled = true;

    try {
        await setDoc(doc(db, "establishments", String(selectedId)), updateData, { merge: true });
        alert(`🎉 Status de "${selectedName}" atualizado com sucesso na nuvem!`);
    } catch(err) {
        console.error(err);
        alert(`❌ Erro ao salvar: ${err.message}`);
    } finally {
        submitBtn.innerText = "🚀 Atualizar Status";
        submitBtn.disabled = false;
    }
});