const fs = require("fs");
const { google } = require("googleapis");

const DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive.file"];
const GOOGLE_DRIVE_FILE_ID_PATTERN = /^[a-zA-Z0-9_-]{10,}$/;

const getDriveClient = () => {
  const oauthClientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const oauthClientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const oauthRefreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  if (oauthClientId && oauthClientSecret && oauthRefreshToken) {
    const oauthClient = new google.auth.OAuth2(
      oauthClientId,
      oauthClientSecret,
    );
    oauthClient.setCredentials({ refresh_token: oauthRefreshToken });
    return google.drive({ version: "v3", auth: oauthClient });
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Google Drive credentials are not configured");
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: DRIVE_SCOPES,
  });

  return google.drive({ version: "v3", auth });
};

const uploadPublicImage = async (file) => {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!folderId) {
    throw new Error("GOOGLE_DRIVE_FOLDER_ID is not configured");
  }

  if (!file?.path) {
    throw new Error("Image file is required");
  }

  const drive = getDriveClient();
  const created = await drive.files.create({
    requestBody: {
      name: file.filename || file.originalname,
      parents: [folderId],
      mimeType: file.mimetype,
    },
    media: {
      mimeType: file.mimetype,
      body: fs.createReadStream(file.path),
    },
    fields: "id,name,mimeType,webViewLink",
    supportsAllDrives: true,
  });

  const fileId = created.data.id;

  await drive.permissions.create({
    fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
    supportsAllDrives: true,
  });

  return {
    fileId,
    name: created.data.name,
    mimeType: created.data.mimeType,
    url: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
    directUrl: `https://lh3.googleusercontent.com/d/${fileId}=w1000`,
    webViewLink: created.data.webViewLink,
  };
};

const fetchPublicImage = async (fileId) => {
  if (!GOOGLE_DRIVE_FILE_ID_PATTERN.test(String(fileId || ""))) {
    const error = new Error("Invalid Google Drive file id");
    error.statusCode = 400;
    throw error;
  }

  const urls = [
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
    `https://lh3.googleusercontent.com/d/${fileId}=w1000`,
  ];

  let lastError = null;

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        headers: {
          "User-Agent": "ZaloUTE/1.0",
        },
      });

      const contentType = response.headers.get("content-type") || "";
      if (response.ok && contentType.startsWith("image/")) {
        return response;
      }

      lastError = new Error(
        `Google Drive image request failed with ${response.status} ${contentType}`,
      );
    } catch (error) {
      lastError = error;
    }
  }

  const error = new Error(lastError?.message || "Unable to fetch Google Drive image");
  error.statusCode = 502;
  throw error;
};

module.exports = {
  fetchPublicImage,
  uploadPublicImage,
};
