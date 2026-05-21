import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = supabaseUrl && supabaseKey;

const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;
const BUCKET_NAME = 'etsy-assets';

export const storageProvider = {
  /**
   * Saves an asset (image, mockup, pdf, zip) and returns its accessible URL.
   * Can accept a Buffer or a Base64 encoded string.
   */
  async saveAsset(
    projectId: string,
    assetType: 'image' | 'mockup' | 'pdf' | 'zip',
    fileName: string,
    data: Buffer | string
  ): Promise<string> {
    // 1. Convert Base64 string to Buffer if needed
    let buffer: Buffer;
    if (typeof data === 'string') {
      // If it has a data URI prefix, strip it
      const base64Data = data.includes(',') ? data.split(',')[1] : data;
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      buffer = data;
    }

    // 2. Attempt to upload to Supabase Storage if configured
    if (supabase) {
      try {
        const filePath = `${projectId}/${assetType}/${fileName}`;
        const { data: uploadData, error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, buffer, {
            contentType: this.getContentType(fileName),
            upsert: true
          });

        if (!error && uploadData) {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);
          
          return urlData.publicUrl;
        } else {
          console.warn('Supabase storage upload failed, falling back to local storage:', error?.message);
        }
      } catch (err) {
        console.error('Supabase storage error, falling back to local storage:', err);
      }
    }

    // 3. Fallback: Save to Local filesystem inside public/storage/
    const relativePath = `/storage/${projectId}/${assetType}`;
    const localDir = path.join(process.cwd(), 'public', 'storage', projectId, assetType);
    const localFilePath = path.join(localDir, fileName);

    // Create directories if they do not exist
    await fs.mkdir(localDir, { recursive: true });

    // Write the buffer to the file system
    await fs.writeFile(localFilePath, buffer);

    // Return the relative URL served by Next.js static asset server
    return `${relativePath}/${fileName}`;
  },

  /**
   * Deletes a directory or specific file under a project in local storage.
   */
  async deleteProjectAssets(projectId: string): Promise<boolean> {
    if (supabase) {
      try {
        // Suppress errors, just attempt to clean up Supabase storage
        const { data: list } = await supabase.storage.from(BUCKET_NAME).list(projectId);
        if (list && list.length > 0) {
          const filesToRemove = list.map((x) => `${projectId}/${x.name}`);
          await supabase.storage.from(BUCKET_NAME).remove(filesToRemove);
        }
      } catch (err) {
        console.warn('Could not delete Supabase assets:', err);
      }
    }

    // Local cleanup
    try {
      const localDir = path.join(process.cwd(), 'public', 'storage', projectId);
      await fs.rm(localDir, { recursive: true, force: true });
      return true;
    } catch (err) {
      console.warn('Could not delete local assets:', err);
      return false;
    }
  },

  getContentType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    switch (ext) {
      case '.png':
        return 'image/png';
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.pdf':
        return 'application/pdf';
      case '.zip':
        return 'application/zip';
      case '.json':
        return 'application/json';
      default:
        return 'application/octet-stream';
    }
  }
};
