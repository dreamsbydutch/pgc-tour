/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form'
import { Input } from '../ui/input'
import { type Control } from 'react-hook-form'
import Image from 'next/image'
import DateTimePicker from 'react-datetime-picker'

interface CustomProps {
  control: Control<any>
  fieldType:
    | 'input'
    | 'number'
    | 'checkbox'
    | 'textarea'
    | 'datePicker'
    | 'select'
    | 'skeleton'
  name: string
  label?: string
  placeholder?: string
  iconSrc?: string
  iconAlt?: string
  disabled?: boolean
  dateFormat?: string
  showTImeSelect?: boolean
  children?: React.ReactNode
  renderSkeleton?: (field: any) => React.ReactNode
}
type ValuePiece = Date | null
type Value = ValuePiece | [ValuePiece, ValuePiece]

function RenderField({ field, props }: { field: any; props: CustomProps }) {
  switch (props.fieldType) {
    case 'input':
      return (
        <div className="border-dark-500 bg-dark-400 flex rounded-md border">
          {props.iconSrc && (
            <Image
              alt={props.iconAlt ?? 'icon'}
              src={props.iconSrc}
              height={24}
              width={24}
              className="ml-2"
            />
          )}
          <FormControl>
            <Input
              placeholder={props.placeholder}
              {...field}
              className="shad-input border-0"
            />
          </FormControl>
        </div>
      )
    case 'number':
      return (
        <div className="border-dark-500 bg-dark-400 flex rounded-md border">
          {props.iconSrc && (
            <Image
              alt={props.iconAlt ?? 'icon'}
              src={props.iconSrc}
              height={24}
              width={24}
              className="ml-2"
            />
          )}
          <FormControl>
            <Input
              type="number"
              placeholder={props.placeholder}
              {...field}
              className="shad-input border-0"
            />
          </FormControl>
        </div>
      )
    case 'datePicker':
      return (
        <div className="border-dark-500 bg-dark-400 flex rounded-md border">
          <Input
            className="shad-input border-"
            aria-label="Date and time from"
            type="datetime-local"
          />
        </div>
      )
    default:
      break
  }
  return <Input type="text" placeholder="John Doe" />
}

export default function CustomFormField(props: CustomProps) {
  return (
    <FormField
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <FormItem className="flex-1">
          {props.fieldType !== 'checkbox' && props.label && (
            <FormLabel>{props.label}</FormLabel>
          )}

          <RenderField field={field} props={props} />

          <FormMessage className="shad-error" />
        </FormItem>
      )}
    />
  )
}
