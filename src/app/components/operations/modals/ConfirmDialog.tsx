import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative bg-[#0a0a0a] border border-white/20 rounded-2xl max-w-md w-full p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            destructive ? 'bg-red-500/20' : 'bg-yellow-500/20'
          }`}>
            <AlertTriangle className={`w-5 h-5 ${destructive ? 'text-red-400' : 'text-yellow-400'}`} />
          </div>
          <div>
            <h3 className="text-lg text-white font-medium mb-1">{title}</h3>
            <p className="text-sm text-white/60">{description}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm rounded-lg border transition-all disabled:opacity-50 ${
              destructive
                ? 'bg-red-500/20 hover:bg-red-500/30 border-red-500/40 text-red-300'
                : 'bg-green-500/20 hover:bg-green-500/30 border-green-500/40 text-white'
            }`}
          >
            {loading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
