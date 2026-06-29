import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const mimeTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp4': 'video/mp4',
};

function getFilePath(pathname: string) {
  if (pathname === '/') return './index.html';
  return `.${pathname}`;
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const filePath = getFilePath(url.pathname);

  try {
    const file = await Deno.readFile(filePath);
    const extension = filePath.slice(filePath.lastIndexOf('.'));
    const contentType = mimeTypes[extension] ?? 'application/octet-stream';
    return new Response(file, { headers: { 'content-type': contentType } });
  } catch {
    return new Response('Bulunamadı', { status: 404 });
  }
}

console.log('Sunucu çalışıyor: http://localhost:8000');
serve(handler, { port: 8000 });
