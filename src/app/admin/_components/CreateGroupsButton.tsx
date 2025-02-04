"use client";

import { useState } from "react";
import { Button } from "../../_components/ui/button";
import { useRouter } from "next/navigation";

export function CreateGroupsButton() {
  const [effect, setEffect] = useState(false);
  const router = useRouter();

  const handleButtonClick = () => {
    router.push("/cron/create-groups");
  };

  return (
    <div>
      <Button
        className={`${effect && "animate-toggleClick"} h-[2rem]`}
        onAnimationEnd={() => setEffect(false)}
        onClick={handleButtonClick}
      >
        Create Groups
      </Button>
    </div>
  );
}
export function UpdateGolfersButton() {
  const [effect, setEffect] = useState(false);
  const router = useRouter();

  const handleButtonClick = () => {
    router.push("/cron/update-golfers");
  };

  return (
    <div>
      <Button
        className={`${effect && "animate-toggleClick"} h-[2rem]`}
        onAnimationEnd={() => setEffect(false)}
        onClick={handleButtonClick}
      >
        Update Golfers
      </Button>
    </div>
  );
}
export function UpdateTeamsButton() {
  const [effect, setEffect] = useState(false);
  const router = useRouter();

  const handleButtonClick = () => {
    router.push("/cron/update-teams");
  };

  return (
    <div>
      <Button
        className={`${effect && "animate-toggleClick"} h-[2rem]`}
        onAnimationEnd={() => setEffect(false)}
        onClick={handleButtonClick}
      >
        Update Teams
      </Button>
    </div>
  );
}
