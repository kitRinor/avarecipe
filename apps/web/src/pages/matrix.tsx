import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// UI
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus } from "lucide-react";

// Type
import type { InferResponseType } from "hono/client";
import { PageLayout } from "@/components/pageLayout";
type MatrixResponse = InferResponseType<typeof api.matrix.$get, 200>;

export default function MatrixPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<MatrixResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState("");

  // 認証ガード
  useEffect(() => {
    if (!auth.isLoading && !auth.user) navigate("/login");
  }, [auth.user, auth.isLoading, navigate]);

  // データ取得
  const fetchMatrix = async () => {
    const res = await api.matrix.$get();
    if (res.ok) setData(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    if (auth.user) fetchMatrix();
  }, [auth.user]);

  // 衣装追加
  const handleAddItem = async () => {
    if (!newItemName) return;
    await api.items.$post({ json: { name: newItemName, category: 'cloth' } });
    setNewItemName("");
    fetchMatrix();
  };

  // ステータス切り替え (⚪ -> 🟢 -> 🟡 -> ⚪)
  const toggleStatus = async (avatarId: string, itemId: string, currentStatus?: string) => {
    // 次のステータスを決定
    const nextStatus = 
      currentStatus === "official" ? "modified" :
      currentStatus === "modified" ? "unsupported" : "official";

    // 1. UIを楽観的更新 (APIを待たずに画面を変える)
    const newData = JSON.parse(JSON.stringify(data)) as MatrixResponse; // Deep Copy
    const existingIdx = newData.compatibilities.findIndex(c => c.avatarId === avatarId && c.itemId === itemId);
    
    const now = new Date().toISOString();

    if (existingIdx >= 0) {
      newData.compatibilities[existingIdx].status = nextStatus as any;
    } else {
      newData.compatibilities.push({ 
        avatarId, itemId, 
        status: nextStatus as any,
        userId: auth.user!.id,
        note: null,
        updatedAt: now
      });
    }
    setData(newData);

    // 2. API送信
    await api.compatibility.$post({
      json: { avatarId, itemId, status: nextStatus as any }
    });
  };


  return (
    <PageLayout>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 p-8">
        <div className="max-w-full mx-auto">
          {/* ヘッダー */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/home">
                <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">衣装対応マトリクス</h1>
                <p className="text-zinc-500 text-sm">クリックしてステータスを切り替え</p>
              </div>
            </div>
            
            {/* 簡易アイテム追加 */}
            <div className="flex gap-2">
              <Input 
                placeholder="新しい衣装名..." 
                value={newItemName} 
                onChange={e => setNewItemName(e.target.value)} 
                className="w-64 bg-white"
              />
              <Button onClick={handleAddItem}><Plus className="h-4 w-4 mr-1" /> 衣装追加</Button>
            </div>
          </div>

          {/* マトリクス表 */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                {/* テーブルヘッダー (アバター列) */}
                <thead className="text-xs uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  <tr>
                    <th className="px-4 py-3 font-medium sticky left-0 bg-zinc-100 dark:bg-zinc-800 z-20 border-r">
                      Item \ Avatar
                    </th>
                    {data?.avatars.map((avatar) => (
                      <th key={avatar.id} className="px-4 py-3 font-medium text-center min-w-[100px] border-r last:border-r-0">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm">{avatar.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* テーブルボディ (アイテム行) */}
                <tbody>
                  {data?.items.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      {/* 左端: アイテム名 */}
                      <td className="px-4 py-3 font-medium sticky left-0 bg-white dark:bg-zinc-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        <div className="flex flex-col">
                          <span className="text-base font-semibold">{item.name}</span>
                          <span className="text-xs text-zinc-400">{item.category}</span>
                        </div>
                      </td>

                      {/* 交差セル: ステータス */}
                      {data.avatars.map((avatar) => {
                        const comp = data.compatibilities.find(
                          (c) => c.avatarId === avatar.id && c.itemId === item.id
                        );
                        const status = comp?.status || "unsupported";

                        return (
                          <td 
                            key={`${avatar.id}-${item.id}`} 
                            className="px-2 py-3 text-center border-r last:border-r-0 cursor-pointer transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            onClick={() => toggleStatus(avatar.id, item.id, status)}
                          >
                            <div className="flex justify-center">
                              {status === "official" && (
                                <Badge variant="default" className="bg-green-600 hover:bg-green-700">公式</Badge>
                              )}
                              {status === "modified" && (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">改変</Badge>
                              )}
                              {status === "unsupported" && (
                                <span className="text-zinc-200 dark:text-zinc-700 block w-full h-full select-none">・</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {data?.items.length === 0 && (
                    <tr>
                      <td colSpan={data?.avatars.length + 1} className="p-8 text-center text-zinc-400">
                        衣装がまだありません。右上のフォームから追加してください。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}