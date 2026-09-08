import { getPasswordChecks, PASSWORD_MIN_LENGTH } from "@bethel/auth/password";

const RULES = [
  { key: "letter" as const, label: "Letra" },
  { key: "number" as const, label: "Número" },
  { key: "symbol" as const, label: "Símbolo" },
  { key: "length" as const, label: `${PASSWORD_MIN_LENGTH} caracteres` },
];

export function PasswordRules({ password }: { password: string }) {
  const checks = getPasswordChecks(password);

  return (
    <ul
      aria-live="polite"
      style={{
        listStyle: "none",
        margin: "0 0 16px",
        padding: 0,
        display: "grid",
        gap: 8,
      }}
    >
      {RULES.map((rule) => {
        const ok = checks[rule.key];
        return (
          <li
            key={rule.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: ok ? "#4f8a6b" : "var(--ds-muted)",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 16,
                height: 16,
                borderRadius: 999,
                border: `1.5px solid ${ok ? "#4f8a6b" : "var(--ds-border)"}`,
                background: ok ? "#4f8a6b" : "transparent",
                color: "#fff",
                fontSize: 10,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {ok ? "✓" : ""}
            </span>
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
