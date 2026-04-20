import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { provinceOf } from "../lib/provinces";

type Item = { name: string; province: string };

type Props = {
  items: Item[];
  value: string | null;
  onChange: (name: string) => void;
};

export default function DistrictSelect({ items, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const grouped = useMemo(() => {
    const filter = q.trim().toLowerCase();
    const filtered = filter ? items.filter((item) => item.name.toLowerCase().includes(filter)) : items;
    const groups: Record<string, Item[]> = {};

    for (const item of filtered) {
      (groups[item.province] ??= []).push(item);
    }

    for (const provinceCode of Object.keys(groups)) {
      groups[provinceCode].sort((a, b) => a.name.localeCompare(b.name));
    }

    return groups;
  }, [items, q]);

  const current = value ? items.find((item) => item.name === value) : null;

  return (
    <div ref={ref} className="relative w-full">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 px-3 sm:px-4 py-3 bg-[var(--color-bg-2)] border border-[var(--color-line)] rounded-xl hover:border-[var(--color-ink)] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          {current && (
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ background: provinceOf(current.province).color }}
            />
          )}
          <div className="text-left min-w-0">
            <div className="text-[10px] uppercase tracking-[0.2em] font-mono text-[var(--color-ink-soft)]">
              District
            </div>
            <div className="font-display text-lg sm:text-xl truncate">
              {current ? current.name : "Select a district"}
            </div>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="district-popover absolute z-30 mt-2 w-full bg-[var(--color-bg)] border border-[var(--color-ink)] rounded-xl shadow-[0_18px_50px_-18px_rgba(26,20,16,0.4)] overflow-hidden">
          <div className="p-2 border-b border-[var(--color-line)] relative">
            <Search className="w-4 h-4 absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-[var(--color-ink-soft)]" />
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              autoFocus
              placeholder="Search 77 districts..."
              className="w-full pl-8 sm:pl-9 pr-8 py-2 bg-transparent outline-none font-mono text-sm"
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-[var(--color-ink-soft)]" />
              </button>
            )}
          </div>
          <div className="max-h-[360px] sm:max-h-[420px] overflow-y-auto scroll-ink">
            {Object.keys(grouped)
              .sort()
              .map((provinceCode) => {
                const info = provinceOf(provinceCode);
                return (
                  <div key={provinceCode}>
                    <div className="sticky top-0 bg-[var(--color-bg-2)] px-3 sm:px-4 py-1.5 border-b border-[var(--color-line)]/60 text-[10px] uppercase tracking-[0.2em] font-mono flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: info.color }} />
                      Province {provinceCode} · {info.name}
                      <span className="ml-auto text-[var(--color-ink-soft)]">{grouped[provinceCode].length}</span>
                    </div>
                    {grouped[provinceCode].map((item) => (
                      <button
                        key={item.name}
                        onClick={() => {
                          onChange(item.name);
                          setOpen(false);
                          setQ("");
                        }}
                        className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-2 hover:bg-[var(--color-bg-2)] flex items-center justify-between gap-3 ${
                          value === item.name ? "bg-[var(--color-bg-2)]" : ""
                        }`}
                      >
                        <span className="font-display text-base sm:text-[1.05rem] truncate">{item.name}</span>
                        {value === item.name && (
                          <span className="text-[10px] font-mono text-[var(--color-accent)]">SELECTED</span>
                        )}
                      </button>
                    ))}
                  </div>
                );
              })}
            {Object.keys(grouped).length === 0 && (
              <div className="p-6 text-center text-sm text-[var(--color-ink-soft)]">
                No districts match "{q}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
