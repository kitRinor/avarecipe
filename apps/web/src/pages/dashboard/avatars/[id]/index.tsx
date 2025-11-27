import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { dashboardApi } from "@/lib/api";
import { PageLayout } from "@/components/common/PageLayout";

// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ExternalLink, Pencil, Image as ImageIcon, Layers, UserIcon } from "lucide-react";

// Type
import type { InferResponseType } from "hono/client";
import { PageHeader } from "@/components/common/PageHeader";
type AvatarDetail = InferResponseType<typeof dashboardApi.avatars[':id']['$get'], 200>;
type SharedOutfitList = InferResponseType<typeof dashboardApi.outfits.shared.item[':id']['$get'], 200>;

export default function AvatarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [avatar, setAvatar] = useState<AvatarDetail | null>(null);
  const [sharedOutfits, setSharedOutfits] = useState<SharedOutfitList>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchData = async () => {
    if (!id) return;
    try {
      const res = await dashboardApi.avatars[':id'].$get({ param: { id } });
      if (res.ok) {
        const data = await res.json();
        setAvatar(data);
      } else {
        navigate("/404", { replace: true });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  // Fetch shared outfits that use this item
  const fetchSharedOutfits = async () => {
    if (!id) return;
    try {
      const res = await dashboardApi.outfits.shared.avatar[':id'].$get({ param: { id } });
      if (res.ok) {
        const data = await res.json();
        setSharedOutfits(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    fetchSharedOutfits();
  }, [id, navigate]);

  if (loading) return <PageLayout><div className="p-10">{t("core.action.loading")}</div></PageLayout>;
  if (!avatar) return null;

  return (
    <PageLayout>
      {/* ヘッダー */}
      <PageHeader
        title={t("avatars.detail.page_title")} 
        description={t("avatars.detail.page_description")}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 左カラム: 画像表示 */}
        <div className="md:col-span-1">
          <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-sm">
            {avatar.thumbnailUrl ? (
              <img src={avatar.thumbnailUrl} alt={avatar.name} className="object-cover w-full h-full" />
            ) : (
              <div className="text-zinc-300 flex flex-col items-center gap-2">
                <ImageIcon className="h-16 w-16" />
                <span className="text-sm text-zinc-400 font-medium">No Image</span>
              </div>
            )}
          </div>
        </div>

        {/* 右カラム: 情報表示 */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{avatar.name}</span>
                <Button onClick={() => navigate(`/avatars/${avatar.id}/edit`)} variant="ghost" size="icon">
                  <Pencil className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              <div>
                <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t("core.data.avatar.store_url")}</h2>
                {avatar.storeUrl ? (
                  <a 
                    href={avatar.storeUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 text-blue-500 hover:underline mt-1 break-all"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {avatar.storeUrl}
                  </a>
                ) : (
                  <p className="text-sm text-zinc-400 mt-1">{t("core.message.no_data")}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 将来的な機能のプレースホルダー */}
          <Card className="bg-zinc-50 dark:bg-zinc-900/50 border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-zinc-500">
                <Layers className="h-5 w-5" />
                {t("avatars.detail.used_in_coordinations")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sharedOutfits.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sharedOutfits.map((outfit) => (
                    <div 
                      key={outfit.id} 
                      className="group bg-white dark:bg-zinc-900 rounded-lg border p-3 hover:shadow-md transition-shadow cursor-pointer"
                      // onClick={() => navigate(`/outfits/${outfit.id}`)} // 将来的に詳細ページへ
                    >
                      {/* サムネイル */}
                      <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-md overflow-hidden mb-3 flex items-center justify-center relative">
                        {outfit.imageUrl ? (
                          <img src={outfit.imageUrl} alt={outfit.name} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="h-8 w-8 text-zinc-300" />
                        )}
                      </div>
                      
                      {/* 情報 */}
                      <div>
                        <h3 className="font-bold text-sm truncate">{outfit.name}</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                          {outfit.userDisplayName}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                          {outfit.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-400 text-sm">
                  <p>{t("items.detail.no_used_in_coordinations")}</p>
                  <p className="text-xs mt-2 opacity-70">※ ストアURLが設定されているアイテムのみ検索対象になります</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}