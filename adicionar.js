import { db } from './firebase-config.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { requireAuth, attachLogoutHandler } from './auth.js';

// Tranca a página, apenas prossegue se autenticado
requireAuth((user) => {
    // Injeta botão de Sair
    const btnLogout = document.getElementById('logout-btn');
    if (btnLogout) attachLogoutHandler(btnLogout);
});

const form = document.getElementById('master-form');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerText = "☁️ Sincronizando na Nuvem...";
    submitBtn.disabled = true;

    try {
        // Gera um ID numérico único via Timestamp Atual
        const newId = Date.now();

        // Extrações da UI
        const name = document.getElementById('new-name').value;
        const lat = parseFloat(document.getElementById('new-lat').value);
        const lng = parseFloat(document.getElementById('new-lng').value);
        const icon = document.getElementById('new-icon').value || "";
        const website = document.getElementById('new-site').value || "";
        let hoursText = document.getElementById('new-hours-text').value;

        if (!hoursText.includes("🕒")) {
            hoursText = "🕒 " + hoursText; // Força estilização automática
        }

        const weekOpen = parseInt(document.getElementById('week-open').value);
        const weekClose = parseInt(document.getElementById('week-close').value);
        const sunOpen = parseInt(document.getElementById('sun-open').value);
        const sunClose = parseInt(document.getElementById('sun-close').value);

        // Construção do Documento no Formato Root
        const newEstablishmentData = {
            id: newId,
            name: name,
            coords: [lat, lng],
            icon: icon,
            website: website,
            hours: hoursText,
            schedule: {
                week: [weekOpen, weekClose],
                sun: [sunOpen, sunClose]
            },
            // Criação crua neutra (Isso pode ser mudado pelo cadastro.html/admin.js depois)
            status: "chill",
            msg: "🎉 Loja cadastrada recentemente na rede DIVE!",
            color: "#3498db" // Cor azul do status nativo chill
        };

        // Injeta usando setDoc que mescla caso algo dê conflito
        await setDoc(doc(db, "establishments", String(newId)), newEstablishmentData, { merge: true });

        alert(`🎉 SUCESSO!\nA loja "${name}" acaba de nascer no mapa e os clientes já podem visualizá-la em tempo real! 🎉`);
        
        // Limpa a tela
        form.reset();

    } catch(err) {
        console.error(err);
        alert(`❌ Erro no provedor DB: ${err.message}`);
    } finally {
        submitBtn.innerText = "💾 Cadastrar Loja no Mapa";
        submitBtn.disabled = false;
    }
});
