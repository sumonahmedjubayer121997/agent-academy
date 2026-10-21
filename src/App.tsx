import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom'
import Navbar from './components/Navbar'
import { ProgressProvider } from './store/progress'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Roadmap from './pages/Roadmap'
import ModuleDetail from './pages/ModuleDetail'
import Curriculum from './pages/Curriculum'
import LessonPage from './pages/Lesson'
import Projects from './pages/Projects'
import Playground from './pages/Playground'
import Resources from './pages/Resources'
import Assessment from './pages/Assessment'
import Planner from './pages/Planner'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="text-4xl font-semibold tracking-tight">Page not found</p>
      <p className="mt-2 text-ink-soft">
        <Link to="/" className="text-accent hover:underline">
          Back to the landing page
        </Link>
      </p>
    </div>
  )
}

function Footer() {
  return (
    <footer className="mt-20 border-t border-line py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 text-sm text-ink-faint sm:flex-row">
        <p>Agent Academy — a personal learning companion, built as part of the journey it maps.</p>
        <p>Progress is stored locally in your browser. No accounts, no fake statistics.</p>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ProgressProvider>
        <ScrollToTop />
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/roadmap" element={<Roadmap />} />
              <Route path="/roadmap/:moduleId" element={<ModuleDetail />} />
              <Route path="/curriculum" element={<Curriculum />} />
              <Route path="/learn/:lessonId" element={<LessonPage />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/playground" element={<Playground />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/assess" element={<Assessment />} />
              <Route path="/planner" element={<Planner />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </ProgressProvider>
    </BrowserRouter>
  )
}
