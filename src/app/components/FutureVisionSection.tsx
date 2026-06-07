import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Badge } from "./ui/badge";
import {
  Sparkles,
  Building2,
  Users,
  Leaf,
  TrendingUp,
  Globe,
  Award,
  Lightbulb,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

interface FutureVisionSectionProps {
  isActive: boolean;
  onNextSlide?: () => void;
  isLastSlide?: boolean;
  onPrevSlide?: () => void;
  isFirstSlide?: boolean;
}

interface Opportunity {
  id: string;
  title: string;
  description: string;
  category:
    | "product"
    | "service"
    | "infrastructure"
    | "education";
  timeline: string;
  impact: "high" | "medium" | "transformative";
  image: string;
}

const opportunities: Opportunity[] = [
  {
    id: "hotel-integration",
    title: "Luxury Hotel Integration",
    description:
      "Embedded farm-to-table systems in boutique hotels, creating immersive sustainability experiences for guests.",
    category: "infrastructure",
    timeline: "2026 Q2",
    impact: "transformative",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600",
  },
  {
    id: "experiential",
    title: "Experiential Growing Installations",
    description:
      "Architectural living walls and visible growing systems designed as centerpiece installations for high-end venues.",
    category: "product",
    timeline: "2026 Q1",
    impact: "high",
    image:
      "https://images.unsplash.com/photo-1743148509752-9ea6072ea35f?w=600",
  },
  {
    id: "wellness",
    title: "Wellness Resort Partnerships",
    description:
      "Integrated farming systems supporting wellness programs, nutritional workshops, and healing cuisine.",
    category: "service",
    timeline: "2026 Q3",
    impact: "high",
    image:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600",
  },
  {
    id: "workshops",
    title: "Educational Workshop Series",
    description:
      "Hydroponic farming workshops for hospitality staff, residents, and sustainability-focused travelers.",
    category: "education",
    timeline: "2026 Q1",
    impact: "medium",
    image:
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600",
  },
  {
    id: "branded-produce",
    title: "Branded Local Produce Line",
    description:
      'Premium "Tulum Grown" product line distributed to regional hospitality venues and specialty markets.',
    category: "product",
    timeline: "2026 Q4",
    impact: "transformative",
    image:
      "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600",
  },
  {
    id: "climate-adaptive",
    title: "Climate-Adaptive Infrastructure",
    description:
      "Resilient farming systems designed for tropical climate challenges, hurricane preparedness, and water scarcity.",
    category: "infrastructure",
    timeline: "2027",
    impact: "transformative",
    image:
      "https://images.unsplash.com/photo-1508855898412-54387cfbb044?w=600",
  },
];

export function FutureVisionSection({
  isActive,
  onNextSlide,
  isLastSlide,
  onPrevSlide,
  isFirstSlide,
}: FutureVisionSectionProps) {
  const { t } = useLanguage();

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0a0a]">
      {/* Background */}
      <div className="absolute inset-0 opacity-20">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1696454596847-dda5f2dc0555?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
          alt="Future sustainable architecture"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a]/90 to-[#0a0a0a]" />
      </div>

      <div
        className={`relative h-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 pt-20 md:pt-24 transition-all duration-1000 ${isActive ? "opacity-100" : "opacity-0"}`}
      >
        <div className="flex flex-col h-full gap-4 md:gap-6 overflow-y-auto pr-2 md:pr-4 pb-24">
          {/* Header */}
          <div className="flex-shrink-0 space-y-4 px-[0px] pt-[48px] pb-[0px]">
            <h2 className="text-white tracking-tight leading-tight px-[0px] pt-[12px] pb-[0px] text-[32px]">
              {t('vision.subtitle')}
              <br />
              <span className="text-white/40">
                {t('vision.subtitle2')}
              </span>
            </h2>
            <p className="text-white/60 text-lg max-w-3xl">
              {t('vision.description')}
            </p>
          </div>

          {/* Vision Statement */}
          <div className="flex-shrink-0 bg-gradient-to-br from-green-500/10 to-green-500/5 backdrop-blur-sm border border-green-500/20 rounded-xl md:rounded-2xl p-4 md:p-8">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4 md:gap-8">
              <div className="space-y-2">
                <Building2 className="w-5 h-5 md:w-6 md:h-6 text-green-400/60" />
                <div className="text-xl md:text-2xl text-white">
                  50+
                </div>
                <div className="text-[10px] md:text-xs text-white/50 uppercase tracking-wider">
                  {t('vision.installationsBy2027')}
                </div>
              </div>
              <div className="space-y-2">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-400/60" />
                <div className="text-xl md:text-2xl text-white">
                  200+
                </div>
                <div className="text-[10px] md:text-xs text-white/50 uppercase tracking-wider">
                  {t('vision.hospitalityPartners')}
                </div>
              </div>
              <div className="space-y-2">
                <Leaf className="w-5 h-5 md:w-6 md:h-6 text-green-400/60" />
                <div className="text-xl md:text-2xl text-white">
                  15,000kg
                </div>
                <div className="text-[10px] md:text-xs text-white/50 uppercase tracking-wider">
                  {t('vision.monthlyProduction')}
                </div>
              </div>
              <div className="space-y-2">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-amber-400/60" />
                <div className="text-xl md:text-2xl text-white">
                  90%
                </div>
                <div className="text-[10px] md:text-xs text-white/50 uppercase tracking-wider">
                  {t('vision.wasteReduction')}
                </div>
              </div>
            </div>
          </div>

          {/* Opportunities Grid */}
          <div className="flex-shrink-0">
            <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3 md:gap-4">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={opp.image}
                      alt={opp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge
                        variant="outline"
                        className={`text-xs border-white/30 ${
                          opp.category === "product"
                            ? "bg-blue-500/20 text-blue-300"
                            : opp.category === "service"
                              ? "bg-green-500/20 text-green-300"
                              : opp.category ===
                                  "infrastructure"
                                ? "bg-purple-500/20 text-purple-300"
                                : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {t(`vision.${opp.category}`)}
                      </Badge>
                    </div>

                    {/* Impact Badge */}
                    <div className="absolute top-3 right-3">
                      {opp.impact === "transformative" && (
                        <div className="p-1.5 bg-amber-500/20 backdrop-blur-sm rounded-full border border-amber-500/30">
                          <Sparkles className="w-3 h-3 text-amber-300" />
                        </div>
                      )}
                    </div>

                    {/* Timeline */}
                    <div className="absolute bottom-3 left-3">
                      <Badge
                        variant="outline"
                        className="text-xs border-white/30 bg-black/40 text-white/80"
                      >
                        {opp.timeline}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-lg text-white mb-2">
                        {opp.title}
                      </h3>
                      <p className="text-sm text-white/60 leading-relaxed">
                        {opp.description}
                      </p>
                    </div>

                    {/* Impact Indicator */}
                    <div className="flex items-center gap-2 pt-2">
                      <Award
                        className={`w-4 h-4 ${
                          opp.impact === "transformative"
                            ? "text-amber-400"
                            : opp.impact === "high"
                              ? "text-green-400"
                              : "text-blue-400"
                        }`}
                      />
                      <span className="text-xs text-white/50 uppercase tracking-wider">
                        {t(`vision.${opp.impact}`)} {t('vision.impact')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Vision Statement */}
          <div className="flex-shrink-0 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-start gap-6">
              <div className="flex-1">
                <h3 className="text-xl text-white mb-2">
                  {t('vision.buildingFuture')}
                </h3>
                <p className="text-white/60 leading-relaxed">
                  {t('vision.buildingFutureDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}