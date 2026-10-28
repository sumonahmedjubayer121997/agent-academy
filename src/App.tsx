import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Link, Navigate, useParams } from 'react-router-dom'
import Navbar from './components/Navbar'
import { ProgressProvider } from './store/progress'
import { ActiveRoadmapProvider } from './store/activeRoadmap'
import { usePageMeta } from './hooks/usePageMeta'
import { showOnboardingAgain } from './components/Onboarding'
import { BUNDLES } from './content/roadmaps/registry'
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
import Review from './pages/Review'
import Journal from './pages/Journal'
import Roadmaps, { RoadmapDetail } from './pages/Roadmaps'
import BrainDump from './pages/BrainDump'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

function NotFound() {
  usePageMeta('Page not found')
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

/** Resolve which registered bundle owns a module id (defaults to ai-agents). */
function slugForModule(moduleId?: string): string {
  if (!moduleId) return 'ai-agents'
  for (const [slug, bundle] of Object.entries(BUNDLES)) {
    if (bundle.MODULES.some((m) => m.id === moduleId)) return slug
  }
  return 'ai-agents'
}

/** Resolve which registered bundle owns a lesson id (defaults to ai-agents). */
function slugForLesson(lessonId?: string): string {
  if (!lessonId) return 'ai-agents'
  for (const [slug, bundle] of Object.entries(BUNDLES)) {
    if ((bundle.LESSONS ?? []).some((l) => l.id === lessonId)) return slug
  }
  return 'ai-agents'
}

/** /m/:moduleId resolves the roadmap from the id — shared links self-heal. */
function ModuleShortLink() {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  useEffect(() => {
    navigate(`/r/${slugForModule(moduleId)}/roadmap/${moduleId}`, { replace: true })
  }, [moduleId, navigate])
  return null
}

function Footer() {
  return (
    <footer className="mt-20 border-t border-line py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 text-sm text-ink-faint sm:flex-row">
        <p>Agent Academy — a personal learning companion, built as part of the journey it maps.</p>
        <p>
          Progress is stored locally in your browser. No accounts, no fake statistics.{' '}
          <button
            onClick={() => {
              showOnboardingAgain()
              window.location.hash = ''
              window.location.href = '/'
            }}
            className="text-accent hover:underline"
          >
            New here?
          </button>
        </p>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ActiveRoadmapProvider>
        <ProgressProvider>
          <ScrollToTop />
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="mx-auto w-full max-w-6xl flex-1 px-4">
              <Routes>
                {/* Global routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/roadmaps" element={<Roadmaps />} />
                <Route path="/roadmaps/:slug" element={<RoadmapDetail />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/braindump" element={<BrainDump />} />
                <Route path="/journal" element={<Journal />} />
                <Route path="/playground" element={<Playground />} />
                <Route path="/resources" element={<Resources />} />

                {/* Canonical per-roadmap workspace */}
                <Route path="/r/:slug/curriculum" element={<Curriculum />} />
                <Route path="/r/:slug/roadmap" element={<Roadmap />} />
                <Route path="/r/:slug/roadmap/:moduleId" element={<ModuleDetail />} />
                <Route path="/r/:slug/learn/:lessonId" element={<LessonPage />} />
                <Route path="/r/:slug/review" element={<Review />} />
                <Route path="/r/:slug/projects" element={<Projects />} />
                <Route path="/r/:slug/planner" element={<Planner />} />
                <Route path="/r/:slug/assess" element={<Assessment />} />

                {/* Self-healing short links */}
                <Route path="/m/:moduleId" element={<ModuleShortLink />} />
                <Route path="/l/:lessonId" element={<LessonShortLink />} />

                {/* Legacy paths redirect to the canonical tree (AI Agents is the first roadmap) */}
                <Route path="/curriculum" element={<Navigate replace to="/r/ai-agents/curriculum" />} />
                <Route path="/roadmap" element={<Navigate replace to="/r/ai-agents/roadmap" />} />
                <Route path="/roadmap/:moduleId" element={<LegacyModuleRedirect />} />
                <Route path="/learn/:lessonId" element={<LegacyLessonRedirect />} />
                <Route path="/projects" element={<Navigate replace to="/r/ai-agents/projects" />} />
                <Route path="/review" element={<Navigate replace to="/r/ai-agents/review" />} />
                <Route path="/assess" element={<Navigate replace to="/r/ai-agents/assess" />} />
                <Route path="/planner" element={<Navigate replace to="/r/ai-agents/planner" />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </ProgressProvider>
      </ActiveRoadmapProvider>
    </BrowserRouter>
  )
}

/** /l/:lessonId — self-healing lesson short link. */
function LessonShortLink() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  useEffect(() => {
    navigate(`/r/${slugForLesson(lessonId)}/learn/${lessonId}`, { replace: true })
  }, [lessonId, navigate])
  return null
}

/** Legacy deep links self-heal: the roadmap is resolved from the id, not pinned. */
function LegacyModuleRedirect() {
  const { moduleId } = useParams()
  return <Navigate replace to={`/r/${slugForModule(moduleId)}/roadmap/${moduleId ?? ''}`} />
}

function LegacyLessonRedirect() {
  const { lessonId } = useParams()
  return <Navigate replace to={`/r/${slugForLesson(lessonId)}/learn/${lessonId ?? ''}`} />
}
