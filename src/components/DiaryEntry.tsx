// src/components/DiaryEntry.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import { DiaryEntry as DiaryEntryType } from '@/types';
import { ProfileModal } from '@/pages/ProfileModal'; // Asumiendo que ProfileModal se encuentra aquí
import { Calendar, Lock, Unlock, Edit } from 'lucide-react'; // Agregado Edit para el botón
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils'; // Importar cn desde shadcn/ui

interface DiaryEntryProps {
  entry: DiaryEntryType;
  onEdit?: (entry: DiaryEntryType) => void;
}

// Asegurarse de que las claves estén en camelCase o snake_case consistente
const moodEmojis = {
  happy: '😊',
  sad: '😢',
  excited: '🤩',
  calm: '😌',
  stressed: '😰',
  grateful: '🙏',
  neutral: '😐',
  tired: '😴', // 'cansado'
  inLove: '😍', // 'enamorado'
  bored: '😒', // 'aburrido'
  surprised: '😲', // 'sorprendido'
  confused: '😕',
  anxious: '😟',
  relaxed: '😌',
  nostalgic: '😢',
  motivated: '💪',
  inspired: '✨',
  frustrated: '😤',
  relieved: '😌',
  worried: '😟',
  scared: '😨',
  hopeful: '🌟',
  angry: '😠', // 'mad'
} as const;

// Mapeo de colores más robusto
const moodColors = {
  happy: 'bg-yellow-100 text-yellow-800',
  sad: 'bg-blue-100 text-blue-800',
  excited: 'bg-orange-100 text-orange-800',
  calm: 'bg-green-100 text-green-800',
  stressed: 'bg-red-100 text-red-800',
  grateful: 'bg-purple-100 text-purple-800',
  neutral: 'bg-gray-100 text-gray-800',
  tired: 'bg-gray-200 text-gray-800',
  inLove: 'bg-pink-100 text-pink-800',
  bored: 'bg-gray-300 text-gray-800',
  surprised: 'bg-yellow-200 text-yellow-800',
  confused: 'bg-blue-200 text-blue-800',
  anxious: 'bg-red-200 text-red-800',
  relaxed: 'bg-green-200 text-green-800',
  nostalgic: 'bg-purple-200 text-purple-800',
  motivated: 'bg-orange-200 text-orange-800',
  inspired: 'bg-pink-200 text-pink-800',
  frustrated: 'bg-red-300 text-red-800',
  relieved: 'bg-green-300 text-green-800',
  worried: 'bg-blue-300 text-blue-800',
  scared: 'bg-red-400 text-red-800',
  hopeful: 'bg-purple-300 text-purple-800',
  angry: 'bg-red-500 text-red-800',
} as const;

// Tipo para las claves de los estados de ánimo, para asegurar el tipado correcto
type MoodKey = keyof typeof moodEmojis;

export const DiaryEntry: React.FC<DiaryEntryProps> = ({ entry, onEdit }) => {
  const { user } = useAuth();
  const isOwn = entry.userId === user?.id;
  const [authorName, setAuthorName] = useState<string>('Cargando...'); // Estado inicial 'Cargando...'

  // Validar que la clave de mood sea una de las esperadas
  const validatedMood: MoodKey = (entry.mood in moodEmojis) ? (entry.mood as MoodKey) : 'neutral';

  useEffect(() => {
    // Si es propio, usar el nombre del usuario logueado
    if (isOwn && user) {
      setAuthorName(user.user_metadata?.name || user.email || 'Yo');
      return;
    }

    // Si no es propio, buscar el nombre del autor en la base de datos
    const fetchAuthor = async () => {
      setAuthorName('Cargando...'); // Reiniciar a cargando al buscar
      const { data, error } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', entry.userId)
        .single();

      if (error) {
        console.error('Error fetching author name:', error);
        setAuthorName('Desconocido'); // Manejar error
      } else {
        setAuthorName(data?.name || 'Compañero'); // "Partner" mejorado a "Compañero"
      }
    };
    fetchAuthor();
  }, [entry.userId, isOwn, user]);

  // Memorizar las clases CSS para evitar recálculos innecesarios
  const { alignment, bubbleColor } = useMemo(() => {
    const align = isOwn ? 'justify-end' : 'justify-start';
    const isMelody = authorName.toLowerCase().includes('melody'); // Asumiendo que 'Melody' es un nombre especial
    const color = isOwn
      ? 'bg-green-100 text-green-900'
      : isMelody
        ? 'bg-pink-100 text-pink-900'
        : 'bg-gray-100 text-gray-900';
    return { alignment: align, bubbleColor: color };
  }, [isOwn, authorName]);

  const formattedDate = useMemo(() => {
    try {
      return new Date(entry.date).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Fecha inválida";
    }
  }, [entry.date]);


  return (
    <div className={cn("flex mb-6", alignment)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={cn(
          "relative flex flex-col max-w-[80%] sm:max-w-md rounded-3xl shadow-xl p-4 border border-white/50 backdrop-blur-md",
          bubbleColor
        )}
      >
        {/* Encabezado de la entrada */}
        <div className="flex items-center mb-2">
          <div className="mr-3">
            <ProfileModal
              userId={entry.userId}
              fallbackColor={isOwn ? 'bg-green-200 text-green-700' : 'bg-pink-200 text-pink-700'}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold leading-tight">{entry.title}</h3>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formattedDate} • {authorName}</span>
            </div>
          </div>
          <div className="ml-2">
            <Badge className={cn("text-xs py-0.5 px-2", moodColors[validatedMood])}>
              {moodEmojis[validatedMood]} {validatedMood.charAt(0).toUpperCase() + validatedMood.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Contenido de la entrada */}
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {entry.content}
        </p>

        {/* Imágenes (si existen) */}
        {entry.photos && entry.photos.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {entry.photos.map((photo, idx) => (
              <img
                key={idx}
                src={photo}
                alt={`Imagen de la entrada ${idx + 1}`} // Alt text mejorado
                className="rounded-md object-cover aspect-square w-full h-full" // Asegurar que la imagen ocupe el espacio
                loading="lazy" // Carga perezosa para imágenes
              />
            ))}
          </div>
        )}

        {/* Pie de página - Privacidad */}
        <div className={cn("mt-3 flex items-center text-xs", isOwn ? 'justify-end' : 'justify-start')}>
          {entry.isPrivate ? (
            <Lock className="h-3 w-3 text-gray-400 mr-1" />
          ) : (
            <Unlock className="h-3 w-3 text-gray-400 mr-1" />
          )}
          <span className="text-gray-400">{entry.isPrivate ? 'Privada' : 'Compartida'}</span>
        </div>

        {/* Botón de edición (solo si es la entrada propia y la función onEdit está disponible) */}
        {isOwn && onEdit && (
          <div className="mt-3 text-xs flex justify-end">
            <button
              onClick={() => onEdit(entry)}
              className="text-green-700 hover:underline flex items-center gap-1"
              aria-label="Editar entrada del diario" // Mejorar accesibilidad
            >
              <Edit className="h-3 w-3" /> Editar
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};