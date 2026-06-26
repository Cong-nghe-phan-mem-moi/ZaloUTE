/**
 * Convert relative image URL to absolute URL
 * Server returns URLs like /uploads/filename, but axios baseURL is /api
 * So we need to add the full origin path
 */
const GOOGLE_DRIVE_THUMBNAIL_SIZE = "w1000";

const getNormalizedUrl = (url) => {
  const value = String(url || "").trim();
  const absoluteUrlMatch = value.match(/https?:\/\/\S+/);
  return absoluteUrlMatch ? absoluteUrlMatch[0] : value;
};

const getGoogleDriveFileId = (url) => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "lh3.googleusercontent.com") {
      const fileMatch = parsed.pathname.match(/\/d\/([^/=]+)/);
      return fileMatch?.[1] || null;
    }

    if (parsed.hostname !== "drive.google.com") return null;

    const queryId = parsed.searchParams.get("id");
    if (queryId) return queryId;

    const fileMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/);
    if (fileMatch) return fileMatch[1];

    return null;
  } catch {
    return null;
  }
};

export const getImageFallbackUrl = (url) => {
  const normalizedUrl = getNormalizedUrl(url);
  const googleDriveFileId = getGoogleDriveFileId(normalizedUrl);

  if (!googleDriveFileId) return null;

  return `https://lh3.googleusercontent.com/d/${googleDriveFileId}=${GOOGLE_DRIVE_THUMBNAIL_SIZE}`;
};

export const getImageUrl = (url) => {
  if (!url) return "/default-avatar.svg";

  const normalizedUrl = getNormalizedUrl(url);

  // If it's already absolute URL, return as is
  if (normalizedUrl.startsWith("http://") || normalizedUrl.startsWith("https://")) {
    const googleDriveFileId = getGoogleDriveFileId(normalizedUrl);
    if (googleDriveFileId) {
      return `/api/chats/images/${encodeURIComponent(googleDriveFileId)}`;
    }

    return normalizedUrl;
  }

  // If it's /uploads path, add base URL
  if (normalizedUrl.startsWith("/uploads")) {
    return normalizedUrl;
  }

  // Otherwise assume it's an uploads path
  if (!normalizedUrl.startsWith("/")) {
    return `/uploads/${normalizedUrl}`;
  }

  return normalizedUrl;
};

export default getImageUrl;
