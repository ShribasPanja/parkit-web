import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const response = await axios.post(`${BACKEND_URL}/auth/signup`, {
      name,
      email,
      password,
    });

    return NextResponse.json(response.data, { status: 201 });
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data) {
      return NextResponse.json(error.response.data, {
        status: error.response.status,
      });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
