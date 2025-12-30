
import React, { useState, useEffect } from 'react';
import { SupabaseService } from '../services/supabase';
import { Profile } from '../types';
import { Check, X, User, Landmark, ShieldCheck, Mail, Loader2, RefreshCw } from 'lucide-react';

export const AdminView: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const users = await SupabaseService.getPendingProfiles();
    setPendingUsers(users);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAction = async (id: string, approve: boolean) => {
    await SupabaseService.updateStatus(id, approve ? 'approved' : 'rejected');
    fetchUsers();
  };

  return (
    <div className="h-full bg-[#FBF9F6] flex flex-col overflow-hidden">
      <div className="p-6 bg-white border-b border-[#E5E1DA] flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="serif text-2xl font-bold text-[#6B0000]">Admin Panel</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Pending Approvals</p>
        </div>
        <button onClick={fetchUsers} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-[#6B0000] transition-colors">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-[#6B0000] animate-spin mb-4" />
            <p className="text-slate-400 serif italic">Syncing with Conference...</p>
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-10 h-10 text-emerald-100" />
            </div>
            <p className="serif text-xl font-bold text-slate-800">All Clear</p>
            <p className="text-slate-500 text-sm mt-2">No users currently awaiting approval.</p>
          </div>
        ) : (
          pendingUsers.map(user => (
            <div key={user.id} className="bg-white rounded-3xl p-6 shadow-sm border border-[#E5E1DA] animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-[#6B0000]/5 rounded-2xl flex items-center justify-center shrink-0">
                  <User className="w-6 h-6 text-[#6B0000]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="serif text-lg font-bold text-slate-900 truncate">{user.full_name}</h3>
                  <div className="flex items-center gap-2 text-slate-400 text-xs mt-1">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-xs mt-0.5">
                    <Landmark className="w-3 h-3" />
                    <span className="truncate">{user.church}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => handleAction(user.id, true)}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Check className="w-5 h-5" />
                  Approve
                </button>
                <button 
                   onClick={() => handleAction(user.id, false)}
                   className="px-6 py-3 bg-slate-100 text-slate-400 rounded-2xl font-bold flex items-center justify-center hover:bg-red-50 hover:text-red-500 active:scale-95 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
