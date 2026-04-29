
// Core dependencies and middleware imports
import express from 'express';
import cookieParser from 'cookie-parser'; // For parsing cookies (used for CSRF and auth)
import csurf from 'csurf'; // CSRF protection middleware
import cors from 'cors'; // Cross-Origin Resource Sharing
import multer from 'multer'; // File upload middleware
import path, { dirname, extname, join } from 'path';
import fs from 'fs/promises'; // File system promises API
import crypto from 'crypto'; // For generating random file names
import { fileURLToPath } from 'url';
import prisma from '../prismaClient.js'; // Prisma ORM client
import authMiddleware from '../middleware/authMiddleware.js'; // Custom authentication middleware


// Initialize Express app
const app = express();

// Parse cookies for CSRF and authentication
app.use(cookieParser());

// Enable CSRF protection for all routes
app.use(csurf({ cookie: true }));

// Endpoint to provide CSRF token to frontend
app.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// ...existing code...

// Server port and file path setup
const PORT = process.env.FILEVIEWER_PORT || 5004;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Storage directories for uploaded files and metadata
const storageRoot = join(__dirname, '../../storage');
const uploadDirectory = join(storageRoot, 'uploads');
const dataDirectory = join(storageRoot, 'data');
const metadataFilePath = join(dataDirectory, 'files.json');

// Allowed CORS origins (localhost for dev)
const allowedOrigins = [/^http:\/\/localhost:\d+$/];

// Allowed MIME types for file uploads
const allowedTypes = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
  'video/mp4', 'video/quicktime',
]);


// Enable CORS for allowed origins
app.use(cors({
  origin: (origin, callback) => {
    // Allow all localhost ports
    if (!origin || allowedOrigins.some(pattern => pattern.test(origin))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));


// Ensure storage directories and metadata file exist
async function ensureStorage() {
  await fs.mkdir(uploadDirectory, { recursive: true });
  await fs.mkdir(dataDirectory, { recursive: true });
  try {
    await fs.access(metadataFilePath);
  } catch {
    await fs.writeFile(metadataFilePath, '[]', 'utf8');
  }
}




// Convert a file record to a public-facing object (for API responses)
function toPublicRecord(req, record) {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return {
    id: record.id,
    name: record.name,
    size: record.size,
    type: record.type,
    category: record.category,
    note: record.note,
    uploadDate: record.uploadDate,
    uploadTimestamp: record.uploadTimestamp,
    contentUrl: `${baseUrl}/files/${record.id}/content`,
    downloadUrl: `${baseUrl}/files/${record.id}/download`,
  };
}


// Multer storage configuration for file uploads
const storage = multer.diskStorage({
  // Ensure storage exists and set upload directory
  destination: async (req, file, cb) => {
    try {
      await ensureStorage();
      cb(null, uploadDirectory);
    } catch (error) {
      cb(error);
    }
  },
  // Generate a unique filename for each upload
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${crypto.randomUUID()}${extname(file.originalname)}`);
  },
});


// Multer middleware for handling file uploads
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.has(file.mimetype)) {
      cb(new Error('Unsupported file type.'));
      return;
    }
    cb(null, true);
  },
});


// ...existing code...


// All file routes below require authentication
app.use(authMiddleware);

// Get file content (requires authentication and access control)
app.get('/files/:id/content', async (req, res) => {
  try {
    const file = await prisma.file.findUnique({ where: { id: Number(req.params.id) } });
    if (!file) {
      await auditLog(req.userId, 'file_not_found', 'unknown', Number(req.params.id));
      return res.status(404).json({ message: 'File not found.' });
    }
    const role = req.user.role;
    let allowed = false;
    if (role === 'ADMIN') {
      allowed = true;
    } else if (role === 'CAREGIVER') {
      const caregiver = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { assignedPatients: true }
      });
      const patientIds = caregiver.assignedPatients.map(p => p.id);
      allowed = patientIds.includes(file.uploaderId);
    } else {
      allowed = file.uploaderId === req.user.id;
    }
    if (!allowed) {
      await auditLog(req.userId, 'access_denied', file.name, file.id);
      return res.status(403).json({ message: 'Access denied.' });
    }
    await auditLog(req.userId, 'download_content', file.name, file.id);
    res.type(file.type);
    res.sendFile(path.resolve(file.path));
  } catch {
    res.status(500).json({ message: 'Unable to load file.' });
  }
});

// Download file (requires authentication and access control)
app.get('/files/:id/download', async (req, res) => {
  try {
    const file = await prisma.file.findUnique({ where: { id: Number(req.params.id) } });
    if (!file) {
      await auditLog(req.userId, 'file_not_found', 'unknown', Number(req.params.id));
      return res.status(404).json({ message: 'File not found.' });
    }
    const role = req.user.role;
    let allowed = false;
    if (role === 'ADMIN') {
      allowed = true;
    } else if (role === 'CAREGIVER') {
      const caregiver = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { assignedPatients: true }
      });
      const patientIds = caregiver.assignedPatients.map(p => p.id);
      allowed = patientIds.includes(file.uploaderId);
    } else {
      allowed = file.uploaderId === req.user.id;
    }
    if (!allowed) {
      await auditLog(req.userId, 'access_denied', file.name, file.id);
      return res.status(403).json({ message: 'Access denied.' });
    }
    await auditLog(req.userId, 'download', file.name, file.id);
    res.download(path.resolve(file.path), file.name);
  } catch {
    res.status(500).json({ message: 'Unable to download file.' });
  }
});

// Write an audit log entry to the database
async function auditLog(userId, action, fileName, fileId) {
  try {
    const data = {
      userId,
      action
    };
    // Only include fileId if it is a valid number
    if (typeof fileId === 'number' && !isNaN(fileId)) {
      data.fileId = fileId;
    }
    await prisma.auditLog.create({ data });
  } catch (e) {
    console.error('Audit log error:', e.message);
  }
}

// List files available to the user (role-based)
app.get('/files', async (req, res) => {
  try {
    const role = req.user.role;
    let files = [];
    if (role === 'ADMIN') {
      files = await prisma.file.findMany({
        orderBy: { uploadDate: 'desc' },
        include: { uploader: true }
      });
    } else if (role === 'CAREGIVER') {
      // Get IDs of assigned patients
      const caregiver = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { assignedPatients: true }
      });
      const patientIds = caregiver.assignedPatients.map(p => p.id);
      files = await prisma.file.findMany({
        where: { uploaderId: { in: patientIds } },
        orderBy: { uploadDate: 'desc' },
        include: { uploader: true }
      });
    } else {
      // PATIENT: only own files
      files = await prisma.file.findMany({
        where: { uploaderId: req.user.id },
        orderBy: { uploadDate: 'desc' },
        include: { uploader: true }
      });
    }
    await auditLog(req.userId, 'list_files');
    res.json(files.map((file) => ({
      id: file.id,
      name: file.name,
      size: file.size,
      type: file.type,
      category: file.category,
      note: file.note,
      uploadDate: file.uploadDate,
      uploader: file.uploader?.username,
      contentUrl: `${req.protocol}://${req.get('host')}/files/${file.id}/content`,
      downloadUrl: `${req.protocol}://${req.get('host')}/files/${file.id}/download`,
    })));
  } catch (e) {
    res.status(500).json({ message: 'Unable to load files.' });
  }
});

