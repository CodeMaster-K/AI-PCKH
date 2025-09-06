export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
  token?: string
): Promise<Response> {
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`${res.status}: ${errorText}`);
  }

  return res;
}
