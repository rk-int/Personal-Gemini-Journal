import { User } from 'firebase/auth';
import { logOut } from '../lib/firebase';
import { Sparkles, ShieldCheck, LogOut, Plus, BookOpen, Database, Lock } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onNewEntry: () => void;
  onOpenSecurityModal: () => void;
  entriesCount: number;
}

export function Navbar({ user, onNewEntry, onOpenSecurityModal, entriesCount }: NavbarProps) {
  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 text-slate-800 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-tight text-slate-900">Personal Gemini Journal</span>
              <span className="text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Private Authenticated Reflection Studio</p>
          </div>
        </div>

        {/* Right: Actions and User Profile */}
        <div className="flex items-center gap-2.5">
          <button
            id="nav-security-btn"
            onClick={onOpenSecurityModal}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
            title="View Security & Firestore Isolation Architecture"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Security Model</span>
          </button>

          {user && (
            <>
              <button
                id="nav-new-entry-btn"
                onClick={onNewEntry}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white transition shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Reflection</span>
              </button>

              <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

              <div className="flex items-center gap-2 pl-1">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User Avatar'}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full ring-1 ring-slate-300 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center ring-1 ring-slate-200">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-medium text-slate-800 leading-none truncate max-w-[140px]">
                    {user.displayName || (user.isAnonymous ? 'Guest Explorer' : user.email?.split('@')[0])}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate max-w-[140px]">
                    {user.email || 'Anonymous Session'}
                  </p>
                </div>

                <button
                  id="nav-logout-btn"
                  onClick={handleSignOut}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition ml-1"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
