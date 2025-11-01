const express = require('express');
const router = express.Router();
const Script = require('../models/Script');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/scripts');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'script-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /txt|doc|docx|pdf|rtf|odt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype || extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only document files are allowed (txt, doc, docx, pdf, rtf, odt)'));
    }
  }
});

// Upload script file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Extract text content from the file
    let textContent = '';
    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    if (fileExtension === '.txt') {
      textContent = fs.readFileSync(filePath, 'utf8');
    } else if (fileExtension === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      textContent = result.value;
    } else {
      // For other formats, we'll just store the file path
      textContent = `File uploaded: ${req.file.originalname}`;
    }

    // Create new script record
    const script = new Script({
      title: req.body.title || req.file.originalname,
      content: textContent,
      fileName: req.file.originalname,
      filePath: req.file.path,
      ceremonyId: req.body.ceremonyId || null,
      createdBy: req.body.createdBy || 'officiant',
      type: req.body.type || 'Custom',
      status: req.body.status || 'draft'
    });

    const savedScript = await script.save();

    res.status(201).json({
      message: 'File uploaded successfully',
      script: savedScript,
      file: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    // Clean up the file if there was an error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    res.status(500).json({ message: error.message });
  }
});

// Get all scripts
router.get('/', async (req, res) => {
  try {
    const scripts = await Script.find().sort({ lastModified: -1 });
    res.json(scripts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get scripts by ceremony ID
router.get('/ceremony/:ceremonyId', async (req, res) => {
  try {
    const scripts = await Script.find({ ceremonyId: req.params.ceremonyId }).sort({ lastModified: -1 });
    res.json(scripts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single script
router.get('/:id', async (req, res) => {
  try {
    const script = await Script.findById(req.params.id);
    if (!script) {
      return res.status(404).json({ message: 'Script not found' });
    }
    res.json(script);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new script
router.post('/', async (req, res) => {
  const script = new Script({
    title: req.body.title,
    content: req.body.content,
    fileName: req.body.fileName || '',
    ceremonyId: req.body.ceremonyId,
    createdBy: req.body.createdBy,
    type: req.body.type || 'Custom',
    status: req.body.status || 'draft'
  });

  try {
    const newScript = await script.save();
    res.status(201).json(newScript);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a script
router.put('/:id', async (req, res) => {
  try {
    const script = await Script.findById(req.params.id);
    if (!script) {
      return res.status(404).json({ message: 'Script not found' });
    }

    if (req.body.title !== undefined) script.title = req.body.title;
    if (req.body.content !== undefined) script.content = req.body.content;
    if (req.body.fileName !== undefined) script.fileName = req.body.fileName;
    if (req.body.type !== undefined) script.type = req.body.type;
    if (req.body.status !== undefined) script.status = req.body.status;
    if (req.body.ceremonyId !== undefined) script.ceremonyId = req.body.ceremonyId;

    const updatedScript = await script.save();
    res.json(updatedScript);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a script
router.delete('/:id', async (req, res) => {
  try {
    const script = await Script.findById(req.params.id);
    if (!script) {
      return res.status(404).json({ message: 'Script not found' });
    }

    await script.deleteOne();
    res.json({ message: 'Script deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
