import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SpeedControlProps {
  value: string
  onValueChange: (value: string) => void
}

export function SpeedControl({ value, onValueChange }: SpeedControlProps) {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">Speed</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-32 h-8 text-sm bg-white border-gray-200">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fast">Fast</SelectItem>
          <SelectItem value="balanced">Balanced</SelectItem>
          <SelectItem value="precise">Precise</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}