import { useState } from 'react';
import { Leaf, Mail, Phone, ArrowRight, Loader, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Step = 'choose' | 'email' | 'email-sent' | 'phone' | 'phone-otp';

export function AuthGate() {
  const { signInWithEmail, signInWithPhone, verifyPhoneOtp } = useAuth();
  const [step, setStep] = useState<Step>('choose');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await signInWithEmail(email.trim());
      setStep('email-sent');
    } catch (err: any) {
      setError(err.message ?? 'Failed to send link');
    } finally {
      setLoading(false);
    }
  }

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError('');
    try {
      await signInWithPhone(phone.trim());
      setStep('phone-otp');
    } catch (err: any) {
      setError(err.message ?? 'Failed to send code');
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim()) return;
    setLoading(true);
    setError('');
    try {
      await verifyPhoneOtp(phone.trim(), otp.trim());
    } catch (err: any) {
      setError(err.message ?? 'Invalid code');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center px-4 z-[200]">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, #22c55e33 0%, transparent 60%), radial-gradient(circle at 70% 70%, #16a34a22 0%, transparent 50%)' }}
      />

      <div className="relative w-full max-w-sm">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <div className="text-white font-light text-lg tracking-tight">Hiperlocal</div>
            <div className="text-white/30 text-[9px] uppercase tracking-widest">EST. 2026 LA VELETA, TULUM</div>
          </div>
        </div>

        {/* Choose method */}
        {step === 'choose' && (
          <div className="space-y-3">
            <h2 className="text-white text-2xl font-thin mb-6">Sign in to your farm</h2>
            <button
              onClick={() => setStep('email')}
              className="w-full flex items-center gap-3 px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/8 hover:border-white/20 transition-all group"
            >
              <Mail className="w-5 h-5 text-white/50 group-hover:text-white/70" />
              <div>
                <div className="text-white text-sm">Continue with Email</div>
                <div className="text-white/40 text-xs">We'll send you a magic link</div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/40 ml-auto" />
            </button>
            <button
              onClick={() => setStep('phone')}
              className="w-full flex items-center gap-3 px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/8 hover:border-white/20 transition-all group"
            >
              <Phone className="w-5 h-5 text-white/50 group-hover:text-white/70" />
              <div>
                <div className="text-white text-sm">Continue with Phone</div>
                <div className="text-white/40 text-xs">We'll text you a one-time code</div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/40 ml-auto" />
            </button>
            <p className="text-white/20 text-xs text-center pt-2">No password required. No password stored.</p>
          </div>
        )}

        {/* Email form */}
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <button type="button" onClick={() => { setStep('choose'); setError(''); }} className="text-white/30 text-xs hover:text-white/60 mb-2">← Back</button>
            <h2 className="text-white text-2xl font-thin">Enter your email</h2>
            <p className="text-white/40 text-sm">We'll send a magic link — no password needed.</p>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              required
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-green-500/50 text-sm"
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-green-500/20 border border-green-500/40 text-green-400 rounded-xl hover:bg-green-500/30 disabled:opacity-40 transition-all text-sm"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <><Mail className="w-4 h-4" /> Send magic link</>}
            </button>
          </form>
        )}

        {/* Email sent */}
        {step === 'email-sent' && (
          <div className="space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 text-green-400" />
            </div>
            <h2 className="text-white text-2xl font-thin">Check your inbox</h2>
            <p className="text-white/50 text-sm">We sent a magic link to <span className="text-white">{email}</span>. Click it to sign in — it expires in 1 hour.</p>
            <button onClick={() => { setStep('email'); setError(''); }} className="text-white/30 text-xs hover:text-white/60">Resend or use a different email</button>
          </div>
        )}

        {/* Phone form */}
        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <button type="button" onClick={() => { setStep('choose'); setError(''); }} className="text-white/30 text-xs hover:text-white/60 mb-2">← Back</button>
            <h2 className="text-white text-2xl font-thin">Enter your phone</h2>
            <p className="text-white/40 text-sm">Include country code, e.g. +1 555 000 0000</p>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+1 555 000 0000"
              autoFocus
              required
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-green-500/50 text-sm"
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading || !phone.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-green-500/20 border border-green-500/40 text-green-400 rounded-xl hover:bg-green-500/30 disabled:opacity-40 transition-all text-sm"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <><Phone className="w-4 h-4" /> Send code</>}
            </button>
          </form>
        )}

        {/* Phone OTP */}
        {step === 'phone-otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <button type="button" onClick={() => { setStep('phone'); setError(''); }} className="text-white/30 text-xs hover:text-white/60 mb-2">← Back</button>
            <h2 className="text-white text-2xl font-thin">Enter the code</h2>
            <p className="text-white/40 text-sm">We texted a 6-digit code to <span className="text-white">{phone}</span>.</p>
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              autoFocus
              required
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-green-500/50 text-sm text-center tracking-[0.5em] text-lg"
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full flex items-center justify-center gap-2 py-3 bg-green-500/20 border border-green-500/40 text-green-400 rounded-xl hover:bg-green-500/30 disabled:opacity-40 transition-all text-sm"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Verify code'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
