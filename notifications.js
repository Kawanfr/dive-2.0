export function showToast(message, onClick) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    if (onClick) {
        toast.style.cursor = 'pointer';
        toast.onclick = (e) => {
            if (e.target.tagName !== 'BUTTON') {
                onClick();
                toast.remove();
            }
        };
    }
    
    toast.innerHTML = `<span>${message}</span> <button onclick="event.stopPropagation(); this.parentElement.remove()" style="background:none;border:none;color:white;font-size:16px;cursor:pointer;">&times;</button>`;
    container.appendChild(toast);
    
    setTimeout(() => { if (toast.parentElement) toast.remove(); }, 5000);
}

export function triggerPushNotification(title, body, url) {
    if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(title, {
                body,
                icon: 'https://cdn-icons-png.flaticon.com/512/854/854878.png',
                vibrate: [200, 100, 200],
                data: { url: url || window.location.href }
            });
        });
    }
}

export function checkNotificationPermission() {
    if (!('Notification' in window)) return;
    const btn = document.getElementById('notif-btn');
    if (!btn) return;
    
    if (Notification.permission === 'default' || Notification.permission === 'denied') {
        btn.classList.remove('hidden');
    } else {
        btn.classList.add('hidden');
    }
    
    btn.addEventListener('click', () => {
        if (Notification.permission === 'denied') {
            alert("⚠️ As notificações estão bloqueadas pelo navegador. Vá nas configurações deste site e permita.");
            return;
        }
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showToast("✅ Notificações ativadas!");
                btn.classList.add('hidden');
            }
        });
    });
}
