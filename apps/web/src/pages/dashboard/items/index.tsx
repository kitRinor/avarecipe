import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { PageLayout } from "@/components/common/PageLayout";
import { ImageUploader } from "@/components/common/ImageUploader";

// UI
import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, User as UserIcon } from "lucide-react";

// Type
import type { InferResponseType } from "hono/client";
import { PageHeader } from "@/components/common/PageHeader";
import { ItemAddDialog } from "@/components/features/items/ItemAddDialog";
type ItemResponse = InferResponseType<typeof api.items[":id"]['$get'], 200>;

export default function ItemsIndexPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<ItemResponse[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // 新規作成用State (スキーマに合わせて修正)
  const [newName, setNewName] = useState("");
  const [newThumbnailUrl, setNewThumbnailUrl] = useState<string | undefined>(undefined);
  const [newStoreUrl, setNewStoreUrl] = useState("");

  const fetchData = async () => {
    const res = await api.items.$get({
      query: {
        limit: '50',
        order: 'desc',
        sort: 'createdAt',
      }
    });
    if (res.ok) setItems(await res.json());
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleAdd = async () => {
    if (!newName) return;
    
    await api.items.$post({ 
      json: { 
        name: newName,
        thumbnailUrl: newThumbnailUrl || null, // imageUrl -> thumbnailUrl
        storeUrl: newStoreUrl || null // boothUrl -> storeUrl
      } 
    });
    
    // リセット
    setNewName("");
    setNewThumbnailUrl(undefined);
    setNewStoreUrl("");
    setIsDialogOpen(false);
    fetchData();
  };

  return (
    <PageLayout>
      {/* ヘッダー */}
      <PageHeader
        title={t('items.list.page_title')}
        description={t('items.list.page_description')}
      >
        <Button onClick={() => setIsDialogOpen(true)}><Plus className="h-4 w-4 mr-2" /> {t('core.action.add')}</Button>
        <ItemAddDialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen} 
          onSuccess={fetchData} 
        />
      </PageHeader>

      {/* リスト */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((item) => (
          <Link key={item.id} to={`${item.id}`}>
            <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
              <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden text-zinc-300">
                {item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt={item.name} className="absolute inset-0 object-cover w-full h-full" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <UserIcon className="h-12 w-12" />
                  </div>
                )}
              </div>
              <CardFooter className="p-3">
                <span className="font-bold truncate w-full">{item.name}</span>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </PageLayout>
  );
}