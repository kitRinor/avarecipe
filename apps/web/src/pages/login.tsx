import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext"; // 👈 Authクライアント
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shirt, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next"; // 👈 多言語対応を追加

export default function LoginPage() {
  const auth = useAuth(); // 👈 ユーザー指定の呼び出し形式
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // 状態管理
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null); 
  const [isLoading, setIsLoading] = useState(false); 

  // redirect if logged in
  useEffect(() => {
    if (!auth.isLoading && auth.user) {
      navigate("/dashboard");
    }
  }, [auth.user, auth.isLoading, navigate]);

  if (auth.isLoading) return null; 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null); // リクエスト前にエラーをクリア
    try {
      const {ok, error} = await auth.login(email, password); 
      if (ok) {
        navigate("/dashboard"); // ログイン成功
      } else {
        setError(error ?? t('core.message.error_occurred')); // エラーメッセージ表示
      }
    } catch (err) {
      setError(t('core.message.error_occurred'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-vrclo1-50  p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-vrclo1-900 rounded-full text-white">
              <Shirt className="w-6 h-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{t('app.title')}</CardTitle>
          <CardDescription>
            {t('app.description')}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {/* 💡 エラー表示エリア */}
            {error && (
              <p className="text-sm text-red-500 bg-red-50  p-2 rounded text-center border border-red-200">
                {error}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="email@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                disabled={isLoading}
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('auth.login')}
            </Button>
            
            <div className="w-full flex flex-row justify-between">
              <Button className="w-1/2" variant="ghost" disabled={isLoading}>
                {t('auth.if_new_user')}
              </Button>
              <Button className="w-1/2" variant="ghost" disabled={isLoading}>
                {t('auth.if_forget_password')}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}