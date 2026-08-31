import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase/server";
import { requireAdmin } from "../../../lib/adminAuth";

export const runtime = "nodejs";

const BUCKET =
  process.env.SUPABASE_TRIP_IMAGES_BUCKET?.trim() || "trip-images";

const MAX_FILE_SIZE = 8 * 1024 * 1024;

const extensionFor = (file: File) => {
  const fromName = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (fromName && fromName.length <= 5) return fromName;

  const byType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "image/gif": "gif",
  };

  return byType[file.type] || "jpg";
};

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please choose an image to upload." },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed." },
        { status: 400 }
      );
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image must be smaller than 8 MB." },
        { status: 400 }
      );
    }

    const extension = extensionFor(file);
    const objectPath = `trips/${new Date().getFullYear()}/${crypto.randomUUID()}.${extension}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(objectPath, bytes, {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(objectPath);

    if (!data?.publicUrl) {
      throw new Error("Supabase did not return a public image URL.");
    }

    return NextResponse.json({
      ok: true,
      url: data.publicUrl,
      path: objectPath,
    });
  } catch (error) {
    console.error("Trip image upload failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to upload the image.",
      },
      { status: 500 }
    );
  }
}
