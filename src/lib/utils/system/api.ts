/**
 * System API utilities
 * HTTP request wrappers, error handling, and external API integration
 */

/**
 * Data Golf API endpoints type definition
 */
export type DataGolfExports =
  | "field-updates"
  | "preds/get-dg-rankings"
  | "preds/in-play"
  | "preds/live-hole-stats"
  | "preds/live-tournament-stats"
  | "historical-raw-data/event-list";

/**
 * API error types for better error handling
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: Response,
  ) {
    super(message);
    this.name = "APIError";
  }
}

/**
 * Fetches data from the Data Golf API with proper error handling
 * Golf tournament app specific API integration
 */
export async function fetchDataGolf(
  queryType: DataGolfExports,
  queryParameters: Record<string, string> | null = null,
): Promise<unknown> {
  try {
    let fetchUrl = "";

    if (!queryParameters) {
      fetchUrl =
        process.env.EXTERNAL_DATA_API_URL +
        queryType +
        "?key=" +
        process.env.EXTERNAL_DATA_API_KEY;
    } else {
      const queryParametersString = Object.keys(queryParameters)
        .map((key) => `${key}=${queryParameters[key]}`)
        .join("&");

      fetchUrl =
        process.env.EXTERNAL_DATA_API_URL +
        queryType +
        "?" +
        queryParametersString +
        "&key=" +
        process.env.EXTERNAL_DATA_API_KEY;
    }

    const request = await fetch(fetchUrl);

    if (!request.ok) {
      throw new APIError(
        `HTTP error! status: ${request.status}`,
        request.status,
        request,
      );
    }

    const data = await request.json();
    return data;
  } catch (error) {
    console.error("fetchDataGolf: Error fetching data", {
      queryType,
      queryParameters,
      error,
    });
    throw error;
  }
}

/**
 * Generic fetch wrapper with exponential backoff retry logic
 * Essential for handling flaky network connections
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
): Promise<unknown> {
  let lastError: Error | null = null;

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new APIError(
          `HTTP error! status: ${response.status}`,
          response.status,
          response,
        );
      }

      return await response.json();
    } catch (error) {
      lastError = error as Error;

      if (i < retries) {
        // Exponential backoff: wait 1s, 2s, 4s, etc.
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, i) * 1000),
        );
      }
    }
  }

  throw lastError;
}

/**
 * Type-safe POST request wrapper
 * Handles JSON serialization and response parsing
 */
export async function postData<T = unknown>(
  url: string,
  data: unknown,
  options: Omit<RequestInit, "body" | "method"> = {},
): Promise<T> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    });

    if (!response.ok) {
      throw new APIError(
        `HTTP error! status: ${response.status}`,
        response.status,
        response,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error("postData: Error posting data", { url, data, error });
    throw error;
  }
}

/**
 * Type-safe GET request with query parameter handling
 * Automatically constructs query strings from objects
 */
export async function getData<T = unknown>(
  url: string,
  params: Record<string, string | number | boolean> = {},
  options: RequestInit = {},
): Promise<T> {
  try {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      searchParams.append(key, String(value));
    }

    const queryString = searchParams.toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new APIError(
        `HTTP error! status: ${response.status}`,
        response.status,
        response,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error("getData: Error getting data", { url, params, error });
    throw error;
  }
}

/**
 * Type-safe PUT request wrapper
 * For updating existing resources
 */
export async function putData<T = unknown>(
  url: string,
  data: unknown,
  options: Omit<RequestInit, "body" | "method"> = {},
): Promise<T> {
  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    });

    if (!response.ok) {
      throw new APIError(
        `HTTP error! status: ${response.status}`,
        response.status,
        response,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error("putData: Error putting data", { url, data, error });
    throw error;
  }
}

/**
 * DELETE request wrapper with empty response handling
 * Handles both JSON and empty responses gracefully
 */
export async function deleteData<T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new APIError(
        `HTTP error! status: ${response.status}`,
        response.status,
        response,
      );
    }

    // Handle empty responses gracefully
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return (await response.json()) as T;
    } else {
      return {} as T;
    }
  } catch (error) {
    console.error("deleteData: Error deleting data", { url, error });
    throw error;
  }
}

/**
 * Check URL reachability with timeout support
 * Useful for health checks and connection testing
 */
export async function isUrlReachable(
  url: string,
  timeout = 5000,
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Client-side file download utility
 * Creates temporary download link and triggers download
 */
export async function downloadFile(
  url: string,
  filename: string,
): Promise<void> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new APIError(
        `HTTP error! status: ${response.status}`,
        response.status,
        response,
      );
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error("downloadFile: Error downloading file", {
      url,
      filename,
      error,
    });
    throw error;
  }
}

/**
 * Build URL with query parameters from object
 * Utility for constructing URLs programmatically
 */
export function buildUrl(
  baseUrl: string,
  params: Record<string, string | number | boolean | undefined | null> = {},
): string {
  const url = new URL(baseUrl);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  }

  return url.toString();
}

/**
 * Parse response headers into a plain object
 * Useful for accessing custom headers and metadata
 */
export function parseResponseHeaders(
  response: Response,
): Record<string, string> {
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });
  return headers;
}
