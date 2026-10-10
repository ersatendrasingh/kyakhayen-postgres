import Footer from "@/components/footer/footer";
import { Header } from "@/components/header/header";
import MobileMenu from "@/components/header/mobile-menu";
import ScrollToTopButton from "@/components/scroll-to-top-button";
import { ModeToggle } from "@/components/mode-toggle";

// Website pages read from Neon at request time. Keeping this route group
// dynamic prevents Vercel's build workers from prerendering every DB-backed
// page concurrently and exhausting Neon's small connection pool.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const WebsiteLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-svh flex-col bg-[#fcf8f0] dark:bg-[#091712]">
      <Header />
      <MobileMenu />
      <div className="fixed bottom-7 left-7 z-40 hidden lg:block">
        <ModeToggle />
      </div>
      <main className="flex flex-1 flex-col pt-[108px] lg:pt-[100px]">
        <div className="flex min-h-[calc(100svh-108px)] flex-1 flex-col lg:min-h-[calc(100svh-100px)]">
          {children}
        </div>
      </main>
      <ScrollToTopButton />
      <Footer />
    </div>
  );
};

export default WebsiteLayout;
