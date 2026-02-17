import React, { useState, useEffect } from 'react';
import { Lock, Delete, ChevronRight, Fingerprint } from 'lucide-react';
import { User } from '../types';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  // HARDCODED CORRECT PIN FOR DEMO
  const CORRECT_PIN = "2025";

  useEffect(() => {
    if (pin.length === 4) {
      handleVerify();
    }
  }, [pin]);

  const handleVerify = () => {
    if (pin === CORRECT_PIN) {
      setLoading(true);
      setError(false);
      
      // Simulate API delay
      setTimeout(() => {
        onLogin({
          name: 'Traveler',
          email: 'traveler@example.com',
          avatar: `https://ui-avatars.com/api/?name=Traveler&background=0d9488&color=fff`
        });
      }, 800);
    } else {
      setError(true);
      setTimeout(() => {
        setPin('');
        setError(false);
      }, 400);
    }
  };

  const handlePress = (num: string) => {
    if (pin.length < 4 && !loading) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const handleDelete = () => {
    if (!loading) {
      setPin(prev => prev.slice(0, -1));
      setError(false);
    }
  };

  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-900">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=2021" 
          alt="Travel Background" 
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40"></div>
      </div>

      <div className="relative z-10 w-full max-w-sm px-6">
        <div className="flex flex-col items-center">
          
          <div className="bg-white/10 p-4 rounded-full backdrop-blur-md mb-6 shadow-2xl ring-1 ring-white/20">
            <Lock className="w-8 h-8 text-teal-400" />
          </div>

          <h1 className="text-3xl font-serif font-bold text-white mb-2 tracking-wide">Enter PIN</h1>
          <p className="text-slate-400 mb-8 text-sm">Please enter access code to continue</p>

          {/* PIN Dots */}
          <div className={`flex gap-6 mb-10 transition-transform duration-200 ${error ? 'translate-x-[-5px] animate-pulse' : ''}`}>
            {[0, 1, 2, 3].map((i) => (
              <div 
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  pin.length > i 
                    ? 'bg-teal-400 scale-110 shadow-[0_0_15px_rgba(45,212,191,0.5)]' 
                    : 'bg-slate-700 border border-slate-600'
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="absolute top-64 text-red-400 text-sm font-medium animate-bounce">
              Incorrect PIN. Try 2025.
            </div>
          )}

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-x-8 gap-y-6 w-full max-w-[280px]">
            {numbers.map((num, idx) => {
              if (num === '') return <div key={idx}></div>;
              
              if (num === 'del') return (
                <button
                  key={idx}
                  onClick={handleDelete}
                  className="w-16 h-16 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition active:scale-95"
                >
                  <Delete className="w-6 h-6" />
                </button>
              );

              return (
                <button
                  key={idx}
                  onClick={() => handlePress(num)}
                  disabled={loading}
                  className="w-16 h-16 rounded-full border border-slate-700 bg-slate-800/40 text-2xl font-medium text-white hover:bg-teal-600 hover:border-teal-500 hover:shadow-lg hover:shadow-teal-500/20 transition-all active:scale-90 flex items-center justify-center backdrop-blur-sm"
                >
                  {num}
                </button>
              );
            })}
          </div>

          {loading && (
             <div className="mt-8 flex items-center gap-2 text-teal-400 animate-pulse">
                <Fingerprint className="w-5 h-5" />
                <span className="text-sm font-medium">Authenticating...</span>
             </div>
          )}
          
          <div className="mt-8 text-xs text-slate-500">
             TravelGuideAI Protected System
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginScreen;