const JWT = process.env.NEXT_PUBLIC_PINATA_JWT;

async function pinataError(res: Response, label: string): Promise<never> {
  let detail: string;
  try {
    const body = await res.json();
    detail = body?.error?.details ?? body?.error ?? body?.message ?? res.statusText;
  } catch {
    detail = res.statusText || String(res.status);
  }
  throw new Error(`${label} (${res.status}): ${detail}`);
}

export async function uploadToPinata(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${JWT}` },
    body: formData,
  });

  if (!res.ok) await pinataError(res, "Pinata upload failed");

  const data = await res.json();
  return data.IpfsHash as string;
}

export async function uploadJsonToPinata(
  json: Record<string, unknown>,
  name: string
): Promise<string> {
  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT}`,
    },
    body: JSON.stringify({
      pinataContent: json,
      pinataMetadata: { name },
    }),
  });

  if (!res.ok) await pinataError(res, "Pinata JSON upload failed");

  const data = await res.json();
  return data.IpfsHash as string;
}
