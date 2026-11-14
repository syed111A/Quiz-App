import { useState } from 'react'
import './Quiz.css'
import { data } from '../../assets/data';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react'

const starterQuestions = data.map((item) => ({
  question: item.question,
  options: [item.option1, item.option2, item.option3, item.option4],
  correctIndex: item.ans - 1,
  explanation: 'Review this concept and connect it to what you have studied.',
}))

const Quiz = ({ questions = starterQuestions, title = 'Quick knowledge check', note, warning, onExit, onComplete }) => {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [complete, setComplete] = useState(false)

  if (!questions.length) {
    return (
      <section className="quiz-panel">
        <button className="text-button" onClick={onExit}><ArrowLeft size={17} /> Back</button>
        <h2>No questions available</h2>
        <p>Generate or choose a quiz with questions to get started.</p>
      </section>
    )
  }

  const question = questions[index]

  const advance = () => {
    if (selected === null) return
    const updatedScore = score + (selected === question.correctIndex ? 1 : 0)
    setScore(updatedScore)
    if (index === questions.length - 1) {
      setComplete(true)
      onComplete?.({ score: updatedScore, total: questions.length })
      return
    }
    setIndex(index + 1)
    setSelected(null)
  }

  if (complete) {
    const percent = Math.round((score / questions.length) * 100)
    return (
      <section className="quiz-panel quiz-result">
        <div className="result-icon"><Sparkles size={25} /></div>
        <p className="eyebrow">SESSION COMPLETE</p>
        <h1>Nice work. Keep it up.</h1>
        <p className="result-score">{score}<span> / {questions.length}</span></p>
        <p className="muted-copy">You answered {percent}% correctly. Your next practice will focus on what needs more attention.</p>
        <button className="primary-button" onClick={onExit}>Back to your learning plan <ArrowRight size={17} /></button>
      </section>
    )
  }

  return (
    <section className="quiz-panel">
      <button className="text-button" onClick={onExit}><ArrowLeft size={17} /> Exit practice</button>
      {warning && <p className="quiz-save-warning" role="alert">{warning}</p>}
      <div className="quiz-heading">
        <div>
          <p className="eyebrow">PRACTICE SESSION</p>
          <h1>{title}</h1>
        </div>
        {note && <p className="quiz-session-note">{note}</p>}
        <span className="question-count">{index + 1} of {questions.length}</span>
      </div>
      <div className="quiz-progress"><span style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>
      <p className="question-prompt">{question.question}</p>
      <div className="answer-list">
        {question.options.map((option, optionIndex) => {
          const answered = selected !== null
          const correct = optionIndex === question.correctIndex
          const className = answered && correct
            ? 'answer-option is-correct'
            : answered && selected === optionIndex
              ? 'answer-option is-incorrect'
              : selected === optionIndex
                ? 'answer-option is-selected'
                : 'answer-option'
          return (
            <button
              className={className}
              key={`${index}-${optionIndex}`}
              onClick={() => selected === null && setSelected(optionIndex)}
              disabled={answered}
            >
              <span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span>
              <span>{option}</span>
              {answered && correct && <Check size={18} className="answer-check" />}
            </button>
          )
        })}
      </div>
      {selected !== null && <div className="answer-explanation"><p>{question.explanation}</p>{question.sourcePages?.length > 0 && <span>Source pages: {question.sourcePages.join(', ')}</span>}</div>}
      <div className="quiz-footer">
        <span>{score} correct so far</span>
        <button className="primary-button" disabled={selected === null} onClick={advance}>
          {index === questions.length - 1 ? 'Finish quiz' : 'Next question'} <ArrowRight size={17} />
        </button>
      </div>
    </section>
  )
}

export default Quiz
