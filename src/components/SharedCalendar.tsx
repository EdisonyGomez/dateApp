"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthProvider"
import { toast } from "sonner"
import {
  Calendar,
  Plus,
  CalendarDays,
  Clock,
  MapPin,
  Save,
  ChevronLeft,
  ChevronRight,
  Heart,
  Star,
  Sparkles,
  X,
  Users,
  User,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Plan {
  id: string
  title: string
  description: string
  date: string
  time: string
  location?: string
  created_by: string
  created_by_name?: string // Nombre del creador del plan
  plan_type: "individual" | "together" // Nuevo campo para el tipo de plan
  created_at: string
}

export const SharedCalendar: React.FC = () => {
  const { user, partner } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [showAddPlan, setShowAddPlan] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(false)
  const [newPlan, setNewPlan] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    plan_type: "individual" as "individual" | "together", // Valor por defecto
  })

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    setLoading(true)
    // Seleccionamos el nombre del creador del plan usando un join implícito
    const { data, error } = await supabase
      .from("shared_plans")
      .select(`*, profiles(name)`) // Selecciona todos los campos de shared_plans y el nombre del perfil relacionado
      .order("date", { ascending: true })

    if (!error && data) {
      const fetchedPlans: Plan[] = data.map((plan: any) => ({
        ...plan,
        created_by_name: plan.profiles?.name || "Desconocido", // Asigna el nombre del creador
      }))
      setPlans(fetchedPlans)
    }
    setLoading(false)
  }

  const handleAddPlan = async () => {
    if (!newPlan.title || !newPlan.date || !newPlan.time) {
      toast.error("Por favor completa al menos el título, fecha y hora")
      return
    }

    if (!user) {
      toast.error("Debes estar autenticado para crear planes")
      return
    }

    const { error } = await supabase.from("shared_plans").insert([
      {
        ...newPlan,
        created_by: user.id,
      },
    ])

    if (error) {
      toast.error("Error al crear el plan")
      console.error("Error creating plan:", error)
    } else {
      toast.success("¡Plan creado exitosamente!")
      setNewPlan({ title: "", description: "", date: "", time: "", location: "", plan_type: "individual" })
      setShowAddPlan(false)
      fetchPlans()
    }
  }

  const handleDeletePlan = async (planId: string) => {
    const { error } = await supabase.from("shared_plans").delete().eq("id", planId)

    if (error) {
      toast.error("Error al eliminar el plan")
    } else {
      toast.success("Plan eliminado exitosamente")
      fetchPlans()
    }
  }

  const renderCalendarView = () => {
    const today = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
    const daysInMonth = lastDayOfMonth.getDate()
    const startingDayOfWeek = firstDayOfMonth.getDay()

    const days = []

    // Días vacíos al inicio
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-24"></div>)
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const dayPlans = plans.filter((plan) => plan.date === dateStr)
      const isToday =
        today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear

      days.push(
        <div
          key={day}
          className={`h-24 p-2 border border-pink-100 rounded-lg transition-all duration-300 hover:bg-pink-50 ${
            isToday ? "bg-gradient-to-br from-pink-200 to-rose-200 border-pink-300" : "bg-white"
          }`}
        >
          <div className={`text-sm font-semibold mb-1 ${isToday ? "text-pink-800" : "text-gray-700"}`}>{day}</div>
          <div className="space-y-1">
            {dayPlans.slice(0, 2).map((plan, index) => (
              <div
                key={plan.id}
                className="text-xs bg-gradient-to-r from-pink-400 to-rose-400 text-white px-2 py-1 rounded-full truncate cursor-pointer hover:from-pink-500 hover:to-rose-500 transition-all duration-200"
                title={`${plan.title} - ${plan.time}`}
                onClick={() => {
                  toast.info(`${plan.title} - ${plan.time}${plan.location ? ` en ${plan.location}` : ""}`)
                }}
              >
                {plan.title}
              </div>
            ))}
            {dayPlans.length > 2 && <div className="text-xs text-pink-600 font-medium">+{dayPlans.length - 2} más</div>}
          </div>
        </div>,
      )
    }

    return (
      <div className="space-y-6">
        {/* Header del calendario */}
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarDays className="h-7 w-7 text-pink-500" />
            {currentDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))}
              className="border-pink-300 text-pink-700 hover:bg-pink-50 rounded-xl"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="border-pink-300 text-pink-700 hover:bg-pink-50 rounded-xl px-4"
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))}
              className="border-pink-300 text-pink-700 hover:bg-pink-50 rounded-xl"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Botón para añadir plan */}
        <Button
          onClick={() => setShowAddPlan(true)}
          className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-2xl py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
        >
          <Plus className="h-5 w-5 mr-2" />
          Añadir Nuevo Plan
        </Button>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
            <div key={day} className="text-center font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendario */}
        <div className="grid grid-cols-7 gap-2">{days}</div>

        {/* Lista de próximos planes */}
        <div className="mt-8">
          <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="h-6 w-6 text-pink-500" />
            Próximos Planes
          </h4>
          <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
            {plans
              .filter((plan) => new Date(plan.date) >= new Date())
              .map((plan) => (
                <div
                  key={plan.id}
                  className="bg-gradient-to-r from-white to-pink-50 p-4 rounded-xl border border-pink-200 shadow-sm hover:shadow-md transition-all duration-300 group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-800 mb-1">{plan.title}</h5>
                      {plan.description && <p className="text-sm text-gray-600 mb-2">{plan.description}</p>}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(plan.date).toLocaleDateString("es-ES")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {plan.time}
                        </span>
                        {plan.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {plan.location}
                          </span>
                        )}
                      </div>
                      {/* Mostrar el tipo de plan y los nombres */}
                      <div className="mt-2 flex items-center gap-2 text-xs font-medium text-pink-600">
                        {plan.plan_type === "individual" ? (
                          <>
                            <User className="h-3 w-3" />
                            <span>{plan.created_by_name} (Individual)</span>
                          </>
                        ) : (
                          <>
                            <Users className="h-3 w-3" />
                            <span>
                              {plan.created_by_name} & {partner?.name || "Tu pareja"} (Juntos)
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {user && plan.created_by === user.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePlan(plan.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            {plans.filter((plan) => new Date(plan.date) >= new Date()).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CalendarDays className="h-12 w-12 mx-auto mb-3 text-pink-300" />
                <p>No hay planes próximos. ¡Añade uno nuevo!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderAddPlanForm = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Plus className="h-7 w-7 text-pink-500" />
            Nuevo Plan
          </h3>
          <Button
            variant="outline"
            onClick={() => setShowAddPlan(false)}
            className="border-pink-300 text-pink-700 hover:bg-pink-50 rounded-xl"
          >
            Cancelar
          </Button>
        </div>

        <div className="bg-gradient-to-br from-white to-pink-50 p-6 rounded-2xl border border-pink-200 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Título del Plan *</label>
            <Input
              value={newPlan.title}
              onChange={(e) => setNewPlan((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Ej: Cena romántica, Paseo por el parque..."
              className="border-pink-300 focus:border-pink-500 focus:ring-pink-500 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
            <Textarea
              value={newPlan.description}
              onChange={(e) => setNewPlan((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe los detalles del plan..."
              className="border-pink-300 focus:border-pink-500 focus:ring-pink-500 min-h-[80px] rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha *</label>
              <Input
                type="date"
                value={newPlan.date}
                onChange={(e) => setNewPlan((prev) => ({ ...prev, date: e.target.value }))}
                className="border-pink-300 focus:border-pink-500 focus:ring-pink-500 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Hora *</label>
              <Input
                type="time"
                value={newPlan.time}
                onChange={(e) => setNewPlan((prev) => ({ ...prev, time: e.target.value }))}
                className="border-pink-300 focus:border-pink-500 focus:ring-pink-500 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ubicación</label>
            <Input
              value={newPlan.location}
              onChange={(e) => setNewPlan((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="Ej: Restaurante XYZ, Casa, Parque Central..."
              className="border-pink-300 focus:border-pink-500 focus:ring-pink-500 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Plan</label>
            <Select
              value={newPlan.plan_type}
              onValueChange={(value: "individual" | "together") =>
                setNewPlan((prev) => ({ ...prev, plan_type: value }))
              }
            >
              <SelectTrigger className="w-full border-pink-300 focus:border-pink-500 focus:ring-pink-500 rounded-xl">
                <SelectValue placeholder="Selecciona el tipo de plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="together">Juntos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleAddPlan}
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-2xl py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <Save className="h-5 w-5 mr-2" />
            {loading ? "Guardando..." : "Guardar Plan"}
          </Button>
        </div>
      </div>
    )
  }

  // Componente de partículas de fondo
  const ParticleBackground = () => {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        {[...Array(8)].map((_, i) => (
          <Heart
            key={`heart-${i}`}
            className="absolute text-pink-300/40 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 15 + 10}px`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          />
        ))}
        {[...Array(6)].map((_, i) => (
          <Star
            key={`star-${i}`}
            className="absolute text-yellow-300/30 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 12 + 8}px`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${Math.random() * 2 + 1}s`,
            }}
          />
        ))}
        {[...Array(10)].map((_, i) => (
          <Sparkles
            key={`sparkle-${i}`}
            className="absolute text-pink-400/30 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 14 + 10}px`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${Math.random() * 4 + 2}s`,
            }}
          />
        ))}
      </div>
    )
  }

  if (loading && plans.length === 0) {
    return (
      <Card className="p-8 rounded-3xl shadow-xl border border-pink-100 bg-white/80 backdrop-blur-sm relative overflow-hidden">
        <ParticleBackground />
        <CardContent className="p-0 relative z-10">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <CalendarDays className="h-16 w-16 text-pink-500 animate-pulse" />
              <div className="absolute inset-0 h-16 w-16 rounded-full bg-pink-500 opacity-20 animate-ping"></div>
            </div>
            <p className="text-xl text-gray-700 font-semibold mt-6">Cargando calendario...</p>
            <div className="flex space-x-1 mt-4">
              <Heart className="w-4 h-4 text-pink-500 animate-bounce" />
              <Heart className="w-4 h-4 text-pink-500 animate-bounce" style={{ animationDelay: "0.2s" }} />
              <Heart className="w-4 h-4 text-pink-500 animate-bounce" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="p-8 rounded-3xl shadow-xl border border-pink-100 bg-white/80 backdrop-blur-sm relative overflow-hidden">
      <ParticleBackground />
      <CardContent className="p-0 relative z-10">
        {showAddPlan ? renderAddPlanForm() : renderCalendarView()}
      </CardContent>
    </Card>
  )
}
