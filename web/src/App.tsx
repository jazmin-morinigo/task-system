import { Routes, Route } from 'react-router-dom'
import { AppHeader } from './components/AppHeader'
import { AppFooter } from './components/AppFooter'
import { TaskListPage } from './pages/TaskListPage'
import { TaskDetailPage } from './pages/TaskDetailPage'

export function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<TaskListPage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
        </Routes>
      </div>
      <AppFooter />
    </div>
  )
}
