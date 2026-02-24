// Referências aos elementos
const form = document.getElementById('business-form');
const placeSelect = document.getElementById('place-select');

// --- DADOS DOS ESTABELECIMENTOS (Cópia do app.js para simulação) ---
const establishments = [
    { id: 1, name: "Assai Atacadista (João Dias)" },
    { id: 2, name: "Carrefour Hipermercado (João Dias)" },
    { id: 3, name: "Akki Atacadista João Dias" },
    { id: 4, name: "Ayumi Supermercado" },
    { id: 5, name: "Atacadão" }
];

// 1. Preencher o Dropdown
establishments.forEach(place => {
    const option = document.createElement('option');
    option.value = place.id;
    option.textContent = place.name;
    placeSelect.appendChild(option);
});

// 2. (Opcional) Poderíamos carregar os dados ao selecionar, mas vamos manter simples por enquanto
// Limpamos a lógica antiga que buscava apenas o último update solto
const savedStorage = localStorage.getItem('dive-storage');
if (savedStorage) {
    // Apenas log para debug
    console.log("Banco de dados carregado:", JSON.parse(savedStorage));
}

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