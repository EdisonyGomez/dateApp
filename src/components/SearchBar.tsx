// src/components/SearchBar.tsx
import React, { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string

  /** ✅ Control opcional desde el padre */
  value?: string
  onChange?: (value: string) => void
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Search entries...",
  value,
  onChange,
}) => {
  const [internalQuery, setInternalQuery] = useState("")
  const query = value ?? internalQuery

  useEffect(() => {
    // Si el padre controla, no necesitamos sincronizar nada extra.
    // Si no controla, usamos el estado interno.
  }, [value])

  const setQuery = (next: string) => {
    if (onChange) onChange(next)
    else setInternalQuery(next)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  const handleClear = () => {
    setQuery("")
    onSearch("")
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-pink-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 rounded-2xl border-pink-100 bg-white pl-11 pr-11 text-sm text-pink-800 shadow-sm transition-all duration-300 placeholder:text-pink-300 focus-visible:border-rose-300 focus-visible:ring-1 focus-visible:ring-rose-300"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full p-0 text-pink-400 hover:bg-pink-50 hover:text-rose-500"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  )
}
