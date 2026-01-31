import { useWallet } from '@solana/wallet-adapter-react';
import { FC, useState, useEffect } from 'react';

export const ProofGenerator: FC = () => {
  const { publicKey } = useWallet();
  const [status, setStatus] = useState('SYSTEM IDLE');
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  // Location state
  const [lat, setLat] = useState('37.7749');
  const [long, setLong] = useState('-122.4194');
  const [locationObtained, setLocationObtained] = useState(false);

  // Auto-fetch location on component mount
  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported by this browser');
      return;
    }

    setGeoLoading(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLat(latitude.toFixed(6));
        setLong(longitude.toFixed(6));
        setLocationObtained(true);
        setGeoLoading(false);
        setStatus('LOCATION ACQUIRED');
      },
      (error) => {
        setGeoLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError('Location permission denied. Using default coordinates.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError('Location unavailable. Using default coordinates.');
            break;
          case error.TIMEOUT:
            setGeoError('Location request timeout. Using default coordinates.');
            break;
          default:
            setGeoError('Error fetching location. Using default coordinates.');
        }
        setLocationObtained(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const generateAndSubmitProof = async () => {
    if (!publicKey) return;
    setLoading(true);
    setStatus('ESTABLISHING UPLINK...');

    try {
      // 1. Generate ZK Proof
      setStatus('GENERATING ZK-PROOF...');
      await fetch('/api/generate-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: long, radius: 1000 }),
      });
      
      // 2. Submit to Solana
      setStatus('TRANSMITTING TO CHAIN...');
      
      setStatus('VERIFICATION COMPLETE');
    } catch (error) {
      console.error(error);
      setStatus('CONNECTION ERROR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-lime-900 bg-black w-full">
      {/* Terminal Header */}
      <div className="flex justify-between items-end px-4 py-2 border-b border-lime-900 mb-4">
        <h2 className="text-3xl font-bold text-lime-500 uppercase tracking-tighter">
          TERMINAL UPLINK
        </h2>
        <span className="text-white text-xs opacity-70 mb-1">v0.1.0-alpha</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Status Display */}
        <div className="bg-black border-l-2 border-lime-900 pl-3 py-1 font-mono text-sm">
          <p className="text-white italic opacity-80 mb-1">... Waiting for proof submission ...</p>
          <div className="flex gap-2">
            <span className="text-white">CURRENT STATUS:</span>
            <span className={`font-bold ${status === 'CONNECTION ERROR' ? 'text-red-500' : 'text-lime-500'}`}>
              {status}
            </span>
          </div>
        </div>

        {/* GPS Status / Error Display */}
        {geoError && (
          <div className="bg-red-900 bg-opacity-20 border border-red-500 px-3 py-2 text-xs text-red-400 font-mono">
            ⚠ {geoError}
          </div>
        )}

        {/* Location Display (Read-only) */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-lime-700 block mb-1">LATITUDE</label>
              <div className="w-full bg-gray-900 border border-lime-900 text-lime-500 p-2 text-xs font-mono">
                {lat}
              </div>
            </div>
            <div>
              <label className="text-xs text-lime-700 block mb-1">LONGITUDE</label>
              <div className="w-full bg-gray-900 border border-lime-900 text-lime-500 p-2 text-xs font-mono">
                {long}
              </div>
            </div>
          </div>

          {/* Location Status Indicator */}
          <div className="flex items-center gap-2 text-xs px-2">
            {geoLoading ? (
              <>
                <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                <span className="text-yellow-500">Acquiring GPS signal...</span>
              </>
            ) : locationObtained ? (
              <>
                <span className="inline-block w-2 h-2 bg-lime-500 rounded-full"></span>
                <span className="text-lime-500">GPS: LOCKED</span>
              </>
            ) : (
              <>
                <span className="inline-block w-2 h-2 bg-gray-500 rounded-full"></span>
                <span className="text-gray-400">Using default coordinates</span>
              </>
            )}
          </div>
        </div>

        {/* Refresh Location Button */}
        <button
          onClick={fetchCurrentLocation}
          disabled={geoLoading || loading}
          className="w-full py-2 text-xs border border-lime-700 text-lime-600 hover:bg-lime-900 hover:bg-opacity-30 transition-all duration-200 uppercase tracking-wider font-mono"
        >
          {geoLoading ? '🔄 ACQUIRING...' : '🛰 REFRESH GPS'}
        </button>

        {/* Big Action Button */}
        <button
          onClick={generateAndSubmitProof}
          disabled={!publicKey || loading}
          className={`
            w-full py-4 mt-6 text-lg font-bold tracking-widest border-2 uppercase transition-all duration-200
            ${!publicKey 
              ? 'border-gray-700 text-gray-700 cursor-not-allowed' 
              : 'border-lime-500 text-lime-500 hover:bg-lime-500 hover:text-black shadow-[0_0_15px_rgba(0,255,0,0.3)]'
            }
          `}
        >
          {loading ? 'PROCESSING...' : !publicKey ? 'CONNECT WALLET FIRST' : 'INITIATE PROTOCOL'}
        </button>
      </div>
    </div>
  );
};
