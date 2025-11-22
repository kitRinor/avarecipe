import { S3Client } from '@aws-sdk/client-s3';
import { config } from 'dotenv';
config();

// Load environment variables (already done in index.ts)

const region = process.env.S3_REGION!;
const endpoint = process.env.S3_ENDPOINT!;
const accessKeyId = process.env.S3_ACCESS_KEY!;
const secretAccessKey = process.env.S3_SECRET_KEY!;

// This is the domain used to display the image on the frontend
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME!;
export const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL!;

// AWS SDK requires these environment variables
if (!accessKeyId || !secretAccessKey || !region || !endpoint) {
  throw new Error('Missing S3 credentials (ACCESS_KEY, SECRET_KEY, REGION, or ENDPOINT) for S3 client.');
}

export const s3Client = new S3Client({
  forcePathStyle: true, // host.example.com/bucket/path-to-object
  region: region,
  endpoint: endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

// resolveS3Url: Given a path, return the full S3 public URL
export const resolveS3Url = (path: string | null): string | null => {
  if (!path) return null;

  if (/^(https?:)?\/\//.test(path)) {
    return path;
  }

  const baseUrl = S3_PUBLIC_URL.replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');
  
  return `${baseUrl}/${cleanPath}`;
};