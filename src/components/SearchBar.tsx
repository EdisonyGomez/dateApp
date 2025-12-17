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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  )
}
