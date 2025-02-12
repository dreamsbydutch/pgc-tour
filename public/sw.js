// @ts-nocheck

self.addEventListener("install", (event) => {
  console.info("Service worker installed.");
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  console.info("Service worker activated.");
  event.waitUntil(self.clients.claim());
});

const sendDeliveryReportAction = () => {
  console.log("Web push delivered.");
};

self.addEventListener("push", function (event) {
  console.log("Push event received:", event);
  if (!event.data) {
    console.log("Push event has no data.");
    return;
  }

  const payload = event.data.json();
  console.log("Push event payload:", payload);
  const { body, icon, image, badge, url, title } = payload;
  const notificationTitle = title ?? "Hi";
  const notificationOptions = {
    body,
    icon,
    image,
    data: {
      url,
    },
    badge,
  };

  event.waitUntil(
    self.registration
      .showNotification(notificationTitle, notificationOptions)
      .then(() => {
        console.log("Notification displayed.");
        sendDeliveryReportAction();
      })
      .catch((error) => {
        console.error("Error displaying notification:", error);
      }),
  );
});

self.addEventListener("notificationclick", function (event) {
  console.log("Notification click event:", event);
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
