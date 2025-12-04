import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginWithSignature } from '../services/auth';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async () => {
    // Check if MetaMask (or another Web3 provider) is installed
    if (!(window as any).ethereum) {
      setError("MetaMask is not installed. Please install it to use this app.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Request access to the user's wallet
      const provider = (window as any).ethereum;
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please unlock your wallet.");
      }

      const address = accounts[0];

      // 2. Perform the cryptographic login flow (Nonce -> Sign -> Verify)
      const result = await loginWithSignature(address, provider);

      if (result.success) {
        // 3. Redirect to the page they were trying to visit, or Dashboard by default
        const from = (location.state as any)?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        setError(result.message || "Login failed");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ 
        width: '100%', 
        maxWidth: '400px', 
        padding: '40px', 
        border: '1px solid #e1e4e8', 
        borderRadius: '12px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        backgroundColor: 'white',
        textAlign: 'center'
      }}>
        <h2 style={{ marginBottom: '10px', color: '#333' }}>Sign in</h2>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          Connect your wallet to access ZKMedShard
        </p>
        
        {error && (
          <div style={{ 
            backgroundColor: '#ffebe9', 
            color: '#cf222e', 
            padding: '12px', 
            borderRadius: '6px', 
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <button 
          onClick={handleLogin} 
          disabled={loading}
          className="btn-primary"
          style={{ 
            width: '100%', 
            padding: '12px', 
            backgroundColor: '#0366d6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            fontSize: '16px', 
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Check your wallet...' : 'Sign in with MetaMask'}
        </button>
      </div>
    </div>
  );
}