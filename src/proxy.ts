import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  /*
   * IMPORTANT:
   * getUser() verifies the authenticated user with Supabase.
   */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  /*
   * PUBLIC ROUTES
   */
  const isPublicRoute =
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon");

  /*
   * ROOT → LOGIN
   */
  if (pathname === "/") {
    if (!user) {
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }

    /*
     * If already logged in, send the user
     * to their correct dashboard.
     */
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "teacher") {
      return NextResponse.redirect(
        new URL("/teacher/dashboard", request.url)
      );
    }

    if (profile?.role === "student") {
      return NextResponse.redirect(
        new URL("/student/dashboard", request.url)
      );
    }

    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  /*
   * NOT LOGGED IN
   *
   * Any protected page requires authentication.
   */
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  /*
   * LOGIN PAGE
   *
   * If already logged in, don't allow the user
   * to stay on the login page.
   */
  if (user && pathname === "/login") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "teacher") {
      return NextResponse.redirect(
        new URL("/teacher/dashboard", request.url)
      );
    }

    if (profile?.role === "student") {
      return NextResponse.redirect(
        new URL("/student/dashboard", request.url)
      );
    }

    return response;
  }

  /*
   * TEACHER ROUTES
   */
  if (pathname.startsWith("/teacher")) {
    if (!user) {
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error || profile?.role !== "teacher") {
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }
  }

  /*
   * STUDENT ROUTES
   */
  if (pathname.startsWith("/student")) {
    if (!user) {
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error || profile?.role !== "student") {
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/teacher/:path*",
    "/student/:path*",
  ],
};