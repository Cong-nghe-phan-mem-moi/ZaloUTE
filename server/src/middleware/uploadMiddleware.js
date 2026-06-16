const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const imageMimes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const videoMimes = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
];

const createFileFilter = (allowedMimes) => (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter: createFileFilter([...imageMimes, ...videoMimes]),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

const imageUpload = multer({
  storage,
  fileFilter: createFileFilter(imageMimes),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

upload.imageUpload = imageUpload;
upload.postMedia = [
  upload.fields([
    { name: 'media', maxCount: 10 },
    { name: 'files', maxCount: 10 },
    { name: 'images', maxCount: 10 },
    { name: 'image', maxCount: 10 },
    { name: 'videos', maxCount: 10 },
    { name: 'video', maxCount: 10 },
  ]),
  (req, res, next) => {
    if (req.files && !Array.isArray(req.files)) {
      req.files = Object.values(req.files).flat();
    }

    next();
  },
];
upload.storyMedia = [
  upload.fields([
    { name: 'media', maxCount: 1 },
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]),
  (req, res, next) => {
    if (req.files && !Array.isArray(req.files)) {
      req.files = Object.values(req.files).flat();
    }

    next();
  },
];
upload.handleUploadError = (err, req, res, next) => {
  if (!err) {
    return next();
  }

  if (err instanceof multer.MulterError) {
    const fieldMessage =
      err.code === 'LIMIT_UNEXPECTED_FILE' && err.field
        ? `Unexpected upload field "${err.field}". Use "media" for post files.`
        : err.message;

    return res.status(400).json({
      success: false,
      message: fieldMessage,
      field: err.field,
    });
  }

  return res.status(400).json({
    success: false,
    message: err.message || 'File upload failed',
  });
};

module.exports = upload;
