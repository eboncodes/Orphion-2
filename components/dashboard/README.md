# Dashboard Components

This directory contains the modularized dashboard components for the Orphion AI application.

## Component Structure

### Core Layout Components

- **`DashboardLayout`** - Main layout wrapper that includes the sidebar and main content area
- **`MainContentArea`** - Container for the main content with proper sidebar spacing and transitions
- **`DashboardContentModular`** - Main content area including sidebar controls, overlay, and chat interface (modular version)

### Sidebar Components

- **`Sidebar`** - Main sidebar component with conversation management
- **`SidebarControls`** - Toggle and dock controls for the sidebar
- **`SidebarOverlay`** - Hover area for auto-closing the sidebar

### Chat Interface Components

- **`ChatInterface`** - Main chat interface that conditionally renders greeting or conversation UI
- **`ConversationUI`** - Full conversation interface with messages, header, and input area
- **`MessageBox`** - Legacy message box component (being phased out)
- **`Settings`** - Settings panel component

## Architecture Benefits

1. **Separation of Concerns** - Each component has a single responsibility
2. **Reusability** - Components can be easily reused in other parts of the application
3. **Maintainability** - Easier to debug and modify individual components
4. **Testability** - Components can be tested in isolation
5. **State Management** - Centralized state management through custom hooks

## Chat Interface Flow

The chat interface now has two distinct states:

1. **Initial Greeting State** - Shows when no messages exist:
   - Welcome message
   - Input box
   - Tool selection buttons
   - Example prompts

2. **Conversation State** - Shows when messages exist:
   - Conversation header with title and actions
   - Message history with scrollable area
   - Fixed input box at bottom
   - Auto-scroll to latest message

## State Management

The dashboard state is managed through the `useDashboardState` custom hook located in `@/hooks/useDashboardState`. This hook provides:

- Sidebar state (open/closed, docked/undocked)
- Conversation state (messages, current conversation, title)
- UI state (settings, favorites, chat key)
- All necessary event handlers

## Usage Example

```tsx
import { useDashboardState } from '@/hooks/useDashboardState'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import MainContentArea from '@/components/dashboard/MainContentArea'
import { DashboardContentModular } from '@/components/dashboard'

export default function DashboardPage() {
  const dashboardState = useDashboardState()
  
  return (
    <DashboardLayout {...dashboardState}>
      <MainContentArea {...dashboardState}>
        <DashboardContentModular {...dashboardState} />
      </MainContentArea>
    </DashboardLayout>
  )
}
```

## Component Dependencies

```
DashboardLayout
├── Sidebar
└── MainContentArea
    └── DashboardContentModular (modular)
        ├── SidebarOverlay
        ├── SidebarControls
        └── ChatInterface
            ├── ConversationUI (when messages exist)
            └── Initial Greeting (when no messages)
```

## Props Interface

Each component has a well-defined TypeScript interface that clearly specifies:
- Required and optional props
- Prop types and constraints
- Event handler signatures

This ensures type safety and makes the components easier to use correctly.

## Transition Logic

The `ChatInterface` component automatically switches between states:
- **No messages**: Shows greeting with tools and input
- **Has messages**: Shows full conversation interface with header and message history

This provides a seamless user experience without manual state management. 