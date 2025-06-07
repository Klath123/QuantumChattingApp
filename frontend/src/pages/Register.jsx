import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Shield, Lock, User, Mail, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { generateAndReturnPQKeys } from '../utils/crypto'; // Make sure this path is correct

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      toast.error('Please fill all fields');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // ✅ Generate post-quantum key pairs (Base64-encoded)
      toast.info('Generating quantum-secure keys...', { autoClose: 2000 });
      const keys = await generateAndReturnPQKeys();
      console.log(keys)
      
      // ✅ Store private keys locally (Base64 format)
      localStorage.setItem('kyberPrivate', keys.kyber.privateKey);
      localStorage.setItem('dilithiumPrivate', keys.dilithium.privateKey);
      console.log('=== SENDING DATA ===');
      console.log('Username:', username);
      console.log('Email:', email);
      console.log('Password length:', password.length);
      console.log('Kyber key sample:', keys.kyber.publicKey);
      console.log('Dilithium key sample:', keys.dilithium.publicKey);
      console.log('==================');

      // ✅ Send user data + public keys to backend
      const res = await axios.post('/api/v1/auth/register', {
        username,
        email,
        password,
        kyberPublicKey: keys.kyber.publicKey,
        dilithiumPublicKey: keys.dilithium.publicKey,
      });

      toast.success(res.data.msg || 'Registered successfully! Check your email for welcome message.');
      
      // Show invite code if provided
      if (res.data.invite_code) {
        toast.info(`Your invite code: ${res.data.invite_code}`, { 
          autoClose: 10000,
          hideProgressBar: false 
        });
      }

      navigate('/login');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = username && email && password && confirmPassword && 
                     validateEmail(email) && validatePassword(password) && 
                     password === confirmPassword;

  const getFieldStatus = (value, validator) => {
    if (!value) return 'default';
    return validator(value) ? 'valid' : 'invalid';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white flex items-center justify-center pt-10 overflow-hidden relative">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div>

      <div className="bg-[#0e0e0e]/80 backdrop-blur-xl border border-pink-500/50 shadow-[0_0_50px_#ff00ff40] rounded-2xl p-10 w-full max-w-md space-y-6 relative z-10">
        {/* Enhanced Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-2xl mb-4 shadow-lg animate-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-400 drop-shadow-[0_0_15px_#ff00ff]">
            Join the Matrix
          </h1>
          <p className="text-cyan-400 text-sm opacity-90">
            Create your quantum-secure account
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          {/* Enhanced Username Field */}
          <div className="space-y-2">
            <label className="text-cyan-400 font-semibold mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="neo_the_one"
                className="w-full bg-black/50 backdrop-blur border border-pink-500/70 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 rounded-lg px-4 py-3 text-white outline-none placeholder-gray-500 transition-all duration-300 hover:border-pink-400"
                disabled={isLoading}
                required
              />
              {username && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Email Field */}
          <div className="space-y-2">
            <label className="text-cyan-400 font-semibold mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="neo@matrix.com"
                className={`w-full bg-black/50 backdrop-blur border rounded-lg px-4 py-3 text-white outline-none placeholder-gray-500 transition-all duration-300 ${
                  email && !validateEmail(email) 
                    ? 'border-red-500/70 focus:ring-2 focus:ring-red-400 focus:border-red-400' 
                    : email && validateEmail(email)
                    ? 'border-green-500/70 focus:ring-2 focus:ring-green-400 focus:border-green-400'
                    : 'border-pink-500/70 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 hover:border-pink-400'
                }`}
                disabled={isLoading}
                required
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {getFieldStatus(email, validateEmail) === 'valid' && (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                )}
                {getFieldStatus(email, validateEmail) === 'invalid' && (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
              </div>
            </div>
            {email && !validateEmail(email) && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Please enter a valid email address
              </p>
            )}
          </div>

          {/* Enhanced Password Field */}
          <div className="space-y-2">
            <label className="text-cyan-400 font-semibold mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full bg-black/50 backdrop-blur border rounded-lg px-4 py-3 pr-12 text-white outline-none placeholder-gray-500 transition-all duration-300 ${
                  password && !validatePassword(password)
                    ? 'border-red-500/70 focus:ring-2 focus:ring-red-400 focus:border-red-400'
                    : password && validatePassword(password)
                    ? 'border-green-500/70 focus:ring-2 focus:ring-green-400 focus:border-green-400'
                    : 'border-pink-500/70 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 hover:border-pink-400'
                }`}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {password && !validatePassword(password) && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Password must be at least 8 characters
              </p>
            )}
          </div>

          {/* Enhanced Confirm Password Field */}
          <div className="space-y-2">
            <label className="text-cyan-400 font-semibold mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full bg-black/50 backdrop-blur border rounded-lg px-4 py-3 pr-12 text-white outline-none placeholder-gray-500 transition-all duration-300 ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-red-500/70 focus:ring-2 focus:ring-red-400 focus:border-red-400'
                    : confirmPassword && password === confirmPassword
                    ? 'border-green-500/70 focus:ring-2 focus:ring-green-400 focus:border-green-400'
                    : 'border-pink-500/70 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 hover:border-pink-400'
                }`}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Passwords do not match
              </p>
            )}
          </div>

          {/* Enhanced Key Generation Info */}
          {isLoading && (
            <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/50 rounded-xl p-4 text-center backdrop-blur">
              <div className="flex items-center justify-center mb-3">
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin mr-3" />
                <span className="text-cyan-400 font-semibold text-lg">Generating Keys...</span>
              </div>
              <div className="flex items-center justify-center text-gray-300 text-sm">
                <Shield className="w-4 h-4 mr-2" />
                Creating quantum-resistant cryptographic keys
              </div>
            </div>
          )}

          {/* Enhanced Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={`w-full py-4 mt-6 rounded-lg font-bold tracking-wider text-white transition-all duration-300 transform ${
              !isFormValid || isLoading
                ? 'bg-gray-700/50 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-pink-600 to-cyan-600 hover:from-pink-500 hover:to-cyan-500 hover:scale-[1.02] hover:shadow-[0_0_25px_#ff00ff60] shadow-lg'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin mr-3" />
                Creating Account...
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Enhanced Security Notice */}
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 rounded-xl p-4 mt-6 backdrop-blur">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-yellow-500/80 rounded-full flex items-center justify-center mr-3">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-yellow-300 font-semibold text-sm mb-1">Security Notice</p>
              <p className="text-gray-300 text-xs leading-relaxed">
                Your private keys are stored locally and never sent to our servers. 
                Keep them safe - they cannot be recovered if lost.
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Login Link */}
        <div className="text-center mt-6 pt-6 border-t border-white/10">
          <p className="text-gray-400 text-sm">
            Already have an account?{' '}
            <a href="/login" className="text-pink-400 hover:text-cyan-400 transition-colors font-medium hover:underline">
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}