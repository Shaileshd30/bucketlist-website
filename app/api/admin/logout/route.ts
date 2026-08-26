import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const cookieStore =
      await cookies();

    cookieStore.set(
      "bla_admin_session",
      "",
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      }
    );

    return Response.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Admin logout failed:",
      error
    );

    return Response.json(
      {
        error:
          "Unable to log out.",
      },
      {
        status: 500,
      }
    );
  }
}