export const metadata = {
  title: "Tournament",
  description: "Tournament overview and stats",
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
