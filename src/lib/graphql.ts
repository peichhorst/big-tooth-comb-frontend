// lib/graphql.ts
const ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "https://btc.858webdesign.com/graphql";
const MAX_RETRIES = 2;
const RETRY_STATUSES = [429, 500, 502, 503, 504];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const gqlFetch = async (query: string, variables = {}) => {
  if (!query.trim()) {
    throw new Error("Empty query - add a query string");
  }

  const body = JSON.stringify({ query, variables });

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(ENDPOINT, {
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
