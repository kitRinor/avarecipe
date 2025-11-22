import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Shirt } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function LandingPage() {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // 🔄 ログイン済みなら自動でホームへ
  useEffect(() => {
    if (!isLoading && user) {
      navigate("/home");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) return null; // 判定中は何も出さない

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      {/* ヘッダー */}
      <header className="px-6 py-4 flex items-center justify-between border-b bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-2 font-bold text-xl">
          <Shirt className="h-6 w-6" />
          {t("app.title")}
        </div>
        <div className="flex gap-4">
          <Link to="/login">
            <Button>{t("auth.login")}</Button>
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-8">
        <div className="max-w-2xl space-y-6">
          <h1 className="text-4xl font-bold">{t("index.welcome_message")}</h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 whitespace-pre-line">
            {t("index.app_description")}
          </p>
          
          <div className="flex gap-4 justify-center pt-4">
            <Link to="/login">
              <Button size="lg" className="px-8 text-lg">
                {t("index.get_started")}
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-8 text-lg">
              {t("index.see_features")}
            </Button>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="py-6 text-center text-zinc-500 text-sm border-t">
        {t("app.footer")}
      </footer>
    </div>
  );
}