import { DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from './env.js'

const credentials = env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
  ? {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY
    }
  : undefined

export const s3 = new S3Client({
  region: env.AWS_REGION,
  endpoint: env.S3_ENDPOINT,
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  credentials
})

export async function putObject(params: { key: string; body: Buffer; contentType?: string }) {
  await s3.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType
    })
  )
}

export async function getSignedReadUrl(key: string, expiresIn = 3600) {
  // Presigned GET URLs intentionally avoid signing a Range header so browser <video>
  // elements can issue HTTP range requests for seeking.
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: key
    }),
    { expiresIn }
  )
}

export async function deleteObject(key: string) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: key
    })
  )
}

export async function listKeysByPrefix(prefix: string) {
  const keys: string[] = []
  let continuationToken: string | undefined

  do {
    const response = await s3.send(
      new ListObjectsV2Command({
        Bucket: env.S3_BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: continuationToken
      })
    )

    for (const item of response.Contents ?? []) {
      if (item.Key) keys.push(item.Key)
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined
  } while (continuationToken)

  return keys
}
