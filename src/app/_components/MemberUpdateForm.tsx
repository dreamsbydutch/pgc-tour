"use client";

import { memberSchema } from "@/src/lib/validators";
import { api } from "@/src/trpc/react";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import type { FormEvent } from "react";
import { z } from "zod";
import { FieldInfo } from "./FieldInfo";
import { Button } from "./ui/button";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { memberUpdateFormOnSubmit } from "@/src/server/api/actions/member";

const emptyMember = {
  id: "",
  email: "",
  fullname: "",
  firstname: "",
  lastname: "",
  account: 0,
  role: "",
};

export default function MemberUpdateForm({ user }: { user: User | null }) {
  const router = useRouter();
  const utils = api.useUtils();
  const member = api.member.getById.useQuery({ memberId: user?.id }).data;

  const form = useForm({
    defaultValues: member ?? emptyMember,
    onSubmit: async ({ value }) => {
      await memberUpdateFormOnSubmit({ value, user });
      utils.invalidate();
      router.refresh();
      return;
    },
    validatorAdapter: zodValidator(),
    validators: { onChange: memberSchema },
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    await form.handleSubmit();
    return;
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <form.Field
          name="firstname"
          validators={{
            onChange: z
              .string()
              .min(3, "First name must be at least 3 characters"),
          }}
        >
          {(field) => {
            // Avoid hasty abstractions. Render props are great!
            return (
              <div className="flex flex-col">
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
                </div>
                <FieldInfo field={field} />
              </div>
            );
          }}
        </form.Field>
        <form.Field
          name="lastname"
          validators={{
            onChange: z
              .string()
              .min(3, "Last name must be at least 3 characters"),
          }}
        >
          {(field) => {
            // Avoid hasty abstractions. Render props are great!
            return (
              <div className="flex flex-col">
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
                </div>
                <FieldInfo field={field} />
              </div>
            );
          }}
        </form.Field>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit}
              className="h-[1.5rem] w-2/5 items-center self-end"
            >
              {isSubmitting ? "..." : "Update"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
