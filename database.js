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

export const globalEstablishments = []; // Usando const para mutação segura (evita perda de referência)

let listeners = [];

function validateEstablishments(data) {
    if (!Array.isArray(data)) {
        throw new Error("A lista de estabelecimentos precisa ser um array.");
    }

    const ids = new Set();
    data.forEach((place, index) => {
        if (!place || typeof place !== 'object' || Array.isArray(place)) {
            throw new Error(`O estabelecimento na posição ${index + 1} está inválido.`);
        }
        if ((typeof place.id !== 'string' && typeof place.id !== 'number') ||
            String(place.id).trim() === '' ||
            (typeof place.id === 'number' && !Number.isFinite(place.id))) {
            throw new Error(`O estabelecimento na posição ${index + 1} não tem um ID válido.`);
        }
        if (ids.has(String(place.id))) {
            throw new Error(`O ID "${place.id}" está duplicado.`);
        }
        ids.add(String(place.id));

        if (typeof place.name !== 'string' || !place.name.trim()) {
            throw new Error(`O estabelecimento "${place.id}" não tem um nome válido.`);
        }
        if (!Array.isArray(place.coords) || place.coords.length !== 2 ||
            !Number.isFinite(place.coords[0]) || !Number.isFinite(place.coords[1]) ||
            Math.abs(place.coords[0]) > 90 || Math.abs(place.coords[1]) > 180) {
            throw new Error(`As coordenadas do estabelecimento "${place.name}" são inválidas.`);
        }
        if (place.offers !== undefined && !Array.isArray(place.offers)) {
            throw new Error(`A lista de ofertas de "${place.name}" está inválida.`);
        }
        if (Array.isArray(place.offers)) {
            place.offers.forEach((offer, offerIndex) => {
                if (!offer || typeof offer !== 'object' || Array.isArray(offer) ||
                    !Number.isFinite(offer.expiresAt) ||
                    (offer.id !== undefined && !Number.isFinite(offer.id)) ||
                    typeof offer.product !== 'string' || typeof offer.price !== 'string' ||
                    (offer.up !== undefined && (!Number.isFinite(offer.up) || offer.up < 0)) ||
                    (offer.down !== undefined && (!Number.isFinite(offer.down) || offer.down < 0)) ||
                    (offer.voters !== undefined && (!Array.isArray(offer.voters) || !offer.voters.every(voter => typeof voter === 'string')))) {
                    throw new Error(`A oferta ${offerIndex + 1} de "${place.name}" está inválida.`);
                }
            });
        }
    });
}

function persistEstablishments(data) {
    validateEstablishments(data);
    try {
        localStorage.setItem("dive_db", JSON.stringify(data));
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(`Não foi possível salvar os dados no armazenamento local: ${detail}`);
    }
}

function replaceEstablishments(data) {
    globalEstablishments.length = 0;
    globalEstablishments.push(...data);
}

export function getSafeHttpUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
        const url = new URL(value.trim());
        return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
    } catch {
        return '';
    }
}

// Carrega os dados locais ou inicializa o banco com os estabelecimentos padrão.
export async function initializeDB(onReady) {
    let localData;
    try {
        localData = localStorage.getItem("dive_db");
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(`Não foi possível acessar o armazenamento local: ${detail}`);
    }

    if (localData) {
        let data;
        try {
            data = JSON.parse(localData);
            validateEstablishments(data);
        } catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            throw new Error(`Os dados locais do DIVE estão inválidos e foram preservados. Corrija ou remova a chave "dive_db" para continuar. Detalhe: ${detail}`);
        }
        replaceEstablishments(data);
    } else {
        const initialData = defaultPayload.map(place => ({ ...place }));
        persistEstablishments(initialData);
        replaceEstablishments(initialData);
    }
    if (onReady) onReady();
}

export function subscribeToEstablishments(onUpdated, onPushAlert) {
    listeners.push(onUpdated);
    onUpdated(globalEstablishments);
}

export function saveEstablishmentToLocal(place) {
    const index = globalEstablishments.findIndex(p => String(p.id) === String(place.id));
    const updatedEstablishments = [...globalEstablishments];
    if (index !== -1) updatedEstablishments[index] = place;
    else updatedEstablishments.push(place);

    persistEstablishments(updatedEstablishments);
    replaceEstablishments(updatedEstablishments);
    listeners.forEach(fn => fn(globalEstablishments));
}

export function deleteEstablishmentFromLocal(id) {
    const filtered = globalEstablishments.filter(p => String(p.id) !== String(id));
    persistEstablishments(filtered);
    replaceEstablishments(filtered);
    listeners.forEach(fn => fn(globalEstablishments));
}

// Sincroniza abas abertas (Se o Admin salvar numa aba, o Mapa na outra atualiza sozinho)
window.addEventListener('storage', (e) => {
    if (e.key === 'dive_db' && e.newValue) {
        try {
            const data = JSON.parse(e.newValue);
            validateEstablishments(data);
            replaceEstablishments(data);
            listeners.forEach(fn => fn(globalEstablishments));
        } catch(err) {
            console.error("A alteração recebida de outra aba contém dados inválidos. Os dados atuais foram mantidos.", err);
        }
    }
});
