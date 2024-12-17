export const metadata = {
  title: 'Rulebook',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-10/12 max-w-4xl">{children}</div>
}
