interface NavigationDotsProps {
  total: number;
  current: number;
  onNavigate: (index: number) => void;
}

export function NavigationDots({
  total,
  current,
  onNavigate,
}: NavigationDotsProps) {
  const progress = ((current + 1) / total) * 100;

  return (
    <div className="fixed top-0 left-0 right-0 z-[95] h-1">
      {/* Background bar */}
      <div className="absolute inset-0 bg-white/10" />

      {/* Progress bar */}
      <div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-400 transition-all duration-1000 ease-out"
        style={{ width: `${progress}%` }}
      />

      {/* Segment markers */}
      <div className="absolute inset-0 flex">
        {Array.from({ length: total }).map((_, index) => (
          <button
            key={index}
            onClick={() => onNavigate(index)}
            className="flex-1 relative group"
            aria-label={`Go to section ${index + 1}`}
          >
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />

            {/* Divider line between segments */}
            {index < total - 1 && (
              <div className="absolute right-0 top-0 bottom-0 w-px bg-white/20" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}