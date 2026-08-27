import { S3Client, HeadObjectCommand, DeleteObjectCommand } from 'npm:@aws-sdk/client-s3@3'
import { PutObjectCommand, GetObjectCommand } from 'npm:@aws-sdk/client-s3@3'
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner@3'

export type YandexS3Config = {
  endpoint: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  publicBucket: string
  privateBucket: string
  cdnBase: string
}

export function readYandexS3Config(): YandexS3Config | null {
  const accessKeyId = Deno.env.get('YANDEX_S3_ACCESS_KEY_ID') || ''
  const secretAccessKey = Deno.env.get('YANDEX_S3_SECRET_ACCESS_KEY') || ''
  if (!accessKeyId || !secretAccessKey) return null
  return {
    endpoint: Deno.env.get('YANDEX_S3_ENDPOINT') || 'https://storage.yandexcloud.net',
    region: Deno.env.get('YANDEX_S3_REGION') || 'ru-central1',
    accessKeyId,
    secretAccessKey,
    publicBucket: Deno.env.get('YANDEX_S3_PUBLIC_BUCKET') || 'moxt-public',
    privateBucket: Deno.env.get('YANDEX_S3_PRIVATE_BUCKET') || 'moxt-private',
    cdnBase: (Deno.env.get('MOXT_MEDIA_CDN_BASE') || '').replace(/\/+$/, ''),
  }
}

export function createYandexS3Client(config: YandexS3Config) {
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true,
  })
}

export function resolveS3Bucket(config: YandexS3Config, visibility: 'public' | 'private') {
  return visibility === 'private' ? config.privateBucket : config.publicBucket
}

export function buildPublicCdnUrl(config: YandexS3Config, objectKey: string) {
  const key = objectKey.replace(/^\/+/, '')
  if (config.cdnBase) return `${config.cdnBase}/${encodeURI(key)}`
  return `${config.endpoint}/${resolveS3Bucket(config, 'public')}/${encodeURI(key)}`
}

export async function presignPut(
  client: S3Client,
  bucket: string,
  objectKey: string,
  mimeType: string,
  expiresSec = 900,
) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ContentType: mimeType,
    CacheControl: objectKey.startsWith('public/') ? 'public, max-age=31536000, immutable' : 'private, max-age=3600',
  })
  return getSignedUrl(client, command, { expiresIn: expiresSec })
}

export async function presignGet(
  client: S3Client,
  bucket: string,
  objectKey: string,
  expiresSec = 3600,
) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: objectKey })
  return getSignedUrl(client, command, { expiresIn: expiresSec })
}

export async function headObject(client: S3Client, bucket: string, objectKey: string) {
  return client.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }))
}

export async function deleteObject(client: S3Client, bucket: string, objectKey: string) {
  return client.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }))
}
