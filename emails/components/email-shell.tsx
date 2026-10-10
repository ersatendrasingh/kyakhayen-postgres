import type { CSSProperties, ReactNode } from "react";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "https://www.kyakhayen.com";

export const emailLinks = {
  home: appUrl,
  login: `${appUrl}/auth/login`,
  register: `${appUrl}/auth/register`,
  mealPlan: `${appUrl}/meal-plan`,
  preferences: `${appUrl}/meal-plan/create`,
  plans: `${appUrl}/subscription-plans`,
  support: `${appUrl}/contact-us`,
};

const colours = {
  canvas: "#f8f1e7",
  paper: "#fffdf9",
  ink: "#30251f",
  copy: "#675950",
  muted: "#8d786b",
  line: "#eadcc8",
  accent: "#c23b2c",
  accentSoft: "#f8e6dd",
  forest: "#19372e",
  gold: "#c38e43",
};

const bodyStyle: CSSProperties = {
  margin: 0,
  padding: "32px 12px",
  backgroundColor: colours.canvas,
  color: colours.ink,
  fontFamily: "Arial, Helvetica, sans-serif",
};

const copyStyle: CSSProperties = {
  margin: "0 0 18px",
  color: colours.copy,
  fontSize: "15px",
  lineHeight: "24px",
};
const EmailHead = "head" as const;
const EmailImage = "img" as const;

type EmailShellProps = {
  preview: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
};

export function EmailShell({
  preview,
  eyebrow,
  title,
  children,
}: EmailShellProps) {
  return (
    <html lang="en">
      <EmailHead>
        <meta content={preview} name="x-apple-disable-message-reformatting" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
      </EmailHead>
      <body style={bodyStyle}>
        <div
          style={{
            display: "none",
            maxHeight: 0,
            overflow: "hidden",
            opacity: 0,
          }}
        >
          {preview}
        </div>
        <table
          cellPadding="0"
          cellSpacing="0"
          role="presentation"
          style={{ margin: "0 auto", maxWidth: "620px", width: "100%" }}
        >
          <tbody>
            <tr>
              <td style={{ padding: "0 0 16px" }}>
                <table
                  cellPadding="0"
                  cellSpacing="0"
                  role="presentation"
                  style={{
                    backgroundColor: colours.paper,
                    border: `1px solid ${colours.line}`,
                    borderRadius: "22px",
                    width: "100%",
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ padding: "24px 28px 18px" }}>
                        <table
                          cellPadding="0"
                          cellSpacing="0"
                          role="presentation"
                          style={{ width: "100%" }}
                        >
                          <tbody>
                            <tr>
                              <td>
                                <a href={emailLinks.home}>
                                  <EmailImage
                                    alt="Kya Khayen"
                                    height="45"
                                    src="cid:kyakhayen-logo"
                                    style={{
                                      border: 0,
                                      display: "block",
                                      height: "45px",
                                      width: "auto",
                                    }}
                                  />
                                </a>
                              </td>
                              <td
                                style={{
                                  color: colours.gold,
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  letterSpacing: "2px",
                                  textAlign: "right",
                                  textTransform: "uppercase",
                                }}
                              >
                                A KASA Product
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "0 28px" }}>
                        <div
                          style={{
                            borderTop: `1px solid ${colours.line}`,
                            paddingTop: "28px",
                          }}
                        >
                          <p
                            style={{
                              color: colours.accent,
                              fontSize: "11px",
                              fontWeight: 700,
                              letterSpacing: "2.4px",
                              margin: "0 0 12px",
                              textTransform: "uppercase",
                            }}
                          >
                            {eyebrow}
                          </p>
                          <h1
                            style={{
                              color: colours.ink,
                              fontSize: "30px",
                              letterSpacing: "-0.6px",
                              lineHeight: "37px",
                              margin: "0 0 22px",
                            }}
                          >
                            {title}
                          </h1>
                        </div>
                        {children}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "12px 28px 28px" }}>
                        <div
                          style={{
                            borderTop: `1px solid ${colours.line}`,
                            color: colours.muted,
                            fontSize: "12px",
                            lineHeight: "19px",
                            paddingTop: "18px",
                          }}
                        >
                          <strong style={{ color: colours.ink }}>
                            Kya Khayen
                          </strong>{" "}
                          is a KASA product. Recipe discovery and meal planning
                          information only; not medical, diagnostic or
                          allergy-safety advice.
                          <br />
                          <a
                            href={emailLinks.support}
                            style={{ color: colours.accent }}
                          >
                            Contact support
                          </a>{" "}
                          &nbsp;|&nbsp; {new Date().getFullYear()} KASA
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

export function EmailParagraph({ children }: { children: ReactNode }) {
  return <p style={copyStyle}>{children}</p>;
}

export function EmailButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <div style={{ margin: "26px 0" }}>
      <a
        href={href}
        style={{
          backgroundColor: colours.accent,
          borderRadius: "999px",
          color: "#ffffff",
          display: "inline-block",
          fontSize: "15px",
          fontWeight: 700,
          padding: "14px 26px",
          textDecoration: "none",
        }}
      >
        {children}
      </a>
    </div>
  );
}

export function EmailNotice({
  children,
  tone = "warm",
}: {
  children: ReactNode;
  tone?: "warm" | "dark";
}) {
  return (
    <div
      style={{
        backgroundColor: tone === "dark" ? colours.forest : colours.accentSoft,
        borderRadius: "16px",
        color: tone === "dark" ? "#fef8ec" : colours.ink,
        fontSize: "14px",
        lineHeight: "22px",
        margin: "18px 0 24px",
        padding: "16px 18px",
      }}
    >
      {children}
    </div>
  );
}

export function CodeBlock({ code }: { code: string }) {
  return (
    <div
      style={{
        backgroundColor: colours.forest,
        borderRadius: "16px",
        color: "#ffffff",
        fontSize: "32px",
        fontWeight: 700,
        letterSpacing: "8px",
        margin: "22px 0",
        padding: "18px",
        textAlign: "center",
      }}
    >
      {code}
    </div>
  );
}

export function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <tr>
      <td
        style={{
          borderBottom: `1px solid ${colours.line}`,
          color: colours.muted,
          fontSize: "13px",
          padding: "11px 0",
        }}
      >
        {label}
      </td>
      <td
        style={{
          borderBottom: `1px solid ${colours.line}`,
          color: colours.ink,
          fontSize: "13px",
          fontWeight: 700,
          padding: "11px 0",
          textAlign: "right",
        }}
      >
        {value}
      </td>
    </tr>
  );
}

export function DetailTable({ children }: { children: ReactNode }) {
  return (
    <table
      cellPadding="0"
      cellSpacing="0"
      role="presentation"
      style={{ margin: "12px 0 22px", width: "100%" }}
    >
      <tbody>{children}</tbody>
    </table>
  );
}
