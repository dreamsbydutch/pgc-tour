"use client";

import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { isNonEmptyArray } from "@tanstack/react-form";
import { capitalize } from "@/lib/utils/main";

/**
 * Minimal Reusable Rulebook Components
 *
 * Simple, clean components that can be reused across the application
 * for displaying collapsible sections and rule lists.
 */

// Types
// If you have a Prisma Rule or RuleCategory type, use Pick/Omit for minimal types
// Otherwise, keep the explicit types as is (since these are not from Prisma)

// export type RuleItemType = Pick<Rule, "ruleText" | "details">;
// export type RuleCategoryType = Pick<RuleCategory, "category"> & { rules: RuleItemType[]; picture?: { url: string; altText: string } };

// If no Prisma types exist, keep the explicit types
export interface RuleItemType {
  ruleText: string;
  details?: string[];
}

export interface RuleCategoryType {
  category: string;
  rules: RuleItemType[];
  picture?: {
    url: string;
    altText: string;
  };
}

// Collapsible Section Component
interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function CollapsibleSection({
  title,
  children,
  isOpen,
  onToggle,
  className = "",
}: CollapsibleSectionProps) {
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
        aria-expanded={isOpen}
      >
        <h2 className="text-xl font-semibold">{title}</h2>
        {isOpen ? (
          <ChevronDown className="h-5 w-5" />
        ) : (
          <ChevronRight className="h-5 w-5" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// Rule Display Component
interface RuleDisplayProps {
  rule: RuleItemType;
  className?: string;
}

export function RuleDisplay({ rule, className = "" }: RuleDisplayProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <p className="font-medium text-gray-800">{capitalize(rule.ruleText)}</p>
      {isNonEmptyArray(rule.details) && (
        <ul className="ml-4 mt-2 space-y-1">
          {rule.details?.map((detail, index) => (
            <li key={index} className="flex items-start">
              <span className="mr-2 mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></span>
              <span className="text-sm text-gray-600">{detail}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Bullet List Component (generic)
interface BulletListProps {
  items: string[];
  bulletColor?: string;
  className?: string;
}

export function BulletList({
  items,
  bulletColor = "bg-blue-500",
  className = "",
}: BulletListProps) {
  return (
    <ul className={`space-y-2 ${className}`}>
      {isNonEmptyArray(items) &&
        items.map((item, index) => (
          <li key={index} className="flex items-start">
            <span
              className={`mr-2 mt-1 h-2 w-2 flex-shrink-0 rounded-full ${bulletColor}`}
            ></span>
            <span className="text-gray-700">{capitalize(item)}</span>
          </li>
        ))}
    </ul>
  );
}

// Full Category Section Component
interface CategorySectionProps {
  category: RuleCategoryType;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function CategorySection({
  category,
  isOpen,
  onToggle,
  className = "",
}: CategorySectionProps) {
  return (
    <CollapsibleSection
      title={category.category}
      isOpen={isOpen}
      onToggle={onToggle}
      className={className}
    >
      <div className="space-y-3">
        {category.rules.map((rule, index) => (
          <RuleDisplay key={index} rule={rule} />
        ))}
      </div>
    </CollapsibleSection>
  );
}

// Hook for managing multiple collapsible sections
export function useCollapsibleSections(initialOpen: string[] = []) {
  const [openSections, setOpenSections] = React.useState<Set<string>>(
    new Set(initialOpen),
  );

  const toggleSection = (sectionId: string) => {
    const newOpenSections = new Set(openSections);
    if (newOpenSections.has(sectionId)) {
      newOpenSections.delete(sectionId);
    } else {
      newOpenSections.add(sectionId);
    }
    setOpenSections(newOpenSections);
  };

  const openAll = () => setOpenSections(new Set(["all"]));
  const closeAll = () => setOpenSections(new Set());

  return {
    openSections,
    toggleSection,
    isOpen: (sectionId: string) =>
      openSections.has(sectionId) || openSections.has("all"),
    openAll,
    closeAll,
  };
}
