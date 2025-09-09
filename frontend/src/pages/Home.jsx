import React from 'react';

export default function Home() {
  return (
    <div className=" bg-white">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-20 mt-10">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Secure Messaging for the Future
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Quantum-resistant encryption that protects your conversations from tomorrow's threats.
          </p>
          
          <div className="space-x-4">
            <button className="bg-blue-600 text-white px-8 py-3 rounded font-medium hover:bg-blue-700" onClick={() => window.location.href = '/register'}>
              Get Started
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="text-center p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Post-Quantum Security</h3>
            <p className="text-gray-600">Protected against quantum computer attacks</p>
          </div>
          <div className="text-center p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">End-to-End Encrypted</h3>
            <p className="text-gray-600">Your messages stay private and secure</p>
          </div>
          <div className="text-center p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Lightning Fast</h3>
            <p className="text-gray-600">Real-time messaging without compromise</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-4 mt-15">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-gray-500">© 2025 Overcloak. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}