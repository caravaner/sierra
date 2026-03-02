import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-muted/30">
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
