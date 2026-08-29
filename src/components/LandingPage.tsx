import { useState } from 'react';
import { signInWithGoogle, signInAsGuest } from '../lib/firebase';
import { Sparkles, Shield, Lock, Database, Brain, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface LandingPageProps {
  onOpenSecurityModal: () => void;
}

export function LandingPage({ onOpenSecurityModal }: LandingPageProps) {
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign in error:', err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        setErrorMsg('Sign-in popup was blocked or closed. You can also use Quick Guest Sign-In below or allow popups for this site.');
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setGuestLoading(true);
      setErrorMsg(null);
      await signInAsGuest();
    } catch (err: any) {
      console.error('Guest sign in error:', err);
      setErrorMsg(err.message || 'Guest session initialization failed.');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Top Banner & Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-4">
        {/* Left Column: Value Prop */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Powered by Gemini 3.6 Flash & Firebase Firestore</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.15]">
            A private space for <span className="text-emerald-700">meaningful reflection</span> and cognitive clarity.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
            Personal Gemini Journal pairs your personal thoughts with Google's Gemini 3.6 Flash model. Converse across multi-turn journal sessions, uncover hidden insights, and automatically synthesize reflections—all securely isolated in your private Cloud Firestore vault.
          </p>

          {/* Auth Action Box */}
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs max-w-xl space-y-4">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Authenticate to Access Your Vault</span>
            </h2>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p>{errorMsg}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Google Sign In Button */}
              <button
                id="landing-google-signin-btn"
                onClick={handleGoogleSignIn}
                disabled={loading || guestLoading}
                className="flex-1 flex items-center justify-center gap-3 px-5 py-2.5 rounded-lg font-medium text-sm bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.99] transition shadow-xs disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Sign in with Google</span>
              </button>

              {/* Guest Sign In for test fallback */}
              <button
                id="landing-guest-signin-btn"
                onClick={handleGuestSignIn}
                disabled={loading || guestLoading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition disabled:opacity-50"
              >
                {guestLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-500/30 border-t-slate-700 rounded-full animate-spin" />
                ) : (
                  <span>Guest Demo Mode</span>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              Protected by Firebase OAuth. No passwords stored. Isolated per user UID.
            </p>
          </div>
        </div>

        {/* Right Column: Architecture & Feature Highlights */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 text-slate-100 p-6 rounded-xl border border-slate-800 shadow-lg space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Security & Architecture</span>
              <button
                onClick={onOpenSecurityModal}
                className="text-xs text-slate-300 hover:text-white underline underline-offset-4 flex items-center gap-1"
              >
                <span>View Threat Matrix</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-950/70 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Firebase Federated Auth</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Google OAuth token exchange without local password exposure or plaintext credential storage.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Firestore Owner-Bound Isolation</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Strict rules enforce <code className="text-emerald-300 text-[11px]">request.auth.uid == userId</code> to block cross-tenant read/write leaks.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Gemini 3.6 Flash & Fallback Ladder</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Multi-turn conversational reflections with automated fallback resilience (3.6 Flash → 3.1 Flash-Lite → 3.7 Flash).
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Zero-Hardcoded Secrets
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Secret Manager Bound
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-slate-200 mt-12">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">01. Conversational Reflections</span>
          <h3 className="font-bold text-base text-slate-900">Multi-Turn Thought Partnership</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Choose between Socratic probing, creative brainstorming, or action-oriented coaching for every reflection session.
          </p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">02. Automated Synthesis</span>
          <h3 className="font-bold text-base text-slate-900">Key Insights & Action Steps</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Generate high-level session summaries, extract emotional mood indicators, and structure tangible micro-actions.
          </p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">03. Persistent History</span>
          <h3 className="font-bold text-base text-slate-900">Searchable Firestore Vault</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Access past journal entries anytime with instant real-time synchronization, tag filtering, and markdown export.
          </p>
        </div>
      </div>
    </div>
  );
}
