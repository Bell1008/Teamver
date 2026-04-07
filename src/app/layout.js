import "./globals.css";
import { DialogProvider } from "@/components/DialogProvider";

export const metadata = { title: "Teamver", description: "AI 활용 학생 팀플 전용 협업 도구" };

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <DialogProvider>{children}</DialogProvider>
      </body>
    </html>
  );
}
