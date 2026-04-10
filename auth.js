import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

// === CONFIGURAÇÃO MESTRE GLOBAL ===
export const MASTER_ADMINS = ['kawanautentico@gmail.com', 'guleidi2012@hotmail.com', 'suporte@dive.com'];

export function isMaster(user) {
    if (!user) return false;
    return MASTER_ADMINS.includes(user.email);
}

// O Cão de Guarda - Protege o Admin Panel
export function requireAuth(onAuthenticated) {
    onAuthStateChanged(auth, (user) => {
        if (!user || (!isMaster(user) && window.location.pathname.includes('admin-panel.html'))) {
            if (!window.location.pathname.includes('login.html')) {
                alert("Acesso Negado 🛑\nApenas administradores globais possuem acesso a esta área.");
                if (user) {
                    signOut(auth);
                }
                window.location.replace('login.html');
            }
        } else {
            console.log("Portões Abertos! Administrador logado:", user.email);
            if (onAuthenticated) onAuthenticated(user);
        }
    });
}

// Rotinas da Página de Login
if (window.location.pathname.includes('login.html')) {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        onAuthStateChanged(auth, (user) => {
            if (user && isMaster(user)) {
                window.location.replace('admin-panel.html');
            } else if (user && !isMaster(user)) {
                signOut(auth);
            }
        });

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = document.getElementById('login-btn');
            btn.innerText = "⏳ Logando...";
            btn.disabled = true;

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                await signInWithEmailAndPassword(auth, email, password);
                // onAuthStateChanged vai ser disparado aqui
            } catch (error) {
                alert("❌ Erro: E-mail ou Senha incorretos.");
                btn.innerText = "🔓 Entrar no Sistema";
                btn.disabled = false;
            }
        });
    }
}

export function attachLogoutHandler(btnElement) {
    if (!btnElement) return;
    btnElement.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.replace('login.html');
        }).catch((error) => alert("Erro ao Deslogar:", error));
    });
}
