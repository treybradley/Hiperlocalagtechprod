import React, { useState, useEffect } from "react";
import {
  LanguageProvider,
  useLanguage,
} from "./contexts/LanguageContext";
import { FarmConfigProvider } from "./contexts/FarmConfigContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AuthModal } from "./components/AuthModal";
import { HeroSection } from "./components/HeroSection";
import { ConfiguratorSection } from "./components/ConfiguratorSection";
import { FinancialCalculatorSection, type PlanLoadRequest } from "./components/FinancialCalculatorSection";
import { FinancialPlanDetailSection } from "./components/operations/FinancialPlanDetailSection";
import { AboutSection } from "./components/AboutSection";
import { LearnSection } from "./components/LearnSection";
import { NavigationDots } from "./components/NavigationDots";
import { NextSlideButton } from "./components/NextSlideButton";
import { SlideNavigation } from "./components/SlideNavigation";
import { TopNavigation } from "./components/TopNavigation";
import { OperationsHomeSection } from "./components/operations/OperationsHomeSection";
import { SystemDetailSection } from "./components/operations/SystemDetailSection";
import { GrowCycleDetailSection } from "./components/operations/GrowCycleDetailSection";
import { CreateSystemModal } from "./components/operations/modals/CreateSystemModal";
import { CreateGrowCycleModal } from "./components/operations/modals/CreateGrowCycleModal";
import { initDB } from "../storage/db";
import { HydroponicSystem, GrowCycle } from "../storage/models";
import { Leaf, Box, BarChart3 } from "lucide-react";

const FINANCIAL_SECTION_INDEX = 2;

const sections = [
  { id: "hero", component: HeroSection, icon: Leaf },
  { id: "configurator", component: ConfiguratorSection, icon: Box },
  { id: "financial", component: FinancialCalculatorSection, icon: BarChart3 },
];

