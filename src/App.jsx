import { createElement, useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  FileUp,
  FileText,
  Flame,
  GraduationCap,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  Plus,
  Send,
  Search,
  Sparkles,
  Target,
  Trash2,
  X,
} from 'lucide-react'
import Quiz from './components/Quiz/Quiz'
import { data } from './assets/data'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import './index.css'

const navigation = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'practice', label: 'My learning', icon: BookOpen },
  { id: 'create', label: 'Create a quiz', icon: Sparkles, badge: 'AI' },
]

const workspaceNavigation = [
  { id: 'documents', label: 'Study materials', icon: FileText },
  { id: 'tutor', label: 'AI tutor', icon: MessageCircle },
  { id: 'progress', label: 'Progress', icon: Target },
]

const starterQuiz = data.map((item) => ({
  question: item.question,
  options: [item.option1, item.option2, item.option3, item.option4],
  correctIndex: item.ans - 1,
  explanation: 'Review this concept and connect it to what you have studied.',
}))

const sampleQuizzes = [
  { title: 'The foundations of computer science', subject: 'Computer science', questions: 12, score: 83, when: 'Today' },
  { title: 'Cell structure and function', subject: 'Biology', questions: 10, score: 70, when: 'Yesterday' },
  { title: 'Principles of algebra', subject: 'Mathematics', questions: 15, score: 92, when: 'Oct 22' },
]

const chartBars = [
  { day: 'M', value: 38 },
  { day: 'T', value: 58 },
  { day: 'W', value: 46 },
  { day: 'T', value: 78 },
  { day: 'F', value: 61 },
  { day: 'S', value: 92 },
  { day: 'S', value: 70 },
]

