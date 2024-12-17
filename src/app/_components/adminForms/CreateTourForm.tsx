'use client'

import { createTourSchema } from "@/types/zod-validation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFormStatus } from "react-dom"
import { useForm } from "react-hook-form"
import { createTour } from "./actions"
import { Form } from "../ui/form"
import CustomFormField from "../customForm/CustomFormField"
import { z } from "zod"
import { Button } from "../ui/button"


export default function CreateTourForm() {
  const { pending } = useFormStatus()

  const form = useForm<z.infer<typeof createTourSchema>>({
    resolver: zodResolver(createTourSchema),
    defaultValues: {
      name: undefined,
      logoUrl: undefined,
      season: undefined,
    },
  })
  async function onSubmit({
    name,
    logoUrl,
    season,
  }: z.infer<typeof createTourSchema>) {
    await createTour({
      name,
      logoUrl,
      season,
    })
  }

  return (
    <div className="my-5 flex flex-col gap-5 rounded-2xl bg-card p-5 shadow-sm">
      <Form {...form}>
        <h1 className="mx-4 text-xl font-bold">Create Tour</h1>
        <form
          className="flex flex-col gap-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <CustomFormField
            fieldType="input"
            name="name"
            control={form.control}
            placeholder="Tour Name"
          />
          <CustomFormField
            fieldType="input"
            name="logoUrl"
            control={form.control}
            placeholder="Logo URL"
          />
          <CustomFormField
            fieldType="input"
            name="season"
            control={form.control}
            placeholder="Year"
          />
          <div className="flex justify-end">
            <Button
              onClick={() => {
                const values = form.getValues()
                onSubmit({
                  season: +values.season,
                  name: values.name,
                  logoUrl: values.logoUrl,
                })
              }}
              disabled={pending}
              className="min-w-20"
            >
              Create
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
