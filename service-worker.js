// キャッシュ名とキャッシュするファイル
const CACHE_NAME = 'time-recorder-v1';
const urlsToCache = [
  '/time-recorder-app/',
  '/time-recorder-app/index.html',
  '/time-recorder-app/static/js/main.js',
  '/time-recorder-app/static/css/main.css',
  '/time-recorder-app/manifest.json',
  '/time-recorder-app/logo192.png',
  '/time-recorder-app/logo512.png'
];

// インストール時にキャッシュを作成
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// フェッチリクエストの処理
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュが見つかった場合はそれを返す
        if (response) {
          return response;
        }
        // キャッシュがない場合はネットワークリクエストを行う
        return fetch(event.request)
          .then(response => {
            // リクエストが有効でない場合はそのまま返す
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 重要：レスポンスはストリームなので、キャッシュと返却に両方使うためにクローンする
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          });
      })
  );
});

// アクティブ化時に古いキャッシュを削除
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});