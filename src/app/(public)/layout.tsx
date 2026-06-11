import { Masthead } from "@/components/site/Masthead";
import { Footer } from "@/components/site/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Masthead />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
