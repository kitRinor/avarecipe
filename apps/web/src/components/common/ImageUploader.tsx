import { useCallback, useState, useRef } from "react";
import { useS3Upload } from "@/hooks/useS3Upload"; 
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2 } from "lucide-react"; 
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ImageUploaderProps {
  onUploadSuccess: (url: string) => void;
  defaultUrl?: string;
  category: 'avatar' | 'item' | 'outfit' | 'other';
}

export function ImageUploader({ onUploadSuccess, defaultUrl, category }: ImageUploaderProps) {
  const { uploadImage, isUploading } = useS3Upload();
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(defaultUrl);
  const [isDragOver, setIsDragOver] = useState(false); 
  
  const fileInputRef = useRef<HTMLInputElement>(null); 


  // upload処理
  const processFile = useCallback(async (file: File) => {
    // allow only image files
    if (!file.type.startsWith('image/')) {
        return;
    }

    // tempUrl for preview 
    const tempUrl = URL.createObjectURL(file);
    setPreviewUrl(tempUrl);

    // execute upload
    const url = await uploadImage(file, category);
    
    // release tempUrl
    URL.revokeObjectURL(tempUrl);

    if (url) {
      onUploadSuccess(url);
      setPreviewUrl(url); // switch to persistent URL
    } else {
      setPreviewUrl(defaultUrl);
    }
  }, [uploadImage, onUploadSuccess, defaultUrl, category]);



  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        processFile(file);
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }, [processFile]);
  
  const handleClear = () => {
    setPreviewUrl(undefined);
    onUploadSuccess('');
  };

  const handleAreaClick = () => {
    if (!isUploading && fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault(); // allow drop
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    if (isUploading) return;

    // Get the dropped file
    const file = event.dataTransfer.files[0];
    if (file) {
        processFile(file);
    }
  }, [isUploading, processFile]);


  
  return (
    <div className="space-y-2">
      <Label htmlFor={`file-upload-${category}`}>画像アップロード ({category})</Label>
      
      <Input 
        ref={fileInputRef}
        id={`file-upload-${category}`}
        type="file" 
        onChange={handleFileChange} 
        disabled={isUploading} 
        accept="image/png, image/jpeg, image/webp"
        className="hidden" // hide input
      />

      {/* Drag and drop area */}
      <div 
        onClick={handleAreaClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "w-full h-32 rounded-lg border-2 border-dashed transition-colors cursor-pointer",
          "flex items-center justify-center p-2",
          isDragOver 
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
            : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500",
          isUploading && "pointer-events-none opacity-70"
        )}
      >
        {/* Preview area */}
        <div className="flex items-center gap-4 w-full">
            <div 
                className={cn(
                    "w-20 h-20 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center relative overflow-hidden flex-shrink-0",
                )}
            >
                {previewUrl ? (
                    <>
                    <img src={previewUrl} alt="Preview" className="object-cover w-full h-full" />
                    <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-1 right-1 h-5 w-5 opacity-80"
                        onClick={(e) => { e.stopPropagation(); handleClear(); }} // 伝播を止めて親のonClickが発火しないようにする
                        disabled={isUploading}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                    </>
                ) : (
                    <Upload className="h-6 w-6 text-zinc-400" />
                )}
            </div>

            {/* Text area */}
            <div className="text-center flex-1">
                {isUploading ? (
                    <p className="text-blue-500 flex items-center justify-center gap-2 font-medium">
                        <Loader2 className="h-4 w-4 animate-spin" /> アップロード中...
                    </p>
                ) : isDragOver ? (
                    <p className="text-blue-600 font-medium">ここにドロップ</p>
                ) : (
                    <>
                        <p className="text-sm font-medium">ファイルをドラッグ＆ドロップ</p>
                        <p className="text-xs text-zinc-500">またはクリックして選択</p>
                    </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}