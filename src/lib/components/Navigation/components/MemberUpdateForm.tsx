"use client";

import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { z } from "zod";
import { FieldInfo } from "../../ui/FieldInfo";
import { Button } from "../../ui/button";
import { useRouter } from "next/navigation";
import { useSeasonalStore } from "@pgc-store";
import { api } from "@pgc-trpcClient";
import { getErrorMessage } from "@pgc-utils";
import { memberSchema } from "@pgc-utils";
import type { NavigationMember } from "../types";
import type { Member } from "@prisma/client";

const emptyMember = {
  id: "",
  email: "",
  firstname: "",
  lastname: "",
  account: 0,
  role: "",
  friends: [],
};

export function MemberUpdateForm({
  member,
  setIsEditing,
}: {
  member: NavigationMember;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
}) {
  const router = useRouter();
  const utils = api.useUtils();
  const allMembers = api.member.getAll.useQuery().data;
  const updateMember = useSeasonalStore((state) => state.setMember);

  // tRPC mutation for updating member
  const updateMemberMutation = api.member.update.useMutation({
    onSuccess: (updatedMember) => {
      updateMember(updatedMember);
      void utils.member.invalidate();
      router.refresh();
      setIsEditing(false);
    },
    onError: (error) => {
      handleError(error, "Failed to update member");
    },
  });

  // Form setup
  const form = useForm({
    defaultValues: member ?? emptyMember,
    onSubmit: async ({ value }) => {
      try {
        // Convert null values to undefined for tRPC mutation
        const sanitizedValue = {
          ...value,
          firstname: value.firstname ?? undefined,
          lastname: value.lastname ?? undefined,
          role: value.role ?? undefined,
          account: value.account ?? undefined,
          friends: value.friends ?? undefined,
        };
        await updateMemberMutation.mutateAsync(sanitizedValue);
      } catch (error) {
        handleError(error, "Failed to update member");
      }
    },
    validatorAdapter: zodValidator(),
    validators: { onChange: memberSchema },
  });

  // Handler for form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    await form.handleSubmit();
    setIsEditing(false);
    return;
  };

  // Handler for member select change
  const handleMemberSelectChange = (id: string) => {
    const selected = allMembers?.find((m: Member) => m.id === id);
    form.setFieldValue("email", selected?.email ?? "");
    form.setFieldValue("firstname", selected?.firstname ?? "");
    form.setFieldValue("lastname", selected?.lastname ?? "");
    form.setFieldValue("id", id);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        {member?.role === "admin" && (
          <form.Field name="id">
            {(field) => (
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
                    value={field.state.value ?? ""}
                    onChange={(e) => handleMemberSelectChange(e.target.value)}
                  >
                    <option value="">-- Select a Member --</option>
                    {allMembers?.map((member: Member) => (
                      <option key={member.id} value={member.id}>
                        {member.firstname} {member.lastname}
                      </option>
                    ))}
                  </select>
                </div>
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
        )}
        {/* Email Field */}
        <form.Field
          name="email"
          validators={{
            onChange: z.string().min(3, "Emails must be at least 3 characters"),
          }}
        >
          {(field) => (
            <div className="flex flex-col">
              <div className="flex flex-row">
                <label htmlFor={field.name} className="my-auto">
                  Email:
                </label>
                <input
                  className="ml-2 h-[1.5rem] border-2 px-0.5"
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>
        {/* First Name Field */}
        <form.Field
          name="firstname"
          validators={{
            onChange: z
              .string()
              .min(3, "First name must be at least 3 characters"),
          }}
        >
          {(field) => (
            <div className="flex flex-col">
              <div className="flex flex-row">
                <label htmlFor={field.name} className="my-auto">
                  First Name:
                </label>
                <input
                  className="ml-2 h-[1.5rem] border-2 px-0.5"
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>
        {/* Last Name Field */}
        <form.Field
          name="lastname"
          validators={{
            onChange: z
              .string()
              .min(3, "Last name must be at least 3 characters"),
          }}
        >
          {(field) => (
            <div className="flex flex-col">
              <div className="flex flex-row">
                <label htmlFor={field.name} className="my-auto">
                  Last Name:
                </label>
                <input
                  className="ml-2 h-[1.5rem] border-2 px-0.5"
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>
        {/* Submit/Cancel Buttons */}
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <div className="flex justify-between">
              <Button
                onClick={() => setIsEditing(false)}
                variant={"secondary"}
                className="h-[1.5rem] w-1/3 items-center self-start"
              >
                Stop editing
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit}
                className="h-[1.5rem] w-1/3 items-center self-end"
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

/**
 * Handles and logs errors, optionally shows a toast (extend as needed)
 */
function handleError(error: unknown, context: string) {
  console.error(`${context}:`, getErrorMessage(error));
}
