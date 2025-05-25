export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="legal-container py-8">
      {children}
      <div className="mt-8 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} PGC Tour
      </div>
    </div>
  );
}