function AuthScreen({ onError, onNotice, message, notice }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    onError('')
    onNotice('')
    if (!isSupabaseConfigured) {
      onError('Account sign-in is not connected yet. Configure this app with its Supabase project.')
      return
    }
    setBusy(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        onError(error.message)
      } else {
        onNotice('')
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Sign-in failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-art">
        <div className="auth-art-brand"><span className="brand-mark"><GraduationCap size={20} /></span> lumen</div>
        <div className="auth-quote">
          <span className="eyebrow">YOUR SPACE TO GROW</span>
          <h1>Small steps.<br />Stronger understanding.</h1>
          <p>Make every study session count with learning that adapts to you.</p>
        </div>
        <div className="auth-art-footer"><span>Learn at your own pace</span><span>01 — 03</span></div>
      </div>
      <div className="auth-content">
        <div className="auth-form-wrap">
          <span className="auth-mobile-brand"><span className="brand-mark"><GraduationCap size={19} /></span> lumen</span>
          <span className="eyebrow">PRIVATE LEARNING SPACE</span>
          <h2>Welcome back</h2>
          <p className="muted-copy">Sign in with the existing account for this learning workspace.</p>
          {message && <div className="inline-error" role="alert">{message}</div>}
          {notice && <div className="inline-notice" role="status">{notice}</div>}
          {!isSupabaseConfigured && <div className="setup-notice auth-setup"><LockKeyhole size={17} /><span><strong>Accounts aren’t connected yet.</strong> Add your Supabase project settings to enable secure sign-in.</span></div>}
          <form onSubmit={submit} className="auth-form">
            <label>
              Email address
              <span className="input-icon"><Mail size={17} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></span>
            </label>
            <label>
              <span className="password-label">Password</span>
              <span className="input-icon"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required /><button type="button" className="password-visibility" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span>
            </label>
            <button className="primary-button auth-submit" disabled={busy || !isSupabaseConfigured}>{busy ? 'Please wait…' : 'Sign in'} <ArrowRight size={17} /></button>
          </form>
          <p className="auth-secure"><LockKeyhole size={13} /> Account creation and email-code recovery are disabled.</p>
          <p className="auth-secure"><LockKeyhole size={13} /> Your learning data stays private and secure.</p>
        </div>
      </div>
    </main>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const sessionUserId = session?.user?.id
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured)
  const [authError, setAuthError] = useState('')
  const [authNotice, setAuthNotice] = useState('')
  const [signingOut, setSigningOut] = useState(false)
  const [activeView, setActiveView] = useState('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [quizList, setQuizList] = useState(isSupabaseConfigured ? [] : sampleQuizzes)
  const [documents, setDocuments] = useState([])
  const [quizTitle, setQuizTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [difficulty, setDifficulty] = useState('Mixed')
  const [questionCount, setQuestionCount] = useState('10')
  const [generating, setGenerating] = useState(false)
  const [pageError, setPageError] = useState('')
  const [notice, setNotice] = useState('')
  const [savedAttempts, setSavedAttempts] = useState([])
  const [selectedDocumentId, setSelectedDocumentId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [tutorQuestion, setTutorQuestion] = useState('')
  const [tutorMessages, setTutorMessages] = useState([])
  const [tutorSending, setTutorSending] = useState(false)
  const [tutorDocumentId, setTutorDocumentId] = useState('')

  useEffect(() => {
    if (!supabase) return undefined

    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      if (error) setAuthError(error.message)
      setSession(currentSession)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
      setAuthLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!sessionUserId) {
      setPageError('')
      setNotice('')
      setQuizList(isSupabaseConfigured ? [] : sampleQuizzes)
      setDocuments([])
      setSavedAttempts([])
      setTutorMessages([])
      setActiveQuiz(null)
      setSelectedDocumentId('')
      setTutorDocumentId('')
      return
    }
    setQuizList([])
    setDocuments([])
    setSavedAttempts([])
    setTutorMessages([])
    let cancelled = false
    supabase
      .from('quizzes')
      .select('id,title,subject,difficulty,question_count,questions,created_at')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data: quizzes, error }) => {
        if (cancelled) return
        if (error) {
          setPageError(`Could not load your saved quizzes: ${error.message}`)
          return
        }
        if (quizzes?.length) {
          setQuizList(quizzes.map((quiz) => ({
            ...quiz,
            questionData: quiz.questions,
            questions: quiz.question_count,
            score: null,
            when: new Date(quiz.created_at).toLocaleDateString(),
          })))
        }
      })
    return () => { cancelled = true }
  }, [sessionUserId])

  useEffect(() => {
    if (!sessionUserId) return
    let cancelled = false
    supabase
      .from('study_documents')
      .select('id,title,file_name,page_count,status,error_message,storage_path,created_at')
      .order('created_at', { ascending: false })
      .then(({ data: rows, error }) => {
        if (cancelled) return
        if (error) {
          setPageError(`Could not load your study materials: ${error.message}`)
          return
        }
        setDocuments(rows || [])
      })
    return () => { cancelled = true }
  }, [sessionUserId])

  useEffect(() => {
    if (!sessionUserId) return
    let cancelled = false
    supabase
      .from('quiz_attempts')
      .select('score,total_questions')
      .order('completed_at', { ascending: false })
      .limit(100)
      .then(({ data: attempts, error }) => {
        if (cancelled) return
        if (error) {
          setPageError(`Could not load your learning progress: ${error.message}`)
          return
        }
        setSavedAttempts((attempts || []).map((attempt) => ({
          score: attempt.score,
          total: attempt.total_questions,
        })))
      })
    return () => { cancelled = true }
  }, [sessionUserId])

  const navigate = (view) => {
    setActiveView(view)
    setActiveQuiz(null)
    setPageError('')
    setNotice('')
    setMobileMenuOpen(false)
  }

  const generateQuiz = async (event) => {
    event.preventDefault()
    setPageError('')
    setNotice('')
    if (!session) {
      setPageError('Sign in with a connected Supabase project to generate and save an AI quiz.')
      return
    }
    setGenerating(true)
    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          subject,
          difficulty,
          questionCount: Number(questionCount),
          title: quizTitle,
          documentId: selectedDocumentId || null,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Quiz generation failed.')
      const quiz = {
        title: quizTitle.trim() || `${subject} practice`,
        subject,
        difficulty: result.difficulty || difficulty.toLowerCase(),
        isAdaptive: difficulty.toLowerCase() === 'adaptive',
        sourceDocumentId: selectedDocumentId || null,
        adaptiveNote: result.adaptiveNote,
        questions: result.questions,
      }
      const { data: savedQuiz, error } = await supabase
        .from('quizzes')
        .insert({
          title: quiz.title,
          subject: quiz.subject,
          user_id: session.user.id,
          difficulty: quiz.difficulty,
          is_adaptive: quiz.isAdaptive,
          source_document_id: quiz.sourceDocumentId,
          source: quiz.sourceDocumentId ? 'document' : 'ai',
          question_count: quiz.questions.length,
          questions: quiz.questions,
        })
        .select('id')
        .single()
      if (error) {
        quiz.saveWarning = `Quiz generated, but could not be saved: ${error.message}`
      } else {
        quiz.id = savedQuiz.id
        setQuizList((current) => [{ ...quiz, questionData: quiz.questions, questions: quiz.questions.length, score: null, when: 'Just now' }, ...current])
      }
      setActiveQuiz(quiz)
      setActiveView('practice')
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Quiz generation failed. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const completeQuiz = async ({ score, total }) => {
    setSavedAttempts((current) => [...current, { score, total }])
    if (activeQuiz?.id && session) {
      const { error } = await supabase.from('quiz_attempts').insert({
        user_id: session.user.id,
        quiz_id: activeQuiz.id,
        score,
        total_questions: total,
      })
      if (error) setPageError(`Your score could not be saved: ${error.message}`)
    }
  }

  const uploadDocument = async (file) => {
    setPageError('')
    setNotice('')
    if (!session) {
      setPageError('Connect Supabase and sign in before uploading study materials.')
      return
    }
    if (!(file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
      setPageError('Choose a PDF file.')
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      setPageError('PDFs must be 15 MB or smaller.')
      return
    }

    setUploading(true)
    let documentRecord = null
    let storagePath = ''
    let fileUploaded = false
    try {
      const [pdfjsLib, workerModule] = await Promise.all([
        import('pdfjs-dist'),
        import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
      ])
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise
      if (pdf.numPages > 300) throw new Error('PDFs are limited to 300 pages.')
      const pages = []
      let totalTextLength = 0
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber)
        const content = await page.getTextContent()
        const text = content.items.map((item) => ('str' in item ? item.str : '')).join(' ').trim()
        totalTextLength += text.length
        if (totalTextLength > 120000) throw new Error('This PDF contains too much text to index in one request. Split it into smaller files.')
        pages.push({ pageNumber, text })
      }
      if (!pages.some((page) => page.text.length > 0)) {
        throw new Error('No selectable text was found. Scanned PDFs need OCR, which is not supported yet.')
      }

      const documentId = crypto.randomUUID()
      const safeFileName = file.name.replace(/[^\w.-]+/g, '_')
      storagePath = `${session.user.id}/${documentId}/${safeFileName}`
      const { data: savedDocument, error: insertError } = await supabase
        .from('study_documents')
        .insert({
          id: documentId,
          user_id: session.user.id,
          title: file.name.replace(/\.pdf$/i, '').slice(0, 200) || 'Study material',
          file_name: file.name,
          storage_path: storagePath,
          page_count: pdf.numPages,
          status: 'uploaded',
        })
        .select('id,title,file_name,page_count,status,error_message,storage_path,created_at')
        .single()
      if (insertError) throw new Error(`Could not save this document: ${insertError.message}`)
      documentRecord = savedDocument
      setDocuments((current) => [savedDocument, ...current])

      const { error: uploadError } = await supabase.storage
        .from('study-materials')
        .upload(storagePath, file, { contentType: 'application/pdf', upsert: false })
      if (uploadError) throw new Error(`Could not upload this PDF: ${uploadError.message}`)
      fileUploaded = true
      const { error: statusError } = await supabase
        .from('study_documents')
        .update({ status: 'processing', error_message: null })
        .eq('id', documentId)
      if (statusError) throw new Error(`The PDF uploaded, but processing could not start: ${statusError.message}`)
      setDocuments((current) => current.map((item) => item.id === documentId ? { ...item, status: 'processing', error_message: null } : item))

      const response = await fetch('/api/index-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ documentId, pages }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Document indexing failed.')
      setDocuments((current) => current.map((item) => item.id === documentId ? { ...item, status: 'ready', error_message: null } : item))
      setNotice(`${file.name} is ready. ${result.chunkCount} searchable passages were created.`)
    } catch (error) {
      let message = error instanceof Error ? error.message : 'Document upload failed. Please try again.'
      if (documentRecord) {
        if (fileUploaded) {
          const { error: updateError } = await supabase
            .from('study_documents')
            .update({ status: 'failed', error_message: message.slice(0, 300) })
            .eq('id', documentRecord.id)
          if (updateError) message = `${message} Also could not update document status: ${updateError.message}`
          setDocuments((current) => current.map((item) => item.id === documentRecord.id ? { ...item, status: 'failed', error_message: message } : item))
        } else {
          const { error: deleteError } = await supabase.from('study_documents').delete().eq('id', documentRecord.id)
          if (deleteError) {
            message = `${message} The incomplete document record could not be removed: ${deleteError.message}`
            setDocuments((current) => [{ ...documentRecord, status: 'failed', error_message: message }, ...current.filter((item) => item.id !== documentRecord.id)])
          } else {
            setDocuments((current) => current.filter((item) => item.id !== documentRecord.id))
          }
        }
      }
      setPageError(message)
    } finally {
      setUploading(false)
    }
  }

  const deleteDocument = async (document) => {
    setPageError('')
    try {
      const { error: storageError } = await supabase.storage.from('study-materials').remove([document.storage_path])
      if (storageError) {
        setPageError(`Could not remove the PDF file: ${storageError.message}`)
        return
      }
      const { error } = await supabase.from('study_documents').delete().eq('id', document.id)
      if (error) {
        setPageError(`The PDF file was removed, but its document record could not be deleted: ${error.message}`)
        return
      }
      setDocuments((current) => current.filter((item) => item.id !== document.id))
      setNotice(`${document.file_name} was removed.`)
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Document removal failed.')
    }
  }

  const askTutor = async (event) => {
    event.preventDefault()
    const question = tutorQuestion.trim()
    if (!question || !session) return
    setTutorQuestion('')
    setTutorSending(true)
    setPageError('')
    setTutorMessages((current) => [...current, { role: 'user', text: question }])
    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ question, documentId: tutorDocumentId || null }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'The tutor could not answer.')
      setTutorMessages((current) => [...current, { role: 'assistant', text: result.answer, citations: result.citations }])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The tutor could not answer. Please try again.'
      setTutorMessages((current) => [...current, { role: 'assistant', text: message, isError: true }])
    } finally {
      setTutorSending(false)
    }
  }

  const signOut = async () => {
    setSigningOut(true)
    setPageError('')
    try {
      const { error } = await supabase.auth.signOut()
      if (error) setPageError(`Could not sign out: ${error.message}`)
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Could not sign out.')
    } finally {
      setSigningOut(false)
    }
  }

  if (authLoading) {
    return <main className="loading-screen"><span className="brand-mark"><GraduationCap size={20} /></span><span>Getting your learning space ready…</span></main>
  }

  if (!isSupabaseConfigured || !session) {
    return <AuthScreen onError={setAuthError} onNotice={setAuthNotice} message={authError} notice={authNotice} />
  }

  if (activeView === 'practice' && activeQuiz) {
    return (
      <main className="practice-page">
        {pageError && <div className="floating-error" role="alert">{pageError}<button onClick={() => setPageError('')} aria-label="Dismiss error"><X size={16} /></button></div>}
        <Quiz
          title={activeQuiz?.title || 'Quick knowledge check'}
          questions={activeQuiz?.questions || starterQuiz}
          note={activeQuiz?.adaptiveNote}
          warning={activeQuiz?.saveWarning}
          onExit={() => navigate('overview')}
          onComplete={completeQuiz}
        />
      </main>
    )
  }

  const name = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Alex'

  return (
    <div className="app-shell">
      {mobileMenuOpen && <button className="mobile-backdrop" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation" />}
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); navigate('overview') }}>
          <span className="brand-mark"><GraduationCap size={20} /></span><span>lumen</span>
        </a>
        <div className="workspace-switcher">
          <div className="workspace-avatar">L</div>
          <span><strong>Learning space</strong><small>Personal workspace</small></span>
          <ChevronDown size={16} />
        </div>
        <p className="nav-caption">MENU</p>
        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <button key={item.id} className={`nav-item ${activeView === item.id ? 'nav-active' : ''}`} onClick={() => navigate(item.id)}>
              <item.icon size={18} strokeWidth={1.8} /><span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>
        <p className="nav-caption workspace-caption">YOUR WORKSPACE</p>
        <nav className="side-nav" aria-label="Learning tools">
          {workspaceNavigation.map((item) => (
            <button key={item.id} className={`nav-item ${activeView === item.id ? 'nav-active' : ''}`} onClick={() => navigate(item.id)}>
              <item.icon size={18} strokeWidth={1.8} /><span>{item.label}</span>
              {item.soon && <span className="soon-dot" aria-label="Coming soon" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="weekly-goal">
            <div className="goal-icon"><Target size={17} /></div>
            <div className="goal-title"><strong>Weekly goal</strong><span>3 of 5 study days</span></div>
            <span className="goal-percent">60%</span>
            <div className="goal-track"><span /></div>
          </div>
          {session && <button className="nav-item signout-button" onClick={signOut}><LogOut size={17} /><span>Sign out</span></button>}
          <div className="profile-row">
            <div className="profile-avatar">{name.charAt(0).toUpperCase()}</div>
            <div className="profile-info"><strong>{name}</strong><span>{session ? 'Free plan' : 'Demo workspace'}</span></div>
            <button className="icon-button profile-menu" aria-label="Profile options"><ChevronDown size={16} /></button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu-button icon-button" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="breadcrumb"><span>Workspace</span><ChevronRight size={15} /><strong>{getPageTitle(activeView)}</strong></div>
          <div className="topbar-actions">
            <label className="search-box"><Search size={16} /><input placeholder="Search anything..." aria-label="Search" /><kbd>⌘ K</kbd></label>
            <button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button>
            <div className="topbar-avatar">{name.charAt(0).toUpperCase()}</div>
            {session
              ? <button className="topbar-auth-button" aria-label="Sign out" title="Sign out" onClick={signOut} disabled={signingOut}><LogOut size={15} />{signingOut ? 'Signing out…' : 'Sign out'}</button>
              : null}
          </div>
        </header>

        <div className="page-content">
          {!isSupabaseConfigured && (
            <div className="demo-banner">
              <span className="demo-banner-icon"><Sparkles size={16} /></span>
              <span><strong>Demo workspace</strong> — connect Supabase and Gemini to enable accounts, saved progress, and AI generation.</span>
              <a href="#setup" onClick={(event) => { event.preventDefault(); navigate('create') }}>Setup guide <ArrowUpRight size={14} /></a>
            </div>
          )}
          {pageError && <div className="inline-error page-alert" role="alert">{pageError}<button onClick={() => setPageError('')} aria-label="Dismiss error"><X size={16} /></button></div>}
          {notice && <div className="inline-notice page-alert" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss message"><X size={16} /></button></div>}
          {activeView === 'overview' && <Overview name={name} onNavigate={navigate} savedAttempts={savedAttempts} quizList={quizList} demoMode={!isSupabaseConfigured} />}
          {activeView === 'practice' && <PracticePage quizList={quizList} onStart={(quiz) => { setActiveQuiz(quiz); setActiveView('practice') }} />}
          {activeView === 'create' && (
            <CreateQuizPage
              subject={subject}
              setSubject={setSubject}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              questionCount={questionCount}
              setQuestionCount={setQuestionCount}
              quizTitle={quizTitle}
              setQuizTitle={setQuizTitle}
              documents={documents}
              selectedDocumentId={selectedDocumentId}
              setSelectedDocumentId={setSelectedDocumentId}
              generating={generating}
              onSubmit={generateQuiz}
              isConfigured={Boolean(session)}
            />
          )}
          {activeView === 'documents' && <DocumentsPage documents={documents} onUpload={uploadDocument} onDelete={deleteDocument} uploading={uploading} isConfigured={Boolean(session)} />}
          {activeView === 'tutor' && <TutorPage documents={documents} question={tutorQuestion} setQuestion={setTutorQuestion} messages={tutorMessages} sending={tutorSending} onSubmit={askTutor} selectedDocumentId={tutorDocumentId} setSelectedDocumentId={setTutorDocumentId} isConfigured={Boolean(session)} />}
          {activeView === 'progress' && <ProgressPage savedAttempts={savedAttempts} demoMode={!isSupabaseConfigured} />}
        </div>
      </main>
    </div>
  )
}

function getPageTitle(view) {
  return [...navigation, ...workspaceNavigation].find((item) => item.id === view)?.label || 'Overview'
}

function Overview({ name, onNavigate, savedAttempts, quizList, demoMode }) {
  const completed = savedAttempts.length
  const correct = savedAttempts.reduce((sum, attempt) => sum + attempt.score, 0)
  const total = savedAttempts.reduce((sum, attempt) => sum + attempt.total, 0)
  const accuracy = total ? Math.round((correct / total) * 100) : 78

  return (
    <>
      <section className="welcome-row">
        <div>
          <p className="eyebrow">{new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase()}</p>
          <h1>Good afternoon, {name}<span className="wave">✦</span></h1>
          <p className="muted-copy">A little progress each day adds up to big results.</p>
        </div>
        <button className="primary-button" onClick={() => onNavigate('create')}><Plus size={18} /> Create a quiz</button>
      </section>

      <section className="stats-grid" aria-label="Learning statistics">
        <StatCard icon={Flame} tone="peach" label="Day streak" value={demoMode ? '4 days' : '0 days'} delta={demoMode ? '+1 from last week' : 'Build your first streak'} />
        <StatCard icon={BookOpen} tone="lavender" label="Quizzes completed" value={completed ? String(completed) : demoMode ? '12' : '0'} delta={completed ? 'This session' : demoMode ? '+3 this week' : 'Start your first quiz'} />
        <StatCard icon={Target} tone="mint" label="Average accuracy" value={total ? `${accuracy}%` : demoMode ? '78%' : '—'} delta={total ? 'From your sessions' : demoMode ? '+8% this month' : 'Complete a quiz to begin'} />
        <StatCard icon={Clock3} tone="blue" label="Study time" value={demoMode ? '6.5 hrs' : '—'} delta={demoMode ? 'This week' : 'Progress tracking is next'} />
      </section>

      <div className="dashboard-grid">
        <section className="surface-card activity-card">
          <div className="section-heading">
            <div><h2>Your learning activity</h2><p>Keep showing up. It is working.</p></div>
            <button className="select-button">This week <ChevronDown size={15} /></button>
          </div>
          <div className="activity-summary"><strong>{demoMode ? '4h 35m' : '—'}</strong>{demoMode && <><span className="positive-change"><ArrowUpRight size={14} /> 12.8%</span><span className="summary-period">vs. last week</span></>}</div>
          {demoMode ? <div className="activity-chart" role="img" aria-label="Sample study activity by day of the week">
            {chartBars.map((bar, index) => (
              <div className="chart-column" key={`${bar.day}-${index}`}>
                <div className="chart-track"><span className={index === 5 ? 'chart-bar chart-bar-highlight' : 'chart-bar'} style={{ height: `${bar.value}%` }} /></div>
                <span className="chart-day">{bar.day}</span>
              </div>
            ))}
          </div> : <div className="empty-chart">Complete a quiz to start seeing your study activity here.</div>}
        </section>

        <section className="focus-card">
          <div className="focus-card-top"><span className="focus-icon"><Sparkles size={18} /></span><span className="focus-label">YOUR NEXT STEP</span></div>
          <h2>Make it a habit</h2>
          <p>You are one study session away from completing your weekly goal.</p>
          <div className="focus-progress"><div className="focus-progress-label"><span>Weekly study goal</span><strong>{demoMode ? '3 / 5 days' : '0 / 5 days'}</strong></div><div className="goal-track"><span style={{ width: demoMode ? '60%' : '0%' }} /></div></div>
          <button className="focus-link" onClick={() => onNavigate('practice')}>Start a 5-minute quiz <ArrowRight size={16} /></button>
          <div className="focus-decoration" aria-hidden="true">✳</div>
        </section>
      </div>

      <section className="surface-card recent-card">
        <div className="section-heading">
          <div><h2>Recently studied</h2><p>Your learning, all in one place.</p></div>
          <button className="subtle-link" onClick={() => onNavigate('practice')}>View all <ArrowRight size={15} /></button>
        </div>
        <div className="recent-list">
          {quizList.slice(0, 3).map((quiz, index) => (
            <div className="recent-row" key={`${quiz.title}-${index}`}>
              <div className={`recent-subject-icon subject-tone-${index % 3}`}><BookOpen size={18} /></div>
              <div className="recent-details"><strong>{quiz.title}</strong><span>{quiz.subject} <i /> {quiz.questions} questions</span></div>
              <span className="recent-when">{quiz.when}</span>
              <span className={`score-pill ${quiz.score === null ? 'score-new' : ''}`}>{quiz.score === null ? 'New' : `${quiz.score}%`}</span>
              <button className="icon-button row-arrow" onClick={() => onNavigate('practice')} aria-label={`Open ${quiz.title}`}><ChevronRight size={18} /></button>
            </div>
          ))}
          {!quizList.length && <p className="empty-list">Your saved quizzes will appear here after you create one.</p>}
        </div>
      </section>
      <p className="dashboard-footnote"><Check size={14} /> You are building a great learning habit. Keep going.</p>
    </>
  )
}

function StatCard({ icon, tone, label, value, delta }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}>{createElement(icon, { size: 18, strokeWidth: 1.9 })}</div>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <span className="stat-delta">{delta}</span>
    </article>
  )
}

function PracticePage({ quizList, onStart }) {
  return (
    <section className="content-page">
      <div className="page-title-row">
        <div><p className="eyebrow">YOUR LIBRARY</p><h1>My learning</h1><p className="muted-copy">Practice at your pace and build confidence one quiz at a time.</p></div>
        <button className="primary-button" onClick={() => onStart({ title: 'Quick knowledge check', questions: starterQuiz })}><BookOpen size={17} /> Quick practice</button>
      </div>
      <div className="surface-card library-card">
        <div className="library-toolbar"><strong>{quizList.length} quizzes</strong><button className="select-button">Recently added <ChevronDown size={15} /></button></div>
        {quizList.map((quiz, index) => (
          <button className="library-row" key={`${quiz.title}-${index}`} onClick={() => onStart({ id: quiz.id, title: quiz.title, questions: quiz.questionData || starterQuiz })}>
            <span className={`recent-subject-icon subject-tone-${index % 3}`}><BookOpen size={18} /></span>
            <span className="library-info"><strong>{quiz.title}</strong><span>{quiz.subject} · {quiz.questions} questions · {quiz.when}</span></span>
            <span className="library-score">{quiz.score === null ? 'Not started' : `${quiz.score}% accuracy`}</span>
            <ChevronRight size={18} className="row-arrow" />
          </button>
        ))}
      </div>
    </section>
  )
}

function CreateQuizPage({ subject, setSubject, difficulty, setDifficulty, questionCount, setQuestionCount, quizTitle, setQuizTitle, documents, selectedDocumentId, setSelectedDocumentId, generating, onSubmit, isConfigured }) {
  return (
    <section className="content-page create-page">
      <div className="page-title-row">
        <div><p className="eyebrow">PERSONALIZED PRACTICE</p><h1>Build your next quiz</h1><p className="muted-copy">Choose what you are learning. Gemini will shape a quiz around your goals.</p></div>
        <div className="ai-orb"><Sparkles size={23} /></div>
      </div>
      <div className="create-layout">
        <form className="surface-card create-form" onSubmit={onSubmit}>
          <div className="form-section-title"><span>01</span><div><h2>What are you studying?</h2><p>Be specific for more focused questions.</p></div></div>
          <label className="field-label">Topic or subject
            <input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="e.g. Photosynthesis, World War II, derivatives" required minLength={2} maxLength={120} />
          </label>
          <label className="field-label">Quiz title <span className="optional-label">Optional</span>
            <input value={quizTitle} onChange={(event) => setQuizTitle(event.target.value)} placeholder="Give this study session a name" maxLength={100} />
          </label>
          <label className="field-label">Use study material <span className="optional-label">Optional</span>
            <select value={selectedDocumentId} onChange={(event) => setSelectedDocumentId(event.target.value)}>
              <option value="">General knowledge</option>
              {documents.filter((document) => document.status === 'ready').map((document) => <option key={document.id} value={document.id}>{document.title}</option>)}
            </select>
          </label>
          {selectedDocumentId && <p className="source-hint"><FileText size={14} /> Questions will be grounded in the selected PDF, with page references.</p>}
          <div className="form-divider" />
          <div className="form-section-title"><span>02</span><div><h2>Set your challenge</h2><p>We will meet you where you are.</p></div></div>
          <fieldset className="choice-fieldset">
            <legend>Difficulty</legend>
            <div className="segmented-control">
              {['Easy', 'Mixed', 'Advanced', 'Adaptive'].map((level) => <button type="button" className={difficulty === level ? 'segment-selected' : ''} key={level} onClick={() => setDifficulty(level)}>{level}</button>)}
            </div>
          </fieldset>
          {difficulty === 'Adaptive' && <p className="source-hint"><Target size={14} /> Difficulty will adjust to your recent results for this topic.</p>}
          <label className="field-label">Number of questions
            <select value={questionCount} onChange={(event) => setQuestionCount(event.target.value)}>
              <option value="5">5 questions · quick review</option>
              <option value="10">10 questions · focused session</option>
              <option value="15">15 questions · deep practice</option>
            </select>
          </label>
          <div className="form-divider" />
          {!isConfigured && <div className="setup-notice"><LockKeyhole size={17} /><span><strong>AI generation is not connected yet.</strong> Add Supabase and server-side Gemini environment variables to sign in and enable secure quiz generation.</span></div>}
          <button type="submit" className="primary-button generate-button" disabled={generating}>
            {generating ? <span className="spinner" /> : <Sparkles size={17} />}
            {generating ? 'Creating your quiz…' : 'Generate my quiz'} {!generating && <ArrowRight size={17} />}
          </button>
          <p className="form-footnote"><LockKeyhole size={13} /> Your quiz is private to your account.</p>
        </form>
        <aside className="create-aside">
          <div className="aside-tip">
            <span className="tip-icon"><Sparkles size={17} /></span>
            <p className="eyebrow">A LITTLE TIP</p>
            <h3>Specific topics make better quizzes.</h3>
            <p>Try naming a chapter, concept, or learning objective instead of a broad subject.</p>
            <div className="tip-example"><span>Try</span> “The stages of cellular respiration”</div>
          </div>
          <div className="aside-note"><Clock3 size={17} /><div><strong>Made for your pace</strong><span>Choose a short check-in or go deeper with a longer quiz.</span></div></div>
        </aside>
      </div>
    </section>
  )
}

function DocumentsPage({ documents, onUpload, onDelete, uploading, isConfigured }) {
  const fileChanged = (event) => {
    const [file] = event.target.files || []
    if (file) onUpload(file)
    event.target.value = ''
  }
  const readyCount = documents.filter((document) => document.status === 'ready').length

  return (
    <section className="content-page">
      <div className="page-title-row">
        <div><p className="eyebrow">YOUR PRIVATE LIBRARY</p><h1>Study materials</h1><p className="muted-copy">Turn your PDFs into searchable, source-grounded study material.</p></div>
        <span className="period-chip"><Check size={14} /> {readyCount} ready</span>
      </div>
      {!isConfigured && <div className="setup-notice document-setup"><LockKeyhole size={17} /><span><strong>Connect Supabase to upload materials.</strong> Files are stored privately and indexed only for your account.</span></div>}
      <div className={`upload-zone ${!isConfigured ? 'upload-disabled' : ''}`}>
        <input id="study-pdf" type="file" accept="application/pdf,.pdf" onChange={fileChanged} disabled={!isConfigured || uploading} />
        <label htmlFor="study-pdf">
          <span className="upload-icon">{uploading ? <span className="spinner spinner-purple" /> : <FileUp size={22} />}</span>
          <strong>{uploading ? 'Processing your PDF…' : 'Upload a study material'}</strong>
          <span>Choose a PDF or <b>browse files</b></span>
          <small>PDF only · Up to 15 MB · Text-based PDFs (scanned pages need OCR)</small>
        </label>
      </div>
      <section className="surface-card documents-card">
        <div className="section-heading"><div><h2>Your materials</h2><p>Only you can access your uploaded files and extracted text.</p></div></div>
        {documents.length ? documents.map((document) => (
          <article className="document-row" key={document.id}>
            <span className="document-icon"><FileText size={19} /></span>
            <div className="document-info"><strong>{document.title}</strong><span>{document.file_name} · {document.page_count} {document.page_count === 1 ? 'page' : 'pages'}</span>{document.error_message && <small>{document.error_message}</small>}</div>
            <span className={`document-status status-${document.status}`}>{document.status === 'ready' && <Check size={13} />}{document.status === 'failed' && <AlertCircle size={13} />}{document.status === 'processing' && <span className="mini-spinner" />}{document.status}</span>
            <button className="icon-button delete-document" onClick={() => onDelete(document)} aria-label={`Delete ${document.file_name}`}><Trash2 size={16} /></button>
          </article>
        )) : <p className="empty-list">No study materials yet. Upload a PDF to create document-grounded quizzes and tutor answers.</p>}
      </section>
    </section>
  )
}

function TutorPage({ documents, question, setQuestion, messages, sending, onSubmit, selectedDocumentId, setSelectedDocumentId, isConfigured }) {
  const readyDocuments = documents.filter((document) => document.status === 'ready')
  return (
    <section className="content-page tutor-page">
      <div className="page-title-row">
        <div><p className="eyebrow">PERSONAL STUDY PARTNER</p><h1>AI tutor</h1><p className="muted-copy">Ask questions and get step-by-step explanations grounded in your materials.</p></div>
        <span className="tutor-badge"><Sparkles size={14} /> Gemini</span>
      </div>
      {!isConfigured && <div className="setup-notice document-setup"><LockKeyhole size={17} /><span><strong>Connect Supabase and configure Gemini.</strong> Tutor requests are authenticated and answered server-side.</span></div>}
      <div className="surface-card tutor-card">
        <div className="tutor-toolbar">
          <div className="tutor-identity"><span className="tutor-avatar"><MessageCircle size={17} /></span><div><strong>Your AI tutor</strong><span>Grounded answers with source references</span></div></div>
          <label className="tutor-source">Answer from
            <select value={selectedDocumentId} onChange={(event) => setSelectedDocumentId(event.target.value)} disabled={!isConfigured}>
              <option value="">All my materials</option>
              {readyDocuments.map((document) => <option key={document.id} value={document.id}>{document.title}</option>)}
            </select>
          </label>
        </div>
        <div className="tutor-conversation" aria-live="polite">
          {!messages.length && <div className="tutor-welcome"><span className="tutor-avatar"><Sparkles size={18} /></span><strong>What are you working through?</strong><p>Ask a question, request an explanation, or explore a tricky concept. Select a PDF above for answers with page citations.</p><div className="suggestion-chips"><button onClick={() => setQuestion('Can you explain the main idea in simple terms?')}>Explain a concept simply</button><button onClick={() => setQuestion('What should I focus on when studying this topic?')}>Help me study</button></div></div>}
          {messages.map((message, index) => (
            <div className={`chat-message message-${message.role} ${message.isError ? 'message-error' : ''}`} key={`${message.role}-${index}`}>
              <span className="message-avatar">{message.role === 'user' ? 'You' : <Sparkles size={14} />}</span>
              <div className="message-content"><strong>{message.role === 'user' ? 'You' : 'Lumen tutor'}</strong><p>{message.text}</p>
                {message.citations?.length > 0 && <div className="citation-list"><span>Sources</span>{message.citations.map((citation) => <span className="citation-chip" key={`${citation.documentId}-${citation.pageNumber}`}><FileText size={12} /> {citation.title} · p. {citation.pageNumber}</span>)}</div>}
              </div>
            </div>
          ))}
          {sending && <div className="chat-message message-assistant"><span className="message-avatar"><Sparkles size={14} /></span><div className="message-content"><strong>Lumen tutor</strong><p className="thinking"><span /><span /><span /></p></div></div>}
        </div>
        <form className="tutor-compose" onSubmit={onSubmit}>
          <textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={isConfigured ? 'Ask your tutor anything…' : 'Connect your learning account to start a tutor session'} maxLength={1500} disabled={!isConfigured || sending} rows={2} />
          <div className="compose-footer"><span>{selectedDocumentId ? 'Answers will focus on your selected PDF.' : 'Answers can use any ready study material.'}</span><button className="primary-button" disabled={!isConfigured || sending || question.trim().length < 2}><Send size={15} /> Send</button></div>
        </form>
      </div>
    </section>
  )
}

function ProgressPage({ savedAttempts, demoMode }) {
  const totalQuestions = savedAttempts.reduce((sum, item) => sum + item.total, 0)
  const correctAnswers = savedAttempts.reduce((sum, item) => sum + item.score, 0)
  return (
    <section className="content-page">
      <div className="page-title-row"><div><p className="eyebrow">YOUR LEARNING JOURNEY</p><h1>Progress</h1><p className="muted-copy">See how your understanding grows over time.</p></div><span className="period-chip">Last 30 days <ChevronDown size={15} /></span></div>
      <div className="stats-grid progress-stats">
        <StatCard icon={Target} tone="mint" label="Questions answered" value={totalQuestions || (demoMode ? '128' : '0')} delta="Across all subjects" />
        <StatCard icon={Check} tone="lavender" label="Correct answers" value={correctAnswers || (demoMode ? '101' : '0')} delta="Keep up the momentum" />
        <StatCard icon={Flame} tone="peach" label="Current streak" value={demoMode ? '4 days' : '0 days'} delta={demoMode ? 'Your best is 9 days' : 'Start a streak with a quiz'} />
      </div>
      <div className="progress-columns">
        <div className="surface-card mastery-card"><div className="section-heading"><div><h2>Topic mastery</h2><p>Topics to revisit rise to the top.</p></div></div>
          {(demoMode ? [['Biology', 'Cell structure', 42], ['Mathematics', 'Quadratic equations', 64], ['Computer science', 'Data structures', 78], ['History', 'Early civilizations', 91]] : []).map(([group, topic, value]) => (
            <div className="mastery-row" key={topic}><div className="mastery-copy"><span>{group}</span><strong>{topic}</strong></div><div className="mastery-track"><span style={{ width: `${value}%` }} /></div><strong className="mastery-value">{value}%</strong></div>
          ))}
          {!demoMode && <p className="empty-list">Topic insights will appear after you complete more study sessions.</p>}
        </div>
        <div className="surface-card insight-card"><span className="insight-icon"><Sparkles size={18} /></span><p className="eyebrow">{demoMode ? 'A PATTERN WE NOTICED' : 'PERSONAL INSIGHTS'}</p><h2>{demoMode ? "You're getting stronger." : 'Your insights are on their way.'}</h2><p>{demoMode ? 'Your accuracy in Computer science has improved over your last three practice sessions.' : 'Complete a few quizzes to see your strengths and areas to revisit.'}</p>{demoMode && <span className="insight-growth"><ArrowUpRight size={15} /> +14% this month</span>}</div>
      </div>
    </section>
  )
}

export default App
