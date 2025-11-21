// components/LoveNoteModal.tsx
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLoveNote } from "@/hooks/useLoveNote";

/**
 * Componente que muestra un modal romántico cuando
 * existe una love note pendiente para el usuario.
 */
export const LoveNoteModal: React.FC = () => {
  const { note, loading, error, markAsSeen } = useLoveNote();
  const [open, setOpen] = useState(false);

  // Abrir el modal automáticamente cuando llega una nota nueva
  useEffect(() => {
    if (note) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [note]);

  // Si no hay nota o sigue cargando, no renderizamos nada
  if (loading || !note) return null;

  const handleOpenChange = async (value: boolean) => {
    if (!value) {
      // Al cerrar el modal, marcamos la nota como vista
      await markAsSeen();
    }
    setOpen(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="text-center max-w-md">
        <DialogHeader>
          <DialogTitle className="text-pink-600 text-2xl">
            💌 Un mensaje para ti
          </DialogTitle>
        </DialogHeader>
        {error && (
          <p className="text-sm text-red-500 mt-2">{error}</p>
        )}
        <p className="text-lg text-muted-foreground italic mt-4">
          “{note.message}”
        </p>
      </DialogContent>
    </Dialog>
  );
};
