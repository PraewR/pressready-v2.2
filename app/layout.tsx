import "./globals.css";

export const metadata = {
  title: "PressReady V2 Prototype",
  description: "AI-powered media interview preparation for PR consultants",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
