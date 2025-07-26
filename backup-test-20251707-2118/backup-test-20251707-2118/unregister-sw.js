// Script à copier-coller dans la console DevTools
// pour désinstaller le Service Worker

navigator.serviceWorker.getRegistrations().then(function(registrations) {
  console.log('🔍 Service Workers trouvés:', registrations.length);
  for(let registration of registrations) {
    console.log('🗑️ Désinstallation de:', registration.scope);
    registration.unregister();
  }
  console.log('✅ Tous les Service Workers désinstallés !');
  console.log('🔄 Rechargez la page maintenant (F5)');
});
