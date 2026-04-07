import Link from 'next/link';

interface PageHeaderProps {
  backUrl: string;
  title: string;
}

export function PageHeader({ backUrl, title }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <Link
        href={backUrl}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        ← Back
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
    </div>
  );
}
