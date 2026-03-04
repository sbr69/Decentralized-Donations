const JWT = process.env.NEXT_PUBLIC_PINATA_JWT;

export async function uploadToPinata(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${JWT}` },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Pinata upload failed: ${res.statusText}`);
  }

  const data = await res.json();
  return data.IpfsHash as string;
}

export async function uploadJsonToPinata(
  json: Record<string, unknown>,
  name: string
): Promise<string> {
  const res = await fetch(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${JWT}`,
      },
      body: JSON.stringify({
        pinataContent: json,
        pinataMetadata: { name },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Pinata JSON upload failed: ${res.statusText}`);
  }

  const data = await res.json();
  return data.IpfsHash as string;
}
