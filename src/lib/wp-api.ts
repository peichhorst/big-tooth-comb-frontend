import axios from 'axios';

const WP_BASE_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://btc.858webdesign.com";
const API_URL = `${WP_BASE_URL.replace(/\/$/, "")}/wp-json/wp/v2`;

export async function fetchPosts(limit = 5) {
  try {
    const response = await axios.get(`${API_URL}/posts?per_page=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

export async function fetchPostBySlug(slug: string) {
  if (!slug) return null;
  try {
    const response = await axios.get(`${API_URL}/posts?slug=${slug}`);
    return response.data?.[0] ?? null;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

export async function fetchPages(slug: string) {
  if (!slug) return null;
  try {
    const response = await axios.get(`${API_URL}/pages?slug=${slug}`);
    return response.data?.[0] ?? null; // Returns single page by slug
  } catch (error) {
    console.error('Error fetching page:', error);
    return null;
  }
}
