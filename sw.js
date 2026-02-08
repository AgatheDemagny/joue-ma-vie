self.addEventListener('install', e => {
  console.log('Service Worker installé');
});

self.addEventListener('fetch', e => {
  // On peut ajouter un cache plus tard si besoin
});
