import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const expectedEmail = process.env.ADMIN_EMAIL || "mahad@gmail.com";
    const expectedPassword = process.env.ADMIN_PASSWORD || "mahad000";

    if (email === expectedEmail && password === expectedPassword) {
      const response = NextResponse.json({
        success: true,
        message: "Authentication successful",
      });

      // Secure HTTP-Only Cookie
      const secretToken = process.env.ADMIN_SESSION_SECRET || "mkweb_admin_session_token_key";
      
      response.cookies.set({
        name: "admin_token",
        value: secretToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: "Invalid email or password" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error during authentication" },
      { status: 500 }
    );
  }
}
