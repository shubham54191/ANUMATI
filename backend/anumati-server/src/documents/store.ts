import { createHash, randomBytes } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, open, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Transform, type Readable } from "node:stream";

export const ALLOWED_MIME = new Set(["application/pdf", "image/png", "image/jpeg"]);

/**
 * Content-addressed storage. A file is hashed with SHA-256 as it arrives —
 * before anything else reads it — and stored under that hash. The same file
 * uploaded twice is one object; a signature over a hash cannot be moved to a
 * different file.
 *
 * In a deployment this directory is replaced by MAITRI 2.0's Central
 * Document Repository: ANUMATI keeps the hash and a reference, not a copy.
 */
export class DocumentStore {
  constructor(private root: string) {}

  pathFor(sha256: string) {
    return path.join(this.root, sha256.slice(0, 2), sha256.slice(2, 4), sha256);
  }

  async put(stream: Readable, maxBytes: number): Promise<{ sha256: string; bytes: number; storedPath: string }> {
    await mkdir(path.join(this.root, "tmp"), { recursive: true });
    const tmp = path.join(this.root, "tmp", randomBytes(12).toString("hex"));
    const hash = createHash("sha256");
    let bytes = 0;
    const meter = new Transform({
      transform(chunk: Buffer, _enc, cb) {
        bytes += chunk.length;
        if (bytes > maxBytes) return cb(new Error(`File is larger than ${maxBytes} bytes.`));
        hash.update(chunk);
        cb(null, chunk);
      },
    });
    try {
      await pipeline(stream, meter, createWriteStream(tmp));
    } catch (e) {
      await rm(tmp, { force: true });
      throw e;
    }
    const sha256 = hash.digest("hex");
    const final = this.pathFor(sha256);
    await mkdir(path.dirname(final), { recursive: true });
    const exists = await stat(final).then(() => true, () => false);
    if (exists) await rm(tmp, { force: true });
    else await rename(tmp, final);
    return { sha256, bytes, storedPath: final };
  }

  read(sha256: string) {
    return createReadStream(this.pathFor(sha256));
  }

  async head(sha256: string, n: number): Promise<Buffer> {
    const fh = await open(this.pathFor(sha256), "r");
    try {
      const buf = Buffer.alloc(n);
      const { bytesRead } = await fh.read(buf, 0, n, 0);
      return buf.subarray(0, bytesRead);
    } finally {
      await fh.close();
    }
  }

  async discard(sha256: string) {
    await rm(this.pathFor(sha256), { force: true });
  }
}

/** First bytes of the formats we accept — the declared type is not trusted. */
export function sniffMime(head: Buffer): string | null {
  if (head.subarray(0, 5).toString("latin1") === "%PDF-") return "application/pdf";
  if (head[0] === 0x89 && head.subarray(1, 4).toString("latin1") === "PNG") return "image/png";
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "image/jpeg";
  return null;
}
