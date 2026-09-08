import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useStore } from '../../store';

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };
const STYLES = {
  success: 'bg-white border-emerald-200 text-emerald-800 [&_svg]:text-emerald-500',
  error: 'bg-white border-red-200 text-red-800 [&_svg]:text-red-500',
  info: 'bg-white border-court-200 text-court-800 [&_svg]:text-court-500',
};

export default function ToastHost() {
  const toasts = useStore((s) => s.toasts);
  const dismissToast = useStore((s) => s.dismissToast);

  return createPortal(
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((t) => {
        const Icon = ICONS[t.tone] || Info;
        return (
          <div key={t.id} className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border px-4 py-3 shadow-lg animate-toast-in ${STYLES[t.tone] || STYLES.info}`}>
            <Icon className="mt-0.5 size-5 shrink-0" />
            <p className="flex-1 text-sm font-medium">{t.message}</p>
            <button onClick={() => dismissToast(t.id)} className="text-ink-400 hover:text-ink-700">
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
