import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthStore } from '../context/useAuthStore';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  // Timer for OTP expiry
  useState(() => {
    let interval;
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setShowOtpInput(false);
            setOtpExpiry(null);
            toast.error('OTP expired. Please try again.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        '/api/v1/auth/login',
        { username, password },
        { withCredentials: true }
      );

      if (response.data.otp_required) {
        setShowOtpInput(true);
        setTimeLeft(600); // 10 minutes in seconds
        toast.success('OTP sent to your email');
      } else {
        // Direct login (if OTP is not required)
        const res = await axios.get('/api/v1/user/me', { withCredentials: true });
        setUser(res.data);
        toast.success('Logged in');
        navigate('/chat');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        '/api/v1/auth/verify-otp',
        { username, otp },
        { withCredentials: true }
      );

      if (response.data.success) {
        // Get user data and set auth
        const res = await axios.get('/api/v1/user/me', { withCredentials: true });
        setUser(res.data);
        toast.success('Login successful!');
        navigate('/chat');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'OTP verification failed');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      await axios.post(
        '/api/v1/auth/send-otp',
        { username },
        { withCredentials: true }
      );
      
      setTimeLeft(600); // Reset timer
      setOtp(''); // Clear OTP input
      toast.success('New OTP sent to your email');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to resend OTP');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setShowOtpInput(false);
    setOtp('');
    setTimeLeft(0);
  };

  const handleOtpInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md border border-gray-200">
        {!showOtpInput ? (
          // Login Form
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600">Sign in to your account</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                  disabled={isLoading}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={!username || !password || isLoading}
              className={`w-full py-3 mt-6 rounded-xl font-medium transition-all ${
                !username || !password || isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg hover:shadow-xl'
              }`}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </>
        ) : (
          // OTP Verification Form
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Verify Your Identity
              </h1>
              <p className="text-gray-600 mb-4">
                Enter the 6-digit code sent to your email
              </p>
            
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={handleOtpInputChange}
                  placeholder="000000"
                  maxLength="6"
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all text-center text-2xl font-mono tracking-widest font-bold"
                  disabled={isLoading}
                  onKeyPress={(e) => e.key === 'Enter' && handleVerifyOtp()}
                />
                <p className="text-gray-500 text-xs mt-2 text-center">
                  Check your email for the verification code
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleVerifyOtp}
                  disabled={otp.length !== 6 || isLoading}
                  className={`w-full py-3 rounded-xl font-medium transition-all ${
                    otp.length !== 6 || isLoading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isLoading ? 'Verifying...' : 'Verify & Continue'}
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleResendOtp}
                    disabled={isLoading || timeLeft > 540}
                    className={`py-2.5 rounded-lg font-medium text-sm transition-all ${
                      isLoading || timeLeft > 540
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {timeLeft > 540 ? `Resend (${formatTime(timeLeft - 540)})` : 'Resend Code'}
                  </button>

                  <button
                    onClick={handleBack}
                    disabled={isLoading}
                    className="py-2.5 rounded-lg font-medium text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-all"
                  >
                    ← Back to Login
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-gray-600 text-sm">
            Don't have an account?{' '}
            <a 
              href="/register" 
              className="text-gray-900 hover:underline font-medium"
            >
              Create one now
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}