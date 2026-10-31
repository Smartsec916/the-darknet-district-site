import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Improved error handling when response is not OK
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    } catch (error) {
      // If parsing the response text fails, still throw a meaningful error
      console.error("Error parsing response text:", error);
      throw new Error(`${res.status}: ${res.statusText || 'Unknown error'}`);
    }
  }
}

// Enhanced API request with better error handling
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Log the error for debugging
    console.error(`API Request failed for ${method} ${url}:`, error);
    throw error; // Re-throw for query error handling
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

// Enhanced query function with better error handling
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // Log the error for debugging
      console.error(`Query failed for ${queryKey[0]}:`, error);
      throw error; // Re-throw for react-query error handling
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
