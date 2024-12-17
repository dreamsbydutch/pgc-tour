'use client'

import { createTournament } from './actions'
import { Button } from '../ui/button'
import CustomFormField from '../customForm/CustomFormField'
import { useForm } from 'react-hook-form'
import { createTournamentSchema } from '../../types/zod-validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form } from '../ui/form'
import { useFormStatus } from 'react-dom'
import { useState } from 'react'

export default function CreateTournamentForm() {
  const { pending } = useFormStatus()
  const [tierId, setTierId] = useState<string | undefined>(undefined)
  const [courseId, setCourseId] = useState<string | undefined>(undefined)

  const form = useForm<z.infer<typeof createTournamentSchema>>({
    resolver: zodResolver(createTournamentSchema),
    defaultValues: {
      name: undefined,
      courseId: undefined,
      startDate: undefined,
      endDate: undefined,
      tierId: undefined,
      seasonId: undefined,
      currentRound: undefined,
      logoUrl: undefined,
      livePlay: undefined,
    },
  })
  async function onSubmit({
    name,
    courseId,
    startDate,
    endDate,
    tierId,
    seasonId,
    logoUrl,
  }: z.infer<typeof createTournamentSchema>) {
    const tourneyTimeline =
      new Date() < new Date(startDate)
        ? 0
        : new Date() > new Date(endDate)
          ? 4
          : -1
    await createTournament({
      name,
      courseId,
      startDate,
      endDate,
      tierId,
      seasonId,
      currentRound: tourneyTimeline,
      logoUrl,
      livePlay: false,
    })
  }

  return (
    <div className="my-5 flex flex-col gap-5 rounded-2xl bg-card p-5 shadow-sm">
      <Form {...form}>
        <h1 className="mx-4 text-xl font-bold">Create Tournament</h1>
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
            name="logoUrl"
            control={form.control}
            placeholder="Logo URL"
          />
          <CustomFormField
            fieldType="input"
            name="courseId"
            control={form.control}
            placeholder="Course ID"
          />
          <CustomFormField
            fieldType="datePicker"
            name="startDate"
            control={form.control}
            placeholder="Start Date"
          />
          <CustomFormField
            fieldType="datePicker"
            name="endDate"
            control={form.control}
            placeholder="End Date"
          />
          <CustomFormField
            fieldType="input"
            name="season"
            control={form.control}
            placeholder="Year"
          />
          <CustomFormField
            fieldType="input"
            name="tierName"
            control={form.control}
            placeholder="Tier Name"
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
