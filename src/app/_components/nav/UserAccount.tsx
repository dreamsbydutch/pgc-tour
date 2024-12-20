"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// import { useForm } from "@tanstack/react-form";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";
// import { zodValidator } from "@tanstack/zod-form-adapter";
import { api } from "@/src/trpc/react";
// import { memberSchema } from "@/src/lib/validators";
// import { z } from "zod";
// import { FieldInfo } from "../FieldInfo";
import { Button } from "../ui/button";
import { createClient } from "@/src/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
// import type { FormEvent } from "react";

// const emptyMember = {
//   id: "",
//   email: "",
//   fullname: "",
//   firstname: "",
//   lastname: "",
//   account: 0,
//   role: "",
// };

export function UserAccountNav({ user }: { user: User | null }) {
  const supabase = createClient();
  const router = useRouter();
  const utils = api.useUtils();
  const member = api.member.getById.useQuery({ memberId: user?.id }).data;
  // const updateMutation = api.member.update.useMutation();
  // const form = useForm({
  //   defaultValues: member ?? emptyMember,
  //   onSubmit: async ({ value }) => {
  //     value.fullname = value.firstname + " " + value.lastname;
  //     updateMutation.mutate(value);
  //     await utils.member.invalidate();
  //   },
  //   validatorAdapter: zodValidator(),
  //   validators: { onChange: memberSchema },
  // });

  async function handleLogout() {
    await supabase.auth.signOut();
    await utils.invalidate();
    router.push("/signin");
    router.refresh();
  }
  // const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   await form.handleSubmit();
  //   return
  // }

  return (
    <div className="w-fit space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center space-x-1">
          <Image
            className="grid place-items-center rounded-full bg-border"
            src={user?.user_metadata.avatar_url as string}
            alt=""
            width={30}
            height={30}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col gap-1 space-y-1 leading-none">
              <p className="w-[200px] truncate text-base font-bold text-slate-800">
                {member?.fullname}
              </p>
              <p className="w-[200px] truncate text-sm text-slate-800">
                {member?.email}
              </p>
              {/* <form
                onSubmit={() => handleSubmit}
              >
                <div className="flex flex-col gap-2">
                  <form.Field
                    name="firstname"
                    validators={{
                      onChange: z
                        .string()
                        .min(3, "First name must be at least 3 characters"),
                    }}
                    children={(field) => {
                      // Avoid hasty abstractions. Render props are great!
                      return (
                        <div className="flex flex-row">
                          <label htmlFor={field.name} className="my-auto">
                            First Name:
                          </label>
                          <input
                            className="ml-2 h-[1.5rem] border-2 px-0.5"
                            id={field.name}
                            name={field.name}
                            value={field.state.value ?? undefined}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                          <FieldInfo field={field} />
                        </div>
                      );
                    }}
                  />
                  <form.Field
                    name="lastname"
                    validators={{
                      onChange: z
                        .string()
                        .min(3, "Last name must be at least 3 characters"),
                    }}
                    children={(field) => {
                      // Avoid hasty abstractions. Render props are great!
                      return (
                        <div className="flex flex-row">
                          <label htmlFor={field.name} className="my-auto">
                            Last Name:
                          </label>
                          <input
                            className="ml-2 h-[1.5rem] border-2 px-0.5"
                            id={field.name}
                            name={field.name}
                            value={field.state.value ?? undefined}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                          <FieldInfo field={field} />
                        </div>
                      );
                    }}
                  />
                  <Button
                    type="submit"
                    className="h-[1.5rem] w-2/5 items-center self-end"
                  >
                    Update
                  </Button>
                </div>
              </form> */}
              <Link href={"/privacy"} className="text-xs text-slate-700">
                Privacy Policy
              </Link>
              <Link href={"/terms"} className="text-xs text-slate-700">
                Terms of Service
              </Link>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer">
            <Button className="w-full" onClick={() => handleLogout}>
              Sign out
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
