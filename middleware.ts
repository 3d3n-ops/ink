import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/p/(.*)", // Public published entries
  "/pricing",
  "/landing",
]);

const isOnboardingRoute = createRouteMatcher([
  "/onboarding(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  
  // If user is signed in and on landing page, redirect to dashboard
  // Dashboard will check onboarding status and redirect if needed
  if (userId && request.nextUrl.pathname === "/") {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }
  
  // Allow onboarding routes for signed-in users (they need to complete it)
  if (userId && isOnboardingRoute(request)) {
    return NextResponse.next();
  }
  
  // Protect non-public routes
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

