import { db } from './db/provider';
import { EditorToken } from '@/types';

export async function tokenOlustur(templateId: string, purchaseId: string): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // Valid for 30 days

  const tokenData: EditorToken = {
    token,
    templateId,
    purchaseId,
    usedAt: null,
    expiresAt: expiresAt.toISOString(),
    downloadCount: 0,
    createdAt: new Date().toISOString()
  };

  await db.saveEditorToken(tokenData);
  return token;
}

export async function tokenDogrula(token: string): Promise<{
  gecerli: boolean;
  templateId?: string;
  hata?: string;
}> {
  const data = await db.getEditorToken(token);

  if (!data) return { gecerli: false, hata: 'Geçersiz bağlantı linki' };
  if (new Date() > new Date(data.expiresAt)) return { gecerli: false, hata: 'Bağlantı linkinin süresi dolmuş' };
  if (data.downloadCount >= 3) return { gecerli: false, hata: 'İndirme hakkınız dolmuştur (En fazla 3 defa)' };

  return { gecerli: true, templateId: data.templateId };
}

export async function indirmeSayisiArtir(token: string): Promise<void> {
  const data = await db.getEditorToken(token);
  if (data) {
    await db.saveEditorToken({
      ...data,
      downloadCount: data.downloadCount + 1,
      usedAt: data.usedAt || new Date().toISOString()
    });
  }
}
