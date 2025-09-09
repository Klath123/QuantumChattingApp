import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../context/useChatStore';
import Navbar from '../components/navbar';

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
    <>
    <Navbar />
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md border border-gray-200">
        {/* Header */}
        <div className="text-center mb-8">
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Connect with Friend
          </h1>
          <p className="text-gray-600 text-sm">
            Enter your invite code to start a secure conversation
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invite Code Field */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Invite Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter invite code"
              className="w-full border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 rounded-xl px-4 py-3 text-gray-900 outline-none transition-all font-mono tracking-wider text-lg"
              onKeyPress={(e) => e.key === 'Enter' && code && !isLoading && handleSubmit(e)}
              disabled={isLoading}
              required
            />
            
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <div className="text-blue-600 font-medium mb-1">Connecting...</div>
              <div className="text-blue-500 text-sm">
                Establishing secure connection
              </div>
            </div>
          )}

          {/* Connect Button */}
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={`w-full py-3 rounded-xl font-medium transition-all ${
              !isFormValid || isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg hover:shadow-xl'
            }`}
          >
            {isLoading ? 'Connecting...' : 'Connect Now'}
          </button>
        </form>

        {/* Back to Dashboard Link */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => navigate('/chat')}
            className="text-gray-900 hover:underline font-medium text-sm"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
    </>
  );
}