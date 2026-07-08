/**
 * Módulo para gerenciar a instalação do PWA.
 * Escuta o evento 'beforeinstallprompt', mostra um botão customizado
 * e dispara o prompt de instalação quando o usuário clica.
 */

let deferredInstallPrompt = null;

export function initPwaInstaller() {
    const installButton = document.getElementById('install-pwa-btn');

    if (!installButton) {
        console.warn("Botão de instalação PWA '#install-pwa-btn' não encontrado.");
        return;
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        // Previne o mini-infobar padrão do Chrome
        e.preventDefault();
        // Guarda o evento para que possa ser acionado mais tarde.
        deferredInstallPrompt = e;
        // Mostra nosso botão de instalação customizado
        installButton.classList.remove('hidden');
        console.log("PWA é instalável. Botão de instalação exibido.");
    });

    installButton.addEventListener('click', async () => {
        if (!deferredInstallPrompt) return;

        // Mostra o prompt de instalação
        deferredInstallPrompt.prompt();

        // Espera pela escolha do usuário
        const { outcome } = await deferredInstallPrompt.userChoice;
        console.log(`PWA setup user choice: ${outcome}`);

        // O prompt só pode ser usado uma vez. Limpamos a variável.
        deferredInstallPrompt = null;
        installButton.classList.add('hidden');
    });
}