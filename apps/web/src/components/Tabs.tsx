import { type KeyboardEvent, type ReactNode, useRef } from "react";

export interface TabDefinition<TId extends string> {
  id: TId;
  label: string;
  /** Optional count shown after the label — e.g. how many items the panel holds. */
  count?: number;
}

interface TabsProps<TId extends string> {
  /** Names the tablist for screen readers. Required — a bare tablist is meaningless. */
  label: string;
  tabs: TabDefinition<TId>[];
  activeId: TId;
  onChange: (id: TId) => void;
  /** Namespaces the generated ids so two tablists can coexist on one page. */
  idPrefix: string;
}

export function tabId(idPrefix: string, id: string): string {
  return `${idPrefix}-tab-${id}`;
}

export function tabPanelId(idPrefix: string, id: string): string {
  return `${idPrefix}-panel-${id}`;
}

/**
 * An ARIA tablist with roving tabindex and arrow-key navigation. Pair each
 * tab with a <TabPanel> using the same `idPrefix` so the panel and its tab
 * point at each other.
 */
export function Tabs<TId extends string>({
  label,
  tabs,
  activeId,
  onChange,
  idPrefix,
}: TabsProps<TId>) {
  const listRef = useRef<HTMLDivElement>(null);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeId);
    if (currentIndex === -1) return;

    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    const next = tabs[nextIndex];
    if (!next) return;
    onChange(next.id);
    // Focus follows selection, per the WAI-ARIA automatic-activation pattern.
    listRef.current
      ?.querySelector<HTMLButtonElement>(`#${CSS.escape(tabId(idPrefix, next.id))}`)
      ?.focus();
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className="flex gap-1 overflow-x-auto rounded-control border border-line bg-white p-1"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={tabId(idPrefix, tab.id)}
            aria-selected={isActive}
            aria-controls={tabPanelId(idPrefix, tab.id)}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`shrink-0 rounded-control px-3.5 py-2 font-display text-sm font-semibold transition-colors ${
              isActive
                ? "bg-primary text-on-primary"
                : "text-ink-muted hover:bg-surface-container hover:text-ink"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`ml-1.5 tabular-nums ${isActive ? "text-on-primary/70" : "text-ink-subtle"}`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface TabPanelProps {
  id: string;
  activeId: string;
  idPrefix: string;
  children: ReactNode;
}

export function TabPanel({ id, activeId, idPrefix, children }: TabPanelProps) {
  if (id !== activeId) return null;
  return (
    <div
      role="tabpanel"
      id={tabPanelId(idPrefix, id)}
      aria-labelledby={tabId(idPrefix, id)}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: WAI-ARIA's tabs pattern requires a focusable tabpanel, so a keyboard user leaving the tablist has somewhere to land when the panel holds no focusable content of its own.
      tabIndex={0}
    >
      {children}
    </div>
  );
}
