import { getDB } from '../db';
import { Photo } from '../models';
import { incrementPhotoCount } from './growCycles';
import { compressImage, createThumbnail } from '../utils/imageCompression';

export async function createPhoto(
  photo: Omit<Photo, 'id' | 'createdAt' | 'thumbnail' | 'fileSize' | 'dimensions'>,
  imageFile: File
): Promise<Photo> {
  const db = await getDB();
  const now = Date.now();

  // Compress image
  const compressed = await compressImage(imageFile);

  // Generate thumbnail
  const thumbnail = await createThumbnail(compressed.base64);

  const newPhoto: Photo = {
    ...photo,
    id: crypto.randomUUID(),
    createdAt: now,
    imageData: compressed.base64,
    thumbnail,
    fileSize: compressed.fileSize,
    dimensions: {
      width: compressed.width,
      height: compressed.height,
    },
  };

  await db.add('photos', newPhoto);

  // Update grow cycle's photo count
  await incrementPhotoCount(photo.growCycleId);

  return newPhoto;
}

export async function createPhotoFromBase64(
  photo: Omit<Photo, 'id' | 'createdAt'>
): Promise<Photo> {
  const db = await getDB();
  const now = Date.now();

  const newPhoto: Photo = {
    ...photo,
    id: crypto.randomUUID(),
    createdAt: now,
  };

  await db.add('photos', newPhoto);

  // Update grow cycle's photo count
  await incrementPhotoCount(photo.growCycleId);

  return newPhoto;
}

export async function getPhoto(id: string): Promise<Photo | undefined> {
  const db = await getDB();
  return db.get('photos', id);
}

export async function getPhotosByGrowCycle(growCycleId: string): Promise<Photo[]> {
  const db = await getDB();
  const photos = await db.getAllFromIndex('photos', 'by-cycle', growCycleId);
  return photos.sort((a, b) => b.timestamp - a.timestamp);
}

export async function getPhotosBySystem(systemId: string): Promise<Photo[]> {
  const db = await getDB();
  const photos = await db.getAllFromIndex('photos', 'by-system', systemId);
  return photos.sort((a, b) => b.timestamp - a.timestamp);
}

export async function getPhotosByDailyLog(dailyLogId: string): Promise<Photo[]> {
  const db = await getDB();
  const photos = await db.getAllFromIndex('photos', 'by-log', dailyLogId);
  return photos.sort((a, b) => b.timestamp - a.timestamp);
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('photos', id);
}

export async function updatePhoto(
  id: string,
  updates: Partial<Photo>
): Promise<void> {
  const db = await getDB();
  const photo = await db.get('photos', id);

  if (!photo) {
    throw new Error('Photo not found');
  }

  const updated = {
    ...photo,
    ...updates,
    id: photo.id,
    createdAt: photo.createdAt,
  };

  await db.put('photos', updated);
}
