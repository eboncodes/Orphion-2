import { Button } from '@/components/ui/button'
import { 
  Paperclip, 
  Camera, 
  Mail, 
  MessageCircle 
} from 'lucide-react'

export function InputControls() {
  return (
    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
      >
        <Paperclip className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
      >
        <Camera className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
      >
        <Mail className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
      >
        <MessageCircle className="h-4 w-4" />
      </Button>
    </div>
  )
}