import React, { useState } from 'react';
import { verifyClaimHash } from '../services/auth';

export default function DoctorVerify() {
  const [hashInput, setHashInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ isValid: boolean; message: string } | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hashInput.trim()) return;

    setLoading(true);
    setResult(null);

    const res = await verifyClaimHash(hashInput.trim());
    setLoading(false);

    if (res.success) {
      setResult({ isValid: res.isValid, message: res.message });
    } else {
      setResult({ isValid: false, message: res.message || 'Error occurred' });
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <div className="card" style={{ border: '1px solid #ddd', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginTop: 0, color: '#333' }}>Doctor Verification Portal</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Enter the Patient's Claim Hash below to verify its validity on the ZKMedShard network.
        </p>

        <form onSubmit={handleVerify}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Claim Hash</label>
            <input
              type="text"
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              placeholder="e.g. 0x123abc..."
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                borderRadius: '6px',
                border: '1px solid #ccc'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !hashInput}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Verifying...' : 'Verify Claim'}
          </button>
        </form>

        {result && (
          <div style={{ marginTop: '25px', padding: '15px', borderRadius: '8px', textAlign: 'center', backgroundColor: result.isValid ? '#d4edda' : '#f8d7da', border: result.isValid ? '1px solid #c3e6cb' : '1px solid #f5c6cb' }}>
            <h3 style={{ margin: '0 0 10px 0', color: result.isValid ? '#155724' : '#721c24' }}>
              {result.isValid ? '✅ Verified Valid' : '❌ Invalid / Not Found'}
            </h3>
            <p style={{ margin: 0, color: result.isValid ? '#155724' : '#721c24' }}>
              {result.isValid 
                ? "This claim hash exists in the database and has been verified." 
                : "This hash does not exist in our records."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}