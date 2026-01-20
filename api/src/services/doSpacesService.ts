import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import path from 'path';

interface UploadResult {
  success: boolean;
  url?: string;
  cdnUrl?: string;
  key?: string;
  message?: string;
}

interface ListResult {
  success: boolean;
  files?: Array<{
    key: string;
    size: number;
    lastModified: Date;
    url: string;
    cdnUrl: string;
  }>;
  message?: string;
}

class DOSpacesService {
  private s3Client: S3Client;
  private bucket: string;
  private folder: string;
  private cdnEndpoint: string;
  private endpoint: string;

  constructor() {
    // Validate required environment variables
    const requiredEnvVars = [
      'DO_SPACES_KEY',
      'DO_SPACES_SECRET',
      'DO_SPACES_ENDPOINT',
      'DO_SPACES_CDN_ENDPOINT',
      'DO_SPACES_BUCKET',
      'DO_SPACES_FOLDER'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    this.bucket = process.env.DO_SPACES_BUCKET!;
    this.folder = process.env.DO_SPACES_FOLDER!;
    this.cdnEndpoint = process.env.DO_SPACES_CDN_ENDPOINT!;
    this.endpoint = process.env.DO_SPACES_ENDPOINT!;

    // Initialize S3 client for DigitalOcean Spaces
    this.s3Client = new S3Client({
      endpoint: this.endpoint,
      region: 'us-east-1', // DigitalOcean Spaces uses a dummy region
      credentials: {
        accessKeyId: process.env.DO_SPACES_KEY!,
        secretAccessKey: process.env.DO_SPACES_SECRET!
      },
      forcePathStyle: false // Required for DO Spaces
    });
  }

  /**
   * Generate a unique filename with timestamp and sanitized original name
   */
  private generateUniqueFilename(originalName: string, branchId?: string): string {
    const timestamp = Date.now();
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '_') // Sanitize filename
      .toLowerCase();
    
    const prefix = branchId ? `${branchId}_` : '';
    return `${prefix}${timestamp}_${nameWithoutExt}${ext}`;
  }

  /**
   * Get the full key (path) for a file in the bucket
   */
  private getFileKey(filename: string): string {
    return `${this.folder}/${filename}`;
  }

  /**
   * Get the CDN URL for a file
   */
  public getCdnUrl(key: string): string {
    // Remove leading slash if present
    const cleanKey = key.startsWith('/') ? key.substring(1) : key;
    return `${this.cdnEndpoint}/${cleanKey}`;
  }

  /**
   * Get the direct URL for a file (without CDN)
   */
  public getDirectUrl(key: string): string {
    const cleanKey = key.startsWith('/') ? key.substring(1) : key;
    return `https://${this.bucket}.${this.endpoint.replace('https://', '')}/${cleanKey}`;
  }

  /**
   * Upload a file to DigitalOcean Spaces
   */
  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    branchId?: string
  ): Promise<UploadResult> {
    try {
      const filename = this.generateUniqueFilename(originalName, branchId);
      const key = this.getFileKey(filename);

      // Use the Upload utility for better handling of large files
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: fileBuffer,
          ContentType: mimeType,
          ACL: 'public-read', // Make files publicly accessible
          CacheControl: 'max-age=31536000' // Cache for 1 year
        }
      });

      await upload.done();

      const directUrl = this.getDirectUrl(key);
      const cdnUrl = this.getCdnUrl(key);

      // Validate URLs are CDN URLs, not local paths
      if (cdnUrl.includes('/uploads/') || cdnUrl.includes('localhost')) {
        throw new Error(`Invalid CDN URL generated. Check DO_SPACES_CDN_ENDPOINT configuration.`);
      }

      return {
        success: true,
        url: directUrl,
        cdnUrl: cdnUrl,
        key: key,
        message: 'File uploaded successfully'
      };
    } catch (error) {
      console.error('DO Spaces upload error:', error instanceof Error ? error.message : 'Unknown error');
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload file'
      };
    }
  }

  /**
   * Delete a file from DigitalOcean Spaces
   */
  async deleteFile(key: string): Promise<{ success: boolean; message: string }> {
    try {
      // Remove leading slash if present
      const cleanKey = key.startsWith('/') ? key.substring(1) : key;

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: cleanKey
      });

      await this.s3Client.send(command);

      return {
        success: true,
        message: 'File deleted successfully'
      };
    } catch (error) {
      console.error('DO Spaces delete error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete file'
      };
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const cleanKey = key.startsWith('/') ? key.substring(1) : key;

      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: cleanKey
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * List files in a specific folder
   */
  async listFiles(prefix?: string): Promise<ListResult> {
    try {
      const folderPrefix = prefix ? `${this.folder}/${prefix}` : this.folder;

      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: folderPrefix
      });

      const response = await this.s3Client.send(command);

      if (!response.Contents || response.Contents.length === 0) {
        return {
          success: true,
          files: [],
          message: 'No files found'
        };
      }

      const files = response.Contents.map(item => ({
        key: item.Key || '',
        size: item.Size || 0,
        lastModified: item.LastModified || new Date(),
        url: this.getDirectUrl(item.Key || ''),
        cdnUrl: this.getCdnUrl(item.Key || '')
      }));

      return {
        success: true,
        files,
        message: `Found ${files.length} file(s)`
      };
    } catch (error) {
      console.error('DO Spaces list error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to list files'
      };
    }
  }

  /**
   * Delete a file by its full URL (CDN or direct)
   */
  async deleteFileByUrl(url: string): Promise<{ success: boolean; message: string }> {
    try {
      // Extract key from URL
      let key = '';
      
      if (url.includes(this.cdnEndpoint)) {
        // CDN URL
        key = url.replace(this.cdnEndpoint + '/', '');
      } else if (url.includes(this.bucket)) {
        // Direct URL
        const urlParts = url.split(`${this.bucket}.`)[1];
        if (urlParts) {
          key = urlParts.split('/').slice(1).join('/');
        }
      } else {
        // Assume it's already a key
        key = url;
      }

      return await this.deleteFile(key);
    } catch (error) {
      console.error('DO Spaces delete by URL error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete file'
      };
    }
  }
}

// Export a singleton instance with error handling
let doSpacesServiceInstance: DOSpacesService;

try {
  doSpacesServiceInstance = new DOSpacesService();
} catch (error) {
  console.error('Failed to initialize DigitalOcean Spaces service:', error instanceof Error ? error.message : 'Unknown error');
  throw error; // Fail fast - don't allow server to start without CDN configured
}

export const doSpacesService = doSpacesServiceInstance;


