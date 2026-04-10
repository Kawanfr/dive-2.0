import { db } from './firebase-config.js';
import { collection, onSnapshot, doc, setDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// O antigo data.js agora vive apenas AQUI para o SEED INICIAL, caso o banco esteja limpo. 
// Depois disso, a NUVEM é a única fonte da verdade.
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
let isFirstSync = true;

// Preenche o banco se estiver vazio
export async function initializeDB(onReady) {
    try {
        const querySnapshot = await getDocs(collection(db, "establishments"));
        
        let needsSeed = false;
        if (querySnapshot.empty) {
            needsSeed = true;
        } else {
            // Verifica se o banco atual está faltando os dados reais de coordenadas (legado)
            const firstDoc = querySnapshot.docs[0].data();
            if (!firstDoc.coords) {
                needsSeed = true;
            }
        }

        if (needsSeed) {
            console.warn("Banco precisa do Seed Completo. Fazendo o upload dos dados mestres...");
            
            // Envia tudo pro Firestore
            for (let place of defaultPayload) {
                await setDoc(doc(db, "establishments", String(place.id)), place, { merge: true });
            }
            console.log("✅ Seed finalizado no Firestore.");
        }
    } catch(e) {
        console.error("DB Error:", e);
    } finally {
        if(onReady) onReady();
    }
}

// Mantém conexão permanente por WebSocket
export function subscribeToEstablishments(onUpdated, onPushAlert) {
    return onSnapshot(collection(db, "establishments"), (snapshot) => {
        let hasStructuralChanges = false;
        
        snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            
            if (change.type === "added") {
                globalEstablishments.push(data);
                hasStructuralChanges = true;
            }
            if (change.type === "modified") {
                const index = globalEstablishments.findIndex(p => String(p.id) === String(data.id));
                if(index !== -1) globalEstablishments[index] = data;
                else globalEstablishments.push(data);
                
                hasStructuralChanges = true;

                // Emite alerta apenas se alterado remotamente (e não o primeiro load)
                if (!isFirstSync && onPushAlert) {
                    onPushAlert(data);
                }
            }
            if (change.type === "removed") {
                globalEstablishments = globalEstablishments.filter(p => String(p.id) !== String(data.id));
                hasStructuralChanges = true;
            }
        });

        // Diz à UI base para repintar
        if (hasStructuralChanges && onUpdated) {
            onUpdated(globalEstablishments);
        }
        
        isFirstSync = false;
    });
}
