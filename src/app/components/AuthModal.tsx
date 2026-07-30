import { useState } from 'react';
import { Leaf, Mail, Loader, Check, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

type Step = 'email' | 'email-sent';

export function AuthModal() {
  const { showAuthModal, closeAuthModal, signInWithEmail } = useAuth();
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!showAuthModal) return null;

  function handleClose() {
    setStep('email');
    setEmail('');
    setError('');
    closeAuthModal();
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await signInWithEmail(email.trim());
      setStep('email-sent');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.failedToSend'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors"
          aria-label={t('common.close')}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <div className="text-white font-light text-lg tracking-tight">Hiperlocal</div>
            <div className="text-white/30 text-[9px] uppercase tracking-widest">{t('auth.signInToContinue')}</div>
          </div>
        </div>

        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <h2 className="text-white text-xl font-thin">{t('auth.continueWithEmail')}</h2>
            <p className="text-white/40 text-sm">{t('auth.magicLinkHint')}</p>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
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
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <><Mail className="w-4 h-4" /> {t('auth.sendMagicLink')}</>}
            </button>
          </form>
        )}

        {step === 'email-sent' && (
          <div className="space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 text-green-400" />
            </div>
            <h2 className="text-white text-xl font-thin">{t('auth.checkInbox')}</h2>
            <p className="text-white/50 text-sm">
              {t('auth.sentLinkTo')} <span className="text-white">{email}</span>. {t('auth.clickToSignIn')}
            </p>
            <button
              onClick={() => { setStep('email'); setError(''); }}
              className="text-white/30 text-xs hover:text-white/60"
            >
              {t('auth.resendOrDifferent')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
