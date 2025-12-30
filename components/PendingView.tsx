
import React, { useEffect, useState } from 'react';
import { SupabaseService } from '../services/supabase';
import { Loader2, ShieldAlert, LogOut, Clock } from 'lucide-react';
import { Profile } from '../types';

interface PendingViewProps {
  user: Profile;
  onStatusUpdate: () => void;
  onSignOut: () => void;
}

export const PendingView: React.FC<PendingViewProps> = ({ user, onStatusUpdate, onSignOut }) => {
  const [status, setStatus] = useState(user.status);

  useEffect(() => {
    const unsub = SupabaseService.subscribeToStatus(user.id, (newStatus) => {
      if (newStatus !== status) {
        setStatus(newStatus);
        if (newStatus === 'approved') {
          onStatusUpdate();
        }
      }
    });
    return unsub;
  }, [user.id, status, onStatusUpdate]);

  if (status === 'rejected') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#FBF9F6] text-center">
        <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-6 text-red-500">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h2 className="serif text-2xl font-bold text-slate-800 mb-2">Access Declined</h2>
        <p className="text-slate-500 mb-8 max-w-[260px]">Your registration request was not approved. Please contact your District Administrator for clarification.</p>
        <button 
          onClick={onSignOut}
          className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl font-bold active:scale-95 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#FBF9F6] text-center">
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center">
          <Clock className="w-12 h-12 text-[#6B0000] animate-pulse" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-500 rounded-full border-4 border-[#FBF9F6] flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        </div>
      </div>
      <h2 className="serif text-2xl font-bold text-slate-800 mb-2">Awaiting Approval</h2>
      <p className="text-slate-500 mb-2 font-medium">Thank you, {user.full_name}.</p>
      <p className="text-sm text-slate-400 mb-10 max-w-[240px]">An administrator has been notified. This screen will refresh automatically once you are approved.</p>
      
      <div className="bg-white p-6 rounded-2xl border border-[#E5E1DA] w-full max-w-[300px] text-left">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">Request Details</span>
        </div>
        <p className="text-sm font-bold text-slate-700">{user.church}</p>
        <p className="text-xs text-slate-400">{user.email}</p>
      </div>

      <button 
        onClick={onSignOut}
        className="mt-12 flex items-center gap-2 text-slate-400 font-bold hover:text-slate-600 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Cancel Request
      </button>
    </div>
  );
};
