"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/AuthProvider"
import { toast } from "sonner"
import { Heart } from "lucide-react"

export const AuthForm: React.FC = () => {
  const { signIn, signUp } = useAuth()
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    name: "",
  })
  const [loading, setLoading] = useState(false)

  /* ───────────── login ───────────── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(loginData.email, loginData.password)
      toast.success("¡Bienvenido de nuevo, mi amor!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fallo al iniciar sesión. Por favor, inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  /* ───────────── register ───────────── */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signUp(registerData.email, registerData.password, registerData.name)
      toast.success("¡Cuenta creada con éxito! Bienvenido a tu diario.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fallo al registrarse. Por favor, inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  /* ───────────── UI ───────────── */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <Card className="w-full max-w-md rounded-xl shadow-2xl shadow-pink-200/50 border border-pink-100 transition-all duration-500 ease-in-out">
        {" "}
        {/* Transición para la tarjeta */}
        <CardHeader className="text-center space-y-4">
          <div className="flex flex-col items-center justify-center">
            <Heart className="h-10 w-10 text-pink-500 mb-2 animate-pulse" />
            <CardTitle className="text-3xl font-extrabold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent text-center leading-tight">
              Diario de Pareja entre Melo y Yesi
            </CardTitle>
          </div>
          <CardDescription className="text-lg text-gray-600 font-medium">
            Comparte tus momentos diarios, sueños y amor con tu pareja.
          </CardDescription>
        </CardHeader>
        <Tabs defaultValue="login" className="w-full px-6">
          <TabsList className="grid w-full grid-cols-2 rounded-full bg-pink-100/50 p-1 mb-6 shadow-inner">
            <TabsTrigger
              value="login"
              className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 ease-in-out"
            >
              {" "}
              {/* Transición para el trigger de la pestaña */}
              Iniciar Sesión
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 ease-in-out"
            >
              {" "}
              {/* Transición para el trigger de la pestaña */}
              Registrarse
            </TabsTrigger>
          </TabsList>
          {/* ───────────── Login Tab ───────────── */}
          <TabsContent value="login" className="transition-all duration-500 ease-in-out">
            {" "}
            {/* Transición para el contenido de la pestaña */}
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-semibold">
                    Correo Electrónico
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 transition-all duration-300 ease-in-out" // Transición para el input
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-semibold">
                    Contraseña
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 transition-all duration-300 ease-in-out" // Transición para el input
                  />
                </div>
              </CardContent>
              <CardFooter className="pt-6">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                  disabled={loading}
                >
                  {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          {/* ───────────── Register Tab ───────────── */}
          <TabsContent value="register" className="transition-all duration-500 ease-in-out">
            {" "}
            {/* Transición para el contenido de la pestaña */}
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700 font-semibold">
                    Nombre
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Tu nombre"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    required
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 transition-all duration-300 ease-in-out" // Transición para el input
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-gray-700 font-semibold">
                    Correo Electrónico
                  </Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={registerData.email}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        email: e.target.value,
                      })
                    }
                    required
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 transition-all duration-300 ease-in-out" // Transición para el input
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-gray-700 font-semibold">
                    Contraseña
                  </Label>
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerData.password}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        password: e.target.value,
                      })
                    }
                    required
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400 transition-all duration-300 ease-in-out" // Transición para el input
                  />
                </div>
              </CardContent>
              <CardFooter className="pt-6">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                  disabled={loading}
                >
                  {loading ? "Creando cuenta..." : "Crear Cuenta"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
