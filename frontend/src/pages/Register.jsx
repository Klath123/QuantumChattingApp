import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { generateAndReturnPQKeys } from '../utils/crypto';

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
      // Generate post-quantum key pairs
      toast.info('Generating quantum-secure keys...', { autoClose: 2000 });
      const keys = await generateAndReturnPQKeys();
      console.log(keys)
      
      // Store private keys locally
      localStorage.setItem('kyberPrivate', keys.kyber.privateKey);
      localStorage.setItem('dilithiumPrivate', keys.dilithium.privateKey);
      console.log('=== SENDING DATA ===');
      console.log('Username:', username);
      console.log('Email:', email);
      console.log('Password length:', password.length);
      console.log('Kyber key sample:', keys.kyber.publicKey);
      console.log('Dilithium key sample:', keys.dilithium.publicKey);
      console.log('==================');

      // Send user data + public keys to backend
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md border border-gray-200">
        {/* Header */}
        <div className="text-center mb-8">
        
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Account
          </h1>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          {/* Username Field */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 rounded-xl px-4 py-3 text-gray-900 outline-none transition-all"
              disabled={isLoading}
              required
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className={`w-full border rounded-xl px-4 py-3 text-gray-900 outline-none transition-all ${
                email && !validateEmail(email) 
                  ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                  : email && validateEmail(email)
                  ? 'border-green-500 focus:border-green-500 focus:ring-1 focus:ring-green-500'
                  : 'border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900'
              }`}
              disabled={isLoading}
              required
            />
            {email && !validateEmail(email) && (
              <p className="text-red-500 text-sm mt-1">
                Please enter a valid email address
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={`w-full border rounded-xl px-4 py-3 pr-12 text-gray-900 outline-none transition-all ${
                  password && !validatePassword(password)
                    ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    : password && validatePassword(password)
                    ? 'border-green-500 focus:border-green-500 focus:ring-1 focus:ring-green-500'
                    : 'border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900'
                }`}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {password && !validatePassword(password) && (
              <p className="text-red-500 text-sm mt-1">
                Password must be at least 8 characters
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className={`w-full border rounded-xl px-4 py-3 pr-12 text-gray-900 outline-none transition-all ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    : confirmPassword && password === confirmPassword
                    ? 'border-green-500 focus:border-green-500 focus:ring-1 focus:ring-green-500'
                    : 'border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900'
                }`}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-red-500 text-sm mt-1">
                Passwords do not match
              </p>
            )}
          </div>

          {/* Key Generation Loading */}
          {isLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <div className="text-blue-600 font-medium mb-1">Generating Keys...</div>
              <div className="text-blue-500 text-sm">
                Creating quantum-resistant cryptographic keys
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={`w-full py-3 rounded-xl font-medium transition-all ${
              !isFormValid || isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg hover:shadow-xl'
            }`}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Security Notice */}
       
        {/* Login Link */}
        <div className="text-center mt-6 pt-6 border-t border-gray-200">
          <p className="text-gray-600 text-sm">
            Already have an account?{' '}
            <a href="/login" className="text-gray-900 hover:underline font-medium">
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}