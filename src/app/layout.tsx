import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ระบบนิเทศนักศึกษาฝึกสอน",
  description: "คณะครุศาสตร์อุตสาหกรรม — ภาควิชาครุศาสตร์ไฟฟ้า",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body
        className="font-sans antialiased"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <header style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-4">
            <div
              className="grid h-10 w-10 place-items-center rounded-[10px] text-white"
              style={{
                background: "linear-gradient(135deg, #ff8a3d, var(--accent))",
                boxShadow: "var(--shadow), var(--glow)",
              }}
              aria-hidden
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold" style={{ color: "var(--ink)" }}>
                ระบบนิเทศนักศึกษาฝึกสอน
              </h1>
              <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
                คณะครุศาสตร์อุตสาหกรรม · ภาควิชาครุศาสตร์ไฟฟ้า
              </p>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
