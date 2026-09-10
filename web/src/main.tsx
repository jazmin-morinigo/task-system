import { createRoot } from 'react-dom/client'
import './index.css'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'

// TEMPORAL: solo para verificar que shadcn/ui renderiza con los estilos de Tailwind v4
// aplicados. Se reemplaza por las páginas reales en la próxima tarea.
createRoot(document.getElementById('root')!).render(
  <Card>
    <CardHeader>
      <CardTitle>Task System</CardTitle>
    </CardHeader>
    <CardContent>
      <Button>Botón de prueba</Button>
    </CardContent>
  </Card>
)
