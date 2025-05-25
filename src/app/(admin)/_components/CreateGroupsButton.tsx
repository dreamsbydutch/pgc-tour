"use client";

import { useState } from "react";
import { Button } from "../../_components/ui/button";
import { useRouter } from "next/navigation";
import LoadingSpinner from "../../_components/LoadingSpinner";

export function CreateGroupsButton() {
  const [isClicked, setIsClicked] = useState(false);
  const [effect, setEffect] = useState(false);
  const router = useRouter();

  const handleButtonClick = () => {
    setIsClicked(true);
    router.push("/cron/create-groups");
  };

  return (
    <div>
      <Button
        className={`${effect && "animate-toggleClick"} h-[2rem]`}
        onAnimationEnd={() => setEffect(false)}
        onClick={handleButtonClick}
        disabled={isClicked}
      >
        {isClicked ? <LoadingSpinner /> : "Create Groups"}
      </Button>
    </div>
  );
}
export function UpdateGolfersButton() {
  const [isClicked, setIsClicked] = useState(false);
  const [effect, setEffect] = useState(false);
  const router = useRouter();

  const handleButtonClick = () => {
    setIsClicked(true);
    router.push("/cron/update-golfers");
  };

  return (
    <div>
      <Button
        className={`${effect && "animate-toggleClick"} h-[2rem]`}
        onAnimationEnd={() => setEffect(false)}
        onClick={handleButtonClick}
        disabled={isClicked}
      >
        {isClicked ? <LoadingSpinner /> : "Update Golfers"}
      </Button>
    </div>
  );
}
export function UpdateTeamsButton() {
  const [isClicked, setIsClicked] = useState(false);
  const [effect, setEffect] = useState(false);
  const router = useRouter();

  const handleButtonClick = () => {
    setIsClicked(true);
    router.push("/cron/update-teams");
  };

  return (
    <div>
      <Button
        className={`${effect && "animate-toggleClick"} h-[2rem]`}
        onAnimationEnd={() => setEffect(false)}
        onClick={handleButtonClick}
        disabled={isClicked}
      >
        {isClicked ? <LoadingSpinner /> : "Update Teams"}
      </Button>
    </div>
  );
}

export function EmailListLinkButton() {
  const [isClicked, setIsClicked] = useState(false);
  const [effect, setEffect] = useState(false);
  const router = useRouter();

  const handleButtonClick = () => {
    setIsClicked(true);
    router.push("/admin/email-list");
  };

  return (
    <div>
      <Button
        className={`${effect && "animate-toggleClick"} h-[2rem]`}
        onAnimationEnd={() => setEffect(false)}
        onClick={handleButtonClick}
        disabled={isClicked}
      >
        {isClicked ? <LoadingSpinner /> : "Email List"}
      </Button>
    </div>
  );
}
