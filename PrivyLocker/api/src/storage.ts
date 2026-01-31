import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_DIR = path.join(__dirname, '../../uploads');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

export const saveFile = (buffer: Buffer, originalName: string): string => {
    const fileId = uuidv4();
    const ext = path.extname(originalName);
    const fileName = `${fileId}${ext}`;
    const filePath = path.join(STORAGE_DIR, fileName);

    fs.writeFileSync(filePath, buffer);
    return fileName; // This serves as the "URI" for the mock
};

export const getFile = (fileName: string): Buffer | null => {
    const filePath = path.join(STORAGE_DIR, fileName);
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath);
    }
    return null;
};
