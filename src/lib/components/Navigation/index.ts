/**
 * Navigation Components Index
 *
 * Centralized exports for all navigation components
 */

// Main navigation provider
export { NavigationProvider } from "./main";

// Core navigation components
export { NavigationContainer } from "./components/NavigationContainer";
export { NavItem } from "./components/NavItem";
export { UserAccountNav } from "./components/UserAccountNav";
export { UserAccountNavMenu } from "./components/UserAccountNavMenu";
export { SignInButton } from "./components/SignInButton";

// Error handling components
export {
  ErrorBoundary,
  useErrorBoundary,
} from "./components/EnhancedErrorBoundary";

// Hooks
export { useNavigationData } from "./hooks/useNavigationData";
export { useNavigationPerformance } from "./hooks/useNavigationPerformance";

// Utilities and types
export * from "./utils";
export type * from "./utils/types";
