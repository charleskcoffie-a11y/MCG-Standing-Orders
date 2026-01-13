
import React, { useState } from 'react';
import { SupabaseService } from '../services/supabase';
import { Loader2, Mail, User, ShieldCheck, Landmark, Lock, AtSign } from 'lucide-react';

interface AuthViewProps {
  onAuthenticated: () => void;
  onGuestLogin?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthenticated, onGuestLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState(''); // Email or Username
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [church, setChurch] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const user = await SupabaseService.signIn(identifier, password);
        if (!user) {
          alert("Account not found. Please register first, or use 'admin' / '1927'");
        }
      } else {
        await SupabaseService.signUp(email, username, fullName, church, password);
      }
      onAuthenticated();
    } catch (err: any) {
      alert(err.message || "Authentication error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen max-w-md mx-auto bg-[#FBF9F6] flex flex-col justify-center p-6 safe-area-inset">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-white rounded-[1.5rem] shadow-lg flex items-center justify-center mx-auto mb-4 transform -rotate-6 border border-slate-100">
           <Landmark className="w-8 h-8 text-[#6B0000]" />
        </div>
        <h1 className="serif text-2xl font-black text-[#6B0000] mb-1">Methodist Law</h1>
        <p className="text-slate-500 text-sm font-medium italic">Digital Reference</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#E5E1DA] mb-6">
        <h2 className="serif text-lg font-bold mb-5 text-slate-800">
          {isLogin ? 'Sign In' : 'Register Account'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          {isLogin ? (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                required
                className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-[#6B0000]/20 focus:border-[#6B0000] transition-all outline-none"
                placeholder="Username or Email"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
              />
            </div>
          ) : (
            <>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#6B0000]/20 focus:border-[#6B0000] transition-all outline-none"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                />
              </div>
              <div className="relative">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#6B0000]/20 focus:border-[#6B0000] transition-all outline-none"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  required
                  type="email"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#6B0000]/20 focus:border-[#6B0000] transition-all outline-none"
                  placeholder="Email Address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="relative">
                <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#6B0000]/20 focus:border-[#6B0000] transition-all outline-none"
                  placeholder="Church / District"
                  value={church}
                  onChange={e => setChurch(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              required
              type="password"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#6B0000]/20 focus:border-[#6B0000] transition-all outline-none"
              placeholder="Password (Admin: 1927)"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full py-4 bg-[#6B0000] text-white rounded-2xl font-bold text-lg shadow-lg shadow-[#6B0000]/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
            {isLogin ? 'Sign In' : 'Register'}
          </button>
        </form>

        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="w-full mt-6 text-center text-sm font-bold text-slate-500 hover:text-[#6B0000] transition-colors"
        >
          {isLogin ? "Need access? Request registration" : "Already have an account? Sign In"}
        </button>

        {onGuestLogin && (
          <button 
            onClick={onGuestLogin}
            className="w-full mt-3 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
          >
            Continue as Guest
          </button>
        )}
      </div>

      <div className="mt-8 text-center text-slate-400 text-[9px] uppercase tracking-wider font-bold">
        <p>Methodist Church Reference</p>
      </div>
    </div>
  );
};
