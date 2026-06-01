const CACHE_NAME = 'thamarat-v9-cache';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// مرحلة التثبيت وحفظ الملفات في الذاكرة
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting()) // إجبار المتصفح على تشغيل النسخة الجديدة فوراً
  );
});

// تفعيل الكاش وحذف الكاش القديم تلقائياً
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// تشغيل التطبيق أوفلاين بنسبة 100%
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // لو الملف متسجل أوفلاين افتحه فوراً
      }
      return fetch(e.request).catch(() => {
        // لو مفيش إنترنت والملف مش في الكاش، ما تخليش التطبيق يبوظ
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
