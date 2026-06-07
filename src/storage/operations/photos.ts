import { Photo } from '../models';
import { apiFetchAuth } from '../api';

export async function createPhoto(
  photo: Omit<Photo, 'id' | 'createdAt' | 'thumbnail' | 'fileSize' | 'dimensions'>,
  imageFile: File
): Promise<Photo> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const result = await apiFetchAuth<Photo>('/photos', {
          method: 'POST',
          body: JSON.stringify({ ...photo, imageData: base64 }),
        });
        resolve(result);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(imageFile);
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
