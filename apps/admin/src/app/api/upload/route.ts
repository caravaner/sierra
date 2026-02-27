import { NextRequest, NextResponse } from "next/server";
import { auth } from "@sierra/auth";
import { uploadFile, UploadError } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  try {
    const url = await uploadFile(file);
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error("[upload]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
