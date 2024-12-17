'use client'

import { createSeason } from './actions'
import { Button } from '../ui/button'
import CustomFormField from '../customForm/CustomFormField'
import { useForm } from 'react-hook-form'
import { createSeasonSchema } from '../../types/zod-validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form } from '../ui/form'
import { useFormStatus } from 'react-dom'

export default function CreateSeasonForm() {
  const { pending } = useFormStatus()

  const form = useForm<z.infer<typeof createSeasonSchema>>({
    resolver: zodResolver(createSeasonSchema),
    defaultValues: {
      number: undefined,
      year: undefined,
    },
  })
  async function onSubmit({
    number,
    year,
  }: z.infer<typeof createSeasonSchema>) {
    await createSeason({ number, year })
  }

  return (
    <div className="my-5 flex flex-col gap-5 rounded-2xl bg-card p-5 shadow-sm">
      <Form {...form}>
        <h1 className="mx-4 text-xl font-bold">Create Season</h1>
        <form className="flex gap-5" onSubmit={form.handleSubmit(onSubmit)}>
          <CustomFormField
            fieldType="input"
            name="year"
            control={form.control}
            placeholder="Year"
          />
          <CustomFormField
            fieldType="input"
            name="number"
            control={form.control}
            placeholder="Number"
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
