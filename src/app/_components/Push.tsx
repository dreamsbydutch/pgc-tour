const SERVICE_WORKER_FILE_PATH = "./sw.js";

export function notificationUnsupported(): boolean {
  let unsupported = false;
  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("showNotification" in ServiceWorkerRegistration.prototype)
  ) {
    unsupported = true;
  }
  return unsupported;
}

export function checkPermissionStateAndAct(
  onSubscribe: (subs: PushSubscription | null) => void,
): void {
  const state: NotificationPermission = Notification.permission;
  switch (state) {
    case "denied":
      break;
    case "granted":
      registerAndSubscribe(onSubscribe);
      break;
    case "default":
      break;
  }
}

async function subscribe(
  onSubscribe: (subs: PushSubscription | null) => void,
): Promise<void> {
  await navigator.serviceWorker.ready
    .then(async (registration: ServiceWorkerRegistration) => {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        return subscription.unsubscribe().then(() => {
          return registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          });
        });
      } else {
        return registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });
      }
    })
    .then((subscription: PushSubscription) => {
      console.info("Created subscription Object: ", subscription.toJSON());
      submitSubscription(subscription).then((_) => {
        onSubscribe(subscription);
      });
    })
    .catch((e) => {
      console.error("Failed to subscribe cause of: ", e);
    });
}

async function submitSubscription(
  subscription: PushSubscription,
): Promise<void> {
  const endpointUrl = "/api/web-push/subscription";
  const res = await fetch(endpointUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ subscription }),
  });
  if (res.ok) {
    //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result: { success: boolean } = await res.json();
    console.log(result);
  } else {
    console.error("Failed to submit subscription");
  }
}

export async function registerAndSubscribe(
  onSubscribe: (subs: PushSubscription | null) => void,
): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.register(
      SERVICE_WORKER_FILE_PATH,
    );
    console.log("Service worker registered with scope:", registration.scope);
    await subscribe(onSubscribe);
  } catch (e) {
    console.error("Failed to register service-worker: ", e);
  }
}

export async function sendWebPush(message: string | null): Promise<void> {
  const endPointUrl = "/api/web-push/send";
  const pushBody = {
    title: "Test Push",
    body: message ?? "This is a test push message",
    image: "/logo512.png",
    icon: "logo512.png",
    url: "https://www.pgctour.ca",
  };
  console.log("Sending push message:", pushBody);
  const res = await fetch(endPointUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pushBody),
  });
  if (res.ok) {
    //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result: { success: boolean } = await res.json();
    console.log("Push message sent:", result);
  } else {
    console.error("Failed to send web push");
  }
}