// Upload a new file (with audit logging)
app.post('/files', upload.single('file'), async (req, res) => {
  if (!req.file) {
    await auditLog(req.userId, 'upload_failed', req.file?.originalname);
    res.status(400).json({ message: 'A file is required.' });
    return;
  }
  try {
    const file = await prisma.file.create({
      data: {
        name: req.file.originalname,
        storedName: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        type: req.file.mimetype,
        category: req.body.category || 'Other',
        note: req.body.note || '',
        uploader: { connect: { id: req.userId } },
      },
      include: { uploader: true }
    });
    await auditLog(req.userId, 'upload', req.file.originalname, file.id);
    res.status(201).json({
      id: file.id,
      name: file.name,
      size: file.size,
      type: file.type,
      category: file.category,
      note: file.note,
      uploadDate: file.uploadDate,
      uploader: file.uploader?.username,
      contentUrl: `${req.protocol}://${req.get('host')}/files/${file.id}/content`,
      downloadUrl: `${req.protocol}://${req.get('host')}/files/${file.id}/download`,
    });
  } catch (e) {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    await auditLog(req.userId, 'upload_failed', req.file?.originalname);
    res.status(500).json({ message: 'Unable to save file.' });
  }
});

// ...existing code...

// Delete a file (requires authentication and access control)
app.delete('/files/:id', async (req, res) => {
  try {
    const file = await prisma.file.findUnique({ where: { id: Number(req.params.id) } });
    if (!file) {
      await auditLog(req.userId, 'file_not_found', 'unknown', Number(req.params.id));
      return res.status(404).json({ message: 'File not found.' });
    }
    const role = req.user.role;
    let allowed = false;
    if (role === 'ADMIN') {
      allowed = true;
    } else if (role === 'CAREGIVER') {
      const caregiver = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { assignedPatients: true }
      });
      const patientIds = caregiver.assignedPatients.map(p => p.id);
      allowed = patientIds.includes(file.uploaderId);
    } else {
      allowed = file.uploaderId === req.user.id;
    }
    if (!allowed) {
      await auditLog(req.userId, 'access_denied', file.name, file.id);
      return res.status(403).json({ message: 'Access denied.' });
    }
    await fs.unlink(file.path).catch(() => {});
    await prisma.file.delete({ where: { id: file.id } });
    await auditLog(req.userId, 'delete_file', file.name, file.id);
    res.status(204).send();
  } catch {
    res.status(500).json({ message: 'Unable to delete file.' });
  }
});

// Error handler for file upload and other errors
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ message: 'File exceeds the 10 MB limit.' });
    return;
  }

  if (error) {
    res.status(400).json({ message: error.message || 'Unable to upload file.' });
    return;
  }

  next();
});


// Start the server after ensuring storage is ready
ensureStorage().then(() => {
  app.listen(PORT, () => {
    console.log(`File viewer server started on port: ${PORT}`);
  });
});