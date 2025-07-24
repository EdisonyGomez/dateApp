import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';

export const useLoveNote = () => {
  const { user } = useAuth();
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const fetchNote = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('love_notes')
        .select('id, message')
        .eq('recipient_id', user.id)
        .eq('seen', false)
        .order('created_at', { ascending: false })
        .limit(1); // ❌ No uses .single()

      if (error) {
        console.error('Error fetching love note:', error);
        return;
      }

      const noteData = data?.[0];
      if (noteData) {
        setNote(noteData.message);

        // Marcar como vista
        await supabase
          .from('love_notes')
          .update({ seen: true })
          .eq('id', noteData.id);
      }
    };

    fetchNote();
  }, [user?.id]);

  return note;
};
