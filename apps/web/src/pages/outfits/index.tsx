import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { publicApi } from "@/lib/api";
import { PageLayout } from "@/components/common/PageLayout";

// UI
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

// Type
import type { InferResponseType } from "hono/client";
import { PageHeader } from "@/components/common/PageHeader";
type PublicOutfitsResponse = InferResponseType<typeof publicApi.outfits[':id']['$get'], 200>;

export default function PublicOutfitsPage() {
  const { t } = useTranslation();
  const [outfits, setOutfits] = useState<PublicOutfitsResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOutfits = async () => {
      try {
        const res = await publicApi.outfits.$get({
          query: { limit: 20 } // ページネーションは別途実装推奨
        });
        if (res.ok) {
          setOutfits(await res.json());
        } else {
          toast.error(t('core.message.fetch_failed'));
        }
      } catch (e) {
        console.error(e);
        toast.error(t('core.message.error_occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchOutfits();
  }, []);

  if (loading) return <PageLayout><div className="p-10 text-center">{t('core.action.loading')}</div></PageLayout>;

  return (
    <PageLayout>
      <PageHeader
        title={t('outfits.title')}
        description={t('outfits.description')}
        backBtn={false}
      />
      <div className="max-w-6xl mx-auto">

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {outfits.map((outfit) => (
            <Link key={outfit.id} to={`${outfit.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full border-border">
                {/* Thumbnail */}
                <div className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden">
                  {outfit.imageUrl ? (
                    <img src={outfit.imageUrl} alt={outfit.name} className="w-full h-full object-cover transition-transform hover:scale-105 duration-300" />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                  )}
                </div>

                <CardContent className="p-4">
                  <h3 className="font-bold text-lg truncate mb-1">{outfit.name}</h3>
                  
                  {/* <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                     <span className="px-2 py-0.5 rounded-full bg-muted text-foreground">
                        {outfit.avatar.name}
                     </span>
                  </div> */}

                  {/* User Info */}
                  <div className="flex items-center gap-2 pt-3 border-t border-border">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={outfit.user.avatarUrl || undefined} />
                      <AvatarFallback>{outfit.user.displayName}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground truncate">
                      {outfit.user.displayName}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {outfits.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            {t('core.message.no_data')}
          </div>
        )}
      </div>
    </PageLayout>
  );
}