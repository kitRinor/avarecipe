import { ImageUploader } from "@/components/imageUploader";
import { PageLayout } from "@/components/pageLayout";



export default function _TmpPage() {
  return (
    <PageLayout>
      <div>Temporary Page</div>
      <ImageUploader 
        category="other"
        onUploadSuccess={(url) => {
          console.log("Uploaded URL:", url);
        }}
      />

    </PageLayout>
  )
}