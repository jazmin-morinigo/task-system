import { Routes, Route } from 'react-router-dom'
import { AppHeader } from './components/AppHeader'
import { TaskListPage } from './pages/TaskListPage'
import { TaskDetailPage } from './pages/TaskDetailPage'

export function App() {
  return (
    <>
      <AppHeader />
      <Routes>
        <Route path="/" element={<TaskListPage />} />
        <Route path="/tasks/:id" element={<TaskDetailPage />} />
      </Routes>
    </>
  )
}
