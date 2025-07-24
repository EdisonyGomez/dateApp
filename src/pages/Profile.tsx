import { AvatarUploader } from '@/components/AvatarUploader'

export default function ProfilePage() {
  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Tu perfil</h1>
      <AvatarUploader />
    </div>
  )
}
