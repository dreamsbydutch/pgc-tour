"use client";
import { useEffect, useState } from "react";
import {
  checkPermissionStateAndAct,
  notificationUnsupported,
  registerAndSubscribe,
  sendWebPush,
} from "../_components/Push";

export default function Home() {
  const [unsupported, setUnsupported] = useState<boolean>(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    const isUnsupported = notificationUnsupported();
    setUnsupported(isUnsupported);
    if (isUnsupported) {
      return;
    }
    checkPermissionStateAndAct(setSubscription);
  }, []);

  return (
    <main>
      <div className="">
        <button
          disabled={unsupported}
          onClick={() => registerAndSubscribe(setSubscription)}
          className={subscription ? "" : ""}
        >
          {unsupported
            ? "Notification Unsupported"
            : subscription
              ? "Notification allowed"
              : "Allow notification"}
        </button>
        {subscription ? (
          <>
            <input
              placeholder={"Type push message ..."}
              style={{ marginTop: "5rem" }}
              value={message ?? ""}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button onClick={() => sendWebPush(message)}>Test Web Push</button>
          </>
        ) : null}
        <div className="">
          <span>Push subscription:</span>
        </div>
        <code className="">
          {subscription
            ? JSON.stringify(subscription?.toJSON(), undefined, 2)
            : "There is no subscription"}
        </code>
      </div>
    </main>
  );
}
