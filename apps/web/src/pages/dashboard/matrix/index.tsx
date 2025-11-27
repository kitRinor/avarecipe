import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { dashboardApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { PageLayout } from "@/components/common/PageLayout";

// UI
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, Image as ImageIcon } from "lucide-react";

// Utils
import { cn } from "@/lib/utils";

// Type
import type { InferResponseType } from "hono/client";
import { PageHeader } from "@/components/common/PageHeader";

type MatrixResponse = InferResponseType<typeof dashboardApi.matrix.$get, 200>;

export default function MatrixPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [data, setData] = useState<MatrixResponse | null>(null);
  const prevData = useRef<MatrixResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch matrix data on load
  const fetchMatrix = async () => {
    try {
      const res = await dashboardApi.matrix.$get();
      if (res.ok) {
        setData(await res.json());
      } else {
        toast.error(t('matrix.fetch_failed'));
      }
    } catch (e) {
      console.error(e);
      toast.error(t('core.message.error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMatrix();
    }
  }, [user]);

  // Toggle compatibility status
  const toggleStatus = async (avatarId: string, itemId: string, currentStatus?: string) => {
    const nextStatus =
      currentStatus === "official" ? "modified" :
      currentStatus === "modified" ? "unsupported" : "official";

    prevData.current = data;
    const newData = JSON.parse(JSON.stringify(data)) as MatrixResponse;
    
    const existingIdx = newData.compatibilities.findIndex(
      c => c.avatarId === avatarId && c.itemId === itemId
    );

    if (existingIdx >= 0) {
      newData.compatibilities[existingIdx].status = nextStatus;
    } else {
      newData.compatibilities.push({
        userId: user!.id, 
        avatarId,
        itemId,
        status: nextStatus,
        note: null,
      });
    }
    setData(newData);

    try {
      const res = await dashboardApi.compatibility.$post({
        json: { avatarId, itemId, status: nextStatus }
      });

      if (!res.ok) {
        throw new Error("API Error");
      }
    } catch (e) {
      console.error(e);
      toast.error(t('matrix.update_failed'));
      setData(prevData.current);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="p-10 flex justify-center text-zinc-500">
          {t('core.message.loading')}
        </div>
      </PageLayout>
    );
  }

  if (!data) {
    return (
      <PageLayout>
        <div className="p-10 flex justify-center text-red-500">
          {t('core.message.no_data')}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Header */}
      <PageHeader
        title={t('matrix.page_title')} 
        description={t('matrix.page_description')}
      />
      {/* Matrix Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border overflow-visible">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            {/* Table Header: Avatars */}
            <thead className="text-xs uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              <tr>
                <th className="px-4 py-3 font-medium sticky left-0 bg-zinc-100 dark:bg-zinc-800 z-20 border-r dark:border-zinc-700 min-w-[200px]">
                  {t('core.data.item.name')} \ {t('core.data.avatar.name')}
                </th>
                {data.avatars.map((avatar) => (
                  <th key={avatar.id} className="px-2 py-3 font-medium text-center min-w-[100px] border-r dark:border-zinc-700 last:border-r-0">
                    <div className="flex flex-col items-center gap-2">
                      
                      {/* Avatar Image with HoverCard (Clean syntax!) */}
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <Avatar className="h-10 w-10 cursor-pointer border border-zinc-200 dark:border-zinc-700 hover:scale-110 transition-transform">
                            <AvatarImage src={avatar.thumbnailUrl || undefined} className="object-cover" />
                            <AvatarFallback>
                              <UserIcon className="h-5 w-5 text-zinc-400" />
                            </AvatarFallback>
                          </Avatar>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-auto p-0 overflow-hidden border-none shadow-xl rounded-lg" side="bottom" sideOffset={5}>
                          <div className="relative">
                            {avatar.thumbnailUrl ? (
                              <img 
                                src={avatar.thumbnailUrl} 
                                alt={avatar.name} 
                                className="w-48 h-48 object-cover" 
                              />
                            ) : (
                              <div className="w-48 h-48 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                <UserIcon className="h-12 w-12 text-zinc-300" />
                              </div>
                            )}
                            <div className="absolute bottom-0 w-full bg-black/60 p-2 text-white text-xs text-center truncate">
                              {avatar.name}
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>

                      <span className="text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[90px]">
                        {avatar.name}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body: Items */}
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id} className="border-b dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  {/* Row Header: Item Name & Image */}
                  <td className="px-4 py-3 font-medium sticky left-0 bg-white dark:bg-zinc-900 z-10 border-r dark:border-zinc-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center gap-3">
                      
                      {/* Item Image with HoverCard (Clean syntax!) */}
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          {/* 👇 hover:scale-110 transition-transform を追加 */}
                          <div className="h-10 w-10 rounded-md bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 overflow-hidden cursor-pointer border border-zinc-200 dark:border-zinc-700 hover:scale-110 transition-transform">
                            {item.thumbnailUrl ? (
                              <img src={item.thumbnailUrl} alt={item.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <ImageIcon className="h-5 w-5 text-zinc-400" />
                              </div>
                            )}
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent side="right" align="start" sideOffset={10} className="w-auto p-0 overflow-hidden border-none shadow-xl rounded-lg">
                          <div className="relative">
                            {item.thumbnailUrl ? (
                              <img 
                                src={item.thumbnailUrl} 
                                alt={item.name} 
                                className="w-48 h-48 object-cover" 
                              />
                            ) : (
                              <div className="w-48 h-48 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                <ImageIcon className="h-12 w-12 text-zinc-300" />
                              </div>
                            )}
                            <div className="absolute bottom-0 w-full bg-black/60 p-2 text-white text-xs">
                              <p className="font-bold truncate">{item.name}</p>
                              <p className="opacity-80 text-[10px]">{item.category}</p>
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>

                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold truncate block max-w-[140px]" title={item.name}>
                          {item.name}
                        </span>
                        <span className="text-xs text-zinc-400 capitalize">{item.category}</span>
                      </div>
                    </div>
                  </td>

                  {/* Intersection Cells: Status */}
                  {data.avatars.map((avatar) => {
                    const comp = data.compatibilities.find(
                      (c) => c.avatarId === avatar.id && c.itemId === item.id
                    );
                    const status = comp?.status || "unsupported";

                    return (
                      <td
                        key={`${avatar.id}-${item.id}`}
                        className="px-2 py-3 text-center border-r dark:border-zinc-700 last:border-r-0 cursor-pointer transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        onClick={() => toggleStatus(avatar.id, item.id, status)}
                      >
                        <div className="flex justify-center items-center h-full">
                          {status === "official" && (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                              {t('matrix.status.official')}
                            </Badge>
                          )}
                          {status === "modified" && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800">
                              {t('matrix.status.modified')}
                            </Badge>
                          )}
                          {status === "unsupported" && (
                            <span className="text-zinc-200 dark:text-zinc-700 block w-full h-full select-none">
                              {t('matrix.status.unsupported')}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {data.items.length === 0 && (
                <tr>
                  <td colSpan={data.avatars.length + 1} className="p-8 text-center text-zinc-400">
                    {t('core.message.no_data')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
}