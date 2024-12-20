"use server";

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
  console.log(code);

  if (code) {
    // Create a Supabase client
    const supabase = await createClient();

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const supabaseUser = await supabase.auth.getUser();
      if (supabaseUser.data.user) {
        const prismaUser = await api.member.getById({
          memberId: supabaseUser.data.user.id,
        });
        if (!prismaUser) {
          const fullName = formatName(supabaseUser.data.user.user_metadata.name, "full");
          const splitName = fullName.split(" ");
          await api.member.create({
            id: supabaseUser.data.user.id,
            fullname: fullName,
            firstname: splitName[0] ?? "N/A",
            lastname: splitName.slice(1).toString(),
            email: supabaseUser.data.user.email ?? "N/A",
          });
        } else if (!prismaUser?.firstname || !prismaUser?.lastname) {
          const fullName = formatName(prismaUser.fullname, "full");
          const splitName = fullName.split(" ");
          await api.member.update({
            id: prismaUser.id,
            fullname: fullName,
            firstname: splitName[0],
            lastname: splitName.slice(1).toString(),
          });
        }

        // If successful, redirect to the 'next' path or home
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // If there's no code or an error occurred, redirect to an error page
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
