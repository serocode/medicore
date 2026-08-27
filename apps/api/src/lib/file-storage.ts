import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../env.js";

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "application/pdf"]);

export class UnsupportedFileTypeError extends Error {
  constructor(contentType: string) {
    super(`Unsupported file type: ${contentType}`);
  }
}

export class FileTooLargeError extends Error {
  constructor(maxSizeMb: number) {
    super(`File exceeds the maximum size of ${maxSizeMb}MB`);
  }
}

export class InvalidStorageKeyError extends Error {
  constructor() {
    super("Invalid storage key");
  }
}

export interface FileStorage {
  save(file: File): Promise<string>;
  read(storageKey: string): Promise<Buffer>;
}

const STORAGE_KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\.jpg|\.png|\.pdf)?$/i;

function assertValidFile(file: File): void {
  if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
    throw new UnsupportedFileTypeError(file.type);
  }
  if (file.size > env.MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
    throw new FileTooLargeError(env.MAX_UPLOAD_SIZE_MB);
  }
}

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "application/pdf": ".pdf",
};

export class LocalDiskFileStorage implements FileStorage {
  constructor(private uploadDir: string = env.UPLOAD_DIR) {}

  async save(file: File): Promise<string> {
    assertValidFile(file);
    await mkdir(this.uploadDir, { recursive: true });

    const extension = EXTENSION_BY_CONTENT_TYPE[file.type] ?? "";
    const storageKey = `${randomUUID()}${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(this.uploadDir, storageKey), buffer);

    return storageKey;
  }

  async read(storageKey: string): Promise<Buffer> {
    // storageKey comes from a route param — reject anything that isn't
    // exactly the UUID(+extension) shape save() produces, to rule out
    // path traversal before it ever reaches the filesystem.
    if (!STORAGE_KEY_PATTERN.test(storageKey)) {
      throw new InvalidStorageKeyError();
    }
    return readFile(path.join(this.uploadDir, storageKey));
  }
}
