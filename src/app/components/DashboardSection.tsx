import { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  Thermometer,
  Droplets,
  Wind,
  Zap,
  Sun,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardSectionProps {
  isActive: boolean;
  onNextSlide?: () => void;
  isLastSlide?: boolean;
  onPrevSlide?: () => void;
  isFirstSlide?: boolean;
}

export function DashboardSection({ isActive, onNextSlide, isLastSlide, onPrevSlide, isFirstSlide }: DashboardSectionProps) {
  const { t } = useLanguage();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulated real-time data
  const [temperature] = useState(24.5 + Math.random() * 1.5);
  const [humidity] = useState(62 + Math.random() * 8);
  const [ec] = useState(1.8 + Math.random() * 0.4);
  const [ph] = useState(6.2 + Math.random() * 0.6);
  const [reservoir] = useState(75 + Math.random() * 15);
  const [airflow] = useState(85 + Math.random() * 10);
  const [powerConsumption] = useState(3.2 + Math.random() * 0.8);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Status calculations
  const tempStatus = temperature > 27 ? 'warning' : temperature < 20 ? 'warning' : 'optimal';
  const humidityStatus = humidity > 75 ? 'warning' : humidity < 50 ? 'warning' : 'optimal';
  const ecStatus = ec > 2.2 ? 'warning' : ec < 1.4 ? 'warning' : 'optimal';
  const phStatus = ph > 6.5 ? 'warning' : ph < 5.8 ? 'warning' : 'optimal';

  const getStatusColor = (status: string) => {
    return status === 'optimal' ? 'text-green-400' : status === 'warning' ? 'text-amber-400' : 'text-red-400';
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0a0a]">
      <div className={`relative h-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 pt-20 md:pt-24 transition-all duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex flex-col h-full gap-4 md:gap-6 overflow-y-auto pl-[0px] pr-[16px] py-[0px] pb-24">
          {/* Header */}
          <div className="flex-shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-4 px-[0px] pt-[48px] pb-[0px]">
            <div className="space-y-2">
              <h2 className="font-thin text-white tracking-tight px-[0px] pt-[12px] pb-[0px] text-[32px]">
                {t('dashboard.title')}
                <br />
                <span className="text-white/40">{t('dashboard.subtitle')}</span>
              </h2>
            </div>

            {/* System Time */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-4">
              <div className="text-xs text-white/40 uppercase tracking-wider mb-1">{t('dashboard.systemTime')}</div>
              <div className="text-2xl text-white font-mono">{formatTime(time)}</div>
              <div className="text-xs text-white/40 mt-1">{formatDate(time)}</div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {/* Temperature */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">

                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-wider">{t('dashboard.temperature')}</div>
                    <div className="text-3xl text-white mt-1">{temperature.toFixed(1)}°C</div>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs border-white/20 ${
                    tempStatus === 'optimal' ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {t(`dashboard.${tempStatus}`)}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-white/50">
                  <span>{t('dashboard.range')}: 20-27°C</span>
                  <span className={getStatusColor(tempStatus)}>
                    {temperature > 24 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  </span>
                </div>
                <Progress value={((temperature - 15) / 15) * 100} className="h-1" />
              </div>

              <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs">
                <div className="flex justify-between text-white/50">
                  <span>{t('dashboard.min24h')}</span>
                  <span className="text-white">22.1°C</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>{t('dashboard.max24h')}</span>
                  <span className="text-white">26.8°C</span>
                </div>
              </div>
            </div>

            {/* Humidity */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">

                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-wider">{t('dashboard.humidity')}</div>
                    <div className="text-3xl text-white mt-1">{humidity.toFixed(1)}%</div>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs border-white/20 ${
                    humidityStatus === 'optimal'
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {t(`dashboard.${humidityStatus}`)}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-white/50">
                  <span>{t('dashboard.range')}: 50-75%</span>
                  <span className={getStatusColor(humidityStatus)}>
                    {humidity > 65 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  </span>
                </div>
                <Progress value={humidity} className="h-1" />
              </div>

              <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs">
                <div className="flex justify-between text-white/50">
                  <span>{t('dashboard.min24h')}</span>
                  <span className="text-white">58.2%</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>{t('dashboard.max24h')}</span>
                  <span className="text-white">71.5%</span>
                </div>
              </div>
            </div>

            {/* EC (Electrical Conductivity) */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">

                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-wider">{t('dashboard.nutrientEC')}</div>
                    <div className="text-3xl text-white mt-1">{ec.toFixed(1)}</div>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs border-white/20 ${
                    ecStatus === 'optimal' ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {t(`dashboard.${ecStatus}`)}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-white/50">
                  <span>{t('dashboard.range')}: 1.4-2.2 mS/cm</span>
                  <span className={getStatusColor(ecStatus)}>
                    {ec > 1.8 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  </span>
                </div>
                <Progress value={((ec - 1.0) / 1.5) * 100} className="h-1" />
              </div>

              <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs">
                <div className="flex justify-between text-white/50">
                  <span>{t('dashboard.lastAdjusted')}</span>
                  <span className="text-white">2h {t('dashboard.ago')}</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>{t('dashboard.nextCheck')}</span>
                  <span className="text-white">4h</span>
                </div>
              </div>
            </div>

            {/* pH */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">

                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-wider">{t('dashboard.phLevel')}</div>
                    <div className="text-3xl text-white mt-1">{ph.toFixed(1)}</div>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs border-white/20 ${
                    phStatus === 'optimal' ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {t(`dashboard.${phStatus}`)}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-white/50">
                  <span>{t('dashboard.range')}: 5.8-6.5</span>
                  <span className={getStatusColor(phStatus)}>
                    {ph > 6.2 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  </span>
                </div>
                <Progress value={((ph - 5.0) / 2.0) * 100} className="h-1" />
              </div>

              <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs">
                <div className="flex justify-between text-white/50">
                  <span>{t('dashboard.lastAdjusted')}</span>
                  <span className="text-white">6h {t('dashboard.ago')}</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>{t('dashboard.nextCheck')}</span>
                  <span className="text-white">2h</span>
                </div>
              </div>
            </div>

            {/* Reservoir Level */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4 sm:col-span-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">

                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-wider">{t('dashboard.reservoirLevel')}</div>
                    <div className="text-3xl text-white mt-1">{reservoir.toFixed(0)}%</div>
                    <div className="text-xs text-white/50 mt-1">≈ {(reservoir * 1.2).toFixed(0)}L / 120L {t('dashboard.capacity')}</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs border-white/20 bg-green-500/20 text-green-300">
                  {t('dashboard.optimal')}
                </Badge>
              </div>

              <Progress value={reservoir} className="h-2" />

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="space-y-1">
                  <div className="text-xs text-white/40">{t('dashboard.waterUsage24h')}</div>
                  <div className="text-white">18.5L</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-white/40">{t('dashboard.refillScheduled')}</div>
                  <div className="text-white">{t('dashboard.tomorrow')}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-white/40">{t('dashboard.estRemaining')}</div>
                  <div className="text-white">4.2 {t('dashboard.days')}</div>
                </div>
              </div>
            </div>

            {/* Airflow */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">

                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-wider">{t('dashboard.airflow')}</div>
                    <div className="text-3xl text-white mt-1">{airflow.toFixed(0)}%</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs border-white/20 bg-green-500/20 text-green-300">
                  {t('dashboard.active')}
                </Badge>
              </div>

              <Progress value={airflow} className="h-1" />

              <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs">
                <div className="flex justify-between text-white/50">
                  <span>{t('dashboard.fanSpeed')}</span>
                  <span className="text-white">850 RPM</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>{t('dashboard.airExchanges')}</span>
                  <span className="text-white">24</span>
                </div>
              </div>
            </div>

            {/* Power Consumption */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">

                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-wider">{t('dashboard.powerDraw')}</div>
                    <div className="text-3xl text-white mt-1">{powerConsumption.toFixed(1)} kW</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-white/50">
                  <span>{t('dashboard.dailyConsumption')}</span>
                  <span className="text-white">76.8 kWh</span>
                </div>
                <div className="flex justify-between text-xs text-white/50">
                  <span>{t('dashboard.monthlyEst')}</span>
                  <span className="text-white">2,304 kWh</span>
                </div>
              </div>
            </div>

            {/* Lighting Schedule */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4 sm:col-span-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">

                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-wider">{t('dashboard.lightingSchedule')}</div>
                    <div className="text-xl text-white mt-1">{t('dashboard.activeCycle')}: 18h {t('dashboard.on')} / 6h OFF</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs border-white/20 bg-amber-500/20 text-amber-300">
                  {t('dashboard.on')}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">{t('dashboard.currentIntensity')}</span>
                      <span className="text-white">85%</span>
                    </div>
                    <Progress value={85} className="h-1.5" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="text-white/40">{t('dashboard.nextOff')}</div>
                    <div className="text-white">22:00</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-white/40">{t('dashboard.spectrum')}</div>
                    <div className="text-white">{t('dashboard.full')}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-white/40">{t('dashboard.ppfdAvg')}</div>
                    <div className="text-white">420 μmol/m²/s</div>
                  </div>
                </div>
              </div>
            </div>

            {/* System Alerts */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4 sm:col-span-2">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wider">{t('dashboard.systemStatus')}</div>
                  <div className="text-xl text-white mt-1">{t('dashboard.allSystemsNominal')}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <span className="text-white/70">{t('dashboard.lastSystemCheck')}: 15 {t('dashboard.minutesAgo')}</span>
                  <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-300">
                    {t('dashboard.ok')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs p-2 bg-white/5 border border-white/10 rounded-lg">
                  <span className="text-white/70">{t('dashboard.nutrientTopUp')}: 3 {t('dashboard.days')}</span>
                  <Badge variant="outline" className="text-[10px] border-white/20 text-white/60">
                    {t('dashboard.scheduled')}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
