import { useLanguage } from "../contexts/LanguageContext";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div>
      <div className="flex items-center gap-1 bg-white/5 rounded-full p-1">
        <button
          onClick={() => setLanguage("es")}
          className={`px-3 py-2 rounded-full text-xs uppercase tracking-wider transition-all ${
            language === "es"
              ? "bg-green-500/20 text-white"
              : "text-white/60 hover:text-white/80"
          }`}
        >
          ES
        </button>
        <button
          onClick={() => setLanguage("en")}
          className={`px-3 py-2 rounded-full text-xs uppercase tracking-wider transition-all ${
            language === "en"
              ? "bg-green-500/20 text-white"
              : "text-white/60 hover:text-white/80"
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );
}