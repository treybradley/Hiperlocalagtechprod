import type { LucideIcon } from 'lucide-react';

interface SectionLabelProps {
  icon: LucideIcon;
  label: string;
}

export function SectionLabel({ icon: Icon, label }: SectionLabelProps) {
  return (
    <div className="flex-shrink-0 flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-md px-[12px] py-[9px] w-fit -mb-2">
      <Icon className="w-3 h-3 text-green-400" />
      <span className="text-xs text-white/70 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}
