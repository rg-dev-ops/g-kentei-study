import { useEffect, useRef, useSyncExternalStore } from 'react';

// window.confirm はアプリ内ブラウザなどで表示されない（即 false になる）ことがあるため、
// アプリ内のダイアログで確認する。

type Request = {
  message: string;
  okLabel: string;
  danger: boolean;
  resolve: (ok: boolean) => void;
};

let current: Request | null = null;
const listeners = new Set<() => void>();

function set(req: Request | null) {
  current = req;
  listeners.forEach((l) => l());
}

export function confirmDialog(
  message: string,
  { okLabel = 'OK', danger = false }: { okLabel?: string; danger?: boolean } = {},
): Promise<boolean> {
  current?.resolve(false);
  return new Promise((resolve) => set({ message, okLabel, danger, resolve }));
}

/** App に 1 つだけ置く */
export function ConfirmHost() {
  const req = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
  const okRef = useRef<HTMLButtonElement>(null);

  const close = (ok: boolean) => {
    req?.resolve(ok);
    set(null);
  };

  useEffect(() => {
    if (!req) return;
    okRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!req) return null;
  return (
    <div className="modal-backdrop" onClick={() => close(false)}>
      <div className="modal" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <p className="modal-message">{req.message}</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={() => close(false)}>
            キャンセル
          </button>
          <button
            ref={okRef}
            type="button"
            className={`btn ${req.danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => close(true)}
          >
            {req.okLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
