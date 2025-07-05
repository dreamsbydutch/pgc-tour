import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

/**
 * Minimal Reusable Rulebook Components
 *
 * Simple, clean components that can be reused across the application
 * for displaying collapsible sections and rule lists.
 */

// Types
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
      <p className="font-medium text-gray-800">{rule.ruleText}</p>
      {rule.details && rule.details.length > 0 && (
        <ul className="ml-4 mt-2 space-y-1">
          {rule.details.map((detail, index) => (
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
      {items.map((item, index) => (
        <li key={index} className="flex items-start">
          <span
            className={`mr-2 mt-1 h-2 w-2 flex-shrink-0 rounded-full ${bulletColor}`}
          ></span>
          <span className="text-gray-700">{item}</span>
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
