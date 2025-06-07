"use client";

import { cn } from "@/lib/utils";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState } from "react";
import type { CollapsibleSectionProps } from "../../types";

/**
 * CollapsibleSection Component
 *
 * A reusable collapsible section for organizing content.
 * Used for rule categories and other expandable content sections.
 */
export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  className,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("mx-auto border-b-2 border-slate-500", className)}>
      <div
        className="flex cursor-pointer flex-row justify-center gap-2 py-5 text-center font-varela text-2xl font-extrabold xs:text-3xl md:text-4xl"
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <div>{title}</div>
        <div className="self-center">
          {isOpen ? (
            <ChevronUpIcon className="self-center" />
          ) : (
            <ChevronDownIcon className="self-center" />
          )}
        </div>
      </div>
      <div className={cn("hidden pb-8", isOpen && "block")}>{children}</div>
    </div>
  );
}
