import { Link, useParams } from "react-router-dom";
import { PageLayout } from "@/components/common/PageLayout";
import { useTranslation } from "react-i18next";

// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, User as UserIcon, ExternalLink, 
  Settings2, ShoppingBag, 
  Heart, Share2, Copy
} from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { InferResponseType } from "hono";
import { publicApi } from "@/lib/api";

type RecipeDetail = InferResponseType<typeof publicApi.recipes[':id']['$get'], 200>;

export default function RecipeDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const handleCopyConfig = (config: any) => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    toast.success("Configuration copied to clipboard");
  };

  const fetchData = async () => {
    if (!id) return;
    try {
      const res = await publicApi.recipes[':id'].$get({ param: { id } });
      if (res.ok) setRecipe(await res.json());
    } catch (e) {
      console.error(e);
      toast.error("Failed to load recipe data");
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto pb-20">
        
        {/* --- 1. Header Section --- */}
        <header className="mb-8 space-y-4">
          {/* Title & Actions */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
                {recipe?.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <Link to={`/u/${recipe?.user?.handle}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={recipe?.user?.avatarUrl ?? undefined} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <span>{recipe?.user?.displayName}</span>
                </Link>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(recipe?.createdAt ?? '').toLocaleDateString()}
                </span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="h-4 w-4" /> Share
              </Button>
              <Button size="sm" className="gap-2 bg-pink-500 hover:bg-pink-600 text-white border-none">
                <Heart className="h-4 w-4 fill-current" /> Like
              </Button>
            </div>
          </div>

          {/* Tags */}
          {/* <div className="flex gap-2 flex-wrap">
            {recipe?.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="px-3 py-1">
                #{tag}
              </Badge>
            ))}
          </div> */}

          {/* Hero Image */}
          <div className="aspect-video w-full rounded-xl overflow-hidden border border-border shadow-sm bg-muted">
            <img src={recipe?.imageUrl ?? undefined} alt={recipe?.name} className="w-full h-full object-cover" />
          </div>

          <p className="text-lg text-muted-foreground leading-relaxed">
            {recipe?.description}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          
          {/* --- Left Column: Main Content (Steps) --- */}
          <div className="md:col-span-2 space-y-10">
            
            {/* 3. Steps Section */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="flex items-center justify-center h-8 px-4 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  Steps
                </span>
                
              </h2>
              
              <div className="space-y-8 relative before:absolute before:left-[15px] before:top-2 before:h-full before:w-[2px] before:bg-border before:content-['']">
                {recipe?.steps.map((step) => (
                  <div key={step.stepNumber} className="relative pl-10">
                    {/* Step Number Badge */}
                    <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border-4 border-background bg-muted font-bold text-xs text-muted-foreground">
                      {step.stepNumber}
                    </div>
                    
                    <div className="space-y-3 pt-1">
                      <h3 className="text-xl font-bold text-foreground">
                        {step.name}
                      </h3>
                      <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {step.description}
                      </p>
                      {step.imageUrl && (
                        <div className="rounded-lg overflow-hidden shadow-sm mt-3">
                          <img src={step.imageUrl} alt={step.name} className=" max-h-[200px] object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* --- Right Column: Sidebar (Ingredients & Configs) --- */}
          <div className="space-y-6">
            
            {/* 2. Ingredients (Base Asset) */}
            {recipe?.baseAsset && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    {t('core.data.recipe.base_asset')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    {recipe?.baseAsset?.imageUrl && (
                      <div className="h-14 w-14 rounded-md overflow-hidden border border-border bg-muted flex-shrink-0">
                        <img src={recipe?.baseAsset?.imageUrl} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold truncate">{recipe?.baseAsset?.name}</p>
                      <a 
                        href={recipe?.baseAsset?.storeUrl ?? '#'} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                      >
                        BOOTH <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 2. Ingredients (Items) & 4. Configuration */}
            {recipe?.assets.map((asset) => (
              <Card key={asset.id} className="overflow-hidden">
                <div className="flex flex-col">
                  {/* Asset Info */}
                  <div className="p-3 flex items-center gap-3 bg-muted/30 border-b border-border">
                      <div className="h-10 w-10 rounded bg-muted overflow-hidden flex-shrink-0 border border-border">
                        <img src={asset.asset?.imageUrl || undefined} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate text-sm">{asset.asset?.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{asset.asset?.category}</p>
                      </div>
                  </div>

                  {/* Config & Note */}
                  <div className="p-3 flex-1 text-xs space-y-2">
                    {asset.note && (
                      <div className="text-muted-foreground border-l-2 border-primary/20 pl-2 mb-2">
                        {asset.note}
                      </div>
                    )}
                    
                    {asset.configuration && Object.keys(asset.configuration).length > 0 && (
                      <div className="bg-muted/50 rounded p-2 font-mono flex items-start justify-between group">
                        <pre className="overflow-x-auto whitespace-pre-wrap break-all max-h-[100px]">
                          {JSON.stringify(asset.configuration, null, 2)}
                        </pre>
                        <button 
                          onClick={() => handleCopyConfig(asset.configuration)}
                          className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}

          </div>
        </div>

      </div>
    </PageLayout>
  );
}