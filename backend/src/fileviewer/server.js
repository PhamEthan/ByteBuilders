
// Core dependencies and middleware imports
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path, { dirname, extname, join } from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import prisma from '../prismaClient.js';


// Initialize Express app
const app = express();

// Parse cookies for CSRF and authentication (disabled for testing)
// app.use(cookieParser());

// CSRF protection disabled for testing


// No CSRF or cookie endpoints

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


// Enable CORS for all origins (for local dev)
app.use(cors({
  origin: '*',
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





// Get file content (public)
app.get('/files/:id/content', async (req, res) => {
  try {
    const file = await prisma.file.findUnique({ where: { id: Number(req.params.id) } });
    if (!file) {
      return res.status(404).json({ message: 'File not found.' });
    }
    res.type(file.type);
    res.sendFile(path.resolve(file.path));
  } catch {
    res.status(500).json({ message: 'Unable to load file.' });
  }
});

// Download file (public)
app.get('/files/:id/download', async (req, res) => {
  try {
    const file = await prisma.file.findUnique({ where: { id: Number(req.params.id) } });
    if (!file) {
      return res.status(404).json({ message: 'File not found.' });
    }
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

// List all files (public, no uploader info)
app.get('/files', async (req, res) => {
  try {
    const files = await prisma.file.findMany({
      orderBy: { uploadDate: 'desc' }
    });
    res.json(files.map((file) => ({
      id: file.id,
      name: file.name,
      size: file.size,
      type: file.type,
      category: file.category,
      note: file.note,
      uploadDate: file.uploadDate,
      contentUrl: `${req.protocol}://${req.get('host')}/files/${file.id}/content`,
      downloadUrl: `${req.protocol}://${req.get('host')}/files/${file.id}/download`,
    })));
  } catch (e) {
    res.status(500).json({ message: 'Unable to load files.' });
  }
});

// Upload a new file (public, no uploader info)
app.post('/files', upload.single('file'), async (req, res) => {
  if (!req.file) {
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
      }
    });
    res.status(201).json({
      id: file.id,
      name: file.name,
      size: file.size,
      type: file.type,
      category: file.category,
      note: file.note,
      uploadDate: file.uploadDate,
      contentUrl: `${req.protocol}://${req.get('host')}/files/${file.id}/content`,
      downloadUrl: `${req.protocol}://${req.get('host')}/files/${file.id}/download`,
    });
  } catch (e) {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    res.status(500).json({ message: 'Unable to save file.' });
  }
});

// ...existing code...

// Delete a file (public)
app.delete('/files/:id', async (req, res) => {
  try {
    const file = await prisma.file.findUnique({ where: { id: Number(req.params.id) } });
    if (!file) {
      return res.status(404).json({ message: 'File not found.' });
    }
    await fs.unlink(file.path).catch(() => {});
    await prisma.file.delete({ where: { id: file.id } });
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