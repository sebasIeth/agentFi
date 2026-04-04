import { PinataSDK } from "pinata";

const PINATA_JWT = process.env.PINATA_JWT || "";
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || "gateway.pinata.cloud";

const pinata = new PinataSDK({ pinataJwt: PINATA_JWT, pinataGateway: PINATA_GATEWAY });

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function uploadImage(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<{ cid: string; gatewayUrl: string; size: number }> {
  if (buffer.length > MAX_SIZE) throw new Error("Image too large. Max 10MB.");
  if (!ALLOWED_TYPES.includes(mimeType)) throw new Error("Invalid image type.");

  const file = new File([new Uint8Array(buffer)], filename, { type: mimeType });
  const response = await pinata.upload.public.file(file);

  return {
    cid: response.cid,
    gatewayUrl: `https://${PINATA_GATEWAY}/ipfs/${response.cid}`,
    size: buffer.length,
  };
}

export function getGatewayUrl(cid: string): string {
  return `https://${PINATA_GATEWAY}/ipfs/${cid}`;
}
