import Sidebar from "./Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 bg-[#faf8f8]">
      <Sidebar />
      <div className="absolute h-[calc(100vh-24px)] rounded-lg top-3 left-60 bg-[white] w-[calc(100vw-252px)] shadow-md">
        {children}
      </div>
    </div>
  );
}
