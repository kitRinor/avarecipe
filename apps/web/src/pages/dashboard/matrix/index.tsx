import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { dashboardApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { PageLayout } from "@/components/common/PageLayout";
import { PageHeader } from "@/components/common/PageHeader";

// UI
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, Image as ImageIcon, Search, Pencil, Eye, Check, AlertCircle, X } from "lucide-react";

// Utils
import { cn } from "@/lib/utils";

// Type
import type { InferResponseType } from "hono/client";

type MatrixResponse = InferResponseType<typeof dashboardApi.matrix.$get, 200>;

export default function MatrixPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [data, setData] = useState<MatrixResponse | null>(null);
  const prevData = useRef<MatrixResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // 🛠️ New States
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFilter, setAvatarFilter] = useState("");
  const [itemFilter, setItemFilter] = useState("");

  // Fetch matrix data on load
  const fetchMatrix = async () => {
    try {
      const res = await dashboardApi.matrix.$get();
      if (res.ok) {
        setData(await res.json());
      } else {
        toast.error(t('dashboard.matrix.fetch_failed'));
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

  // 🔍 Filtering Logic
  const filteredAvatars = useMemo(() => {
    if (!data) return [];
    return data.avatars.filter(a => 
      a.name.toLowerCase().includes(avatarFilter.toLowerCase())
    );
  }, [data, avatarFilter]);

  const filteredItems = useMemo(() => {
    if (!data) return [];
    return data.items.filter(i => 
      i.name.toLowerCase().includes(itemFilter.toLowerCase()) || 
      i.category.toLowerCase().includes(itemFilter.toLowerCase())
    );
  }, [data, itemFilter]);


  // Set compatibility status directly (for Edit Mode)
  const setStatus = async (avatarId: string, itemId: string, newStatus: "official" | "modified" | "unsupported") => {
    if (!data) return;

    prevData.current = data;
    const newData = JSON.parse(JSON.stringify(data)) as MatrixResponse;
    
    const existingIdx = newData.compatibilities.findIndex(
      c => c.avatarId === avatarId && c.itemId === itemId
    );

    // Don't update if status is same
    if (existingIdx >= 0 && newData.compatibilities[existingIdx].status === newStatus) {
      return;
    }

    if (existingIdx >= 0) {
      newData.compatibilities[existingIdx].status = newStatus;
    } else {
      newData.compatibilities.push({
        userId: user!.id, 
        avatarId,
        itemId,
        status: newStatus,
        note: null,
      });
    }
    setData(newData);

    try {
      const res = await dashboardApi.compatibility.$post({
        json: { avatarId, itemId, status: newStatus }
      });

      if (!res.ok) {
        throw new Error("API Error");
      }
    } catch (e) {
      console.error(e);
      toast.error(t('dashboard.matrix.update_failed'));
      setData(prevData.current);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="p-10 flex justify-center text-vrclo1-500">
          {t('core.action.loading')}
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
      <PageHeader
        title={t('dashboard.matrix.page_title')} 
        description={t('dashboard.matrix.page_description')}
      >
         {/* Header Controls: Mode Switch */}
         <div className="flex items-center gap-2 bg-vrclo1-100  p-1 rounded-lg border">
            <Button
              variant={isEditing ? "ghost" : "secondary"}
              size="sm"
              onClick={() => setIsEditing(false)}
              className={cn("gap-2", !isEditing && "bg-white  shadow-sm")}
            >
              <Eye className="h-4 w-4" /> {t('dashboard.matrix.mode_view')}
            </Button>
            <Button
              variant={isEditing ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setIsEditing(true)}
              className={cn("gap-2", isEditing && "bg-white  shadow-sm")}
            >
              <Pencil className="h-4 w-4" /> {t('dashboard.matrix.mode_edit')}
            </Button>
         </div>
      </PageHeader>

      {/* Filter Controls */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-vrclo1-400" />
          <Input 
            placeholder={t('dashboard.matrix.filter_item')}
            value={itemFilter}
            onChange={(e) => setItemFilter(e.target.value)}
            className="pl-8 bg-white "
          />
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-vrclo1-400" />
          <Input 
            placeholder={t('dashboard.matrix.filter_avatar')}
            value={avatarFilter}
            onChange={(e) => setAvatarFilter(e.target.value)}
            className="pl-8 bg-white "
          />
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white  rounded-xl shadow-sm border overflow-visible">
        <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
          <table className="w-full text-sm text-left border-collapse">
            {/* Table Header: Avatars */}
            <thead className="text-xs uppercase bg-vrclo1-100  text-vrclo1-700  sticky top-0 z-30 shadow-sm">
              <tr>
                <th className="px-4 py-3 font-medium sticky left-0 bg-vrclo1-100  z-40 border-r  min-w-[200px]">
                  <div className="flex justify-between items-end">
                    <span>{t('core.data.item.name')}</span>
                  </div>
                </th>
                {filteredAvatars.map((avatar) => (
                  <th key={avatar.id} className="px-2 py-3 font-medium text-center min-w-[120px] border-r  last:border-r-0">
                    <div className="flex flex-col items-center gap-2">
                      
                      {/* Avatar Image */}
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <Avatar className="h-10 w-10 cursor-pointer border border-vrclo1-200  hover:scale-110 transition-transform">
                            <AvatarImage src={avatar.thumbnailUrl || undefined} className="object-cover" />
                            <AvatarFallback><UserIcon className="h-5 w-5 text-vrclo1-400" /></AvatarFallback>
                          </Avatar>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-auto p-0 overflow-hidden border-none shadow-xl rounded-lg z-[999]" side="bottom" sideOffset={5}>
                          <div className="relative">
                            {avatar.thumbnailUrl ? (
                              <img src={avatar.thumbnailUrl} alt={avatar.name} className="w-48 h-48 object-cover" />
                            ) : (
                              <div className="w-48 h-48 bg-vrclo1-100  flex items-center justify-center"><UserIcon className="h-12 w-12 text-vrclo1-300" /></div>
                            )}
                            <div className="absolute bottom-0 w-full bg-black/60 p-2 text-white text-xs text-center truncate">{avatar.name}</div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>

                      <span className="text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[110px]">
                        {avatar.name}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body: Items */}
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} className="border-b  hover:bg-vrclo1-50 ">
                  {/* Row Header: Item */}
                  <td className="px-4 py-3 font-medium sticky left-0 bg-white  z-20 border-r  shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center gap-3">
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <div className="h-10 w-10 rounded-md bg-vrclo1-100  flex-shrink-0 overflow-hidden cursor-pointer border border-vrclo1-200 ">
                            {item.thumbnailUrl ? (
                              <img src={item.thumbnailUrl} alt={item.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center"><ImageIcon className="h-5 w-5 text-vrclo1-400" /></div>
                            )}
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent side="right" align="start" sideOffset={10} className="w-auto p-0 overflow-hidden border-none shadow-xl rounded-lg z-[999]">
                          <div className="relative">
                            {item.thumbnailUrl ? (
                              <img src={item.thumbnailUrl} alt={item.name} className="w-48 h-48 object-cover" />
                            ) : (
                              <div className="w-48 h-48 bg-vrclo1-100  flex items-center justify-center"><ImageIcon className="h-12 w-12 text-vrclo1-300" /></div>
                            )}
                            <div className="absolute bottom-0 w-full bg-black/60 p-2 text-white text-xs">
                              <p className="font-bold truncate">{item.name}</p>
                              <p className="opacity-80 text-[10px]">{item.category}</p>
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold truncate block max-w-[140px]" title={item.name}>{item.name}</span>
                        <span className="text-xs text-vrclo1-400 capitalize">{item.category}</span>
                      </div>
                    </div>
                  </td>

                  {/* Intersection Cells */}
                  {filteredAvatars.map((avatar) => {
                    const comp = data.compatibilities.find(
                      (c) => c.avatarId === avatar.id && c.itemId === item.id
                    );
                    const status = comp?.status || "unsupported";

                    return (
                      <td
                        key={`${avatar.id}-${item.id}`}
                        className={cn(
                          "px-2 py-3 text-center border-r  last:border-r-0 transition-colors",
                          !isEditing && "hover:bg-vrclo1-100 "
                        )}
                      >
                        <div className="flex justify-center items-center h-full min-h-[32px]">
                          {/* 👁️ View Mode */}
                          {!isEditing && (
                            <>
                              {status === "official" && <Badge className="bg-green-600 hover:bg-green-700">{t('dashboard.matrix.status.official')}</Badge>}
                              {status === "modified" && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">{t('dashboard.matrix.status.modified')}</Badge>}
                              {status === "unsupported" && <span className="text-vrclo1-200 ">・</span>}
                            </>
                          )}

                          {/* ✏️ Edit Mode: 3 Buttons */}
                          {isEditing && (
                            <div className="flex items-center gap-1 bg-vrclo1-100  p-1 rounded-full">
                              {/* Official Button */}
                              <button
                                onClick={() => setStatus(avatar.id, item.id, "official")}
                                className={cn(
                                  "h-6 w-6 rounded-full flex items-center justify-center transition-all",
                                  status === "official" 
                                    ? "bg-green-500 text-white shadow-sm scale-110" 
                                    : "text-vrclo1-400 hover:bg-green-100 hover:text-green-500"
                                )}
                                title={t('dashboard.matrix.status.official')}
                              >
                                <Check className="h-3 w-3" />
                              </button>

                              {/* Modified Button */}
                              <button
                                onClick={() => setStatus(avatar.id, item.id, "modified")}
                                className={cn(
                                  "h-6 w-6 rounded-full flex items-center justify-center transition-all",
                                  status === "modified" 
                                    ? "bg-yellow-400 text-white shadow-sm scale-110" 
                                    : "text-vrclo1-400 hover:bg-yellow-100 hover:text-yellow-500"
                                )}
                                title={t('dashboard.matrix.status.modified')}
                              >
                                <AlertCircle className="h-3 w-3" />
                              </button>

                              {/* Unsupported Button */}
                              <button
                                onClick={() => setStatus(avatar.id, item.id, "unsupported")}
                                className={cn(
                                  "h-6 w-6 rounded-full flex items-center justify-center transition-all",
                                  status === "unsupported" 
                                    ? "bg-vrclo1-400 text-white shadow-sm" 
                                    : "text-vrclo1-300 hover:bg-vrclo1-200 hover:text-vrclo1-500"
                                )}
                                title={t('dashboard.matrix.status.unsupported')}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
}