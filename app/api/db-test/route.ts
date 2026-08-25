import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("trips")
      .select("id, slug, title")
      .limit(5);

    if (error) {
      console.error("Supabase test failed:", error);

      return Response.json(
        {
          ok: false,
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return Response.json({
      ok: true,
      message: "Supabase connection successful.",
      rows: data,
    });
  } catch (error) {
    console.error("DB test route failed:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown database error.",
      },
      {
        status: 500,
      }
    );
  }
}