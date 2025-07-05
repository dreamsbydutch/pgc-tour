/**
 * @fileoverview External API utilities and data fetching
 * Provides functions for making API calls and handling external data sources
 */

/**
 * Data Golf API endpoints
 */
type DataGolfExports =
  | "field-updates"
  | "preds/get-dg-rankings"
  | "preds/in-play"
  | "preds/live-hole-stats"
  | "preds/live-tournament-stats"
  | "historical-raw-data/event-list";

/**
 * Fetches data from the Data Golf API
 * @param queryType - API endpoint to call
 * @param queryParameters - Query parameters to include
 * @returns Promise resolving to API response data
 * @example
 * const data = await fetchDataGolf("field-updates", { tournament_id: "123" });
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
      throw new Error(`HTTP error! status: ${request.status}`);
    }

    const data = await request.json();
    return data;
  } catch (error) {
    // Log critical DataGolf API failures for debugging
    console.error("DataGolf API Error:", {
      queryType,
      queryParameters,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
}

/**
 * Generic fetch wrapper with error handling and retries
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param retries - Number of retry attempts
 * @returns Promise resolving to response data
 * @example
 * const data = await fetchWithRetry("https://api.example.com/data", {}, 3);
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error as Error;

      if (i < retries) {
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, i) * 1000),
        );
      }
    }
  }

  // Log when all retries are exhausted
  console.error("Fetch failed after all retries:", {
    url,
    retries,
    error: lastError?.message,
  });

  throw lastError;
}

/**
 * POST request wrapper with type safety
 * @param url - URL to post to
 * @param data - Data to send
 * @param options - Additional fetch options
 * @returns Promise resolving to response data
 * @example
 * const result = await postData("/api/submit", { name: "John" });
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    throw error;
  }
}

/**
 * GET request wrapper with query parameters
 * @param url - Base URL
 * @param params - Query parameters
 * @param options - Additional fetch options
 * @returns Promise resolving to response data
 * @example
 * const data = await getData("/api/users", { page: 1, limit: 10 });
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    throw error;
  }
}

/**
 * PUT request wrapper
 * @param url - URL to put to
 * @param data - Data to send
 * @param options - Additional fetch options
 * @returns Promise resolving to response data
 * @example
 * const result = await putData("/api/user/123", { name: "Jane" });
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    throw error;
  }
}

/**
 * DELETE request wrapper
 * @param url - URL to delete
 * @param options - Additional fetch options
 * @returns Promise resolving to response data
 * @example
 * await deleteData("/api/user/123");
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Handle empty responses
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return (await response.json()) as T;
    } else {
      return {} as T;
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Checks if a URL is valid and reachable
 * @param url - URL to check
 * @param timeout - Timeout in milliseconds
 * @returns Promise resolving to true if URL is reachable
 * @example
 * const isReachable = await isUrlReachable("https://example.com");
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
 * Downloads a file from a URL
 * @param url - URL to download from
 * @param filename - Filename to save as
 * @returns Promise that resolves when download completes
 * @example
 * await downloadFile("https://example.com/file.pdf", "document.pdf");
 */
export async function downloadFile(
  url: string,
  filename: string,
): Promise<void> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
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
    throw error;
  }
}
