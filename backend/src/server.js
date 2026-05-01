import express from 'express'
import path, {dirname, join} from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/authRoutes.js'
import appointmentRoutes from './routes/appointmentRoutes.js'
import cors from "cors";
import cookieParser from 'cookie-parser';

import multer from 'multer';
import fs from 'fs/promises';
import csurf from 'csurf';
import prisma from './prismaClient.js';
import authMiddleware from './middleware/authMiddleware.js';

const allowedOrigins = process.env.FRONTEND_ORIGIN
  ? process.env.FRONTEND_ORIGIN.split(',').map((origin) => origin.trim())
  : ["http://localhost:3000", "https://nominatim.openstreetmap.org"];

//Allows communication between frontend client and database server,
//  without flagging CORS communication issues in the web browser
const corsOptions = {
    origin: allowedOrigins,
    credentials: true,
};


const app = express()
app.use(cors(corsOptions))
app.use(cookieParser())
app.enable('trust proxy');

// CSRF protection
const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' } });

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});

if (process.env.NODE_ENV === 'production' || process.env.FORCE_HTTPS === 'true') {
  app.use((req, res, next) => {
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    if (proto === 'https') {
      return next();
    }
    return res.redirect(`https://${req.headers.host}${req.url}`);
  });
}

const PORT = process.env.PORT || 5003

// Get the file path from URL of currModule
const __filename = fileURLToPath(import.meta.url)
// Retrieve Dir name
const __dirname = dirname(__filename)

//MIDDLEWARE
app.use(express.json())

// File upload storage setup
const ensureStorage = async () => {
  const uploadDir = join(process.cwd(), 'storage', 'uploads');
  await fs.mkdir(uploadDir, { recursive: true });
};

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = join(process.cwd(), 'storage', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const allowedTypes = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

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

/*
//Hands over HTML from /public Dir
app.use(express.static(path.join(__dirname, '../public')))
// Now Display HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})
*/

//Temporary redirect back to the actual frontend
app.get('/', (req, res) => {
    res.redirect("http://localhost:3000/")
})

//ROUTES
app.use('/auth', authRoutes)
app.use('/appointments', appointmentRoutes)

// CSRF token endpoint
app.get('/csrf-token', csrfProtection, (req, res) => {
  res.cookie('XSRF-TOKEN', req.csrfToken(), { httpOnly: false, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
  res.json({ csrfToken: req.csrfToken() });
});

// All file routes below require authentication
// app.use('/files', authMiddleware); // Disabled for testing

// List all files (no auth)
app.get('/files', async (req, res) => {
  try {
    const files = await prisma.file.findMany({
      orderBy: { uploadDate: 'desc' },
      include: { uploader: true }
    });
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

// Upload a new file (no auth)
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
      },
      include: { uploader: true }
    });
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
    res.status(500).json({ message: 'Unable to save file.' });
  }
});

// Get file content (no auth)
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

// Download file (no auth)
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

// Delete a file (no auth)
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

// Audit log helper
async function auditLog(userId, action, fileName, fileId) {
  try {
    const data = { userId, action };
    if (typeof fileId === 'number' && !isNaN(fileId)) {
      data.fileId = fileId;
    }
    await prisma.auditLog.create({ data });
  } catch (e) {
    console.error('Audit log error:', e.message);
  }
}



// Ensure storage and start server
ensureStorage().then(() => {
  app.listen(PORT, () => {
    console.log(`Server has started on port: ${PORT}`);
  });
});

