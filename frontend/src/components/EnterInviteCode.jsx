import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../context/useChatStore';
import { Shield, Key, AlertCircle, Loader2, ArrowLeft, Zap, Info } from 'lucide-react';

export default function EnterInviteCode() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setPeer = useChatStore((state) => state.setPeer);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code) {
      toast.error('Please enter an invite code');
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.post(
        '/api/v1/user/connect',
        { invite_code: code },
        { withCredentials: true }
      );

      const connectedUser = res.data.connected_user;
      setPeer(connectedUser);
      toast.success(`Connected to ${connectedUser.username}!`);
      navigate('/chat');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid invite code');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = code.length > 0;

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
            <Key className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-400 drop-shadow-[0_0_15px_#ff00ff]">
            Join the Matrix
          </h1>
          <p className="text-cyan-400 text-sm opacity-90">
            Enter your invite code to connect with someone special
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Enhanced Invite Code Field */}
          <div className="space-y-2">
            <label className="text-cyan-400 font-semibold mb-2 flex items-center gap-2">
              <Key className="w-4 h-4" />
              Invite Code
            </label>
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter your quantum key..."
                className="w-full bg-black/50 backdrop-blur border border-pink-500/70 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 rounded-lg px-4 py-3 text-white outline-none placeholder-gray-500 transition-all duration-300 hover:border-pink-400 font-mono tracking-wider text-lg"
                onKeyPress={(e) => e.key === 'Enter' && code && !isLoading && handleSubmit(e)}
                disabled={isLoading}
                required
              />
              {code && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
            <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Ask your friend to share their invite code with you
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/50 rounded-xl p-4 text-center backdrop-blur">
              <div className="flex items-center justify-center mb-3">
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin mr-3" />
                <span className="text-cyan-400 font-semibold text-lg">Connecting...</span>
              </div>
              <div className="flex items-center justify-center text-gray-300 text-sm">
                <Shield className="w-4 h-4 mr-2" />
                Establishing secure quantum connection
              </div>
            </div>
          )}

          {/* Enhanced Connect Button */}
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
                Connecting...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Zap className="w-5 h-5 mr-2" />
                Connect Now
              </div>
            )}
          </button>
        </form>

     

        {/* Enhanced Back to Dashboard Link */}
        <div className="text-center mt-6 pt-6 border-t border-white/10">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-pink-400 hover:text-cyan-400 transition-colors font-medium hover:underline text-sm flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}