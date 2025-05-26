import { createServerClient } from "@supabase/ssr"
import { i18nRouter } from "next-i18n-router"
import { NextResponse, type NextRequest } from "next/server"
import i18nConfig from "./i18nConfig"

export async function middleware(request: NextRequest) {
  // Handle i18n first
  const i18nResult = i18nRouter(request, i18nConfig)
  if (i18nResult) return i18nResult

  try {
    // Use the new Supabase SSR pattern
    let supabaseResponse = NextResponse.next({
      request
    })

    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({
              request
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          }
        }
      }
    )

    // Get user session
    const {
      data: { user }
    } = await supabase.auth.getUser()

    // Handle unauthenticated users (redirect to login)
    if (
      !user &&
      !request.nextUrl.pathname.startsWith("/login") &&
      !request.nextUrl.pathname.startsWith("/auth")
    ) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }

    // Handle authenticated users on root path (your custom logic)
    if (user && request.nextUrl.pathname === "/") {
      const { data: homeWorkspace, error } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_home", true)
        .single()

      if (!homeWorkspace) {
        throw new Error(error?.message)
      }

      return NextResponse.redirect(
        new URL(`/${homeWorkspace.id}/chat`, request.url)
      )
    }

    // Return the supabase response (important for session management)
    return supabaseResponse
  } catch (e) {
    return NextResponse.next({
      request: {
        headers: request.headers
      }
    })
  }
}

export const config = {
  matcher: "/((?!api|static|.*\\..*|_next|auth).*)"
}
