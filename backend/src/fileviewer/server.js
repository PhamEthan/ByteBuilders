import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs/promises';
import path, { dirname, extname, join } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const app = express();
const PORT = process.env.FILEVIEWER_PORT || 5004;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storageRoot = join(__dirname, '../../storage');
const uploadDirectory = join(storageRoot, 'uploads');
const dataDirectory = join(storageRoot, 'data');
const metadataFilePath = join(dataDirectory, 'files.json');

const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
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

app.use(cors({ origin: allowedOrigins, credentials: false }));

async function ensureStorage() {
  await fs.mkdir(uploadDirectory, { recursive: true });
  await fs.mkdir(dataDirectory, { recursive: true });

  try {
    await fs.access(metadataFilePath);
  } catch {
    await fs.writeFile(metadataFilePath, '[]', 'utf8');
  }
}

async function readMetadata() {
  await ensureStorage();
  const fileContent = await fs.readFile(metadataFilePath, 'utf8');
  return JSON.parse(fileContent);
}

async function writeMetadata(records) {
  await ensureStorage();
  await fs.writeFile(metadataFilePath, JSON.stringify(records, null, 2), 'utf8');
}

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

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await ensureStorage();
      cb(null, uploadDirectory);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${crypto.randomUUID()}${extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.has(file.mimetype)) {
      cb(new Error('Unsupported file type.'));
      return;
    }

    cb(null, true);
  },
});

app.get('/files', async (req, res) => {
  try {
    const records = await readMetadata();
    const sortedRecords = records
      .sort((left, right) => right.uploadTimestamp - left.uploadTimestamp)
      .map((record) => toPublicRecord(req, record));

    res.json(sortedRecords);
  } catch {
    res.status(500).json({ message: 'Unable to load files.' });
  }
});

app.post('/files', upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'A file is required.' });
    return;
  }

  try {
    const records = await readMetadata();
    const timestamp = Date.now();
    const record = {
      id: crypto.randomUUID(),
      name: req.file.originalname,
      storedName: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      type: req.file.mimetype,
      category: req.body.category || 'Other',
      note: req.body.note || '',
      uploadDate: new Date(timestamp).toLocaleString(),
      uploadTimestamp: timestamp,
    };

    records.push(record);
    await writeMetadata(records);
    res.status(201).json(toPublicRecord(req, record));
  } catch {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.status(500).json({ message: 'Unable to save file.' });
  }
});

app.get('/files/:id/content', async (req, res) => {
  try {
    const records = await readMetadata();
    const record = records.find((entry) => entry.id === req.params.id);

    if (!record) {
      res.status(404).json({ message: 'File not found.' });
      return;
    }

    res.type(record.type);
    res.sendFile(path.resolve(record.path));
  } catch {
    res.status(500).json({ message: 'Unable to load file.' });
  }
});

app.get('/files/:id/download', async (req, res) => {
  try {
    const records = await readMetadata();
    const record = records.find((entry) => entry.id === req.params.id);

    if (!record) {
      res.status(404).json({ message: 'File not found.' });
      return;
    }

    res.download(path.resolve(record.path), record.name);
  } catch {
    res.status(500).json({ message: 'Unable to download file.' });
  }
});

app.delete('/files/:id', async (req, res) => {
  try {
    const records = await readMetadata();
    const record = records.find((entry) => entry.id === req.params.id);

    if (!record) {
      res.status(404).json({ message: 'File not found.' });
      return;
    }

    const remainingRecords = records.filter((entry) => entry.id !== req.params.id);
    await fs.unlink(record.path).catch(() => {});
    await writeMetadata(remainingRecords);
    res.status(204).send();
  } catch {
    res.status(500).json({ message: 'Unable to delete file.' });
  }
});

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

ensureStorage().then(() => {
  app.listen(PORT, () => {
    console.log(`File viewer server started on port: ${PORT}`);
  });
});