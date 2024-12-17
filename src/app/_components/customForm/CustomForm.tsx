import { ChangeEvent, FormEvent } from 'react'

export default function CustomForm(props: FormInputs) {
  return (
    <div className="m-4 rounded-xl bg-stone-200 p-4">
      <FormHeader {...{ title: props.title }} />
      <FormBody {...props} />
      <div className="mb-2 flex w-full flex-wrap justify-center">
        {props.data?.map((obj) => {
          return (
            <span className="mx-1.5" key={obj}>
              {obj}
            </span>
          )
        })}
      </div>
    </div>
  )

  function FormHeader(props: { title: string }) {
    return (
      <div className="font-varela mb-4 text-center text-2xl font-bold">
        {props.title}
      </div>
    )
  }
  function FormBody(props: FormInputs) {
    return (
      <form onSubmit={props.onSubmit} className="flex flex-col gap-2">
        <FormInputs {...props} />
        <SubmitButton pending={props.pending} />
      </form>
    )

    function FormInputs(props: FormInputs) {
      return props.inputFields.map((obj) => {
        return (
          <input
            key={obj.id}
            type="text"
            placeholder={obj.placeholder}
            value={obj.value}
            onChange={obj.onChange}
            className="w-full rounded-full bg-stone-100 px-4 py-2 text-black"
          />
        )
      })
    }
    function SubmitButton({ pending }: { pending: boolean }) {
      return (
        <button
          type="submit"
          className={`mx-auto w-1/2 rounded-full bg-stone-300 ${pending ? 'my-[10px]' : 'shadow-btn my-2 border-2 border-stone-400 bg-slate-100 font-semibold'} px-10 py-3 transition`}
          disabled={pending}
        >
          {pending ? 'Submitting...' : 'Submit'}
        </button>
      )
    }
  }
}

type FormInputs = {
  title: string
  inputFields: {
    id: string
    placeholder: string
    value: string
    onChange: (e: ChangeEvent<HTMLInputElement>) => void
  }[]
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  pending: boolean
  data?: string[]
}
