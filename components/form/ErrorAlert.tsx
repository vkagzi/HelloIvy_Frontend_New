interface ErrorAlertProps {
  error: string | null;
}

export function ErrorAlert({ error }: ErrorAlertProps) {
  if (!error) return null;

  return (
    <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
      {error}
    </div>
  );
}