function AppContent() {
  const { t } = useLanguage();
  const [currentSection, setCurrentSection] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [mode, setMode] = useState<'planning' | 'operations' | 'about' | 'learn'>('planning');
  const [operationsView, setOperationsView] = useState<'home' | 'system-detail' | 'cycle-detail' | 'financial-plan-detail'>('home');
  const [showCreateSystemModal, setShowCreateSystemModal] = useState(false);
  const [showCreateCycleModal, setShowCreateCycleModal] = useState(false);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [selectedFinancialPlanId, setSelectedFinancialPlanId] = useState<string | null>(null);
  const [planLoadRequest, setPlanLoadRequest] = useState<PlanLoadRequest | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { session, loading: authLoading, openAuthModal } = useAuth();

  // Initialize IndexedDB on mount (kept for any legacy reads)
  useEffect(() => {
    initDB().catch(console.error);
  }, []);

  // Restore mode preference (operations requires auth)
  useEffect(() => {
    if (authLoading) return;
    const savedMode = localStorage.getItem('hydroops-mode') as
      | 'planning'
      | 'operations'
      | 'about'
      | 'learn'
      | null;
    if (savedMode === 'operations') {
      if (session) setMode('operations');
      else setMode('planning');
      return;
    }
    if (savedMode === 'planning' || savedMode === 'about' || savedMode === 'learn') {
      setMode(savedMode);
    }
  }, [authLoading, session]);

  const handleModeChange = (newMode: 'planning' | 'operations' | 'about' | 'learn') => {
    if (newMode === 'operations' && !session) {
      openAuthModal(() => {
        setMode('operations');
        localStorage.setItem('hydroops-mode', 'operations');
      });
      return;
    }
    setMode(newMode);
    localStorage.setItem('hydroops-mode', newMode);
  };

  const handleNextSlide = () => {
    if (currentSection < sections.length - 1 && !isScrolling) {
      setIsScrolling(true);
      setCurrentSection((prev) => prev + 1);
      setTimeout(() => setIsScrolling(false), 1000);
    }
  };

  const handlePrevSlide = () => {
    if (currentSection > 0 && !isScrolling) {
      setIsScrolling(true);
      setCurrentSection((prev) => prev - 1);
      setTimeout(() => setIsScrolling(false), 1000);
    }
  };

  const handleCreateSystem = () => {
    setShowCreateSystemModal(true);
  };

  const handleSystemCreated = (system: HydroponicSystem) => {
    setRefreshTrigger(prev => prev + 1);
    setSelectedSystemId(system.id);
    setOperationsView('system-detail');
  };

  const handleViewSystem = (systemId: string) => {
    setSelectedSystemId(systemId);
    setOperationsView('system-detail');
  };

  const handleBackToOperationsHome = () => {
    setOperationsView('home');
    setSelectedSystemId(null);
    setSelectedCycleId(null);
    setSelectedFinancialPlanId(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleViewFinancialPlan = (planId: string) => {
    setSelectedFinancialPlanId(planId);
    setOperationsView('financial-plan-detail');
  };

  const handleCreateFinancialPlan = () => {
    setPlanLoadRequest({ type: 'new' });
    setMode('planning');
    setCurrentSection(FINANCIAL_SECTION_INDEX);
    localStorage.setItem('hydroops-mode', 'planning');
  };

  const handleFinancialPlanDeleted = () => {
    setSelectedFinancialPlanId(null);
    setOperationsView('home');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFinancialPlanDuplicated = (planId: string) => {
    setSelectedFinancialPlanId(planId);
    setOperationsView('financial-plan-detail');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleStartCycle = () => {
    setShowCreateCycleModal(true);
  };

  const handleCycleCreated = (cycle: GrowCycle) => {
    setRefreshTrigger(prev => prev + 1);
    setSelectedCycleId(cycle.id);
    setOperationsView('cycle-detail');
  };

  const handleViewCycle = (cycleId: string) => {
    setSelectedCycleId(cycleId);
    setOperationsView('cycle-detail');
  };

  const handleBackToSystemDetail = () => {
    setOperationsView('system-detail');
    setSelectedCycleId(null);
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode !== 'planning') return;
      if (isScrolling) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (
        (e.key === "ArrowDown" || e.key === " ") &&
        currentSection < sections.length - 1
      ) {
        e.preventDefault();
        handleNextSlide();
      } else if (e.key === "ArrowUp" && currentSection > 0) {
        e.preventDefault();
        handlePrevSlide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSection, isScrolling, mode]);

  // Brief auth init spinner only
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="dark">
      <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a0a]">
        <AuthModal />
        {/* Top Navigation */}
        <TopNavigation mode={mode} onModeChange={handleModeChange} />

        {/* Planning Mode (Ideation) */}
        {mode === 'planning' && (
          <>
            {/* Section Container */}
            <div
              className="w-full h-full transition-transform duration-1000 ease-out"
              style={{
                transform: `translateY(-${currentSection * 100}vh)`,
              }}
            >
              {sections.map((section, index) => {
                const Component = section.component;
                const extraProps = section.id === 'financial'
                  ? {
                      planLoadRequest,
                      onPlanLoadHandled: () => setPlanLoadRequest(null),
                    }
                  : {};
                return (
                  <div key={section.id} className="w-full h-screen">
                    <Component
                      isActive={index === currentSection}
                      onNextSlide={handleNextSlide}
                      onPrevSlide={handlePrevSlide}
                      isFirstSlide={index === 0}
                      isLastSlide={index === sections.length - 1}
                      {...extraProps}
                    />
                  </div>
                );
              })}
            </div>

            {/* Navigation Dots */}
            <NavigationDots
              total={sections.length}
              current={currentSection}
              onNavigate={setCurrentSection}
            />

            {/* Section Label */}
            <div className="fixed top-27 left-0 right-0 z-[100] pointer-events-none">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-md px-[12px] py-[9px] w-fit pointer-events-auto">
                  {(() => {
                    const SectionIcon = sections[currentSection].icon;
                    return (
                      <SectionIcon className="w-3 h-3 text-green-400" />
                    );
                  })()}
                  <span className="text-xs text-white/70 uppercase tracking-wider">
                    {t(`nav.${sections[currentSection].id}`)}
                  </span>
                </div>
              </div>
            </div>

            {/* Sticky Footer Navigation */}
            <div className="fixed bottom-0 left-0 right-0 z-[100] bg-gradient-to-t from-black/80 to-transparent pb-6 pt-8">
              <div className="max-w-7xl mx-auto px-4 md:px-8">
                <SlideNavigation
                  onNext={handleNextSlide}
                  onPrev={handlePrevSlide}
                  isFirstSlide={currentSection === 0}
                  isLastSlide={currentSection === sections.length - 1}
                />
              </div>
            </div>
          </>
        )}

        {/* About & Learn — inline pages under the shared nav */}
        {mode === 'about' && (
          <div className="w-full h-full pt-[72px] sm:pt-[80px] overflow-y-auto hiper-scroll">
            <AboutSection />
          </div>
        )}
        {mode === 'learn' && (
          <div className="w-full h-full pt-[72px] sm:pt-[80px] overflow-y-auto hiper-scroll">
            <LearnSection />
          </div>
        )}

        {/* Operations Mode */}
        {mode === 'operations' && (
          <div className="w-full h-screen">
            {operationsView === 'home' && (
              <OperationsHomeSection
                key={refreshTrigger}
                onCreateSystem={handleCreateSystem}
                onViewSystem={handleViewSystem}
                onViewFinancialPlan={handleViewFinancialPlan}
                onCreateFinancialPlan={handleCreateFinancialPlan}
                onDuplicateFinancialPlan={handleFinancialPlanDuplicated}
              />
            )}

            {operationsView === 'financial-plan-detail' && selectedFinancialPlanId && (
              <FinancialPlanDetailSection
                key={selectedFinancialPlanId}
                planId={selectedFinancialPlanId}
                onBack={handleBackToOperationsHome}
                onSaved={() => setRefreshTrigger(prev => prev + 1)}
                onDeleted={handleFinancialPlanDeleted}
                onDuplicated={handleFinancialPlanDuplicated}
              />
            )}

            {operationsView === 'system-detail' && selectedSystemId && (
              <SystemDetailSection
                key={refreshTrigger}
                systemId={selectedSystemId}
                onBack={handleBackToOperationsHome}
                onStartCycle={handleStartCycle}
                onViewCycle={handleViewCycle}
              />
            )}

            {operationsView === 'cycle-detail' && selectedCycleId && (
              <GrowCycleDetailSection
                key={refreshTrigger}
                cycleId={selectedCycleId}
                onBack={handleBackToSystemDetail}
                onCycleDeleted={() => setRefreshTrigger(prev => prev + 1)}
              />
            )}
          </div>
        )}

        {/* Modals */}
        <CreateSystemModal
          isOpen={showCreateSystemModal}
          onClose={() => setShowCreateSystemModal(false)}
          onSuccess={handleSystemCreated}
        />

        {selectedSystemId && (
          <>
            <CreateGrowCycleModal
              isOpen={showCreateCycleModal}
              systemId={selectedSystemId}
              onClose={() => setShowCreateCycleModal(false)}
              onSuccess={handleCycleCreated}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <FarmConfigProvider>
          <AppContent />
        </FarmConfigProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}