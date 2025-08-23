import { Button } from '@/components/ui/button'
import { 
  Image, 
  Presentation, 
  Globe, 
  Sheet, 
  BarChart3, 
  MoreHorizontal 
} from 'lucide-react'

const actionItems = [
  { icon: Image, label: 'Image', color: 'text-blue-600' },
  { icon: Presentation, label: 'Slides', color: 'text-green-600' },
  { icon: Globe, label: 'Webpage', color: 'text-purple-600' },
  { icon: Sheet, label: 'Spreadsheet', color: 'text-orange-600' },
  { icon: BarChart3, label: 'Visualization', color: 'text-red-600' },
  { icon: MoreHorizontal, label: 'More', color: 'text-gray-600' }
]

export function ActionButtons() {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {actionItems.map((item) => (
        <Button
          key={item.label}
          variant="outline"
          className="h-12 px-6 bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
        >
          <item.icon className={`h-5 w-5 mr-2 ${item.color}`} />
          <span className="text-gray-700">{item.label}</span>
        </Button>
      ))}
    </div>
  )
}