import { useEffect, useRef, useState } from "react";

export type KebabItem = {
  label: string;
  onSelect: () => void;
  danger?: boolean;
};

export function KebabMenu({ items, label = "Row menu" }: { items: KebabItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={rootRef} className="relative flex justify-end">
      <button
        ref={btnRef}
        type="button"
        className="rounded-md px-1.5 py-0.5 text-zinc-500 hover:bg-raised hover:text-white"
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation();
          const r = btnRef.current?.getBoundingClientRect();
          if (r) setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
          setOpen((v) => !v);
        }}
      >
        ⋯
      </button>
      {open ? (
        <div
          className="fixed z-50 w-32 overflow-hidden rounded-lg border border-line bg-raised py-1 text-sm shadow-xl"
          style={{ top: pos.top, right: pos.right }}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`block w-full px-3 py-1.5 text-left hover:bg-bg ${item.danger ? "text-loss" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
