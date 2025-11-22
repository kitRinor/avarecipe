import { ReactNode, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// UI
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shirt } from "lucide-react";
import { useTranslation } from "react-i18next";

export function PageLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    if (!auth.user && !auth.isLoading) {
      // not logged in, redirect to LP
      navigate("/", { replace: true } );
    }
  }, [auth.user, auth.isLoading]);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      
      {/* --- AppBar --- */}
      <header className="border-b bg-white dark:bg-zinc-900 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          <Link to="/home" className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity">
            <Shirt className="h-6 w-6" /> {t("app.title")}
          </Link>

          {/* User Menu */}
          {auth.user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={auth.user.avatarUrl} />
                  <AvatarFallback>ME</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:block">
                  {auth.user.displayName}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={auth.logout}>
                {t("auth.logout")}
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* --- contents --- */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-zinc-500 text-sm border-t bg-zinc-50 dark:bg-zinc-950">
        {t("app.footer")}
      </footer>
      
    </div>
  );
}