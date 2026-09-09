const CACHE_NAME = "nova-dental-lab-cache-v2";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// عند التثبيت: تخزين كل ملفات التطبيق نسخة كاملة على الجهاز
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// تفعيل النسخة الجديدة وحذف أي نسخ قديمة من الكاش فورًا
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// صفحة التطبيق نفسها (index.html): نحاول الإنترنت أولًا للحصول على آخر تحديث،
// ولو مفيش إنترنت نرجع للنسخة المخزنة (أوفلاين). هذا يمنع تكرار مشكلة "نسخة قديمة عالقة".
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const isPage = event.request.mode === "navigate" || event.request.url.endsWith("index.html") || event.request.url.endsWith("/nova-dental/");
  if (isPage) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  // باقي الملفات (أيقونات، manifest): كاش أولًا لأنها نادرًا ما تتغير
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request)
          .then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            return response;
          })
          .catch(() => cached)
      );
    })
  );
});
