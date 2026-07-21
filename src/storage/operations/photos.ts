import { Photo } from '../models';
import { apiFetchAuth } from '../api';
import { compressImage } from '../utils/imageCompression';

export function getPhotoDisplayUrl(photo: Photo): string | undefined {
  return photo.signedUrl || photo.thumbnail || photo.imageData;
}

export async function createPhoto(
  photo: Omit<Photo, 'id' | 'createdAt' | 'thumbnail' | 'fileSize' | 'dimensions' | 'imageData' | 'signedUrl' | 'storagePath'>,
  imageFile: File
): Promise<Photo> {
  const { base64, width, height, fileSize } = await compressImage(imageFile);
  return apiFetchAuth<Photo>('/photos', {
    method: 'POST',
    body: JSON.stringify({
      ...photo,
      imageData: base64,
      fileSize,
      dimensions: { width, height },
    }),
  });
}

export async function createPhotoFromBase64(
  photo: Omit<Photo, 'id' | 'createdAt'>
): Promise<Photo> {
  return apiFetchAuth<Photo>('/photos', {
    method: 'POST',
    body: JSON.stringify(photo),
  });
}

export async function getPhoto(id: string): Promise<Photo | undefined> {
  try {
    return await apiFetchAuth<Photo>(`/photos/${id}`);
  } catch {
    return undefined;
  }
}

export async function getPhotosByGrowCycle(growCycleId: string): Promise<Photo[]> {
  return apiFetchAuth<Photo[]>(`/photos?growCycleId=${encodeURIComponent(growCycleId)}`);
}

export async function getPhotosBySystem(systemId: string): Promise<Photo[]> {
  return apiFetchAuth<Photo[]>(`/photos?systemId=${encodeURIComponent(systemId)}`);
}

export async function getPhotosByDailyLog(dailyLogId: string): Promise<Photo[]> {
  return apiFetchAuth<Photo[]>(`/photos?dailyLogId=${encodeURIComponent(dailyLogId)}`);
}

export async function deletePhoto(id: string): Promise<void> {
  await apiFetchAuth<{ ok: boolean }>(`/photos/${id}`, { method: 'DELETE' });
}

export async function updatePhoto(
  id: string,
  updates: Partial<Photo>
): Promise<void> {
  await apiFetchAuth<Photo>(`/photos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}
