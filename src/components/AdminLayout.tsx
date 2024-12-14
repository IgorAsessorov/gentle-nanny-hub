import { useState } from "react";
import { Menu, User, Users, Home } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { icon: User, label: "Профиль пользователя", path: "/profile" },
    { icon: Users, label: "Няни", path: "/nannies" },
    { icon: Home, label: "Семьи и дети", path: "/families" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen transition-transform bg-[#8B5CF6] border-r border-[#7C3AED]",
          isSidebarOpen ? "w-64" : "w-16",
          "animate-slide-in-right"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#7C3AED]">
          <h1
            className={cn(
              "font-semibold text-white transition-opacity",
              isSidebarOpen ? "opacity-100" : "opacity-0"
            )}
          >
            NMS Admin
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hover:bg-[#7C3AED] text-white"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <nav className="p-2">
          {menuItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              className={cn(
                "w-full justify-start mb-1 hover:bg-[#7C3AED] text-white",
                isSidebarOpen ? "px-4" : "px-2"
              )}
            >
              <item.icon className="h-5 w-5 mr-2" />
              <span
                className={cn(
                  "transition-opacity",
                  isSidebarOpen ? "opacity-100" : "opacity-0"
                )}
              >
                {item.label}
              </span>
            </Button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main
        className={cn(
          "transition-all duration-300 p-8 bg-gray-50",
          isSidebarOpen ? "ml-64" : "ml-16"
        )}
      >
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;