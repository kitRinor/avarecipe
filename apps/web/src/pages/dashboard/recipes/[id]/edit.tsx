import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { dashboardApi } from "@/lib/api";
import { PageLayout } from "@/components/common/PageLayout";
import { ImageUploader } from "@/components/common/ImageUploader";
import { useS3Upload } from "@/hooks/useS3Upload";

// UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, Save, Loader2, Plus, Trash2, GripVertical, 
  Image as ImageIcon, Box, X, User as UserIcon, 
  ArrowUp, ArrowDown, Settings2, ShoppingBag 
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// Type
import type { InferResponseType } from "hono/client";
import { cn } from "@/lib/utils";

// API Responses
type RecipeDetail = InferResponseType<typeof dashboardApi.recipes[':id']['$get'], 200>;
type AssetDetail = InferResponseType<typeof dashboardApi.assets[':id']['$get'], 200>;

export default function EditRecipePage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data State
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  
  // Asset Selection State
  const [isAssetDialogOpen, setIsAssetDialogOpen] = useState(false);
  const [myAssets, setMyAssets] = useState<AssetDetail[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // ref for scrolling to steps end
  const stepsEndRef = useRef<HTMLDivElement>(null);

  // Fetch Recipe
  const fetchRecipe = async () => {
    if (!id) return;
    try {
      const res = await dashboardApi.recipes[':id'].$get({ param: { id } });
      if (res.ok) {
        const data = await res.json();
        setRecipe(data);
      } else {
        toast.error("Failed to load recipe");
        navigate("/dashboard/recipes");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error loading recipe");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  // Fetch Assets for selection
  const fetchMyAssets = async () => {
    if (myAssets.length > 0) return;
    setLoadingAssets(true);
    try {
      const res = await dashboardApi.assets.$get({ query: { limit: 100 } });
      if (res.ok) {
        setMyAssets(await res.json());
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load assets");
    } finally {
      setLoadingAssets(false);
    }
  };

  // --- Handlers ---

  const handleSave = async () => {
    if (!recipe || !id) return;
    setSaving(true);

    try {
      const res = await dashboardApi.recipes[':id'].$put({
        param: { id },
        json: {
          baseAssetId: recipe.baseAssetId || null,
          name: recipe.name,
          description: recipe.description || undefined,
          state: recipe.state,
          imageUrl: recipe.imageUrl || undefined,
          
          steps: recipe.steps.map((step, index) => ({
            id: step.id.startsWith('temp-') ? undefined : step.id,
            stepNumber: index + 1,
            name: step.name,
            description: step.description,
            imageUrl: step.imageUrl || undefined,
          })),

          assets: recipe.assets.map(asset => ({
            id: asset.id.startsWith('temp-') ? undefined : asset.id,
            assetId: asset.assetId,
            note: asset.note || undefined,
            configuration: asset.configuration || undefined,
          }))
        }
      });

      if (res.ok) {
        toast.success(t('core.message.save_success'));
        navigate(`../`); 
      } else {
        toast.error("Failed to save");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error saving");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: keyof RecipeDetail, value: any) => {
    if (!recipe) return;
    setRecipe({ ...recipe, [key]: value });
  };

  // --- Step Management ---

  const addStep = () => {
    if (!recipe) return;
    const newStep = {
      id: `temp-${Date.now()}`,
      stepNumber: recipe.steps.length + 1,
      name: "",
      description: "",
      imageUrl: null,
    };
    setRecipe({ ...recipe, steps: [...recipe.steps, newStep] });
    // scroll to bottom
    setTimeout(() => {
      stepsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const removeStep = (index: number) => {
    if (!recipe) return;
    const newSteps = [...recipe.steps];
    newSteps.splice(index, 1);
    // Re-index step numbers
    newSteps.forEach((s, i) => s.stepNumber = i + 1);
    setRecipe({ ...recipe, steps: newSteps });
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (!recipe) return;
    const newSteps = [...recipe.steps];
    if (direction === 'up' && index > 0) {
      [newSteps[index], newSteps[index - 1]] = [newSteps[index - 1], newSteps[index]];
    } else if (direction === 'down' && index < newSteps.length - 1) {
      [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    }
    newSteps.forEach((s, i) => s.stepNumber = i + 1);
    setRecipe({ ...recipe, steps: newSteps });
  };

  const updateStep = (index: number, field: string, value: any) => {
    if (!recipe) return;
    const newSteps = [...recipe.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setRecipe({ ...recipe, steps: newSteps });
  };

  // --- Asset Management ---

  const openAssetDialog = () => {
    setIsAssetDialogOpen(true);
    fetchMyAssets();
  };

  const addAsset = (asset: AssetDetail[][0]) => {
    if (!recipe) return;
    if (recipe.assets.some(a => a.assetId === asset.id)) {
      toast.warning("既にリストに追加されています");
      return;
    }

    const newRecipeAsset = {
      id: `temp-${Date.now()}`,
      assetId: asset.id,
      note: "",
      configuration: {}, 
      asset: {
        name: asset.name,
        category: asset.category,
        imageUrl: asset.imageUrl,
        storeUrl: asset.storeUrl
      }
    };

    setRecipe({ ...recipe, assets: [...recipe.assets, newRecipeAsset] });
    setIsAssetDialogOpen(false);
  };

  const removeAsset = (index: number) => {
    if (!recipe) return;
    const newAssets = [...recipe.assets];
    newAssets.splice(index, 1);
    setRecipe({ ...recipe, assets: newAssets });
  };

  const updateAssetField = (index: number, field: string, value: any) => {
    if (!recipe) return;
    const newAssets = [...recipe.assets];
    newAssets[index] = { ...newAssets[index], [field]: value };
    setRecipe({ ...recipe, assets: newAssets });
  };

  const updateAssetConfig = (index: number, value: string) => {
    if (!recipe) return;
    const newAssets = [...recipe.assets];
    try {
      const config = JSON.parse(value);
      newAssets[index].configuration = config;
      setRecipe({ ...recipe, assets: newAssets });
    } catch (e) {
      // ignore parse error or handle validation
    }
  };

  if (loading) return <PageLayout><div className="p-10 text-center">{t('core.action.loading')}</div></PageLayout>;
  if (!recipe) return null;

  return (
    <PageLayout>
      <PageHeader
        title={t('dashboard.recipes.edit.page_title')}
        description={t('dashboard.recipes.edit.page_description')}
      >
        <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate("../")}>
                {t('core.action.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {t('core.action.save')}
            </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* --- Left Column: Basic Info & Ingredients (Sidebar) --- */}
        <div className="space-y-6 order-2 lg:order-1">
          
          {/* Basic Info & Thumbnail */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {t('dashboard.recipes.edit.basic_info')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="aspect-video bg-muted rounded-md overflow-hidden border border-border relative group">
                  {recipe.imageUrl ? (
                    <img src={recipe.imageUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <ImageIcon className="h-8 w-8 opacity-50" />
                    </div>
                  )}
                  {/* State Overlay */}
                  <div className="absolute top-2 right-2">
                    <Select 
                      value={recipe.state} 
                      onValueChange={(val: any) => updateField('state', val)}
                    >
                      <SelectTrigger className="h-7 w-[100px] text-xs bg-white/90 dark:bg-black/80 backdrop-blur border-0 shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">{t('dashboard.recipes.edit.status.private')}</SelectItem>
                        <SelectItem value="unlisted">{t('dashboard.recipes.edit.status.unlisted')}</SelectItem>
                        <SelectItem value="public">{t('dashboard.recipes.edit.status.public')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Upload Overlay */}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-3/4">
                        <ImageUploader 
                          category="other" 
                          defaultUrl={recipe.imageUrl || undefined}
                          onUploadSuccess={(url) => updateField('imageUrl', url)}
                        />
                      </div>
                  </div>
              </div>

              <div className="space-y-2">
                <Input 
                  value={recipe.name} 
                  onChange={e => updateField('name', e.target.value)} 
                  className="font-bold text-lg border-transparent hover:border-border focus:border-primary px-2 -ml-2"
                  placeholder="レシピ名"
                />
                <Textarea 
                  value={recipe.description || ""} 
                  onChange={e => updateField('description', e.target.value)} 
                  className="min-h-[100px] resize-y border-transparent hover:border-border focus:border-primary bg-muted/20 px-2 -ml-2"
                  placeholder="説明・メモ..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Base Avatar (Read Only) */}
          <Card>
             <CardHeader className="pb-3 border-b border-border/50">
               <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                 <UserIcon className="h-4 w-4" /> {t('core.data.recipe.base_asset')}
               </CardTitle>
             </CardHeader>
             <CardContent className="pt-4">
               {recipe.baseAsset ? (
                 <div className="flex items-center gap-3">
                   <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src={recipe.baseAsset.imageUrl || undefined} className="object-cover" />
                      <AvatarFallback><Box className="h-4 w-4" /></AvatarFallback>
                   </Avatar>
                   <div className="min-w-0">
                     <p className="font-bold truncate text-sm">{recipe.baseAsset.name}</p>
                     <p className="text-xs text-muted-foreground capitalize">{recipe.baseAsset.category}</p>
                   </div>
                 </div>
               ) : (
                 <p className="text-sm text-muted-foreground">未設定</p>
               )}
             </CardContent>
          </Card>

          {/* Ingredients Editor */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                 <ShoppingBag className="h-4 w-4" /> {t('dashboard.recipes.edit.ingredients')}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={openAssetDialog} className="h-7 px-2">
                <Plus className="h-3 w-3 mr-1" /> 追加
              </Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
               {recipe.assets.length === 0 && <p className="text-muted-foreground text-xs text-center py-2">材料が登録されていません。</p>}

               {recipe.assets.map((asset, index) => (
                 <div key={index} className="group relative pl-3 border-l-2 border-border hover:border-primary/50 transition-colors pb-2">
                    <div className="flex gap-3 mb-2 items-center">
                      <div className="h-8 w-8 rounded bg-muted overflow-hidden flex-shrink-0 border border-border">
                         <img src={asset.asset?.imageUrl || undefined} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="text-sm font-medium truncate">{asset.asset?.name}</p>
                         <p className="text-[10px] text-muted-foreground capitalize">{asset.asset?.category}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeAsset(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* Compact Config Editor */}
                    <div className="space-y-2 opacity-80 group-hover:opacity-100 transition-opacity">
                       <Input 
                         value={asset.note || ""} 
                         onChange={(e) => updateAssetField(index, 'note', e.target.value)}
                         className="h-6 text-[11px] bg-muted/20 border-transparent hover:border-border focus:border-primary px-2" 
                         placeholder="メモ (例: ボーン設定注意)"
                       />
                       <div className="relative">
                          <Settings2 className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
                          <Input 
                            defaultValue={JSON.stringify(asset.configuration)}
                            onBlur={(e) => updateAssetConfig(index, e.target.value)}
                            className="h-6 text-[10px] font-mono bg-muted/20 border-transparent hover:border-border focus:border-primary pl-6 pr-2 text-muted-foreground focus:text-foreground" 
                            placeholder='JSON Config'
                          />
                       </div>
                    </div>
                 </div>
               ))}
            </CardContent>
          </Card>
        </div>

        {/* --- Right Column: Steps (Main Content) --- */}
        <div className="lg:col-span-2 space-y-8 order-1 lg:order-2">
          
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">!</span>
              {t('dashboard.recipes.edit.steps')}
            </h2>
            <Button variant="outline" size="sm" onClick={addStep}>
              <Plus className="h-4 w-4 mr-2" /> {t('dashboard.recipes.edit.add_step')}
            </Button>
          </div>

          <div className="space-y-6 relative before:absolute before:left-[15px] before:top-4 before:h-[calc(100%-2rem)] before:w-[2px] before:bg-border before:content-['']">
            {recipe.steps.length === 0 && (
              <div className="pl-12 py-10 text-muted-foreground italic border border-dashed rounded-lg bg-muted/30 flex flex-col items-center justify-center gap-2">
                <p>手順がまだありません。</p>
                <Button variant="link" onClick={addStep}>最初の手順を追加する</Button>
              </div>
            )}
            
            {recipe.steps.map((step, index) => (
              <div key={step.id || index} className="relative pl-10 group">
                {/* Step Number Badge */}
                <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border-4 border-background bg-muted font-bold text-xs text-muted-foreground z-10 shadow-sm group-hover:border-primary/20 transition-colors">
                  {index + 1}
                </div>
                
                <Card className="border-border/60 shadow-sm hover:shadow-md transition-all group-hover:border-border group-hover:bg-accent/5">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-2">
                        {/* Title Input */}
                        <Input 
                          value={step.name} 
                          onChange={(e) => updateStep(index, 'name', e.target.value)}
                          className="font-bold text-lg border-transparent hover:border-border focus:border-primary px-0 -ml-2 pl-2 bg-transparent" 
                          placeholder="手順のタイトル"
                        />
                        {/* Description Textarea */}
                        <Textarea 
                          value={step.description} 
                          onChange={(e) => updateStep(index, 'description', e.target.value)}
                          className="min-h-[60px] resize-y border-transparent hover:border-border focus:border-primary bg-transparent px-2 -ml-2 text-muted-foreground focus:text-foreground transition-all focus:bg-background focus:shadow-sm" 
                          placeholder="詳細な手順の説明..."
                        />
                      </div>
                      
                      {/* Controls (Sort & Delete) */}
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="flex bg-muted rounded-md overflow-hidden border border-border">
                            <button 
                                onClick={() => moveStep(index, 'up')}
                                disabled={index === 0}
                                className="p-1 hover:bg-background disabled:opacity-30 disabled:hover:bg-transparent"
                                title="上へ移動"
                            >
                                <ArrowUp className="h-3 w-3" />
                            </button>
                            <div className="w-px bg-border"></div>
                            <button 
                                onClick={() => moveStep(index, 'down')}
                                disabled={index === recipe.steps.length - 1}
                                className="p-1 hover:bg-background disabled:opacity-30 disabled:hover:bg-transparent"
                                title="下へ移動"
                            >
                                <ArrowDown className="h-3 w-3" />
                            </button>
                         </div>
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-muted-foreground hover:text-destructive ml-auto"
                            onClick={() => removeStep(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                      </div>
                    </div>

                    {/* Step Image */}
                    <div className="flex items-start gap-4 p-3 bg-muted/20 rounded-md border border-dashed border-border/40 hover:border-border transition-colors">
                        {step.imageUrl ? (
                           <div className="relative h-24 w-auto rounded-md overflow-hidden border border-border group/img bg-background">
                               <img src={step.imageUrl} className="h-full object-contain" />
                               <Button 
                                 size="icon" variant="destructive" 
                                 className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover/img:opacity-100 transition-opacity"
                                 onClick={() => updateStep(index, 'imageUrl', null)}
                               >
                                 <X className="h-3 w-3" />
                               </Button>
                           </div>
                        ) : (
                          <div className="flex items-center justify-center h-24 w-24 bg-muted/50 rounded-md text-muted-foreground/40 text-xs text-center p-1 border border-transparent">
                             <ImageIcon className="h-6 w-6" />
                          </div>
                        )}
                        <div className="flex-1 flex flex-col justify-center">
                           <Label className="text-xs text-muted-foreground mb-1">参考画像</Label>
                           <div className="max-w-[200px]">
                             <ImageUploader 
                                category="other"
                                defaultUrl={undefined}
                                onUploadSuccess={(url) => updateStep(index, 'imageUrl', url)}
                             />
                           </div>
                        </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
            <div ref={stepsEndRef} />
          </div>
        </div>
      </div>

      {/* Asset Selection Dialog */}
      <Dialog open={isAssetDialogOpen} onOpenChange={setIsAssetDialogOpen}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>アセットを選択</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 p-1">
            {loadingAssets ? (
              <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-4">
                {myAssets.map(asset => (
                  <div 
                    key={asset.id} 
                    className="border rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-colors bg-card relative group"
                    onClick={() => addAsset(asset)}
                  >
                    <div className="aspect-square bg-muted relative">
                       {asset.imageUrl ? (
                         <img src={asset.imageUrl} className="w-full h-full object-cover" />
                       ) : (
                         <div className="flex items-center justify-center h-full"><Box className="text-muted-foreground" /></div>
                       )}
                       {recipe.assets.some(a => a.assetId === asset.id) && (
                         <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold backdrop-blur-sm">
                            Added
                         </div>
                       )}
                    </div>
                    <div className="p-2 text-xs">
                      <p className="font-bold truncate">{asset.name}</p>
                      <p className="text-muted-foreground capitalize">{asset.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}