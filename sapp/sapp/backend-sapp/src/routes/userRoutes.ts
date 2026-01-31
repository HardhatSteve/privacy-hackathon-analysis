import { Router, type Request, type Response } from 'express';
import { UserService } from '../services/userService.js';
import { UserRegistrationService } from '../services/authService.js';
import { searchLimiter, handleCheckLimiter } from '../middleware/rateLimiter.js';
import { validate, schemas } from '../middleware/validation.js';

const router = Router();

// Look up user by handle (public - for checking if user exists before messaging)
router.get('/lookup', handleCheckLimiter, validate(schemas.userLookup), async (req: Request, res: Response) => {
  try {
    const { handle } = req.query as { handle: string };

    const user = await UserService.findByHandle(handle);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to lookup user';
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message,
    });
  }
});

// Check if handle exists (public - for messaging validation)
router.get('/exists', handleCheckLimiter, validate(schemas.handleCheck), async (req: Request, res: Response) => {
  try {
    const { handle } = req.query as { handle: string };

    const exists = await UserService.handleExists(handle);

    return res.status(200).json({
      success: true,
      exists,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check user';
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message,
    });
  }
});

// Search users by handle (public - for autocomplete)
router.get('/search', searchLimiter, validate(schemas.userSearch), async (req: Request, res: Response) => {
  try {
    const { q, limit } = req.query as { q: string; limit?: string };

    const maxLimit = Math.min(parseInt(limit || '10') || 10, 20);
    const users = await UserService.search(q, maxLimit);

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to search users';
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message,
    });
  }
});

// Resolve handle to email (internal - for P2P messaging connection)
// This endpoint maps handle -> email for the messaging system
router.get('/resolve', handleCheckLimiter, validate(schemas.userLookup), async (req: Request, res: Response) => {
  try {
    const { handle } = req.query as { handle: string };

    const email = await UserService.getEmailForHandle(handle);

    if (!email) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      email,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to resolve handle';
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message,
    });
  }
});

export default router;
