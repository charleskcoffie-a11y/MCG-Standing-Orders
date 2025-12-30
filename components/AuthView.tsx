
import React, { useState } from 'react';
import { SupabaseService } from '../services/supabase';
import { Loader2, Mail, User, ShieldCheck, Landmark, Lock, AtSign } from 'lucide-react';

interface AuthViewProps {
  onAuthenticated: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthenticated }) => {
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
    <div className="flex-1 flex flex-col bg-[#FBF9F6] p-8 justify-center min-h-screen">
      <div className="mb-10 text-center">
        <div className="w-20 h-20 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-6 border-t border-slate-100">
           <Landmark className="w-10 h-10 text-[#6B0000]" />
        </div>
        <h1 className="serif text-3xl font-black text-[#6B0000] mb-2">Methodist Law</h1>
        <p className="text-slate-500 font-medium italic">Official Digital Reference</p>
      </div>

      <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-[#E5E1DA]">
        <h2 className="serif text-xl font-bold mb-6 text-slate-800">
          {isLogin ? 'Sign In' : 'Register Account'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {isLogin ? (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#6B0000]/20 focus:border-[#6B0000] transition-all outline-none"
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
      </div>

      <div className="mt-12 text-center text-slate-400 text-[10px] uppercase tracking-widest font-bold">
        <p>Managed by Methodist Church Information Technology</p>
      </div>
    </div>
  );
};
