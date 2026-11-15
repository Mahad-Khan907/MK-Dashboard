import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  const secretToken = process.env.ADMIN_SESSION_SECRET || "mkweb_admin_session_token_key";

  if (token && token === secretToken) {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
