import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { api } from "@/src/trpc/server";
import { formatName } from "@/src/lib/utils";

export async function GET(request: Request) {
  // Extract search parameters and origin from the request URL
  const { searchParams, origin } = new URL(request.url);

  // Get the authorization code and the 'next' redirect path
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  console.log("🔐 OAuth callback received:", { code: !!code, next });

  if (code) {
    // Create a Supabase client
    const supabase = await createClient();

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      console.log("✅ Successfully exchanged code for session");
      const supabaseUser = await supabase.auth.getUser();
      if (supabaseUser.data.user) {
        console.log("✅ User authenticated:", supabaseUser.data.user.email);
        const prismaUser = await api.member.getById({
          memberId: supabaseUser.data.user.id,
        });
        if (!prismaUser) {
          console.log("🆕 Creating new member for user");
          const fullName = formatName(
            supabaseUser.data.user.user_metadata.name as string,
            "full",
          );
          const splitName = fullName.split(" ");
          await api.member.create({
            id: supabaseUser.data.user.id,
            fullname: fullName,
            firstname: splitName[0] ?? "N/A",
            lastname: splitName.slice(1).toString(),
            email: supabaseUser.data.user.email ?? "N/A",
          });
        } else if (!prismaUser?.firstname || !prismaUser?.lastname) {
          console.log("🔄 Updating existing member with missing name data");
          const fullName = formatName(prismaUser.fullname, "full");
          const splitName = fullName.split(" ");
          await api.member.update({
            id: prismaUser.id,
            fullname: fullName,
            firstname: splitName[0],
            lastname: splitName.slice(1).toString(),
          });
        } else {
          console.log("✅ Existing member found:", prismaUser.email);
        }

        // If successful, redirect to the 'next' path or home
        // Add cache-busting query parameter to force store refresh
        const redirectUrl = new URL(`${origin}${next}`);
        redirectUrl.searchParams.set("auth_success", "true");
        redirectUrl.searchParams.set("timestamp", Date.now().toString());
        console.log("↩️ Redirecting to:", redirectUrl.toString());
        return NextResponse.redirect(redirectUrl.toString());
      } else {
        console.error("❌ No user data after successful session exchange");
      }
    } else {
      console.error("❌ Error exchanging code for session:", error);
    }
  } else {
    console.error("❌ No authorization code received");
  }

  // If there's no code or an error occurred, redirect to an error page
  console.log("🔄 Redirecting to error page");
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
