export const metadata = {
  title: 'Admin',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex flex-col">{children}</div>
}
