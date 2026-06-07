import { useState } from 'react';
import { Leaf, Loader, Sprout } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Step = 'name' | 'farm';

export function OnboardingFlow() {
  const { profile, saveProfile, createFarm } = useAuth();
  const [step, setStep] = useState<Step>(profile?.name ? 'farm' : 'name');
  const [name, setName] = useState(profile?.name ?? '');
  const [farmName, setFarmName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      await saveProfile(name.trim());
      setStep('farm');
    } catch (err: any) {
      setError(err.message ?? 'Failed to save name');
    } finally {
      setLoading(false);
    }
  }

  async function handleFarmSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!farmName.trim()) return;
    setLoading(true);
    setError('');
    try {
      await createFarm(farmName.trim());
      // AuthContext will update profile + farm, which removes OnboardingFlow from render
    } catch (err: any) {
      setError(err.message ?? 'Failed to create farm');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center px-4 z-[200]">
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, #22c55e33 0%, transparent 60%), radial-gradient(circle at 70% 70%, #16a34a22 0%, transparent 50%)' }}
      />

      <div className="relative w-full max-w-sm">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <div className="text-white font-light text-lg tracking-tight">Hiperlocal</div>
            <div className="text-white/30 text-[9px] uppercase tracking-widest">EST. 2026 LA VELETA, TULUM</div>
          </div>
        </div>

        {step === 'name' && (
          <form onSubmit={handleNameSubmit} className="space-y-5">
            <div>
              <h2 className="text-white text-2xl font-thin">Welcome!</h2>
              <p className="text-white/40 text-sm mt-1">What should we call you?</p>
            </div>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              autoFocus
              required
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-green-500/50 text-sm"
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-green-500/20 border border-green-500/40 text-green-400 rounded-xl hover:bg-green-500/30 disabled:opacity-40 transition-all text-sm"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Continue →'}
            </button>
          </form>
        )}

        {step === 'farm' && (
          <form onSubmit={handleFarmSubmit} className="space-y-5">
            <div>
              <h2 className="text-white text-2xl font-thin">Name your farm</h2>
              <p className="text-white/40 text-sm mt-1">
                Hey {profile?.name ?? name}! Give your farm a name — you can invite collaborators after setup.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <Sprout className="w-5 h-5 text-green-400 shrink-0" />
              <input
                type="text"
                value={farmName}
                onChange={e => setFarmName(e.target.value)}
                placeholder="e.g. La Veleta Farm"
                autoFocus
                required
                className="flex-1 bg-transparent text-white placeholder-white/25 focus:outline-none text-sm"
              />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading || !farmName.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-green-500/20 border border-green-500/40 text-green-400 rounded-xl hover:bg-green-500/30 disabled:opacity-40 transition-all text-sm"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Create farm →'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
