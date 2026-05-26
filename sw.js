const CACHE_NAME = 'brawl-game-v1';
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
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('ファイルを保存中...');
      return cache.addAll(urlsToCache);
    })
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
