import { useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { HelpPanel } from './HelpPanel';

export const HelpButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
        aria-label="Open Help"
      >
        <CircleHelp className="w-6 h-6" />
      </button>
      <HelpPanel open={open} onOpenChange={setOpen} />
    </>
  );
};
