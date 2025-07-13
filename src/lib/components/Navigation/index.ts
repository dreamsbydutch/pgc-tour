/**
 * Navigation - Single point of entry for navigation functionality
 */

// Main components - primary exports
export { NavigationContainer } from "./components/NavigationContainer";
export { NavigationProvider } from "./components/NavigationProvider";

// Backward compatibility - export as NavBar
export { NavigationContainer as NavBar } from "./components/NavigationContainer";

// Individual components for advanced usage
export { NavItem } from "./components/NavItem";
export { UserAccountNav } from "./components/UserAccountNav";
export { UserAccountNavMenu } from "./components/UserAccountNavMenu";
export { SignInButton } from "./components/SignInButton";
export { MemberUpdateForm } from "./components/MemberUpdateForm";

// Hooks
export { useNavigationData } from "./hooks/useNavigationData";

// Types for consumers
export type {
  NavigationUser,
  NavigationMember,
  NavigationTourCard,
  NavigationChampion,
  NavItem as NavItemType,
  NavigationData,
  NavigationProviderProps,
  NavigationContainerProps,
} from "./types";

// Utils that might be needed externally
export { NAV_ITEMS, isNavItemActive, formatUserDisplayName } from "./utils";
