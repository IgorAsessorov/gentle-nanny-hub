import { useState, useEffect } from "react";
import { Menu, User, Users, Home, LogOut, Calendar } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import LoadingScreen from "./LoadingScreen";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useSessionHandler } from "@/hooks/useSessionHandler";

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showLoading, setShowLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { handleLogout } = useSessionHandler();

  const menuItems = [
    { icon: User, label: "Профиль пользователя", path: "/profile" },
    { icon: Users, label: "Пользователи", path: "/users" },
    { icon: Home, label: "Семьи и дети", path: "/families" },
    { icon: Users, label: "Няни", path: "/nannies" },
    { icon: Calendar, label: "Заявки", path: "/appointments" },
  ];

  useEffect(() => {
    let isSubscribed = true;

    if (location.pathname === "/auth") {
      setShowLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        console.log("Проверяем сессию...");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Ошибка при проверке сессии:", error);
          if (isSubscribed) {
            navigate("/auth");
          }
          return;
        }

        if (!session) {
          console.log("Сессия не найдена, перенаправляем на /auth");
          if (isSubscribed) {
            navigate("/auth");
          }
          return;
        }

        console.log("Сессия найдена:", session);
        if (isSubscribed) {
          setShowLoading(false);
        }
      } catch (error) {
        console.error("Ошибка при проверке авторизации:", error);
        if (isSubscribed) {
          navigate("/auth");
        }
      }
    };

    const subscription = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Изменение состояния авторизации:", event, session);
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('Токен успешно обновлен');
        return;
      }
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log("Пользователь не авторизован");
        if (isSubscribed) {
          navigate("/auth");
        }
        return;
      }

      if (isSubscribed) {
        setShowLoading(false);
      }
    });

    checkAuth();

    return () => {
      console.log("Очистка подписок на авторизацию");
      isSubscribed = false;
      subscription.data.subscription.unsubscribe();
    };
  }, [navigate, location]);

  if (showLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-white">
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen transition-transform bg-[#8B5CF6] border-r border-[#7C3AED]",
          isSidebarOpen ? "w-64" : "w-16"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#7C3AED]">
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
            className={cn(
              "text-white hover:text-white hover:bg-[#7C3AED]",
              !isSidebarOpen && "w-full flex justify-center"
            )}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex flex-col justify-between h-[calc(100%-4rem)]">
          <div className="p-2">
            {menuItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full justify-start mb-1 text-white hover:text-white hover:bg-[#7C3AED]",
                  isSidebarOpen ? "px-4" : "px-2"
                )}
              >
                <item.icon className="h-5 w-5 mr-2" />
                <span
                  className={cn(
                    "transition-opacity whitespace-nowrap",
                    isSidebarOpen ? "opacity-100" : "opacity-0 w-0"
                  )}
                >
                  {item.label}
                </span>
              </Button>
            ))}
          </div>
          
          <div className="p-2 mt-auto">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className={cn(
                "w-full justify-start mb-1 text-white hover:text-white hover:bg-[#7C3AED]",
                isSidebarOpen ? "px-4" : "px-2"
              )}
            >
              <LogOut className="h-5 w-5 mr-2" />
              <span
                className={cn(
                  "transition-opacity whitespace-nowrap",
                  isSidebarOpen ? "opacity-100" : "opacity-0 w-0"
                )}
              >
                Выйти
              </span>
            </Button>
          </div>
        </nav>
      </aside>

      <main
        className={cn(
          "transition-all duration-300 p-8 bg-gray-50",
          isSidebarOpen ? "ml-64" : "ml-16"
        )}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;