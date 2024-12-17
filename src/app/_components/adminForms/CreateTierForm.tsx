'use client'

import { createTier } from './actions'
import { Button } from '../ui/button'
import CustomFormField from '../customForm/CustomFormField'
import { useForm } from 'react-hook-form'
import { createTierSchema } from '../../types/zod-validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form } from '../ui/form'
import { useFormStatus } from 'react-dom'

export default function CreateTierForm() {
  const { pending } = useFormStatus()

  const form = useForm<z.infer<typeof createTierSchema>>({
    resolver: zodResolver(createTierSchema),
    defaultValues: {
      name: undefined,
      payouts: undefined,
      points: undefined,
      year: undefined,
    },
  })
  async function onSubmit({
    name,
    payouts,
    points,
    year,
  }: z.infer<typeof createTierSchema>) {
    await createTier({
      name,
      payouts,
      points,
      year,
    })
  }

  return (
    <div className="my-5 flex flex-col gap-5 rounded-2xl bg-card p-5 shadow-sm">
      <Form {...form}>
        <h1 className="mx-4 text-xl font-bold">Create Tier</h1>
        <form
          className="flex flex-col gap-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <CustomFormField
            fieldType="input"
            name="name"
            control={form.control}
            placeholder="Name"
          />
          <CustomFormField
            fieldType="input"
            name="payouts"
            control={form.control}
            placeholder="Payouts array"
          />
          <CustomFormField
            fieldType="input"
            name="points"
            control={form.control}
            placeholder="Points array"
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
                onSubmit(form.getValues())
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
