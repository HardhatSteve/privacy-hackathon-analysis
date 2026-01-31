import { Router, type Request, type Response } from 'express';
import { UserRegistrationService } from '../services/authService.js';
import { registrationLimiter, handleCheckLimiter } from '../middleware/rateLimiter.js';
import { validate, schemas } from '../middleware/validation.js';

const router = Router();

// Register a new user after Privy authentication
// Called when user completes Privy OTP and sets up their handle
router.post('/register', registrationLimiter, validate(schemas.register), async (req: Request, res: Response) => {
  try {
    const { email, handle, privyUserId } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'email is required (from Privy auth)',
      });
    }

    if (!handle || typeof handle !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'handle is required',
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid email format',
      });
    }

    const user = await UserRegistrationService.registerUser({
      email,
      handle,
      privyUserId,
    });

    return res.status(201).json({
      success: true,
      user: {
        handle: user.handle,
        solanaAddress: user.solanaAddress,
      },
    });
  } catch (error) {
    // Log full error details for debugging
    console.error('[sapp-backend] Registration error:', error);

    const message = error instanceof Error ? error.message : 'Failed to register user';

    // Handle specific errors
    if (message.includes('already registered') || message.includes('already taken')) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message,
      });
    }

    if (message.includes('must be')) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message,
      });
    }

    // Handle MongoDB duplicate key errors
    if (message.includes('E11000') || message.includes('duplicate key')) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'A database constraint was violated. This may be due to an orphaned index.',
        details: message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message,
    });
  }
});

// Check if handle is available
router.get('/handle-available', handleCheckLimiter, validate(schemas.handleCheck), async (req: Request, res: Response) => {
  try {
    const { handle } = req.query;

    if (!handle || typeof handle !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'handle query parameter is required',
      });
    }

    const available = await UserRegistrationService.isHandleAvailable(handle);

    return res.status(200).json({
      success: true,
      available,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check handle';
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message,
    });
  }
});

// Get current user by email (after Privy auth)
router.get('/me', async (req: Request, res: Response) => {
  try {
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'email query parameter is required',
      });
    }

    const user = await UserRegistrationService.getUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not registered. Please complete registration.',
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        handle: user.handle,
        solanaAddress: user.solanaAddress,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get user';
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message,
    });
  }
});

// Update wallet address for existing user
router.patch('/wallet', async (req: Request, res: Response) => {
  try {
    const { email, solanaAddress } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'email is required',
      });
    }

    if (!solanaAddress || typeof solanaAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'solanaAddress is required',
      });
    }

    const updatedUser = await UserRegistrationService.updateWalletAddress(email, solanaAddress);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        handle: updatedUser.handle,
        solanaAddress: updatedUser.solanaAddress,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update wallet';
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message,
    });
  }
});

export default router;
