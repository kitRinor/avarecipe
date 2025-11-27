import { useState } from 'react';
import { dashboardApi } from '@/lib/api'; 
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner'; // ShadcnのToast (Sonner) を使ってフィードバック

// Type
import type { InferResponseType } from "hono/client";
type PresignedResponse = InferResponseType<typeof dashboardApi.s3.presigned.$post, 200>;


/**
 * 🎨 R2/S3へのアップロードとDBパス生成を担うカスタムフック
 */
export const useS3Upload = () => {
  const auth = useAuth(); // Authが必要な場合はここで参照
  const [isUploading, setIsUploading] = useState(false);

  /**
   * 画像をS3にアップロードし、DB保存用のURLを返す
   * @param file - アップロードするファイルオブジェクト
   * @param category - 保存先のフォルダ名 (avatar, item, outfit)
   * @returns 公開URL (publicUrl)
   */
  const uploadImage = async (file: File, category: 'avatar' | 'item' | 'outfit' | 'other'): Promise<string | null> => {
    setIsUploading(true);
    let publicUrl: string | null = null;
    const uploadToastId = toast.loading("Uploading...");

    try {
      if (!auth.user) {
        throw new Error('User not authenticated');
      }
      // 1. 拡張子とMIMEタイプを取得し、バリデーション
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const contentType = file.type;
      
      // 2. APIから署名付きURLをもらう (RPC)
      const presignedRes = await dashboardApi.s3.presigned.$post({
        json: { fileExt: fileExt as any, contentType: contentType as any, category }
      });

      if (!presignedRes.ok) {
        throw new Error('Failed to get presigned URL');
      }
      
      // 署名付きURLと公開URLを取得
      const { uploadUrl, publicUrl: fetchedPublicUrl } = await presignedRes.json() as PresignedResponse;
      publicUrl = fetchedPublicUrl; // 成功時のURLを保存

      // 3. R2/S3に直接アップロード (PUTリクエスト)
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 
          'Content-Type': contentType, 
          'Content-Length': file.size.toString(), 
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(`S3 upload failed: Status ${uploadRes.status}`);
      }

      toast.success("Upload completed", { id: uploadToastId });
      return fetchedPublicUrl;

    } catch (e) {
      console.error(e);
      toast.error("Failed to upload.", { id: uploadToastId });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImage, isUploading };
};