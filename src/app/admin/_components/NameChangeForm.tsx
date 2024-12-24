"use client";

import { api } from "@/src/trpc/react";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { FieldInfo } from "../../_components/FieldInfo";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { memberSchema } from "@/src/lib/validators";
import type { FormEvent } from "react";
import { Button } from "../../_components/ui/button";
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

export default function AdminNameChangeForm() {
  const router = useRouter();
  const utils = api.useUtils();
  const allMembers = api.member.getAll.useQuery().data;

  const form = useForm({
    defaultValues: emptyMember,
    onSubmit: async ({ value }) => {
      await memberUpdateFormOnSubmit({ value, userId: value.id });
      await utils.invalidate();
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
    <form onSubmit={(e) => handleSubmit(e)} className="mb-8">
      <div className="flex flex-col gap-2">
        <form.Field name="id">
          {(field) => {
            // Avoid hasty abstractions. Render props are great!
            return (
              <div className="flex flex-col">
                <div className="flex flex-row">
                  <label
                    htmlFor="member"
                    style={{ display: "block", marginBottom: ".5rem" }}
                  >
                    Select Member
                  </label>
                  <select
                    className="ml-2 h-[1.5rem] border-2 px-0.5"
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => {
                      form.setFieldValue(
                        "email",
                        allMembers?.find(
                          (member) => member.id === e.target.value,
                        )?.email ?? "",
                      );
                      form.setFieldValue(
                        "firstname",
                        allMembers?.find(
                          (member) => member.id === e.target.value,
                        )?.firstname ?? "",
                      );
                      form.setFieldValue(
                        "lastname",
                        allMembers?.find(
                          (member) => member.id === e.target.value,
                        )?.lastname ?? "",
                      );
                      field.handleChange(e.target.value);
                    }}
                  >
                    <option value="">-- Select a Member --</option>
                    {allMembers?.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.fullname}
                      </option>
                    ))}
                  </select>
                </div>
                <FieldInfo field={field} />
              </div>
            );
          }}
        </form.Field>
        <form.Field
          name="email"
          validators={{
            onChange: z.string().min(3, "Emails must be at least 3 characters"),
          }}
        >
          {(field) => {
            // Avoid hasty abstractions. Render props are great!
            return (
              <div className="flex flex-col">
                <div className="flex flex-row">
                  <label htmlFor={field.name} className="my-auto">
                    Email:
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
            <div className="flex justify-between">
              <Button
                type="submit"
                disabled={!canSubmit}
                className="h-[1.5rem] w-2/5 items-center self-end"
              >
                {isSubmitting ? "..." : "Update"}
              </Button>
            </div>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
