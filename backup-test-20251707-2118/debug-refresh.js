// 🔍 Script de debug pour identifier les rafraîchissements
// Lancer avec : node debug-refresh.js

let refreshCount = 0;
let navigationCount = 0;

// Intercepter les refreshs
const originalReload = location.reload;
location.reload = function() {
  refreshCount++;
  console.log(`🔄 REFRESH DETECTÉ #${refreshCount}`);
  console.trace('Call stack du refresh:');
  return originalReload.call(this);
};

// Intercepter les navigations
const originalPushState = history.pushState;
history.pushState = function() {
  navigationCount++;
  console.log(`🧭 NAVIGATION #${navigationCount}:`, arguments);
  return originalPushState.apply(this, arguments);
};

// Logger les événements React
if (window.React) {
  const originalCreateElement = React.createElement;
  React.createElement = function(type, props, ...children) {
    if (props && props.onNavigate) {
      console.log('⚛️ Composant avec navigation:', type);
    }
    return originalCreateElement.apply(this, arguments);
  };
}

// Surveiller les changements DOM
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      console.log('🌳 DOM modifié:', mutation.target);
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('🚀 Debug script activé - surveillant les refreshs...');
