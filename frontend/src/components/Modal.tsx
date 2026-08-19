import { useEffect, type ReactNode } from "react";

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
};

export function Modal({ open, title, onClose, children, wide }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Close overlay" className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className={`relative z-10 max-h-[90vh] overflow-y-auto rounded-xl border border-line bg-surface p-5 shadow-2xl ${wide ? "w-full max-w-3xl" : "w-full max-w-md"}`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          {title ? <h2 className="text-lg font-semibold text-white">{title}</h2> : <span />}
          <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-zinc-400 hover:bg-raised hover:text-white">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Lightbox({
  url,
  alt,
  onClose,
}: {
  url: string | null;
  alt?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!url) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [url, onClose]);

  if (!url) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" aria-label="Close screenshot" className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative z-10">
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-2 -top-2 rounded-full bg-raised px-2 py-1 text-sm text-white"
        >
          ✕
        </button>
        <img src={url} alt={alt ?? "Screenshot"} className="max-h-[80vh] max-w-[90vw] rounded-lg object-contain" />
      </div>
    </div>
  );
}
