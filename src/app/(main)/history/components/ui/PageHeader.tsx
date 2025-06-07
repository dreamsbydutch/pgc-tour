/**
 * Page Header Component
 * Reusable header with title and description
 */

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export function PageHeader({
  title,
  description,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`mb-8 ${className}`}>
      <h1 className="text-center font-yellowtail text-5xl">{title}</h1>
      {description && (
        <p className="mt-2 text-center text-gray-500">{description}</p>
      )}
    </div>
  );
}
