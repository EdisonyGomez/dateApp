import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';

export const useLoveNote = () => {
  const { user } = useAuth();
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const fetchNote = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('love_notes')
        .select('id, message')
        .eq('recipient_id', user.id)
        .eq('seen', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) return;

      if (data) {
        setNote(data.message);

        // marcar como vista
        await supabase
          .from('love_notes')
          .update({ seen: true })
          .eq('id', data.id);
      }
    };

    fetchNote();
  }, [user]);

  return note;
};
