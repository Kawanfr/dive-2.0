// Referências aos elementos
const form = document.getElementById('business-form');
const placeSelect = document.getElementById('place-select');

// --- DADOS DOS ESTABELECIMENTOS (Cópia do app.js para simulação) ---
// Usa os dados carregados do arquivo data.js
const establishments = typeof sharedEstablishments !== 'undefined' ? sharedEstablishments : [];

// 1. Preencher o Dropdown
establishments.forEach(place => {
    const option = document.createElement('option');
    option.value = place.id;
    option.textContent = place.name;
    placeSelect.appendChild(option);
});

// 2. Função para carregar dados salvos ao selecionar um local
placeSelect.addEventListener('change', () => {
    const selectedId = placeSelect.value;
    const db = JSON.parse(localStorage.getItem('dive-storage') || '{}');
    
    // Se houver dados salvos para este ID, preenche o formulário
    if (db[selectedId]) {
        document.getElementById('place-status').value = db[selectedId].status;
        document.getElementById('place-msg').value = db[selectedId].msg || "";
    } else {
        // Se não houver, limpa ou define padrão
        document.getElementById('place-status').value = "fire"; // Padrão
        document.getElementById('place-msg').value = "";
    }
});

// Dispara o evento manualmente para o primeiro item ao carregar a página
placeSelect.dispatchEvent(new Event('change'));

// 3. Salvar Atualização
form.addEventListener('submit', (e) => {
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
        name: selectedName, // Mantemos o nome para referência
        status: status,
        msg: document.getElementById('place-msg').value,
        color: color
    };

    // 1. Pega o banco de dados atual (ou cria um vazio)
    const db = JSON.parse(localStorage.getItem('dive-storage') || '{}');
    // 2. Atualiza APENAS o ID selecionado
    db[selectedId] = updateData;
    // 3. Salva tudo de volta
    localStorage.setItem('dive-storage', JSON.stringify(db));

    alert(`🎉 Status de "${selectedName}" atualizado com sucesso!`);
    window.location.reload(); // Atualiza a tela atual para confirmar, sem voltar ao mapa
});