import { X, ShieldCheck, Lock, Database, Server, KeyRound, AlertTriangle } from 'lucide-react';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SecurityModal({ isOpen, onClose }: SecurityModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-700/60 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Agentic Threat Model & Security Directives</h2>
              <p className="text-xs text-slate-400">OWASP Top 10 & 5 Threat Zones Architectural Defense</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Threat Summary Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Threat Summary Table (The 5 Threat Zones)
          </h3>
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-700">
                  <th className="p-3">Threat Zone</th>
                  <th className="p-3">Specific Risk / Vector</th>
                  <th className="p-3">Active Defense Countermeasure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr className="hover:bg-slate-800/30">
                  <td className="p-3 font-medium text-emerald-300">1. Input Surfaces</td>
                  <td className="p-3">Untrusted user prompts, malformed JSON bodies, payload injection.</td>
                  <td className="p-3">Strict schema sanitization, express payload limits, and type parameterization.</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="p-3 font-medium text-emerald-300">2. Planning & Reasoning</td>
                  <td className="p-3">Indirect prompt injection, persona hijack, malicious system override.</td>
                  <td className="p-3">Strict system instruction separation and structured Gemini parsing.</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="p-3 font-medium text-emerald-300">3. Tool Execution</td>
                  <td className="p-3">Uncontrolled API consumption, model unavailability, rate exhaustion.</td>
                  <td className="p-3">Resilient 4-tier model fallback ladder (3.6 Flash → 3.1 Flash-Lite → Latest → 3.7 Flash).</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="p-3 font-medium text-emerald-300">4. Memory & State</td>
                  <td className="p-3">Cross-tenant data leakage, unauthorized read/write access in Firestore.</td>
                  <td className="p-3">
                    Strict Firestore security rules enforcing <code className="text-emerald-400">request.auth.uid == userId</code> on all paths.
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="p-3 font-medium text-emerald-300">5. Inter-System Comm</td>
                  <td className="p-3">Leaking Gemini API keys or service credentials to the client browser.</td>
                  <td className="p-3">Server-side proxy routes (<code className="text-emerald-300">/api/*</code>) and Secret Manager env-injection.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Firestore Rules Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              Active Firestore Security Rules (Zero Insecure Defaults)
            </span>
            <span className="text-[11px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
              ✓ Deployed & Enforced
            </span>
          </div>
          <pre className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/entries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`}
          </pre>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Close Security View
          </button>
        </div>
      </div>
    </div>
  );
}
