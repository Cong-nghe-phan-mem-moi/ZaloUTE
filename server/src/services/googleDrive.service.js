const fs = require("fs");
const { google } = require("googleapis");

const DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive.file"];

const getDriveClient = () => {
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
  });

  const fileId = created.data.id;

  await drive.permissions.create({
    fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  return {
    fileId,
    name: created.data.name,
    mimeType: created.data.mimeType,
    url: `https://drive.google.com/uc?export=view&id=${fileId}`,
    webViewLink: created.data.webViewLink,
  };
};

module.exports = {
  uploadPublicImage,
};
