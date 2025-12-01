import { useState } from "react";
import { useTranslation } from "react-i18next";
import { dashboardApi } from "@/lib/api";
import { fetchStoreItemInfo, StoreItemInfo } from "@/lib/storeInfoUtils/fetchStoreItemInfo";
import { useS3Upload } from "@/hooks/useS3Upload";
import { ImageCandidateList, type CandidateImage } from "@/components/common/ImageCandidateList";

// UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ItemAddDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ItemAddDialog({ open, setOpen, onSuccess }: ItemAddDialogProps) {
  const { t } = useTranslation();
  
  // States
  const [name, setName] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(undefined);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScraping, setIsScraping] = useState(false);

  // Image candidates
  const [candidateImages, setCandidateImages] = useState<CandidateImage[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  
  const [fetchedStoreInfo, setFetchedStoreInfo] = useState<StoreItemInfo | null>(null);

  // Hooks
  const { uploadImage, isUploading } = useS3Upload();

  // Handlers
  const handleAutoFill = async () => {
    if (!storeUrl) return;
    setIsScraping(true);
    try {
      const info = await fetchStoreItemInfo(storeUrl);
      if (info) {
        setFetchedStoreInfo(info);
        setName(info.name);
        if (info.thumbnailUrls.length > 0) {
          setThumbnailUrl(info.thumbnailUrls[0].original);
          setCandidateImages(info.thumbnailUrls);
        }
        toast.success(t('core.message.fetch_success'));
      } else {
        toast.error(t('core.message.fetch_failed'));
      }
    } catch (e) {
      console.error(e);
      toast.error(t('core.message.error_occurred'));
    } finally {
      setIsScraping(false);
    }
  };

  const handleApplyName = async () => {
    if (isScraping) return;
    if (fetchedStoreInfo) {
      setName(fetchedStoreInfo.name);
      toast.success(t('core.message.fetch_success'));
      return;
    }
    if (!storeUrl) return;
    handleAutoFill();
  };

  const handleUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file, "item");
    if (url) {
      setThumbnailUrl(url);
      setUploadedImages(prev => [url, ...prev]);
    }
    event.target.value = "";
  };

  const handleSubmit = async () => {
    if (!name) return;
    setIsSubmitting(true);
    try {
      const res = await dashboardApi.items.$post({
        json: {
          name,
          storeUrl: storeUrl || null,
          thumbnailUrl: thumbnailUrl || null,
        }
      });

      if (res.ok) {
        toast.success(t('core.action.save'));
        onSuccess?.();
        handleClose();
      } else {
        toast.error(t('core.message.error_occurred'));
      }
    } catch (e) {
      console.error(e);
      toast.error(t('core.message.error_occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Reset states after animation
    setTimeout(() => {
      setName("");
      setStoreUrl("");
      setThumbnailUrl(undefined);
      setCandidateImages([]);
      setUploadedImages([]);
      setFetchedStoreInfo(null);
    }, 500);
  };

  const allCandidates = [
    ...uploadedImages.map(url => ({ original: url, resized: url })),
    ...candidateImages,
  ];

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('dashboard.items.list.add_item')}</DialogTitle>
          <DialogDescription>{t('dashboard.items.list.add_item_description')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
           {/* Store URL Input */}
           <div className="space-y-2">
             <Label>{t('core.data.item.store_url')}</Label>
             <div className="flex gap-2">
               <Input 
                 value={storeUrl} 
                 onChange={e => setStoreUrl(e.target.value)} 
                 placeholder="https://booth.pm/..." 
                 disabled={isScraping || isSubmitting}
               />
               <Button
                 variant="secondary"
                 onClick={handleAutoFill}
                 disabled={!storeUrl || isScraping || isSubmitting}
                 title={t('dashboard.items.edit.auto_fill_tooltip')}
               >
                 {isScraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-yellow-500" />}
               </Button>
             </div>
             <p className="text-xs text-muted-foreground">{t('dashboard.items.edit.store_url_help')}</p>
           </div>

           {/* Name Input */}
           <div className="space-y-2">
             <Label>{t('core.data.item.name')} <span className="text-red-500">*</span></Label>
             <div className="flex gap-2">
               <Input 
                 value={name} 
                 onChange={e => setName(e.target.value)} 
                 disabled={isScraping || isSubmitting}
               />
               <Button
                 variant="outline"
                 size="icon"
                 onClick={handleApplyName}
                 disabled={isScraping || (!fetchedStoreInfo && !storeUrl)}
                 title={t('dashboard.items.edit.apply_name_tooltip')}
               >
                 {isScraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
               </Button>
             </div>
           </div>

           {/* Image Selection */}
           <div className="min-w-0 w-full">
             <ImageCandidateList
               currentUrl={thumbnailUrl}
               originalDbUrl={null}
               candidates={allCandidates}
               onSelect={setThumbnailUrl}
               onUploadFile={handleUploadFile}
               isUploading={isUploading}
               onFetch={handleAutoFill}
               isFetching={isScraping}
               showFetchButton={!!(storeUrl && !fetchedStoreInfo)}
             />
           </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>{t('core.action.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={!name || isSubmitting || isUploading}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('core.action.add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}