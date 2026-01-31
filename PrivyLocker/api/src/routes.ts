import express, { Request, Response } from 'express';
import multer from 'multer';
import { saveFile, getFile } from './storage';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload Endpoint
router.post('/upload', upload.single('document'), (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // In a real app, this file would be encrypted client-side.
        // We treat it as an opaque blob here.
        const fileName = saveFile(req.file.buffer, req.file.originalname);

        // Return the URI (in this case, just the filename)
        // In production, this would be ipfs://... or s3://...
        res.json({
            success: true,
            uri: fileName,
            message: 'File stored successfully'
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Fetch Endpoint (Proxy)
router.get('/fetch/:uri', (req: Request, res: Response) => {
    try {
        const { uri } = req.params;
        if (typeof uri !== 'string') {
            return res.status(400).json({ error: 'Invalid URI' });
        }
        const fileBuffer = getFile(uri);

        if (!fileBuffer) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Return raw buffer (encrypted blob)
        res.send(fileBuffer);
    } catch (error) {
        console.error('Fetch Error:', error);
        res.status(500).json({ error: 'Fetch failed' });
    }
});

// Verify Endpoint (Mock Verification Logic)
router.post('/verify', (req: Request, res: Response) => {
    // This endpoint would:
    // 1. Receive a share ID/token.
    // 2. Query Inco/Solana to check permissions.
    // 3. If allowed, fetch the document, decrypt (if server-side generic proof needed) or return encrypted blob + key fragment.
    // For this hackathon demo, we'll assume the frontend does the heavy lifting of decryption if it has the key,
    // and this endpoint just validates the session status.

    const { shareId, verifierPubkey } = req.body;

    // Checking valid session (Mock)
    console.log(`Verifying share ${shareId} for ${verifierPubkey}`);

    res.json({
        authorized: true,
        allowedFields: ['name', 'dob'], // Mock response from Inco
        proofStatus: 'Valid'
    });
});

export default router;
