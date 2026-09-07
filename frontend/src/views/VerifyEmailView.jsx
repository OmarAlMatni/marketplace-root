import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuthStore } from '../store/useAuthStore';

export default function VerifyEmailView() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const email = sessionStorage.getItem('marketplace_verification_email') || '';
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axiosClient.post('/api/auth/verify-email', { email, code: digits.join('') });
      login(data.user, data.token);
      sessionStorage.removeItem('marketplace_verification_email');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  }

  function updateDigit(index, value) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = digit;
    setDigits(nextDigits);
    if (digit && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, event) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(event) {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const nextDigits = ['', '', '', '', '', ''];
    pasted.split('').forEach((digit, index) => {
      nextDigits[index] = digit;
    });
    setDigits(nextDigits);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  return (
    <div className="max-w-sm mx-auto mt-16 bg-white p-8 rounded-xl border border-gray-200">
      <h1 className="text-2xl font-bold mb-2">Verify your email</h1>
      <p className="text-sm text-gray-500 mb-6">Enter the 6-digit code sent to your email. It expires in 10 minutes.</p>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-between gap-2" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => { inputRefs.current[index] = element; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              required
              aria-label={`Verification digit ${index + 1}`}
              value={digit}
              onChange={(e) => updateDigit(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="h-12 w-11 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            />
          ))}
        </div>
        <button type="submit" disabled={loading} className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50">
          {loading ? 'Verifying…' : 'Verify email'}
        </button>
      </form>
      <p className="text-sm text-gray-500 mt-4">Return to <Link to="/login" className="text-brand-600 font-medium">sign in</Link></p>
    </div>
  );
}