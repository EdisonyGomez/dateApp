import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLoveNote } from '@/hooks/useLoveNote';

export const LoveNoteModal = () => {
  const note = useLoveNote();

  if (!note) return null;

  return (
    <Dialog defaultOpen>
      <DialogContent className="text-center">
        <DialogHeader>
          <DialogTitle className="text-pink-600 text-2xl">💌 Un mensaje para ti</DialogTitle>
        </DialogHeader>
        <p className="text-lg text-muted-foreground italic mt-4">
          “{note}”
        </p>
      </DialogContent>
    </Dialog>
  );
};
