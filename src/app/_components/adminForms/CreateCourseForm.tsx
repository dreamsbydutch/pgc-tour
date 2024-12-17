'use client'

import { createCourseSchema } from '@/types/zod-validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFormStatus } from 'react-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { createCourse } from './actions'
import { Form } from '../ui/form'
import CustomFormField from '../customForm/CustomFormField'
import { Button } from '../ui/button'

export default function CreateCourseForm() {
  const { pending } = useFormStatus()

  const form = useForm<z.infer<typeof createCourseSchema>>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      name: undefined,
      apiId: undefined,
      location: undefined,
      par: undefined,
      front: undefined,
      back: undefined,
    },
  })
  async function onSubmit({
    name,
    apiId,
    location,
    par,
    front,
    back,
  }: z.infer<typeof createCourseSchema>) {
    await createCourse({
      name,
      apiId: apiId ?? '',
      location,
      par,
      front,
      back,
    })
  }

  return (
    <div className="my-5 flex flex-col gap-5 rounded-2xl bg-card p-5 shadow-sm">
      <Form {...form}>
        <h1 className="mx-4 text-xl font-bold">Create Course</h1>
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
            name="apiId"
            control={form.control}
            placeholder="API ID"
          />
          <CustomFormField
            fieldType="input"
            name="location"
            control={form.control}
            placeholder="Location"
          />
          <CustomFormField
            fieldType="number"
            name="par"
            control={form.control}
            placeholder="Par"
          />
          <CustomFormField
            fieldType="number"
            name="front"
            control={form.control}
            placeholder="Front"
          />
          <CustomFormField
            fieldType="number"
            name="back"
            control={form.control}
            placeholder="Back"
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
