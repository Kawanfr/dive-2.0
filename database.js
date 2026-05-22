// Banco de dados mockado para rodar localmente sem Firebase (usa localStorage).
const defaultPayload = [
    {
        id: 1,
        name: "Assai Atacadista (João Dias)",
        coords: [-23.646234, -46.729094],
        status: "chill",
        color: "#3498db",
        offers: [],
        icon: "https://www.google.com/s2/favicons?domain=assai.com.br&sz=128",
        hours: "🕒 Seg-Sáb: 07:00 - 22:00 | Dom: 08:00 - 18:00",
        schedule: { week: [7, 22], sun: [8, 18] },
        website: "https://www.assai.com.br"
    },
    {
        id: 2,
        name: "Carrefour Hipermercado (João Dias)",
        coords: [-23.642270, -46.734588],
        status: "chill",
        color: "#3498db",
        offers: [],
        icon: "https://www.google.com/s2/favicons?domain=carrefour.com.br&sz=128",
        hours: "🕒 Aberto todos os dias: 06:00 - 23:00",
        schedule: { all: [6, 23] },
        website: "https://www.carrefour.com.br"
    },
    {
        id: 3,
        name: "Akki Atacadista João Dias",
        coords: [-23.642038, -46.738812],
        status: "chill",
        color: "#3498db",
        offers: [],
        icon: "https://www.google.com/s2/favicons?domain=akkiatacadista.com.br&sz=128",
        hours: "🕒 Seg-Sáb: 07:00 - 22:00 | Dom: 07:00 - 20:00",
        schedule: { week: [7, 22], sun: [7, 20] },
        website: "https://www.akkiatacadista.com.br"
    },
    {
        id: 4,
        name: "Ayumi Supermercado",
        coords: [-23.649516, -46.733178],
        status: "chill",
        color: "#3498db",
        offers: [],
        icon: "https://www.google.com/s2/favicons?domain=ayumisupermercados.com.br&sz=128",
        hours: "🕒 Seg-Sáb: 08:00 - 21:00 | Dom: 08:00 - 14:00",
        schedule: { week: [8, 21], sun: [8, 14] },
        website: "https://ayumisupermercados.com.br"
    },
    {
        id: 5,
        name: "Atacadão",
        coords: [-23.668816, -46.736381],
        status: "chill",
        color: "#3498db",
        offers: [],
        icon: "https://www.google.com/s2/favicons?domain=atacadao.com.br&sz=128",
        hours: "🕒 Seg-Sáb: 07:00 - 22:00 | Dom: 08:00 - 18:00",
        schedule: { week: [7, 22], sun: [8, 18] },
        website: "https://www.atacadao.com.br"
    }
];

export let globalEstablishments = []; // Estado global do mapa

let listeners = [];

// Preenche o banco se estiver vazio
export async function initializeDB(onReady) {
    const localData = localStorage.getItem("dive_db");
    if (localData) {
        try {
            globalEstablishments = JSON.parse(localData);
        } catch (e) {
            console.warn("JSON Corrompido detectado. Resetando database...", e);
            globalEstablishments = [...defaultPayload];
            localStorage.setItem("dive_db", JSON.stringify(globalEstablishments));
        }
    } else {
        globalEstablishments = [...defaultPayload];
        localStorage.setItem("dive_db", JSON.stringify(globalEstablishments));
    }
    if (onReady) onReady();
}

export function subscribeToEstablishments(onUpdated, onPushAlert) {
    listeners.push(onUpdated);
    onUpdated(globalEstablishments);
}

export function saveEstablishmentToLocal(place) {
    const index = globalEstablishments.findIndex(p => String(p.id) === String(place.id));
    if (index !== -1) globalEstablishments[index] = place;
    else globalEstablishments.push(place);
    localStorage.setItem("dive_db", JSON.stringify(globalEstablishments));
    listeners.forEach(fn => fn(globalEstablishments));
}

export function deleteEstablishmentFromLocal(id) {
    globalEstablishments = globalEstablishments.filter(p => String(p.id) !== String(id));
    localStorage.setItem("dive_db", JSON.stringify(globalEstablishments));
    listeners.forEach(fn => fn(globalEstablishments));
}

// Sincroniza abas abertas (Se o Admin salvar numa aba, o Mapa na outra atualiza sozinho)
window.addEventListener('storage', (e) => {
    if (e.key === 'dive_db' && e.newValue) {
        try {
            globalEstablishments = JSON.parse(e.newValue);
            listeners.forEach(fn => fn(globalEstablishments));
        } catch(err) {
            console.error("Erro na sincronização entre abas", err);
        }
    }
});
