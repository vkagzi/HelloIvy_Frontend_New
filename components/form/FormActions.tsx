import { Button } from '@/components/ui/button';

interface FormActionsProps {
  isLoading: boolean;
  onCancel: () => void;
  submitLabel?: string;
  cancelLabel?: string;
}

export function FormActions({
  isLoading,
  onCancel,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
}: FormActionsProps) {
  return (
    <div className="flex justify-end gap-3 pt-4">
      <Button type="button" variant="outline" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : submitLabel}
      </Button>
    </div>
  );
}
