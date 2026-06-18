/**
 * Convert relative image URL to absolute URL
 * Server returns URLs like /uploads/filename, but axios baseURL is /api
 * So we need to add the full origin path
 */
export const getImageUrl = (url) => {
  if (!url) return "/default-avatar.png";

  // If it's already absolute URL, return as is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // If it's /uploads path, add base URL
  if (url.startsWith("/uploads")) {
    return url;
  }

  // Otherwise assume it's an uploads path
  if (!url.startsWith("/")) {
    return `/uploads/${url}`;
  }

  return url;
};

export default getImageUrl;
