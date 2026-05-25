import { PortalNav } from "@/components/PortalNav";
import { PortalTopbar } from "@/components/PortalTopbar";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--color-bg-subtle)]">
      <PortalNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <PortalTopbar />
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
