import { nanoid } from 'nanoid';

export function generateId(length: number = 16): string {
  return nanoid(length);
}

export function generateShareToken(): string {
  return nanoid(16);
}
