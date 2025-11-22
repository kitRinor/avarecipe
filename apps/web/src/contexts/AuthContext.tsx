import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type AuthUser = {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl?: string;
};

// 開発用ダミーユーザー (Seedで作ったデータとIDを合わせる)
const DUMMY_USER: AuthUser = {
  id: "00000000-0000-0000-0000-000000000000",
  handle: "@dev",
  displayName: "Dev User",
  avatarUrl: "https://github.com/shadcn.png", // 適当なアイコン
};

type ContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const Context = createContext<ContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // auto login for dev
    const storedUser = localStorage.getItem("vrclo_mock_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async () => {
    // dummy wait
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    // set dummy user
    setUser(DUMMY_USER);
    localStorage.setItem("vrclo_mock_user", JSON.stringify(DUMMY_USER));
    setIsLoading(false);
  };

  const logout = async () => {
    // dummy wait
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    setUser(null);
    localStorage.removeItem("vrclo_mock_user");
    setIsLoading(false);
  };

  return (
    <Context.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </Context.Provider>
  );
}

export function useAuth() {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}