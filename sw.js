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

/* =======================================================
   ⚙️ نظام التذكير التلقائي الذكي والخلفي (حتى والتطبيق مقفل)
   ======================================================= */

// تشغيل فحص دوري بالتعاون مع نظام أندرويد في الخلفية
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-habit-check') {
    event.waitUntil(checkHabitsFromBackground());
  }
});

// استقبال طلبات الفحص من النظام أو التنبيهات المجدولة
async function checkHabitsFromBackground() {
  const currentHour = new Date().getHours();
  
  // مواعيد التذكير الـ 3 الثابتة (الساعة 12 ظهراً، 5 مغرباً، 9 مساءً)
  const notificationTimes = [12, 17, 21]; 

  if (notificationTimes.includes(currentHour)) {
    // إرسال إشعار التذكير اللطيف للمستخدم وهو خارج البرنامج
    self.registration.showNotification("تذكير ثَمَرَة 🌱", {
      body: "يا بطل، ميعاد مراجعة ثمارك الإيمانية جه.. لا تنسى قطفها اليوم!",
      icon: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/png/solid/seedling.png",
      vibrate: [200, 100, 200],
      badge: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/png/solid/seedling.png",
      tag: "thamarat-remind-tag" // عشان الإشعارات المكررة متتراكمش فوق بعضها وتزعج المستخدم
    });
  }
}

// فتح التطبيق فوراً عند ضغط المستخدم على الإشعار
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // قفل الإشعار
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus(); // لو التطبيق مفتوح في الخلفية يفتحه في وشه
      }
      return clients.openWindow('./'); // لو مقفول تماماً يشغله من جديد
    })
  );
});
