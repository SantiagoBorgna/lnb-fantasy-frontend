// Escuchamos el evento 'push' que manda nuestro servidor Spring Boot
self.addEventListener('push', function (event) {
    if (!event.data) return;

    const data = event.data.json();
    const targetUrl = data.url || '/'; // Ruta a la que debe llevar la notificación (ej. /t/xK9zQ/draft)
    const type = data.type || 'DEFAULT';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            let isAppFocusedAndInUrl = false;
            let isAppOpen = false;

            // Revisamos si el usuario ya tiene la app abierta
            for (let client of windowClients) {
                isAppOpen = true;
                
                // Si la pestaa est enfocada (mirndola) 
                if (client.focused) {
                    const clientPath = new URL(client.url).pathname;
                    // Si la URL coincide exactamente, o si es un evento de draft y ya est en la sala
                    if (clientPath.includes(targetUrl) || (targetUrl.includes('/draft') && clientPath.startsWith('/d/'))) {
                        isAppFocusedAndInUrl = true;
                        break;
                    }
                }
            }

            // Si la app está abierta, mandamos un evento in-app para que salte un Toast verde/rojo
            if (isAppOpen) {
                const channel = new BroadcastChannel('lnb-notifications');
                channel.postMessage({
                    title: data.title,
                    body: data.body,
                    url: targetUrl,
                    type: type
                });
            }

            // Si está mirando la pantalla exacta, SU-PRIMIMOS la notificación del celular (no molestamos)
            if (isAppFocusedAndInUrl) {
                return; 
            }

            // En cualquier otro caso (app cerrada, minimizada, o mirando otra pantalla), tiramos la notificación nativa
            const options = {
                body: data.body,
                icon: '/icons/icon-192.png', 
                badge: '/icons/icon-192.png',
                vibrate: [200, 100, 200, 100, 200, 100, 200], 
                data: { url: targetUrl }
            };

            return self.registration.showNotification(data.title, options);
        })
    );
});

// ¿Qué pasa cuando el usuario toca la notificación con el dedo?
self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    
    // Tratamos de enfocar una ventana existente si ya está abierta
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            const targetUrl = event.notification.data.url;

            for (let client of windowClients) {
                // Si hay una pestaña abierta de nuestra app, la enfocamos y navegamos
                if ('focus' in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }
            
            // Si estaba todo cerrado, abrimos una nueva ventana
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});