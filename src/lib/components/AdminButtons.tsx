"use client";

import { useState, useCallback } from "react";
import { Button } from "@ui/index";
import { useRouter } from "next/navigation";
import {LoadingSpinner} from "@ui/index";

// Generic button for navigation with loading/effect
function NavActionButton({ label, to }: { label: string; to: string }) {
  const [isClicked, setIsClicked] = useState(false);
  const [effect, setEffect] = useState(false);
  const router = useRouter();

  const handleButtonClick = useCallback(() => {
    setIsClicked(true);
    router.push(to);
  }, [router, to]);

  return (
    <div>
      <Button
        className={`${effect ? "animate-toggleClick" : ""} h-[2rem]`}
        onAnimationEnd={() => setEffect(false)}
        onClick={handleButtonClick}
        disabled={isClicked}
      >
        {isClicked ? <LoadingSpinner /> : label}
      </Button>
    </div>
  );
}

export const CreateGroupsButton = () => (
  <NavActionButton label="Create Groups" to="/cron/create-groups" />
);

export const UpdateGolfersButton = () => (
  <NavActionButton label="Update Golfers" to="/cron/update-golfers" />
);

export const UpdateTeamsButton = () => (
  <NavActionButton label="Update Teams" to="/cron/update-teams" />
);

export const EmailListLinkButton = () => (
  <NavActionButton label="Email List" to="/admin/email-list" />
);

export const HistoryButton = () => (
  <NavActionButton label="History" to="/history" />
);
