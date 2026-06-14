import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config';

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucketName = config.supabase.storageBucket;
  private readonly projectUrl: string;
  private readonly serviceKey: string;
  private readonly logger = new Logger(StorageService.name);

  constructor() {
    this.s3 = new S3Client({
      region: config.supabase.s3.region,
      endpoint: config.supabase.s3.endpoint,
      credentials: {
        accessKeyId: config.supabase.s3.accessKeyId,
        secretAccessKey: config.supabase.s3.secretAccessKey,
      },
      forcePathStyle: true,
    });
    this.projectUrl = config.supabase.url;
    this.serviceKey = config.supabase.serviceKey;
  }

  private supabaseApi(path: string, options: RequestInit = {}) {
    return fetch(`${this.projectUrl}/storage/v1${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        apikey: this.serviceKey,
        Authorization: `Bearer ${this.serviceKey}`,
        ...(options.headers || {}),
      },
    });
  }

  async ensureBucket() {
    try {
      const res = await this.supabaseApi('/buckets');
      if (!res.ok) {
        this.logger.warn(`Error listing buckets: ${res.status} ${res.statusText}`);
        return;
      }
      let buckets: any[] = [];
      const json = await res.json();
      buckets = Array.isArray(json) ? json : json?.data || [];
      const exists = buckets.some(b => b.name === this.bucketName);
      if (!exists) {
        const createRes = await this.supabaseApi('/buckets', {
          method: 'POST',
          body: JSON.stringify({
            id: this.bucketName,
            name: this.bucketName,
            public: true,
            file_size_limit: 2 * 1024 * 1024,
            allowed_mime_types: ['application/pdf'],
          }),
        });
        if (!createRes.ok) {
          const err = await createRes.json().catch(() => ({}));
          this.logger.warn(`Error creando bucket: ${JSON.stringify(err)}`);
        } else {
          this.logger.log(`Bucket "${this.bucketName}" creado como público`);
          return;
        }
      }
      await this.supabaseApi(`/buckets/${this.bucketName}`, {
        method: 'PUT',
        body: JSON.stringify({ public: true }),
      }).catch(() => this.logger.warn('No se pudo configurar bucket como público'));
      this.logger.log(`Bucket "${this.bucketName}" verificado como público`);
    } catch (err: any) {
      this.logger.warn(`ensureBucket falló (el bucket puede existir): ${err.message}`);
    }
  }

  private publicUrl(filePath: string): string {
    return `${this.projectUrl}/storage/v1/object/public/${this.bucketName}/${filePath}`;
  }

  async uploadFile(filePath: string, buffer: Buffer, contentType: string): Promise<string> {
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: filePath,
      Body: buffer,
      ContentType: contentType,
    }));
    return this.publicUrl(filePath);
  }

  async deleteFile(filePath: string): Promise<void> {
    const url = `${this.projectUrl}/storage/v1/object/${this.bucketName}/${filePath}`;
    await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.serviceKey}`,
        apikey: this.serviceKey,
      },
    }).catch(err => this.logger.warn(`Error deleting file: ${err.message}`));
  }
}
