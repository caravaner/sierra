import path from "path";
import fs from "fs/promises";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

export class UploadError extends Error {}

export async function uploadFile(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new UploadError("Only image files are allowed (JPEG, PNG, WEBP, GIF, SVG)");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new UploadError("File too large — maximum size is 5 MB");
  }

  const mode = process.env.STORAGE_MODE ?? "local";
  if (mode === "r2") return uploadToR2(file);
  if (mode === "gcs") return uploadToGCS(file);
  return uploadLocal(file);
}

// ─── R2 (Cloudflare) ──────────────────────────────────────────────────────────

async function uploadToR2(file: File): Promise<string> {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new UploadError(
      "R2 is not fully configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL."
    );
  }

  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  const key = `products/${uniqueFilename(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return `${publicUrl.replace(/\/$/, "")}/${key}`;
}

// ─── Local ────────────────────────────────────────────────────────────────────

async function uploadLocal(file: File): Promise<string> {
  const filename = uniqueFilename(file.name);
  const uploadDir = path.join(process.cwd(), "public", "uploads");

  await fs.mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(uploadDir, filename), buffer);

  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3101";
  return `${adminUrl}/uploads/${filename}`;
}

// ─── GCS ──────────────────────────────────────────────────────────────────────

async function uploadToGCS(file: File): Promise<string> {
  const bucket = process.env.STORAGE_GCS_BUCKET;
  if (!bucket) throw new UploadError("STORAGE_GCS_BUCKET is not configured");

  const { Storage } = await import("@google-cloud/storage");

  const credentials = process.env.STORAGE_GCS_CREDENTIALS
    ? JSON.parse(Buffer.from(process.env.STORAGE_GCS_CREDENTIALS, "base64").toString("utf8"))
    : undefined;

  const storage = new Storage({ credentials });

  const filename = `products/${uniqueFilename(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await storage.bucket(bucket).file(filename).save(buffer, {
    metadata: {
      contentType: file.type,
      cacheControl: "public, max-age=31536000, immutable",
    },
  });

  return `https://storage.googleapis.com/${bucket}/${filename}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uniqueFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase() || ".bin";
  return `${crypto.randomUUID()}${ext}`;
}
