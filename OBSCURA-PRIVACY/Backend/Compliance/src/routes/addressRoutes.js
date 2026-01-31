import express from 'express';
import { 
  searchAddresses, 
  getAddressStats, 
  checkAddressCompliance 
} from '../controllers/addressController.js';

const router = express.Router();

router.get('/search', searchAddresses);
router.get('/stats', getAddressStats);
router.post('/check', checkAddressCompliance);

export default router;
