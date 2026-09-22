import { NextRequest, NextResponse } from "next/server";

const API = process.env.API_PROXY ?? "http://localhost:4000";

async function proxy(req: NextRequest, path: string[]) {
  const url = `${API}/api/v1/${path.join("/")}${req.nextUrl.search}`;
  const headers = new Headers();
  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const method = req.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await req.arrayBuffer();

  const res = await fetch(url, {
    method,
    headers,
    body: body && body.byteLength ? body : undefined,
    redirect: "manual",
  });

  const outHeaders = new Headers();
  res.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (k === "set-cookie" || k === "transfer-encoding" || k === "content-encoding" || k === "content-length") {
      return;
    }
    outHeaders.set(key, value);
  });

  const out = new NextResponse(await res.arrayBuffer(), { status: res.status, headers: outHeaders });
  const cookies = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const c of cookies) out.headers.append("set-cookie", c);
  return out;
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path);
}
