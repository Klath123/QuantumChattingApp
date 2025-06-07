import React, { useState, useEffect, useRef } from 'react';

// SVG Icons as components
const Shield = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const OvercloakLogo = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="32" r="30" fill="#7c3aed" opacity="0.15"/>
    <path d="M32 8C20 8 12 16 12 28c0 12 8 20 20 28 12-8 20-16 20-28 0-12-8-20-20-20z" fill="#7c3aed" stroke="#a21caf" strokeWidth="2"/>
    <rect x="24" y="28" width="16" height="14" rx="4" fill="#fff" stroke="#a21caf" strokeWidth="2"/>
    <circle cx="32" cy="35" r="2" fill="#7c3aed"/>
    <rect x="30" y="37" width="4" height="5" rx="2" fill="#a21caf"/>
  </svg>
);
const Users = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MessageCircle = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const Lock = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const Zap = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const Globe = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const TrendingUp = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const CheckCircle = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ArrowRight = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

const Cpu = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
  </svg>
);

const Network = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 14h.01" />
  </svg>
);

const Eye = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

export default function Home() {
  const [stats, setStats] = useState({
    activeUsers: 0,
    messagesEncrypted: 0,
    quantumResistantAlgorithms: 3,
    uptime: 99.9
  });
  
  const [isLoaded, setIsLoaded] = useState(false);
  const heroRef = useRef(null);
  const [visibleElements, setVisibleElements] = useState(new Set());

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleElements(prev => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Simulate API call for stats
  useEffect(() => {
    const fetchStats = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const targetStats = {
        activeUsers: 12847,
        messagesEncrypted: 2847391,
        quantumResistantAlgorithms: 3,
        uptime: 99.97
      };

      setStats(targetStats);
      setIsLoaded(true);
    };

    fetchStats();
  }, []);

  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Post-Quantum Security",
      description: "Built with Kyber and Dilithium algorithms to resist quantum computer attacks",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: "End-to-End Encryption",
      description: "Your messages are encrypted on your device and can only be read by intended recipients",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Lightning Fast",
      description: "Quantum-resistant doesn't mean slow. Experience real-time messaging without compromise",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Global Infrastructure",
      description: "Distributed servers across the globe ensure reliability and low latency worldwide",
      color: "from-green-500 to-teal-500"
    }
  ];

  const CountUp = ({ end, duration = 2000, suffix = "" }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!isLoaded) return;
      
      let startTime;
      const animate = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(end * easeOut));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }, [end, duration, isLoaded]);

    return <span>{count.toLocaleString()}{suffix}</span>;
  };

  // Particle system for background
  const ParticleBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Simple floating dots
      const particles = Array.from({ length: 20 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.3 + 0.1
      }));

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach((particle) => {
          particle.x += particle.vx;
          particle.y += particle.vy;
          
          if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
          if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
          
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(147, 51, 234, ${particle.opacity})`;
          ctx.fill();
        });
        
        requestAnimationFrame(animate);
      };
      
      animate();
      
      const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{ zIndex: 1 }}
      />
    );
  };

  const SimpleBackground = () => (
    <div className="fixed inset-0 pointer-events-none z-0">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 transform -translate-x-1/2 -translate-y-1/2"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Simple Background */}
      <SimpleBackground />
      
      {/* Subtle Particle Background */}
      <ParticleBackground />

            {/* Hero Section */}
      <div className="relative z-10" ref={heroRef}>
        <div className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <OvercloakLogo className="w-20 h-20 drop-shadow-lg" />
            </div>
            <div 
              className="inline-flex items-center space-x-2 bg-purple-900/30 backdrop-blur-sm border border-purple-500/30 px-4 py-2 rounded-full mb-8 transform transition-all duration-700 hover:scale-105"
              style={{
                animation: 'slideInDown 1s ease-out'
              }}
            >
              <Shield className="w-5 h-5 text-purple-400 animate-pulse" />
              <span className="text-purple-300 text-sm font-medium">Quantum-Resistant Technology</span>
            </div>
            
            <h1 
              className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight"
              style={{
                animation: 'fadeInUp 1s ease-out 0.2s both',
                textShadow: '0 0 30px rgba(147, 51, 234, 0.5)'
              }}
            >
              Welcome to{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
                Overcloak
              </span>
            </h1>
            
            <p 
              className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
              style={{
                animation: 'fadeInUp 1s ease-out 0.4s both'
              }}
            >
              Secure the Future of Communication — Today.
              <br />
              <span className="text-purple-400 font-semibold">The only messaging platform ready for the quantum age.</span>
            </p>

            <div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              style={{
                animation: 'fadeInUp 1s ease-out 0.6s both'
              }}
            >
              <button className="group bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden">
                <span className="relative z-10">Start Secure Chat</span>
                <ArrowRight className="inline-block ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-blue-700 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </button>
              <button className="group border-2 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 relative overflow-hidden">
                <span className="relative z-10">Learn More</span>
                <div className="absolute inset-0 bg-purple-500 transform translate-y-full group-hover:translate-y-0 transition-transform"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Stats Section */}
      <div 
        className="bg-black/20 backdrop-blur-sm border-y border-purple-500/20 py-16 relative"
        data-animate
        id="stats"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: stats.activeUsers, label: "Active Users", icon: <Users className="w-8 h-8 mb-2 mx-auto text-purple-400" /> },
              { value: stats.messagesEncrypted, label: "Messages Encrypted", icon: <MessageCircle className="w-8 h-8 mb-2 mx-auto text-blue-400" /> },
              { value: stats.quantumResistantAlgorithms, label: "PQ Algorithms", icon: <Cpu className="w-8 h-8 mb-2 mx-auto text-pink-400" /> },
              { value: stats.uptime, label: "Uptime", icon: <TrendingUp className="w-8 h-8 mb-2 mx-auto text-green-400" />, suffix: "%" }
            ].map((stat, index) => (
              <div 
                key={index}
                className={`space-y-2 transform transition-all duration-700 ${
                  visibleElements.has('stats') ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {stat.icon}
                <div className="text-4xl font-bold text-white">
                  <CountUp end={stat.value} suffix={stat.suffix || ""} />
                </div>
                <div className="text-purple-300 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20" data-animate id="features">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 
              className={`text-4xl font-bold text-white mb-4 transform transition-all duration-700 ${
                visibleElements.has('features') ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
            >
              Quantum-Ready Features
            </h2>
            <p 
              className={`text-gray-300 text-lg max-w-2xl mx-auto transform transition-all duration-700 delay-200 ${
                visibleElements.has('features') ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
            >
              Experience the future of secure communication with our advanced post-quantum cryptographic features
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`group bg-black/20 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 hover:border-purple-400/40 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl relative overflow-hidden transform ${
                  visibleElements.has('features') ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                <div className="relative z-10">
                  <div className="text-purple-400 mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-3 group-hover:text-purple-300 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed group-hover:text-gray-200 transition-colors">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* About Section with Enhanced Animations */}
      <div className="container mx-auto px-6 py-20" data-animate id="about">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div 
            className={`transform transition-all duration-700 ${
              visibleElements.has('about') ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
            }`}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Who are we?
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              We are a team of forward-thinking cryptographers and engineers dedicated to protecting digital communication from the looming threat of quantum computers. Our platform, PostQuantumChat, is built with cutting-edge post-quantum cryptography to safeguard your conversations from even the most advanced adversaries.
            </p>
            
            <div className="space-y-4">
              {[
                { title: "Expert Team", desc: "PhD cryptographers and security researchers" },
                { title: "Open Source", desc: "Transparent algorithms audited by the community" },
                { title: "NIST Approved", desc: "Using standardized post-quantum algorithms" }
              ].map((item, index) => (
                <div 
                  key={index}
                  className={`flex items-start space-x-3 transform transition-all duration-500 ${
                    visibleElements.has('about') ? 'translate-x-0 opacity-100' : '-translate-x-5 opacity-0'
                  }`}
                  style={{ transitionDelay: `${(index + 1) * 200}ms` }}
                >
                  <CheckCircle className="w-6 h-6 text-green-400 mt-1 flex-shrink-0 animate-pulse" />
                  <div>
                    <h3 className="text-white font-semibold">{item.title}</h3>
                    <p className="text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div 
            className={`relative transform transition-all duration-700 delay-300 ${
              visibleElements.has('about') ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'
            }`}
          >
            <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 transform scale-0 group-hover:scale-100 transition-transform duration-500 origin-center"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-6">Why Post-Quantum Cryptography?</h3>
                <div className="space-y-4 text-gray-300">
                  <p className="transform transition-all duration-300 hover:translate-x-2 hover:text-white">
                    Classical encryption like RSA and ECC is vulnerable to quantum attacks using Shor's algorithm.
                  </p>
                  <p className="transform transition-all duration-300 hover:translate-x-2 hover:text-white">
                    With the rise of quantum computing, encrypted messages today could be stored and cracked tomorrow.
                  </p>
                  <p className="text-purple-400 font-semibold transform transition-all duration-300 hover:translate-x-2 hover:text-purple-300">
                    PQC algorithms like Kyber (for key exchange) and Dilithium (for digital signatures) are designed to resist such attacks — ensuring your privacy remains unbroken, forever.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

     {/* CTA Section */}
      <div className="container mx-auto px-6 py-20" data-animate id="cta">
        <div 
          className={`text-center bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-12 relative overflow-hidden group transform transition-all duration-700 ${
            visibleElements.has('cta') ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-blue-600/30 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold text-white mb-6 animate-pulse">
              Join the Resistance.
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Say goodbye to outdated security and embrace a quantum-resistant future. 
              Connect securely. Chat freely.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="group bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-10 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center space-x-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 transform translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                <MessageCircle className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Start Chatting Now</span>
              </button>
              <button className="group border-2 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white px-10 py-4 rounded-lg font-semibold text-lg transition-all duration-300 flex items-center space-x-2 relative overflow-hidden">
                <TrendingUp className="w-5 h-5 transform group-hover:rotate-12 transition-transform" />
                <span>View Documentation</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-purple-500/20 bg-black/20 backdrop-blur-sm py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-400 animate-pulse">
            © 2025 PostQuantumChat. Securing communications for the quantum age.
          </p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translate3d(0, -100px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translate3d(0, 30px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
      `}</style>
    </div>
  );
}