import type { CSSProperties } from "react";

export const titleStyle: CSSProperties = {
  margin: "0 0 4px",
  fontFamily: "var(--font-bricolage), sans-serif",
  fontWeight: 700,
  fontSize: 20,
  letterSpacing: "-0.02em",
  color: "var(--ds-text)",
};

export const subtitleStyle: CSSProperties = {
  margin: "0 0 22px",
  fontSize: 13.5,
  color: "var(--ds-muted)",
};

export const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--ds-text)",
  marginBottom: 6,
};

export const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  background: "var(--ds-soft)",
  border: "1px solid var(--ds-border)",
  borderRadius: 10,
  padding: "10px 13px",
  fontSize: 14,
  color: "var(--ds-text)",
  outline: "none",
};

export const fieldStyle: CSSProperties = { marginBottom: 16 };

export const buttonStyle: CSSProperties = {
  width: "100%",
  background: "var(--ds-accent)",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "11px 16px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(0,0,0,.08)",
};

export const footerTextStyle: CSSProperties = {
  marginTop: 18,
  fontSize: 13,
  color: "var(--ds-muted)",
  textAlign: "center",
};

export const linkStyle: CSSProperties = {
  color: "var(--ds-accent)",
  fontWeight: 600,
  textDecoration: "none",
};
