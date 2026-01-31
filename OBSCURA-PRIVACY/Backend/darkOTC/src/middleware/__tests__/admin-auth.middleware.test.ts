/**
 * Admin Authentication Middleware Tests
 * 
 * Tests for admin public key verification middleware.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAdminPublicKey } from '../admin-auth.middleware';

describe('Admin Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  
  // Store original env
  const originalEnv = process.env.ADMIN_PUBLIC_KEY;
  
  beforeEach(() => {
    mockRequest = {
      body: {},
    };
    mockResponse = {};
    mockNext = jest.fn();
  });
  
  afterEach(() => {
    // Restore original env
    if (originalEnv) {
      process.env.ADMIN_PUBLIC_KEY = originalEnv;
    } else {
      delete process.env.ADMIN_PUBLIC_KEY;
    }
  });
  
  describe('verifyAdminPublicKey', () => {
    it('should pass when public key matches admin key', () => {
      // Set admin key
      process.env.ADMIN_PUBLIC_KEY = 'admin-key-123';
      
      // Set request body
      mockRequest.body = {
        publicKey: 'admin-key-123',
      };
      
      // Call middleware
      verifyAdminPublicKey(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Should call next without error
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    it('should pass when public key matches one of multiple admin keys', () => {
      // Set multiple admin keys
      process.env.ADMIN_PUBLIC_KEY = 'admin-key-1,admin-key-2,admin-key-3';
      
      // Set request body with second key
      mockRequest.body = {
        publicKey: 'admin-key-2',
      };
      
      // Call middleware
      verifyAdminPublicKey(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Should call next without error
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    it('should handle admin keys with whitespace', () => {
      // Set admin keys with whitespace
      process.env.ADMIN_PUBLIC_KEY = ' admin-key-1 , admin-key-2 , admin-key-3 ';
      
      // Set request body
      mockRequest.body = {
        publicKey: 'admin-key-2',
      };
      
      // Call middleware
      verifyAdminPublicKey(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Should call next without error
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    it('should reject when public key is missing', () => {
      // Set admin key
      process.env.ADMIN_PUBLIC_KEY = 'admin-key-123';
      
      // Set request body without publicKey
      mockRequest.body = {
        address: 'some-address',
      };
      mockRequest.body = {
        address: 'some-address',
      };
      
      // Call middleware
      verifyAdminPublicKey(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Should call next with AuthorizationError
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'AuthorizationError',
          message: 'Public key is required for admin operations',
        })
      );
    });
    
    it('should reject when public key does not match admin key', () => {
      // Set admin key
      process.env.ADMIN_PUBLIC_KEY = 'admin-key-123';
      
      // Set request body with wrong key
      mockRequest.body = {
        publicKey: 'wrong-key',
      };
      
      // Call middleware
      verifyAdminPublicKey(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Should call next with AuthorizationError
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'AuthorizationError',
          message: 'Not authorized: Public key is not an authorized admin',
        })
      );
    });
    
    it('should reject when ADMIN_PUBLIC_KEY is not configured', () => {
      // Remove admin key from env
      delete process.env.ADMIN_PUBLIC_KEY;
      
      // Set request body
      mockRequest.body = {
        publicKey: 'some-key',
      };
      
      // Call middleware
      verifyAdminPublicKey(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Should call next with AuthorizationError
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'AuthorizationError',
          message: 'Admin authentication is not configured',
        })
      );
    });
    
    it('should reject when ADMIN_PUBLIC_KEY is empty string', () => {
      // Set empty admin key
      process.env.ADMIN_PUBLIC_KEY = '';
      
      // Set request body
      mockRequest.body = {
        publicKey: 'some-key',
      };
      
      // Call middleware
      verifyAdminPublicKey(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Should call next with AuthorizationError
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'AuthorizationError',
          message: 'Admin authentication is not configured',
        })
      );
    });
    
    it('should handle comma-separated list with empty entries', () => {
      // Set admin keys with empty entries
      process.env.ADMIN_PUBLIC_KEY = 'admin-key-1,,admin-key-2,';
      
      // Set request body
      mockRequest.body = {
        publicKey: 'admin-key-2',
      };
      
      // Call middleware
      verifyAdminPublicKey(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Should call next without error
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    it('should be case-sensitive when matching keys', () => {
      // Set admin key
      process.env.ADMIN_PUBLIC_KEY = 'admin-key-123';
      
      // Set request body with different case
      mockRequest.body = {
        publicKey: 'ADMIN-KEY-123',
      };
      
      // Call middleware
      verifyAdminPublicKey(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Should call next with AuthorizationError (case mismatch)
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'AuthorizationError',
          message: 'Not authorized: Public key is not an authorized admin',
        })
      );
    });
  });
});
