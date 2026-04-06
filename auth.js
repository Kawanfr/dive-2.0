import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

// === CONFIGURAÇÃO MESTRE GLOBAL ===
export const MASTER_ADMINS = ['kawanautentico@gmail.com', 'guleidi2012@hotmail.com', 'suporte@dive.com'];

export function isMaster(user) {
    if (!user) return false;
    return MASTER_ADMINS.includes(user.email);
}

// Função GERAL para expulsar desconhecidos (O Cão de Guarda)
export function requireAuth(onAuthenticated) {
    // Isso vai ficar ouvindo "para sempre" e na hora do F5 atira o callback
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            // Acesso Negado
            if (!window.location.pathname.includes('login.html')) {
                alert("Acesso Negado 🛑\nVocê precisa de um Passaporte Válido para entrar nos Portões Administrativos.");
                window.location.replace('login.html');
            }
        } else {
            // Acesso Concedido
            console.log("Portões Abertos! Entidade logada:", user.email);

            // --- BLINDAGEM VISUAL DE CAMADAS ---
            const isManagerOnly = !isMaster(user);
            const path = window.location.pathname;

            // Se for gerente tentando acessar tela de adicionar ou editar, exila pra tela de Promocoes
            if (isManagerOnly && (path.includes('adicionar.html') || path.includes('editar.html'))) {
                alert("Acesso Restrito 🛡️\nGerentes possuem permissão exclusiva apenas para a Área de Promoções.");
                window.location.replace('cadastro.html');
                return;
            }

            // Expurga da tela os botões de Navegação que o gerente não pode usar
            if (isManagerOnly) {
                document.querySelectorAll('.master-only').forEach(el => el.style.display = 'none');
            }

            if (onAuthenticated) onAuthenticated(user);
        }
    });
}

// Rotinas EXCLUSIVAS da Página de Login em si
if (window.location.pathname.includes('login.html')) {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        // Se a pessoa já estiver logada, expulsa ELA MESMA do login e manda pro painel
        onAuthStateChanged(auth, (user) => {
            if (user) window.location.replace('adicionar.html');
        });

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = document.getElementById('login-btn');
            btn.innerText = "⏳ Avaliando credenciais...";
            btn.disabled = true;

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                // Efetua disparo ao Firebase Auth
                await signInWithEmailAndPassword(auth, email, password);
                // Ao dar certo, o ouvinte onAuthStateChanged acima será disparado sozinho e fará o replace
            } catch (error) {
                let errorMsg = "Erro de conexão.";
                if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                    errorMsg = "As chaves não batem (E-mail ou Senha incorretos).";
                }
                alert("❌ Fechadura travada: " + errorMsg);
                btn.innerText = "🔓 Entrar no Sistema";
                btn.disabled = false;
            }
        });
    }
}

// Botao de Logout genérico
export function attachLogoutHandler(btnElement) {
    if (!btnElement) return;
    btnElement.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.replace('login.html');
        }).catch((error) => alert("Erro ao Deslogar:", error));
    });
}
