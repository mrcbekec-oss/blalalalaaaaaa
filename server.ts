import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// In-memory rooms: Map<roomId, { clients: Map<WebSocket, {name:string}>, items: Array }>
const rooms = new Map<string, { clients: Map<any, any>; items: any[] }>();

const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
};

function getFilePath(pathname: string) {
  if (pathname === "/") return "./index.html";
  return `.${pathname}`;
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  // WebSocket endpoint for real-time rooms
  if (url.pathname === "/ws") {
    const { socket, response } = Deno.upgradeWebSocket(req);

    socket.onopen = () => {
      // noop
    };

    socket.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        handleWsMessage(socket, msg);
      } catch (e) {
        console.error("Invalid WS message", e);
      }
    };

    socket.onclose = () => {
      // remove socket from any room it belonged to
      for (const [roomId, data] of rooms.entries()) {
        if (data.clients.has(socket)) {
          data.clients.delete(socket);
          broadcast(roomId, { type: "presence", users: Array.from(data.clients.values()).map((c) => c.name) });
        }
      }
    };

    return response;
  }

  const filePath = getFilePath(url.pathname);

  try {
    const file = await Deno.readFile(filePath);
    const extension = filePath.slice(filePath.lastIndexOf("."));
    const contentType = mimeTypes[extension] ?? "application/octet-stream";
    return new Response(file, { headers: { "content-type": contentType } });
  } catch {
    return new Response("Bulunamadı", { status: 404 });
  }
}

function handleWsMessage(socket: any, msg: any) {
  if (msg.type === "join") {
    const { room, name } = msg;
    if (!rooms.has(room)) rooms.set(room, { clients: new Map(), items: [] });
    const roomData = rooms.get(room)!;
    roomData.clients.set(socket, { name });
    // send init
    try {
      socket.send(JSON.stringify({ type: "init", items: roomData.items, users: Array.from(roomData.clients.values()).map((c) => c.name) }));
    } catch {}
    broadcast(room, { type: "presence", users: Array.from(roomData.clients.values()).map((c) => c.name) });
  }

  if (msg.type === "place_item") {
    const { room, item } = msg;
    const roomData = rooms.get(room);
    if (!roomData) return;
    roomData.items.push(item);
    broadcast(room, { type: "item_placed", item });
  }

  if (msg.type === "remove_item") {
    const { room, id } = msg;
    const roomData = rooms.get(room);
    if (!roomData) return;
    roomData.items = roomData.items.filter((i) => i.id !== id);
    broadcast(room, { type: "item_removed", id });
  }
}

function broadcast(room: string, message: any) {
  const data = rooms.get(room);
  if (!data) return;
  for (const client of data.clients.keys()) {
    try {
      client.send(JSON.stringify(message));
    } catch (e) {
      // ignore
    }
  }
}

console.log("Sunucu çalışıyor: http://localhost:8000");
serve(handler, { port: 8000 });
