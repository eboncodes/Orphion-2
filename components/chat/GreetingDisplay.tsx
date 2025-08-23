interface GreetingDisplayProps {
  userName: string
  greeting: string
}

export function GreetingDisplay({ userName, greeting }: GreetingDisplayProps) {
  return (
    <div className="text-center space-y-4">
      <h1 className="text-4xl font-semibold text-gray-900">
        Hello {userName}
      </h1>
      <p className="text-xl text-gray-600">
        {greeting}
      </p>
    </div>
  )
}