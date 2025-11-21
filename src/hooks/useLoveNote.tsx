// hooks/useLoveNote.ts
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthProvider";

export interface LoveNote {
  id: string;
  message: string;
}

interface UseLoveNoteResult {
  note: LoveNote | null;
  loading: boolean;
  error: string | null;
  markAsSeen: () => Promise<void>;
}

/**
 * Hook responsable de obtener la love note pendiente
 * para el usuario autenticado y exponer una función
 * para marcarla como leída.
 */
export const useLoveNote = (): UseLoveNoteResult => {
  const { user } = useAuth();
  const [note, setNote] = useState<LoveNote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNote = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("love_notes")
      .select("id, message")
      .eq("recipient_id", user.id)
      .eq("seen", false)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching love note:", error);
      setError("No se pudo cargar el mensaje de amor.");
      setLoading(false);
      return;
    }

    const noteData = data?.[0];

    if (noteData) {
      setNote({ id: noteData.id, message: noteData.message });
    } else {
      setNote(null);
    }

    setLoading(false);
  }, [user?.id]);

  const markAsSeen = useCallback(async () => {
    if (!note) return;
    const { error } = await supabase
      .from("love_notes")
      .update({ seen: true })
      .eq("id", note.id);

    if (error) {
      console.error("Error marcando love note como vista:", error);
      return;
    }

    // Quitamos la nota del estado para que desaparezca el modal
    setNote(null);
  }, [note]);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  return { note, loading, error, markAsSeen };
};
