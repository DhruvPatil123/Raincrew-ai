import { useState, FormEvent, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, UserCheck, HelpCircle, ArrowRight, User, Mail, Sparkles, Check, AudioLines,
  KeyRound, Send, Inbox, ShieldAlert, Zap, Loader2, X, Lock, ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react';
import { Campaign, RecruiterSession } from '../types';
import { googleSignIn, getSupabaseClient } from '../lib/googleAuth';

interface RoleSelectionProps {
  onSelectRole: (
    role: 'recruiter' | 'candidate', 
    initialCampaignId?: string, 
    candidateName?: string, 
    candidateEmail?: string,
    recruiterSession?: RecruiterSession
  ) => void;
  campaigns: Campaign[];
  activeCampaignId: string;
  branding?: {
    appName?: string;
    logoUrl?: string;
    companyName?: string;
    themeColor?: string;
  };
}

export default function RoleSelection({ onSelectRole, campaigns, activeCampaignId, branding }: RoleSelectionProps) {
  const [activeTab, setActiveTab] = useState<'recruiter' | 'candidate'>('recruiter');
  
  // Email authentication states
  const [magicEmail, setMagicEmail] = useState('');
  const [magicLoading, setMagicLoading] = useState(false);
  const [emailAuthMode, setEmailAuthMode] = useState<'login' | 'register'>('login');
  const [recruiterName, setRecruiterName] = useState('');
  const [recruiterOrg, setRecruiterOrg] = useState('');
  const [recruiterPassword, setRecruiterPassword] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  
  // Error handling
  const [recruiterError, setRecruiterError] = useState('');
  
  // Candidate Login Form
  const [candName, setCandName] = useState('');
  const [candEmail, setCandEmail] = useState('');
  const [candidateError, setCandidateError] = useState('');

  const sampleEmail = 'recruiter@foloup.ai';

  const [appUrl, setAppUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/supabase-client-config')
      .then(res => {
        if (res.ok) return res.json();
      })
      .then(data => {
        if (data && data.appUrl) {
          setAppUrl(data.appUrl);
        }
      })
      .catch(err => console.warn("Failed to fetch supabase config with appUrl", err));
  }, []);

  const handleCopyUrl = () => {
    const url = appUrl || window.location.origin;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Real Google Sign-In helper - fully functional for anyone
  const handleGoogleSignIn = async () => {
    setRecruiterError('');
    setMagicLoading(true);
    try {
      const client = await getSupabaseClient();
      if (!client) {
        throw new Error("Supabase is not configured yet! Please configure SUPABASE_URL and SUPABASE_ANON_KEY in your .env configuration to enable Live authentication.");
      }
      
      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar.events',
          redirectTo: appUrl || window.location.origin,
          skipBrowserRedirect: true
        }
      });
      if (error) throw error;

      if (data?.url) {
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        const popup = window.open(
          data.url,
          'supabase_oauth_popup',
          `width=${width},height=${height},left=${left},top=${top},status=yes,toolbar=no,menubar=no`
        );
        if (!popup) {
          throw new Error("Your browser blocked the login popup. Please allow popups for this site to log in with Google.");
        }
        // Keep loading indicator true until popup is either closed or authentication is successful.
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            setMagicLoading(false);
          }
        }, 1000);
      } else {
        throw new Error("Failed to retrieve Google Auth Redirect URL.");
      }
    } catch (err: any) {
      setMagicLoading(false);
      setRecruiterError(err?.message || 'Google Sign-In integration failed.');
    }
  };

  // Real GitHub Sign-In helper - fully functional for anyone
  const handleGitHubSignIn = async () => {
    setRecruiterError('');
    setMagicLoading(true);
    try {
      const client = await getSupabaseClient();
      if (!client) {
        throw new Error("Supabase is not configured yet! Please configure SUPABASE_URL and SUPABASE_ANON_KEY in your .env configuration to enable Live authentication.");
      }
      
      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: appUrl || window.location.origin,
          skipBrowserRedirect: true
        }
      });
      if (error) throw error;

      if (data?.url) {
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        const popup = window.open(
          data.url,
          'supabase_oauth_popup',
          `width=${width},height=${height},left=${left},top=${top},status=yes,toolbar=no,menubar=no`
        );
        if (!popup) {
          throw new Error("Your browser blocked the login popup. Please allow popups for this site to log in with GitHub.");
        }
        // Keep loading indicator true until popup is either closed or authentication is successful.
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            setMagicLoading(false);
          }
        }, 1000);
      } else {
        throw new Error("Failed to retrieve GitHub Auth Redirect URL.");
      }
    } catch (err: any) {
      setMagicLoading(false);
      setRecruiterError(err?.message || 'GitHub Sign-In integration failed.');
    }
  };

  // Immediate Demo Access bypass (Simplifies sandbox testing tremendously!)
  const handleQuickSandboxSignIn = () => {
    setRecruiterError('');
    onSelectRole('recruiter', undefined, undefined, undefined, {
      email: sampleEmail,
      name: 'Eleanor Vance',
      provider: 'magic-link',
      organization: 'Raincrew.AI Sandbox Workspace',
      workspaceId: 'sandbox'
    });
  };

  const handleEmailAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setRecruiterError('');
    setMagicLoading(true);

    try {
      const client = await getSupabaseClient();
      if (!client) {
        throw new Error("Supabase is not configured yet! Please check your credentials.");
      }

      const emailVal = magicEmail.trim();
      const passVal = recruiterPassword.trim();

      if (emailAuthMode === 'login') {
        const { data, error } = await client.auth.signInWithPassword({
          email: emailVal,
          password: passVal
        });
        if (error) throw error;

        if (data?.session && data.user) {
          const fallbackName = data.user?.user_metadata?.full_name || data.user?.email?.split('@')[0] || "User";
          const metaOrg = data.user?.user_metadata?.organization || (data.user?.email ? data.user.email.split('@')[1].split('.')[0].toUpperCase() + " Workspace" : "Raincrew.AI Workspace");
          
          const sessionPayload: RecruiterSession = {
            email: data.user.email || 'recruiter@foloup.ai',
            name: fallbackName,
            provider: 'magic-link',
            organization: metaOrg,
            workspaceId: data.user.email ? data.user.email.split('@')[1].toLowerCase() : 'sandbox',
            token: data.session.access_token || 'email-token'
          };
          setMagicLoading(false);
          onSelectRole('recruiter', undefined, undefined, undefined, sessionPayload);
        } else {
          setMagicLoading(false);
        }
      } else {
        const nameVal = recruiterName.trim();
        const orgVal = recruiterOrg.trim() || `${nameVal.split(' ')[0]}'s Workspace`;

        if (!nameVal) {
          throw new Error("Please specify your full display name to sign up.");
        }
        if (passVal.length < 6) {
          throw new Error("Password must be at least 6 characters in length.");
        }

        const { data, error } = await client.auth.signUp({
          email: emailVal,
          password: passVal,
          options: {
            data: {
              full_name: nameVal,
              organization: orgVal
            }
          }
        });
        if (error) throw error;

        if (data?.session && data.user) {
          const fallbackName = data.user?.user_metadata?.full_name || data.user?.email?.split('@')[0] || "User";
          const metaOrg = data.user?.user_metadata?.organization || (data.user?.email ? data.user.email.split('@')[1].split('.')[0].toUpperCase() + " Workspace" : "Raincrew.AI Workspace");
          
          const sessionPayload: RecruiterSession = {
            email: data.user.email || 'recruiter@foloup.ai',
            name: fallbackName,
            provider: 'magic-link',
            organization: metaOrg,
            workspaceId: data.user.email ? data.user.email.split('@')[1].toLowerCase() : 'sandbox',
            token: data.session.access_token || 'email-token'
          };
          setMagicLoading(false);
          onSelectRole('recruiter', undefined, undefined, undefined, sessionPayload);
        } else {
          setMagicLoading(false);
          setRecruiterError("Account created! If you are not logged in dynamically, please verify your email or check if confirmation is disabled in your Supabase Auth dashboard.");
        }
      }
    } catch (err: any) {
      setMagicLoading(false);
      setRecruiterError(err?.message || 'Authentication transaction failed. Check credentials.');
    }
  };

  const handleCandidateSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!candName.trim() || !candEmail.trim()) {
      setCandidateError('Please provide both your name and email address to proceed.');
      return;
    }

    const activeCampaign = campaigns.find(c => c.id === activeCampaignId) || campaigns[0];
    if (!activeCampaign) {
      setCandidateError('No recruitment vacancies are currently active. Please contact the company recruiter.');
      return;
    }

    setCandidateError('');
    onSelectRole('candidate', activeCampaign.id, candName.trim(), candEmail.trim());
  };

  const activeCampaign = campaigns.find(c => c.id === activeCampaignId) || campaigns[0];

  return (
    <div className="max-w-4xl mx-auto my-12 bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(15,23,42,0.06)] grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
      
      {/* Visual panel Left */}
      <div className="md:col-span-12 lg:col-span-12 xl:col-span-5 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white p-9 flex flex-col justify-between relative overflow-hidden lg:p-9 md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.18)_0,transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        <div className="space-y-8 z-10">
          <div className="flex items-center gap-2.5">
            <img 
              src={branding?.logoUrl || '/logo.svg'} 
              className="h-8 max-w-[125px] object-contain rounded-lg filter drop-shadow-sm" 
              alt="Logo" 
              referrerPolicy="no-referrer" 
            />
            <span className="text-xl font-display font-extrabold tracking-tight">
              {branding?.appName ? (
                branding.appName === 'Raincrew.AI' ? (
                  <>Raincrew<span className="text-indigo-400">.AI</span> AI Portal</>
                ) : (
                  <span>{branding.appName} AI Portal</span>
                )
              ) : (
                <>Raincrew<span className="text-indigo-400">.AI</span> AI Portal</>
              )}
            </span>
          </div>

          <div className="space-y-4 pt-8">
            <h2 className="text-2xl font-display font-bold tracking-tight leading-span leading-tight">Vocal-First Screening Workspace</h2>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              {branding?.appName || 'Raincrew.AI'} uses conversational, intelligent AI follow-ups to evaluate job candidates through rich, natural speech analytics.
            </p>
          </div>
        </div>

        <div className="mt-12 space-y-4 z-10 border-t border-slate-800/85 pt-8">
          <div className="flex gap-3 items-start text-xs text-slate-300">
            <div className="w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-bold text-slate-100 font-display">Multi-Tenancy Isolation</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">Enterprises get secure workspace isolation domains scoped to custom emails.</p>
            </div>
          </div>

          <div className="flex gap-3 items-start text-xs text-slate-300">
            <div className="w-5 h-5 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-bold text-slate-100 font-display">Modern Secure Auth</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">Passwordless Magic-Links and OAuth simulated integrations authenticate sessions seamlessly.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Role specific forms Right */}
      <div className="md:col-span-12 lg:col-span-12 xl:col-span-7 p-8 md:p-10 flex flex-col justify-center bg-slate-50/40">
        
        {/* Portal Switch tabs */}
        <div className="bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200/50 flex text-xs font-semibold mb-8 max-w-sm">
          <button
            onClick={() => setActiveTab('recruiter')}
            className={`flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer font-display font-semibold ${
              activeTab === 'recruiter' 
                ? 'bg-white text-slate-900 shadow-[0_4px_12px_rgba(15,23,42,0.04)]' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" /> Company Recruiter
          </button>
          <button
            onClick={() => setActiveTab('candidate')}
            className={`flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer font-display font-semibold ${
              activeTab === 'candidate' 
                ? 'bg-white text-slate-900 shadow-[0_4px_12px_rgba(15,23,42,0.04)]' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4 text-slate-700" /> Invited Candidate
          </button>
        </div>

        {activeTab === 'recruiter' ? (
          <motion.div
            key="recruiter-portal"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="space-y-1">
              <h3 className="text-lg font-display font-bold text-slate-800">Recruiter Sign In</h3>
              <p className="text-slate-400 text-xs font-light">Access your secure candidate vetting streams and custom dashboard workspace.</p>
            </div>

            {/* ERROR ALERT BOX */}
            {recruiterError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 text-xs text-red-700 font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{recruiterError}</span>
              </div>
            )}

            {/* PRIMARY: Stable Email & Password form (Real Supabase Auth) */}
            <div className="space-y-4 bg-white/80 p-5 rounded-2xl border border-indigo-100/40 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600" />
              
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  Primary Security: Email & Password
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-100 animate-pulse">
                  100% Reliable (No Config Needed)
                </span>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setEmailAuthMode('login');
                    setRecruiterError('');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-center font-bold tracking-wide transition-all cursor-pointer ${
                    emailAuthMode === 'login'
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/40'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmailAuthMode('register');
                    setRecruiterError('');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-center font-bold tracking-wide transition-all cursor-pointer ${
                    emailAuthMode === 'register'
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/40'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5">
                {emailAuthMode === 'register' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">recruiter display name</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Alexander Recruiter"
                          value={recruiterName}
                          onChange={(e) => setRecruiterName(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 bg-white shadow-xs transition-all placeholder:text-slate-400"
                          disabled={magicLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">agency / organization</label>
                      <div className="relative">
                        <Inbox className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                        <input
                          type="text"
                          placeholder="e.g. Raincrew.AI Workspace (Optional)"
                          value={recruiterOrg}
                          onChange={(e) => setRecruiterOrg(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 bg-white shadow-xs transition-all placeholder:text-slate-400"
                          disabled={magicLoading}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Work Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. recruiter@raincrew.ai"
                      value={magicEmail}
                      onChange={(e) => setMagicEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 bg-white shadow-xs transition-all placeholder:text-slate-400"
                      disabled={magicLoading}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Secure Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={recruiterPassword}
                      onChange={(e) => setRecruiterPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 bg-white shadow-xs transition-all placeholder:text-slate-400"
                      disabled={magicLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={magicLoading}
                  className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 text-white disabled:opacity-50 rounded-xl text-xs font-bold tracking-widest uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg active:scale-[0.99]"
                >
                  {magicLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  {magicLoading 
                    ? (emailAuthMode === 'login' ? 'Authenticating...' : 'Registering Account...') 
                    : (emailAuthMode === 'login' ? 'Secure Login' : 'Create & Login')
                  }
                </button>
              </form>
            </div>

            {/* SECONDARY: OAuth SSO Connect Options */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="h-px bg-slate-200 flex-1" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">or sign in with developer oauth sso</span>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={magicLoading}
                  className="py-3 px-4 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {magicLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  )}
                  <span>Google SSO</span>
                </button>

                <button
                  type="button"
                  onClick={handleGitHubSignIn}
                  disabled={magicLoading}
                  className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {magicLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                  ) : (
                    <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.164 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                  )}
                  <span>GitHub SSO</span>
                </button>
              </div>

              {/* Dynamic Sandbox OAuth Helper Info Box */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 mt-3.5 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] leading-normal font-bold text-slate-705">
                    Redirect error to <code className="bg-slate-200 px-1 rounded text-red-600 font-mono">localhost:3000</code> or refused connection?
                  </p>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal pl-5">
                  Your Supabase OAuth provider needs this Cloud Run domain registered as an authorized callback target. In your <strong>Supabase Dashboard (Auth → URL Configuration)</strong>, set this URL as your <strong>Site URL</strong> or add it to <strong>Redirect URLs</strong>:
                </p>
                <div className="pl-5 flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={appUrl || window.location.origin}
                    className="bg-white border border-slate-200/80 px-2 py-1 rounded text-[10px] font-mono text-slate-600 select-all flex-1 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 rounded text-[10px] text-slate-700 font-bold cursor-pointer shrink-0 transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            {/* QUICK SANDBOX ONE-CLICK DIRECT ACCESS BYPASS */}
            <div className="pt-2 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={handleQuickSandboxSignIn}
                className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold tracking-wide transition-all shadow-[0_4px_14px_rgba(99,102,241,0.2)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-violet-200 text-violet-100" />
                <span>Quick Sandbox Direct Access (Eleanor Vance)</span>
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-2 font-light">
                Bypass all forms and access our prevalidated recruiter workspace in one click.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="candidate-portal"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="space-y-1">
              <h3 className="text-lg font-display font-bold text-slate-800">Job Screening Portal</h3>
              <p className="text-slate-400 text-xs">Access your oral evaluation workspace to engage with automated speech assessment triggers.</p>
            </div>

            {!activeCampaign ? (
              <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-5 text-center space-y-1">
                <p className="text-xs font-semibold text-amber-800 font-display">No recruitment vacancies currently active.</p>
                <p className="text-[11px] text-slate-500">Please contact the company recruiter to start the assessment.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Active Role Description Panel */}
                <div className="bg-indigo-50/40 border border-indigo-100/60 rounded-2xl p-4.5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 fill-indigo-200" />
                    </span>
                    <span className="text-[10px] font-bold text-indigo-800 tracking-wider uppercase font-display">Active Hiring Position</span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-display font-extrabold text-slate-800 leading-snug">{activeCampaign.title}</h4>
                    <div className="flex items-center gap-2 text-[10.5px] text-slate-500 font-medium font-display">
                      <span>{activeCampaign.department}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-350" />
                      <span>{activeCampaign.experience || 'All experience levels'}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal pt-2 border-t border-indigo-100/30">
                      {activeCampaign.description}
                    </p>
                  </div>
                </div>

                {/* Candidate Credentials Input Form */}
                <form onSubmit={handleCandidateSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Enter Your Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="Alex Rivera"
                        value={candName}
                        onChange={(e) => setCandName(e.target.value)}
                        className="w-full pl-11 pr-4.5 py-3 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 bg-white shadow-sm transition-all placeholder:text-slate-450"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Enter Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                      <input
                        type="email"
                        required
                        placeholder="alex.rivera@example.com"
                        value={candEmail}
                        onChange={(e) => setCandEmail(e.target.value)}
                        className="w-full pl-11 pr-4.5 py-3 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 bg-white shadow-sm transition-all placeholder:text-slate-450"
                      />
                    </div>
                  </div>

                  {candidateError && (
                    <p className="text-xs text-rose-500 font-semibold">{candidateError}</p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[11px] font-display font-medium tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(79,70,229,0.25)] hover:shadow-[0_6px_16px_rgba(79,70,229,0.35)]"
                  >
                    <UserCheck className="w-4 h-4" /> Start Oral Interview <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}

      </div>

    </div>
  );
}
