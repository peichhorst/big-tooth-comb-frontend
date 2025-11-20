// lib/graphql.ts — FINAL VERSION (HostGator-proof, 2025)

// Use proxy when in browser (bypasses CORS completely)
// Fall back to direct endpoint only in SSR (server-to-server, no CORS)
const getEndpoint = () => {
  // When running in the browser → use Next.js proxy (no CORS)
  if (typeof window !== "undefined") {
    return "/api/graphql/proxy";
  }
  // When running on server (SSR) → direct to WP (no CORS needed)
  return process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "https://btc.858webdesign.com/graphql";
};

const MAX_RETRIES = 2;
const RETRY_STATUSES = [429, 500, 502, 503, 504];
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const gqlFetch = async (query: string, variables = {}) => {
  if (!query.trim()) {
    throw new Error("Empty query - add a query string");
  }

  const endpoint = getEndpoint();
  const body = JSON.stringify({ query, variables });

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      if (json.errors) {
        throw new Error(json.errors[0]?.message || "GraphQL error");
      }
      return json.data;
    }

    if (RETRY_STATUSES.includes(res.status) && attempt < MAX_RETRIES) {
      await sleep(500 * (attempt + 1));
      continue;
    }

    throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`);
  }
};