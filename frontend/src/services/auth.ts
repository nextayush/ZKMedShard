import api from './api';

const TOKEN_KEY = 'zkmedshard_token';

export function storeToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * loginWithSignature:
 * - asks backend for a nonce: POST /auth/nonce { address }
 * - wallet signs the message (the nonce message)
 * - sends signature to POST /auth/verify { address, signature }
 * - backend returns { token }
 *
 * This function is written to work with MetaMask's provider object.
 */
export async function loginWithSignature(address: string, provider: any) {
  try {
    // 1. request nonce
    const nonceResp = await api.post('/auth/nonce', { address });
    const nonce = nonceResp.data?.nonce;
    if (!nonce) return { success: false, message: 'No nonce returned' };

    const message = `Sign this message to login to ZKMedShard: ${nonce}`;

    // Ask wallet to sign
    const signature = await provider.request({
      method: 'personal_sign',
      params: [message, address]
    });

    // verify with backend
    const verifyResp = await api.post('/auth/verify', { address, signature });
    const token = verifyResp.data?.token;
    if (!token) return { success: false, message: 'No token returned' };

    storeToken(token);
    return { success: true };
  } catch (err: any) {
    const message = err?.response?.data?.message || err.message || 'Login failed';
    return { success: false, message };
  }
}

export async function fetchClaims() {
  // FIX: Backend is mapped to /claim (singular), so we must request /claim/list
  const resp = await api.get('/claim/list');
  // FIX: Backend returns { success: true, data: [...] }. We need the array inside 'data'.
  return resp.data?.data || [];
}

/**
 * Submits a new claim (proof) to the backend.
 * Endpoint: POST /claim/prove-and-submit
 */
export async function submitClaim(payload: {
  claim_id: string;
  claim_hash: string;
  proof: any;
  public_signals: any;
}) {
  try {
    const resp = await api.post('/claim/prove-and-submit', payload);
    return { success: true, data: resp.data };
  } catch (err: any) {
    const message = err?.response?.data?.message || err.message || 'Submission failed';
    return { success: false, message };
  }
}

/**
 * Doctor's Check: Verify if a hash exists in the database.
 * Endpoint: POST /claim/verify-hash
 */
export async function verifyClaimHash(hash: string) {
  try {
    // Note: /claim prefix comes from main.rs, /verify-hash comes from claim.rs
    const resp = await api.post('/claim/verify-hash', { claim_hash: hash });
    // resp.data = { success: true, message: "...", data: true/false }
    return { 
      success: true, 
      isValid: resp.data?.data === true,
      message: resp.data?.message 
    };
  } catch (err: any) {
    const message = err?.response?.data?.message || err.message || 'Verification failed';
    return { success: false, message, isValid: false };
  }
}