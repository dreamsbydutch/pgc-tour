/**
 * @fileoverview String manipulation and text utilities
 * Provides functions for string formatting, cleaning, and manipulation
 */

/**
 * Converts a string to a URL-friendly slug
 * @param input - String to slugify
 * @returns URL-friendly slug
 * @example
 * slugify("Hello World!") // "hello-world"
 * slugify("Special@Characters#123") // "specialcharacters123"
 */
export function slugify(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, "") // Remove non-alphanumeric characters except hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Formats a name for display purposes
 * @param name - Full name string
 * @param type - Display type ("display" for "F. Last" or "full" for "First Last")
 * @returns Formatted name
 * @example
 * formatName("john doe", "display") // "J. Doe"
 * formatName("john doe", "full") // "John Doe"
 */
export function formatName(name: string, type: "display" | "full"): string {
  if (typeof name !== "string" || !name.trim()) {
    return "";
  }

  const splitName = name.trim().split(/\s+/);

  if (splitName.length === 0) {
    return "";
  }

  const firstName = splitName[0];
  const lastName = splitName.slice(1).join(" ");

  if (!firstName) {
    return "";
  }

  // Capitalize first letter of each part
  const capitalizedFirst =
    firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  const capitalizedLast = lastName
    ? lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase()
    : "";

  if (type === "full") {
    return lastName
      ? `${capitalizedFirst} ${capitalizedLast}`
      : capitalizedFirst;
  } else {
    return lastName
      ? `${capitalizedFirst.charAt(0)}. ${capitalizedLast}`
      : capitalizedFirst;
  }
}

/**
 * Capitalizes the first letter of a string
 * @param str - String to capitalize
 * @returns String with first letter capitalized
 * @example
 * capitalize("hello world") // "Hello world"
 */
export function capitalize(str: string): string {
  if (typeof str !== "string" || str.length === 0) {
    return "";
  }

  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Capitalizes the first letter of each word
 * @param str - String to title case
 * @returns String in title case
 * @example
 * titleCase("hello world") // "Hello World"
 */
export function titleCase(str: string): string {
  if (typeof str !== "string") {
    return "";
  }

  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Truncates a string to a specified length with ellipsis
 * @param str - String to truncate
 * @param maxLength - Maximum length before truncation
 * @param suffix - Suffix to add when truncated (default: "...")
 * @returns Truncated string
 * @example
 * truncate("This is a long string", 10) // "This is a..."
 */
export function truncate(
  str: string,
  maxLength: number,
  suffix = "...",
): string {
  if (typeof str !== "string") {
    return "";
  }

  if (str.length <= maxLength) {
    return str;
  }

  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Removes extra whitespace and normalizes spacing
 * @param str - String to clean
 * @returns Cleaned string
 * @example
 * cleanWhitespace("  hello    world  ") // "hello world"
 */
export function cleanWhitespace(str: string): string {
  if (typeof str !== "string") {
    return "";
  }

  return str.trim().replace(/\s+/g, " ");
}

/**
 * Extracts initials from a name
 * @param name - Full name
 * @param maxInitials - Maximum number of initials to return
 * @returns Initials string
 * @example
 * getInitials("John Michael Doe") // "JMD"
 * getInitials("John Michael Doe", 2) // "JD"
 */
export function getInitials(name: string, maxInitials?: number): string {
  if (typeof name !== "string" || !name.trim()) {
    return "";
  }

  const words = name.trim().split(/\s+/);
  let initials = words
    .map((word) => word.charAt(0).toUpperCase())
    .filter((initial) => /[A-Z]/.test(initial));

  if (maxInitials && maxInitials > 0) {
    initials = initials.slice(0, maxInitials);
  }

  return initials.join("");
}

/**
 * Converts camelCase to kebab-case
 * @param str - CamelCase string
 * @returns kebab-case string
 * @example
 * camelToKebab("helloWorld") // "hello-world"
 */
export function camelToKebab(str: string): string {
  if (typeof str !== "string") {
    return "";
  }

  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Converts kebab-case to camelCase
 * @param str - kebab-case string
 * @returns camelCase string
 * @example
 * kebabToCamel("hello-world") // "helloWorld"
 */
export function kebabToCamel(str: string): string {
  if (typeof str !== "string") {
    return "";
  }

  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Checks if a string contains only alphanumeric characters
 * @param str - String to check
 * @returns True if alphanumeric only
 * @example
 * isAlphanumeric("abc123") // true
 * isAlphanumeric("abc-123") // false
 */
export function isAlphanumeric(str: string): boolean {
  if (typeof str !== "string") {
    return false;
  }

  return /^[a-zA-Z0-9]+$/.test(str);
}

/**
 * Pluralizes a word based on count
 * @param word - Word to pluralize
 * @param count - Count to determine pluralization
 * @param pluralForm - Custom plural form (optional)
 * @returns Pluralized word
 * @example
 * pluralize("item", 1) // "item"
 * pluralize("item", 2) // "items"
 * pluralize("child", 2, "children") // "children"
 */
export function pluralize(
  word: string,
  count: number,
  pluralForm?: string,
): string {
  if (typeof word !== "string") {
    return "";
  }

  if (count === 1) {
    return word;
  }

  if (pluralForm) {
    return pluralForm;
  }

  // Simple pluralization rules
  if (
    word.endsWith("y") &&
    word.length > 1 &&
    !isVowel(word[word.length - 2]!)
  ) {
    return word.slice(0, -1) + "ies";
  }

  if (
    word.endsWith("s") ||
    word.endsWith("sh") ||
    word.endsWith("ch") ||
    word.endsWith("x") ||
    word.endsWith("z")
  ) {
    return word + "es";
  }

  return word + "s";
}

/**
 * Helper function to check if a character is a vowel
 * @param char - Character to check
 * @returns True if vowel
 */
function isVowel(char: string): boolean {
  return /[aeiouAEIOU]/.test(char);
}

/**
 * Escapes HTML special characters
 * @param str - String to escape
 * @returns HTML-escaped string
 * @example
 * escapeHtml("<script>alert('xss')</script>") // "&lt;script&gt;alert('xss')&lt;/script&gt;"
 */
export function escapeHtml(str: string): string {
  if (typeof str !== "string") {
    return "";
  }

  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return str.replace(/[&<>"']/g, (match) => htmlEscapes[match] || match);
}

/**
 * Generates a random string of specified length
 * @param length - Length of string to generate
 * @param charset - Character set to use (default: alphanumeric)
 * @returns Random string
 * @example
 * randomString(8) // "a7bC9xYz"
 */
export function randomString(
  length: number,
  charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}
