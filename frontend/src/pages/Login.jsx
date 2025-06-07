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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-60 h-60 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-3xl p-8 w-full max-w-md">
        {/* Glass morphism effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 via-pink-400/10 to-blue-400/10 rounded-3xl"></div>
        
        <div className="relative z-10 space-y-6">
          {!showOtpInput ? (
            // Login Form
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Welcome Back
                </h1>
                <p className="text-gray-300 mt-2">Sign in to your account</p>
              </div>

              <div className="space-y-4">
                <div className="group">
                  <label className="block text-sm font-medium text-gray-200 mb-2 group-focus-within:text-purple-300 transition-colors">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400 group-focus-within:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-medium text-gray-200 mb-2 group-focus-within:text-purple-300 transition-colors">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400 group-focus-within:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      disabled={isLoading}
                      onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={!username || !password || isLoading}
                className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 transform ${
                  !username || !password || isLoading
                    ? 'bg-gray-500/50 cursor-not-allowed scale-95'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </>
          ) : (
            // OTP Verification Form
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-4 shadow-lg animate-pulse">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Verify Your Identity
                </h1>
                <p className="text-gray-300 mt-2">
                  Enter the 6-digit code sent to your email
                </p>
                {timeLeft > 0 && (
                  <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30">
                    <svg className="w-4 h-4 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-yellow-400 text-sm font-medium">
                      Expires in {formatTime(timeLeft)}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="group">
                  <label className="block text-sm font-medium text-gray-200 mb-3 text-center">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={handleOtpInputChange}
                    placeholder="000000"
                    maxLength="6"
                    className="w-full px-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm text-center text-3xl font-mono tracking-[0.5em] font-bold"
                    disabled={isLoading}
                    onKeyPress={(e) => e.key === 'Enter' && handleVerifyOtp()}
                  />
                  <p className="text-gray-400 text-xs mt-2 text-center">
                    Check your email for the verification code
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleVerifyOtp}
                    disabled={otp.length !== 6 || isLoading}
                    className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 transform ${
                      otp.length !== 6 || isLoading
                        ? 'bg-gray-500/50 cursor-not-allowed scale-95'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 hover:scale-105 hover:shadow-xl hover:shadow-green-500/25'
                    }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Verifying...
                      </div>
                    ) : (
                      'Verify & Continue'
                    )}
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleResendOtp}
                      disabled={isLoading || timeLeft > 540}
                      className={`py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
                        isLoading || timeLeft > 540
                          ? 'bg-gray-500/30 text-gray-500 cursor-not-allowed'
                          : 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30'
                      }`}
                    >
                      {timeLeft > 540 ? `Resend (${formatTime(timeLeft - 540)})` : 'Resend Code'}
                    </button>

                    <button
                      onClick={handleBack}
                      disabled={isLoading}
                      className="py-2.5 rounded-lg font-medium text-sm bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 border border-gray-500/30 transition-all duration-300"
                    >
                      ← Back to Login
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="text-center pt-6 border-t border-white/10">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <a 
                href="/register" 
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200 hover:underline"
              >
                Create one now
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}