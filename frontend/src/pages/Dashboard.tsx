import React, { useEffect, useState, useRef } from 'react';
import { fetchClaims, submitClaim } from '../services/auth';

type Claim = {
  _id?: string;
  claim_id?: string; // Updated to match backend model
  claim_hash?: string;
  submitter?: string;
  verified?: boolean;
  submitted_at?: string; // or Date
  // keeping old types just in case, though backend sends snake_case
  title?: string;
  description?: string;
  createdAt?: string;
};

export default function Dashboard() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reference for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const res = await fetchClaims();
      // Ensure res is an array before setting
      setClaims(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch claims');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, []);

  const handleUploadClick = () => {
    // Trigger the file browser dialog
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm(`Generate ZK Proof for "${file.name}" and submit?`)) {
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
      return;
    }
    
    setSubmitting(true);
    setError(null);
    setStatusMsg('Reading file...');

    try {
      // 1. Simulate reading/uploading file
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStatusMsg('Generating Proof...');
      // 2. Simulate ZK Proof generation (snarkjs would typically run here)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // MOCK DATA: In a real app, you would run snarkjs.fullProve() here
      const mockPayload = {
        claim_id: `claim-${Date.now()}`,
        // Use the filename in the hash to show it is related to the upload
        claim_hash: `0xhash_${file.name.replace(/\s/g, '_')}_${Date.now()}`, 
        proof: { pi_a: [], pi_b: [], pi_c: [], protocol: "groth16" }, // Mock empty proof
        public_signals: ["1", "0"] // Mock signals
      };

      setStatusMsg('Submitting...');
      const result = await submitClaim(mockPayload);
      
      if (result.success) {
        alert("File processed and claim submitted successfully!");
        loadClaims(); // Refresh list
      } else {
        alert("Failed: " + result.message);
      }
    } catch (e: any) {
      alert("Error submitting claim: " + e.message);
    } finally {
      setSubmitting(false);
      setStatusMsg('');
      // Reset file input so the same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: '20px' }}>
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>My Claims Dashboard</h2>
        
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <button 
          onClick={handleUploadClick} 
          disabled={submitting || loading}
          className="btn-primary"
          style={{ padding: '10px 20px', cursor: 'pointer' }}
        >
          {submitting ? statusMsg : '+ Upload & Generate Claim'}
        </button>
      </div>

      {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      {loading ? (
        <p>Loading claims...</p>
      ) : (
        <div className="claims-list">
          {claims.length === 0 ? (
            <p>No claims found. Upload a file to start!</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {claims.map((c, i) => (
                <li key={c._id || c.claim_id || i} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '10px', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 'bold' }}>ID: {c.claim_id || c.title || 'Untitled'}</div>
                  <div style={{ fontSize: '0.9em', color: '#666' }}>Hash: {c.claim_hash || '...'}</div>
                  <div style={{ marginTop: '5px' }}>
                    <span style={{ 
                      backgroundColor: c.verified ? '#d4edda' : '#f8d7da', 
                      color: c.verified ? '#155724' : '#721c24',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8em'
                    }}>
                      {c.verified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}