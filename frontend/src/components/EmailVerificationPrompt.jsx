import { useState, useEffect } from 'react';
import { useAuth } from '../store/auth';
import client from '../api/client';

export default function EmailVerificationPrompt() {
  const { user, loadUser } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Show prompt if user is logged in but email is not verified
    if (user && !user.emailVerified) {
      // Check if user has dismissed this prompt before (in this session)
      const dismissed = sessionStorage.getItem('emailVerificationDismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    } else {
      setShowPrompt(false);
    }
  }, [user]);

  const handleYes = async () => {
    setLoading(true);
    setError('');
    try {
      await client.post('/auth/send-verification-code');
      setShowCodeInput(true);
      setShowPrompt(false);
    } catch (error) {
      setError(error?.response?.data?.error || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleNo = () => {
    sessionStorage.setItem('emailVerificationDismissed', 'true');
    setShowPrompt(false);
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data } = await client.post('/auth/verify-email-code', { code });
      setSuccess(true);
      // Reload user to get updated emailVerified status
      await loadUser();
      setTimeout(() => {
        setShowCodeInput(false);
        setSuccess(false);
        setCode('');
      }, 2000);
    } catch (error) {
      setError(error?.response?.data?.error || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    try {
      await client.post('/auth/send-verification-code');
      setError('');
      alert('Verification code resent to your email');
    } catch (error) {
      setError(error?.response?.data?.error || 'Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseCodeInput = () => {
    setShowCodeInput(false);
    setCode('');
    setError('');
    setSuccess(false);
    sessionStorage.setItem('emailVerificationDismissed', 'true');
  };

  if (!user || user.emailVerified) {
    return null;
  }

  return (
    <>
      {/* Initial Prompt Modal */}
      {showPrompt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '1rem',
        }}>
          <div className="card" style={{ maxWidth: 500, width: '100%' }}>
            <h3 className="hdr" style={{ marginBottom: '1rem' }}>Email Verification</h3>
            <p style={{ marginBottom: '1.5rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              Would you like to get updates on your mail? Verify your email to receive announcements and important notifications.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                className="btn"
                onClick={handleNo}
                style={{ background: 'transparent', border: '1px solid #1f2937' }}
                disabled={loading}
              >
                Not Now
              </button>
              <button
                className="btn"
                onClick={handleYes}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Yes, Verify Email'}
              </button>
            </div>
            {error && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: 'rgba(239, 68, 68, 1)', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Code Input Modal */}
      {showCodeInput && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '1rem',
        }}>
          <div className="card" style={{ maxWidth: 500, width: '100%' }}>
            <h3 className="hdr" style={{ marginBottom: '1rem' }}>Enter Verification Code</h3>
            <p style={{ marginBottom: '1.5rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              We've sent a 6-digit verification code to <strong>{user.email}</strong>. Please enter it below.
            </p>
            
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                className="input"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(value);
                  setError('');
                }}
                style={{ 
                  fontSize: '1.5rem', 
                  textAlign: 'center', 
                  letterSpacing: '0.5rem',
                  fontFamily: 'monospace',
                  width: '100%'
                }}
                maxLength={6}
                disabled={loading || success}
              />
            </div>

            {success && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '6px', color: 'rgba(34, 197, 94, 1)', fontSize: '0.9rem' }}>
                ✓ Email verified successfully!
              </div>
            )}

            {error && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: 'rgba(239, 68, 68, 1)', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                className="btn"
                onClick={handleCloseCodeInput}
                style={{ background: 'transparent', border: '1px solid #1f2937' }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn"
                onClick={handleResendCode}
                style={{ background: 'transparent', border: '1px solid #1f2937' }}
                disabled={loading || success}
              >
                Resend Code
              </button>
              <button
                className="btn"
                onClick={handleVerifyCode}
                disabled={loading || success || code.length !== 6}
              >
                {loading ? 'Verifying...' : success ? 'Verified!' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

