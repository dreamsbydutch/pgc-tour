import CreateCourseForm from '@/components/adminForms/CreateCourseForm'
import CreateSeasonForm from '@/components/adminForms/CreateSeasonForm'
import CreateTierForm from '@/components/adminForms/CreateTierForm'
import CreateTourForm from '@/components/adminForms/CreateTourForm'
import CreateTournamentForm from '@/components/adminForms/CreateTournamentForm'
import { getServerAuthSession } from '@/server/auth'

export default async function AdminDashboard() {
  const session = await getServerAuthSession()

  if (session?.user.role !== 'admin') {
    return (
      <div className="m-3 flex text-center">
        You aren't the admin. How did you even get here?
      </div>
    )
  }

  return (
    <>
      <div className="mx-auto text-center text-lg font-bold md:text-xl lg:text-2xl">{`${session?.user.firstName} ${session?.user.lastName}`}</div>
      <CreateSeasonForm />
      <CreateTourForm />
      <CreateTierForm />
      <CreateTournamentForm />
      <CreateCourseForm />
    </>
  )
}
