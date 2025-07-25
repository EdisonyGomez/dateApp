"use client"
import type React from "react"
import { useEffect, useState } from "react"
import { DialogDescription, DialogClose } from "@/components/ui/dialog" // Importamos DialogClose

import { useNavigate } from "react-router-dom"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { UserAvatar } from "@/components/UserAvatar"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import {
    Heart,
    Calendar,
    Smile,
    Edit,
    Save,
    X,
    Loader2,
    User,
    Handshake,
    Briefcase,
    Languages,
    ChefHat,
    Palette,
    Headphones,
    Clapperboard,
} from "lucide-react" // Más íconos para cada campo

interface ProfileModalProps {
    userId: string
    fallbackColor?: string
    isCurrentUser?: boolean
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ userId, fallbackColor, isCurrentUser = false }) => {
    const [profile, setProfile] = useState<any>(null)
    const [editing, setEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true)
            const { data, error } = await supabase
                .from("profiles")
                .select(
                    `
          id,
          name,
          avatar_url,
          birthday,
          meet_date,
          chinese_day,
          languages,
          profession,
          favorite_foods,
          hobbies,
          favorite_music,
          favorite_songs,
          favorite_movies
        `,
                )
                .eq("id", userId)
                .single()
            if (!error) setProfile(data)
            setLoading(false)
        }
        if (userId) fetchProfile()
    }, [userId])

    const handleSave = async () => {
        setLoading(true)
        const { error } = await supabase.from("profiles").update(profile).eq("id", userId)
        setLoading(false)
        if (error) {
            toast.error("Error al guardar los cambios. Por favor, inténtalo de nuevo.")
        } else {
            toast.success("¡Perfil actualizado con éxito!")
            setEditing(false) // Volver al modo de vista después de guardar
        }
    }

    const updateField = (field: string, value: any) => {
        setProfile((prev: any) => ({ ...prev, [field]: value }))
    }

    // Función para renderizar un campo en modo vista
    const renderViewField = (icon: React.ElementType, label: string, value: string | string[] | undefined) => {
        if (!value || (Array.isArray(value) && value.length === 0)) return null
        const IconComponent = icon
        return (
            <div className="flex items-start gap-3 p-2 rounded-md hover:bg-pink-50 transition-colors duration-200">
                <IconComponent className="h-5 w-5 text-pink-500 flex-shrink-0 mt-1" />
                <div>
                    <p className="font-semibold text-gray-800">{label}:</p>
                    {Array.isArray(value) ? (
                        <p className="text-gray-600">{value.join(", ")}</p>
                    ) : (
                        <p className="text-gray-600">{value}</p>
                    )}
                </div>
            </div>
        )
    }

    // Función para renderizar un campo de entrada en modo edición
    const renderEditInput = (
        id: string,
        label: string,
        type: string,
        value: string,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
        placeholder: string,
    ) => (
        <div className="space-y-2">
            <Label htmlFor={id} className="text-gray-700 font-semibold">
                {label}
            </Label>
            <Input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="input-field-style"
            />
        </div>
    )

    // Función para renderizar un campo de textarea en modo edición
    const renderEditTextarea = (
        id: string,
        label: string,
        value: string,
        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void,
        placeholder: string,
    ) => (
        <div className="space-y-2">
            <Label htmlFor={id} className="text-gray-700 font-semibold">
                {label}
            </Label>
            <Textarea
                id={id}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="input-field-style min-h-[60px]"
            />
        </div>
    )

    if (loading || !profile) {
        return (
            <Dialog>
                <DialogTrigger asChild>
                    <span className="cursor-pointer inline-flex transition-transform duration-200 hover:scale-105">
                        <UserAvatar name="Cargando" size="xl" fallbackColor={fallbackColor} />
                    </span>
                </DialogTrigger>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl shadow-2xl shadow-pink-200/50 border border-pink-100 animate-fade-in">
                    <div className="flex flex-col items-center justify-center p-8">
                        <Loader2 className="h-12 w-12 text-pink-500 mb-4 animate-spin" />
                        <p className="text-lg text-gray-700 font-medium">Cargando perfil...</p>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <span className="cursor-pointer inline-flex transition-transform duration-200 hover:scale-105">
                    <UserAvatar name={profile.name} avatarUrl={profile.avatar_url} size="xl" fallbackColor={fallbackColor} />
                </span>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl shadow-2xl shadow-pink-200/50 border border-pink-100 animate-fade-in p-6">
                <DialogHeader className="text-center space-y-3 pb-4 border-b border-pink-100">
                    <div className="flex flex-col items-center justify-center">
                        <Heart className="h-8 w-8 text-pink-500 mb-2 animate-pulse" />
                        <DialogTitle className="text-4xl font-extrabold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                            {editing ? "Editar Perfil" : profile.name || "Perfil de Usuario"}
                        </DialogTitle>
                        <DialogDescription className="text-base text-gray-600 font-medium mt-2">
                            {editing ? "Actualiza los detalles de tu historia." : "Descubre los detalles de esta hermosa historia."}
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Avatar en el modal - Ahora más grande */}
                    <div className="flex justify-center py-2">
                        <div className="w-24 h-24">
                            <UserAvatar
                                name={profile.name}
                                avatarUrl={profile.avatar_url}
                                size="4xl"
                                fallbackColor={fallbackColor}
                            />
                        </div>
                    </div>

                    {editing ? (
                        // Modo Edición
                        <div className="space-y-8">
                            {/* Sección: Información Personal */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <User className="h-5 w-5 text-purple-500" /> Detalles Personales
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {renderEditInput(
                                        "modal-name",
                                        "Nombre",
                                        "text",
                                        profile.name || "",
                                        (e) => updateField("name", e.target.value),
                                        "Tu nombre",
                                    )}
                                    {renderEditInput(
                                        "modal-birthday",
                                        "Cumpleaños",
                                        "date",
                                        profile.birthday || "",
                                        (e) => updateField("birthday", e.target.value),
                                        "Fecha de nacimiento",
                                    )}
                                    {renderEditInput(
                                        "modal-meet_date",
                                        "Día que se conocieron",
                                        "date",
                                        profile.meet_date || "",
                                        (e) => updateField("meet_date", e.target.value),
                                        "Fecha de encuentro",
                                    )}
                                    {renderEditInput(
                                        "modal-chinese_day",
                                        "Día Chino",
                                        "text",
                                        profile.chinese_day || "",
                                        (e) => updateField("chinese_day", e.target.value),
                                        "Ej: 2024-01-01",
                                    )}
                                    <div className="sm:col-span-2">
                                        {renderEditInput(
                                            "modal-profession",
                                            "Profesión",
                                            "text",
                                            profile.profession || "",
                                            (e) => updateField("profession", e.target.value),
                                            "Tu profesión",
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Sección: Gustos e Intereses */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <Smile className="h-5 w-5 text-pink-500" /> Tus Gustos y Pasatiempos
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {renderEditTextarea(
                                        "modal-languages",
                                        "Idiomas (separados por coma)",
                                        profile.languages?.join(", ") || "",
                                        (e) =>
                                            updateField(
                                                "languages",
                                                e.target.value.split(",").map((s) => s.trim()),
                                            ),
                                        "Ej: Español, Inglés",
                                    )}
                                    {renderEditTextarea(
                                        "modal-favorite_foods",
                                        "Comidas favoritas (separadas por coma)",
                                        profile.favorite_foods?.join(", ") || "",
                                        (e) =>
                                            updateField(
                                                "favorite_foods",
                                                e.target.value.split(",").map((s) => s.trim()),
                                            ),
                                        "Ej: Pizza, Sushi, Tacos",
                                    )}
                                    <div className="sm:col-span-2">
                                        {renderEditTextarea(
                                            "modal-hobbies",
                                            "Pasatiempos (separados por coma)",
                                            profile.hobbies?.join(", ") || "",
                                            (e) =>
                                                updateField(
                                                    "hobbies",
                                                    e.target.value.split(",").map((s) => s.trim()),
                                                ),
                                            "Ej: Leer, Caminar, Cocinar",
                                        )}
                                    </div>
                                    {renderEditInput(
                                        "modal-favorite_music",
                                        "Género musical favorito",
                                        "text",
                                        profile.favorite_music || "",
                                        (e) => updateField("favorite_music", e.target.value),
                                        "Ej: Pop, Rock",
                                    )}
                                    {renderEditTextarea(
                                        "modal-favorite_songs",
                                        "Canciones favoritas (separadas por coma)",
                                        profile.favorite_songs?.join(", ") || "",
                                        (e) =>
                                            updateField(
                                                "favorite_songs",
                                                e.target.value.split(",").map((s) => s.trim()),
                                            ),
                                        "Ej: Song A, Song B, Song C",
                                    )}
                                    <div className="sm:col-span-2">
                                        {renderEditTextarea(
                                            "modal-favorite_movies",
                                            "Películas favoritas (separadas por coma)",
                                            profile.favorite_movies?.join(", ") || "",
                                            (e) =>
                                                updateField(
                                                    "favorite_movies",
                                                    e.target.value.split(",").map((s) => s.trim()),
                                                ),
                                            "Ej: Movie X, Movie Y, Movie Z",
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Botones de acción para edición */}
                            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setEditing(false)}
                                    className="button-outline-style transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-md"
                                >
                                    <X className="h-4 w-4 mr-2" /> Cancelar
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-2 px-4 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" /> Guardar
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        // Modo Vista
                        <div className="space-y-6 text-base text-gray-700">
                            {/* Sección: Información Personal */}
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-3">
                                    <User className="h-5 w-5 text-purple-500" /> Detalles Personales
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {renderViewField(Calendar, "Cumpleaños", profile.birthday)}
                                    {renderViewField(Handshake, "Se conocieron", profile.meet_date)}
                                    {renderViewField(Calendar, "Día Chino", profile.chinese_day)}
                                    {renderViewField(Briefcase, "Profesión", profile.profession)}
                                </div>
                            </div>

                            {/* Sección: Gustos e Intereses */}
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-3">
                                    <Smile className="h-5 w-5 text-pink-500" /> Tus Gustos y Pasatiempos
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {renderViewField(Languages, "Idiomas", profile.languages)}
                                    {renderViewField(ChefHat, "Comidas Favoritas", profile.favorite_foods)}
                                    {renderViewField(Palette, "Pasatiempos", profile.hobbies)}
                                    {renderViewField(Headphones, "Género Musical Favorito", profile.favorite_music)}
                                    {renderViewField(Headphones, "Canciones Favoritas", profile.favorite_songs)}
                                    {renderViewField(Clapperboard, "Películas Favoritas", profile.favorite_movies)}
                                </div>
                            </div>

                            {/* Botones de acción para vista */}
                            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                                {isCurrentUser && ( // Solo mostrar si es el perfil del usuario actual
                                    <DialogClose asChild>
                                        <Button
                                            variant="outline"
                                            onClick={() => navigate("/edit-profile")} // Navega a la página de edición completa
                                            className="button-outline-style transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-md"
                                        >
                                            <Edit className="h-4 w-4 mr-2" /> Editar Perfil Completo
                                        </Button>
                                    </DialogClose>
                                )}
                                {isCurrentUser && (
                                    <Button
                                        onClick={() => setEditing(true)} // Entra en modo edición dentro del modal
                                        className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-2 px-4 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                                    >
                                        <Edit className="h-4 w-4 mr-2" /> Edición Rápida
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
