// Escuchamos el evento 'push' que manda nuestro servidor Spring Boot
self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body,
            icon: '/logo.png', // ¡Usamos el logo que configuraste recién!
            badge: '/logo.png',
            vibrate: [200, 100, 200, 100, 200, 100, 200], // Vibración copada
            data: { url: '/canchita' } // A dónde ir si tocan la notificación
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// ¿Qué pasa cuando el usuario toca la notificación con el dedo?
self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    
    // Abrimos la app en la canchita
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});