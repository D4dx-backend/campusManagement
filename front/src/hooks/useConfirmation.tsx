import { useState } from 'react';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface ConfirmationOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export function useConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions>({
    title: '',
    description: '',
  });
  const [onConfirm, setOnConfirm] = useState<(() => void) | null>(null);

  const confirm = (confirmOptions: ConfirmationOptions, callback: () => void) => {
    setOptions(confirmOptions);
    setOnConfirm(() => callback);
    setIsOpen(true);
  };

  const ConfirmationComponent = () => (
    <ConfirmationDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title={options.title}
      description={options.description}
      confirmText={options.confirmText}
      cancelText={options.cancelText}
      variant={options.variant}
      onConfirm={() => onConfirm?.()}
    />
  );

  return { confirm, ConfirmationComponent };
}