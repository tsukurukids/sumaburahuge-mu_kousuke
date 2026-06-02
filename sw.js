const CACHE_NAME = 'brawl-game-v3';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './main.js',
  './manifest.json',
  './icon.svg'
];

// インストールされたときに、必要なファイルをスマホの中に保存するよ
self.addEventListener('install', (event) => {
  self.skipWaiting(); // 新しいサービスワーカーをすぐに有効にする
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('ファイルを保存中...');
      return cache.addAll(urlsToCache);
    })
  );
});

// 新しいサービスワーカーが有効になったら、古いキャッシュをきれいに削除するよ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('古いキャッシュを削除:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // 制御をすぐに移行
  );
});

// インターネットがないときは、保存してあるファイルを使ってゲームを動かすよ
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 保存されたものがあればそれを返し、なければインターネットから持ってくる
      return response || fetch(event.request);
    })
  );
});
