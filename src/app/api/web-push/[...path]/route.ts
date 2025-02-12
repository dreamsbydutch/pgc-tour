import webpush from "web-push";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.NEXT_PUBLIC_VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  throw new Error("VAPID keys are not defined");
}

webpush.setVapidDetails(
  "mailto:mail@example.com",
  vapidPublicKey,
  vapidPrivateKey,
);

let subscription: webpush.PushSubscription;

interface RequestWithUrl extends Request {
  url: string;
}

export async function POST(request: RequestWithUrl): Promise<Response> {
  const { pathname } = new URL(request.url);
  switch (pathname) {
    case "/api/web-push/subscription":
      return setSubscription(request);
    case "/api/web-push/send":
      return sendPush(request);
    default:
      return notFoundApi();
  }
}

interface SetSubscriptionRequestBody {
  subscription: webpush.PushSubscription;
}

async function setSubscription(request: Request): Promise<Response> {
  //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const body: SetSubscriptionRequestBody = await request.json();
  subscription = body.subscription;
  return new Response(JSON.stringify({ message: "Subscription set." }), {});
}

interface SendPushRequestBody {
  title: string;
  message: string;
}

async function sendPush(request: Request): Promise<Response> {
  console.log(subscription, "subs");
  //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const body: SendPushRequestBody = await request.json();
  const pushPayload = JSON.stringify(body);
  await webpush.sendNotification(subscription, pushPayload);
  return new Response(JSON.stringify({ message: "Push sent." }), {});
}

async function notFoundApi() {
  return new Response(JSON.stringify({ error: "Invalid endpoint" }), {
    headers: { "Content-Type": "application/json" },
    status: 404,
  });
}
