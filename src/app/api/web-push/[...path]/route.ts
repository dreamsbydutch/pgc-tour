import webpush from "web-push";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
  memberId: string;
}

async function setSubscription(request: Request): Promise<Response> {
  const body: SetSubscriptionRequestBody = await request.json();
  const { subscription, memberId } = body;

  // Store the subscription in the database tied to a member
  await prisma.subscription.create({
    data: {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      memberId: memberId,
    },
  });

  console.log("Subscription set:", subscription);
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

  // Retrieve all subscriptions from the database
  const subscriptions = await prisma.subscription.findMany();

  // Send notifications to all subscriptions
  await Promise.all(
    subscriptions.map(async (sub) => {
      const subscription: webpush.PushSubscription = {
        endpoint: sub.endpoint,
        keys: sub.keys,
      };
      await webpush.sendNotification(subscription, pushPayload);
    }),
  );

  return new Response(
    JSON.stringify({ message: "Push sent to all subscribers." }),
    {},
  );
}

async function notFoundApi() {
  return new Response(JSON.stringify({ error: "Invalid endpoint" }), {
    headers: { "Content-Type": "application/json" },
    status: 404,
  });
}
