"use client";

import { Plus } from "reicon-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export type ComposeAction = {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  onSelect: () => void;
};

export type ComposeGroup = {
  id: string;
  title?: string;
  actions: ComposeAction[];
};

type FloatingComposeMenuProps = {
  groups: ComposeGroup[];
  label?: string;
};

export function FloatingComposeMenu({ groups, label = "Adicionar" }: FloatingComposeMenuProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const firstActionRef = useRef<HTMLButtonElement>(null);
  const actions = groups.flatMap((group) => group.actions);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    const frame = requestAnimationFrame(() => firstActionRef.current?.focus());

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      cancelAnimationFrame(frame);
    };
  }, [open]);

  function handleSelect(action: ComposeAction) {
    setOpen(false);
    action.onSelect();
  }

  return (
    <>
      <div
        aria-hidden={!open}
        onClick={() => setOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          background: "rgba(30, 28, 24, 0.28)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 180ms ease",
        }}
      />

      <div
        ref={rootRef}
        style={{
          position: "fixed",
          right: 28,
          bottom: 28,
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 12,
        }}
      >
        <div
          id={panelId}
          role="menu"
          aria-hidden={!open}
          style={{
            width: "min(320px, calc(100vw - 48px))",
            transformOrigin: "bottom right",
            transform: open ? "scale(1) translateY(0)" : "scale(0.92) translateY(12px)",
            opacity: open ? 1 : 0,
            pointerEvents: open ? "auto" : "none",
            transition: "opacity 180ms ease, transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
            background: "var(--ds-surface)",
            border: "1px solid var(--ds-border)",
            borderRadius: 20,
            boxShadow: "0 18px 48px rgba(30, 28, 24, 0.14)",
            padding: "10px",
            maxHeight: "min(70vh, 520px)",
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {actions.map((action, index) => (
              <button
                key={action.id}
                ref={index === 0 ? firstActionRef : undefined}
                type="button"
                role="menuitem"
                onClick={() => handleSelect(action)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  borderRadius: 12,
                  padding: "10px 12px",
                  background: "transparent",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  color: "var(--ds-text)",
                  transition: "background 140ms ease, opacity 180ms ease, transform 220ms ease",
                  opacity: open ? 1 : 0,
                  transform: open ? "translateY(0)" : "translateY(6px)",
                  transitionDelay: open ? `${60 + index * 28}ms` : "0ms",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = "var(--ds-hover)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = "transparent";
                }}
              >
                {action.icon ? (
                  <span
                    aria-hidden
                    style={{
                      width: 36,
                      height: 36,
                      flexShrink: 0,
                      borderRadius: 10,
                      background: "var(--ds-soft)",
                      color: "var(--ds-accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {action.icon}
                  </span>
                ) : null}
                <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 650 }}>{action.label}</span>
                  {action.description ? (
                    <span style={{ fontSize: 12, color: "var(--ds-muted)", fontWeight: 500, lineHeight: 1.35 }}>
                      {action.description}
                    </span>
                  ) : null}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          aria-label={open ? "Fechar menu de adicionar" : label}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((current) => !current)}
          style={{
            width: 58,
            height: 58,
            borderRadius: 999,
            border: "none",
            background: "var(--ds-accent)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 10px 28px rgba(30, 28, 24, 0.18)",
            transition: "transform 200ms cubic-bezier(0.22, 1, 0.36, 1)",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
          }}
        >
          <Plus size={24} />
        </button>
      </div>
    </>
  );
}
