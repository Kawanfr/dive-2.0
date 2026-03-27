// Referências aos elementos
const form = document.getElementById('business-form');
const placeSelect = document.getElementById('place-select');

// --- DADOS DOS ESTABELECIMENTOS (Cópia do app.js para simulação) ---
// Usa os dados carregados do arquivo data.js
const baseEstablishments = typeof sharedEstablishments !== 'undefined' ? sharedEstablishments : [];
const customEstablishments = JSON.parse(localStorage.getItem('dive-custom-places') || '[]');
const establishments = [...baseEstablishments, ...customEstablishments];

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

// --- INTEGRAÇÃO COM IA (GEMINI API) ---
async function addPlaceWithAI() {
    const promptInput = document.getElementById('ai-prompt').value;
    const apiKey = document.getElementById('ai-api-key').value;

    if (!promptInput || !apiKey) {
        return alert("⚠️ Preencha o comando e a chave da API do Gemini.");
    }

    const btn = document.getElementById('ai-btn');
    btn.innerText = "⏳ A IA está pensando (buscando dados)...";
    btn.disabled = true;

    const systemInstruction = `Você é um assistente de banco de dados para um app de mapas. 
O usuário pedirá para adicionar um estabelecimento comercial. Você deve retornar EXATAMENTE um objeto JSON válido (sem formatação markdown como \`\`\`json) contendo os dados reais ou muito aproximados do local. 
Use a estrutura abaixo como base:
{
    "id": (gere um numero aleatorio entre 100 e 9999),
    "name": "Nome Completo do Local",
    "coords": [-23.550520, -46.633308],
    "status": "chill",
    "msg": "✨ Bem-vindo! Venha conferir nossos produtos.",
    "color": "#3498db",
    "icon": "https://www.google.com/s2/favicons?domain=dominio_do_site.com.br&sz=128",
    "hours": "🕒 Horário estimado",
    "schedule": { "all": [8, 22] },
    "website": "url do site"
}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: { text: systemInstruction } },
                contents: [{ parts: [{ text: promptInput }] }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Erro de conexão com o Google Gemini.");
        }

        const data = await response.json();
        const aiTextResponse = data.candidates[0].content.parts[0].text.trim();
        
        // Remove blocos de markdown caso a IA ignore a instrução
        const cleanJsonText = aiTextResponse.replace(/```json/gi, '').replace(/```/gi, '').trim();

        // Extrai apenas o objeto JSON caso a IA inclua texto extra na resposta
        const jsonMatch = cleanJsonText.match(/\{[\s\S]*\}/);
        const finalJsonText = jsonMatch ? jsonMatch[0] : cleanJsonText;
        const newPlace = JSON.parse(finalJsonText);
        
        // Garante que o ID seja 100% único usando o timestamp atual, ignorando o gerado pela IA
        newPlace.id = Date.now();

        // --- BUSCA DE COORDENADAS REAIS (OPENSTREETMAP) ---
        try {
            btn.innerText = "📍 Buscando coordenadas exatas...";
            // Tenta buscar o endereço real baseado no nome que a IA gerou
            // Adicionamos "Brasil" para melhorar a precisão da busca
            const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(newPlace.name + ' Brasil')}&format=json&limit=1`, {
                headers: { 'User-Agent': 'DIVE-PWA-App' }
            });
            const geoData = await geoResponse.json();
            
            if (geoData && geoData.length > 0) {
                // Sobrescreve as coordenadas chutadas pela IA com as reais do satélite
                newPlace.coords = [parseFloat(geoData[0].lat), parseFloat(geoData[0].lon)];
                console.log(`Coordenadas corrigidas via satélite: ${newPlace.coords}`);
            } else {
                console.warn("Não foi possível achar a coordenada exata, usando a da IA.");
            }
            
            // Validação final de segurança para não quebrar o mapa do Leaflet
            if (!Array.isArray(newPlace.coords) || newPlace.coords.length !== 2 || isNaN(newPlace.coords[0]) || isNaN(newPlace.coords[1])) {
                console.warn("Coordenadas inválidas detectadas. Aplicando localização padrão.");
                newPlace.coords = [-23.646184, -46.732581]; // Posição inicial (João Dias)
            }
        } catch (geoError) {
            console.warn("Erro ao buscar coordenadas reais:", geoError);
            if (!Array.isArray(newPlace.coords) || newPlace.coords.length !== 2 || isNaN(newPlace.coords[0]) || isNaN(newPlace.coords[1])) {
                newPlace.coords = [-23.646184, -46.732581];
            }
        }

        // Salva no LocalStorage
        const currentCustomPlaces = JSON.parse(localStorage.getItem('dive-custom-places') || '[]');
        currentCustomPlaces.push(newPlace);
        localStorage.setItem('dive-custom-places', JSON.stringify(currentCustomPlaces));

        alert(`✅ IA adicionou com sucesso: ${newPlace.name}!\nAs coordenadas e dados foram salvos.`);
        window.location.reload();
    } catch (error) {
        console.error("Detalhes do erro:", error);
        alert(`❌ Erro ao gerar com a IA:\n${error.message}\n\nAbra o console (F12) para ver os detalhes.`);
        btn.innerText = "✨ Adicionar com IA";
        btn.disabled = false;
    }
}

// --- LIMPAR LOCAIS DA IA ---
function clearAIPlaces() {
    if (confirm("Tem certeza que deseja apagar TODOS os locais gerados pela IA? Isso não afetará os locais originais do aplicativo.")) {
        localStorage.removeItem('dive-custom-places');
        alert("🗑️ Locais da IA removidos com sucesso!");
        window.location.reload();
    }
}