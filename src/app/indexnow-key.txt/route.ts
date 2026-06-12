// IndexNow key file (keyLocation variant): https://www.indexnow.org/documentation
export async function GET() {
  const key = process.env.INDEXNOW_KEY || "";
  return new Response(key, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
