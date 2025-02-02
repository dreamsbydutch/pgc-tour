"use client";

import { useState } from "react";
import { Button } from "../../_components/ui/button";
import { useRouter } from "next/navigation";

export default function CreateGroupsButton() {
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
