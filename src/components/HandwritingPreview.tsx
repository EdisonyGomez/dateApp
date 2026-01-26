import React from 'react'

interface HandwritingPreviewProps {
  image: string
  onOpen: () => void
}

export const HandwritingPreview: React.FC<HandwritingPreviewProps> = ({
  image,
  onOpen
}) => {
  return (
    <div
      onClick={onOpen}
      className="cursor-pointer mx-auto max-w-[360px]"
    >
      <div className="bg-white border rounded-xl shadow-md overflow-hidden aspect-[3/4] hover:shadow-lg transition">
        <img
          src={image}
          alt="Handwritten diary"
          className="w-full h-full object-cover object-top"
        />
      </div>
      <p className="text-xs text-center mt-2 text-muted-foreground">
        Tap to open book
      </p>
    </div>
  )
}
