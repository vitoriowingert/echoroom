import { Response } from 'express';
import multer from 'multer';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { uploadService } from '../services/upload.service';
import { ValidationError, AuthorizationError, NotFoundError } from '../utils/errors';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
  },
  fileFilter: (_req, file, cb) => {
    if (uploadService.isAllowedFileType(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError('Invalid file type', 'file'));
    }
  },
});

export const uploadMiddleware = upload.single('file');

export async function uploadMessageAttachment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { roomId } = req.params;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    const result = await uploadService.uploadMessageAttachment(file, roomId, userId);
    res.json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof AuthorizationError) {
      res.status(403).json({ error: error.message });
      return;
    }
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error('Error in uploadMessageAttachment:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload file';
    res.status(500).json({ error: message });
  }
}

export async function uploadAvatar(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    const result = await uploadService.uploadAvatar(file, userId);
    res.json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error('Error in uploadAvatar:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload avatar';
    res.status(500).json({ error: message });
  }
}

export async function uploadServerIcon(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { serverId } = req.params;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    const result = await uploadService.uploadServerIcon(file, serverId, userId);
    res.json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof AuthorizationError) {
      res.status(403).json({ error: error.message });
      return;
    }
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error('Error in uploadServerIcon:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload server icon';
    res.status(500).json({ error: message });
  }
}

