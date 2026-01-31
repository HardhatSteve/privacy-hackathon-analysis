import type { NextApiRequest, NextApiResponse } from 'next';

interface ProofRequest {
  latitude: string;
  longitude: string;
  radius: string;
}

interface ProofResponse {
  proof?: any;
  publicSignals?: string[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProofResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { latitude, longitude, radius } = req.body as ProofRequest;

    if (!latitude || !longitude || !radius) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // For now, return demo proof
    // In production, compute actual Groth16 proof here
    const proof = {
      pi_a: ['1', '2'],
      pi_b: [['3', '4'], ['5', '6']],
      pi_c: ['7', '8'],
    };

    const locationSecret = `${latitude}-${longitude}`;
    const { buildPoseidon } = require('circomlibjs');
    const poseidon = await buildPoseidon();
    const hashFieldElement = poseidon.F.toObject(poseidon([locationSecret]));
    const storedHash = hashFieldElement.toString();

    return res.status(200).json({
      proof,
      publicSignals: [storedHash],
    });
  } catch (error: any) {
    console.error('Proof generation error:', error);
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
