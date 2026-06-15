import React, { useState, useEffect, useRef } from 'react'
import LoadingScreen from '../components/LoadingScreen.jsx'
import { Trophy, Play, RotateCcw, ArrowRight, Check, X, ShieldAlert, Heart, Calendar } from 'lucide-react'

// Reusable audio beep player
const playSound = (type, soundEnabled) => {
  if (!soundEnabled) return
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === 'success') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      osc.start()
      osc.stop(ctx.currentTime + 0.08)
    } else if (type === 'failure') {
      osc.frequency.setValueAtTime(150, ctx.currentTime)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      osc.start()
      osc.stop(ctx.currentTime + 0.25)
    }
  } catch (e) {
    console.warn('Audio play failed', e)
  }
}

// Thai month translation helper
const getThaiMonth = (month) => {
  const months = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ]
  return months[month - 1] || ''
}

const formatBirthdayTh = (birthdayStr) => {
  if (!birthdayStr || !birthdayStr.includes('/')) return 'ไม่มีข้อมูล'
  const [m, d] = birthdayStr.split('/').map(Number)
  return `${d} ${getThaiMonth(m)}`
}

// Get school gradient styling for card backgrounds
const getSchoolGradient = (school) => {
  if (!school) return 'linear-gradient(135deg, #1f2937, #111827)'
  const s = school.toLowerCase()
  if (s.includes('gehenna')) return 'linear-gradient(135deg, #3c0c16, #1f050a)'
  if (s.includes('millennium')) return 'linear-gradient(135deg, #0b2545, #031024)'
  if (s.includes('trinity')) return 'linear-gradient(135deg, #44371c, #261f0f)'
  if (s.includes('abydos')) return 'linear-gradient(135deg, #0e3f42, #051d20)'
  if (s.includes('hyakkiyako')) return 'linear-gradient(135deg, #2b132e, #160818)'
  if (s.includes('shanhaijing')) return 'linear-gradient(135deg, #09301e, #04180f)'
  if (s.includes('redwinter')) return 'linear-gradient(135deg, #232d38, #10161d)'
  if (s.includes('srt')) return 'linear-gradient(135deg, #1a2530, #0c1218)'
  if (s.includes('arius')) return 'linear-gradient(135deg, #1c1c22, #0e0e11)'
  if (s.includes('valkyrie')) return 'linear-gradient(135deg, #131d33, #080d19)'
  if (s.includes('tokiwadai')) return 'linear-gradient(135deg, #4c3c23, #292011)'
  return 'linear-gradient(135deg, #1f2937, #111827)'
}

export default function AgeGuesser({ soundEnabled, onBack, setCustomBackAction }) {
  const [allStudents, setAllStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [fadeLoading, setFadeLoading] = useState(true)

  // Game Play States
  const [leftStudent, setLeftStudent] = useState(null)
  const [rightStudent, setRightStudent] = useState(null)
  const [revealedAge, setRevealedAge] = useState(null) // Ticker state for right student age
  const [revealedBirthday, setRevealedBirthday] = useState(false)
  const [isRevealing, setIsRevealing] = useState(false)
  const [guessResult, setGuessResult] = useState(null) // 'correct' or 'incorrect'
  const [userChoice, setUserChoice] = useState(null) // 'older' (พี่) or 'younger' (น้อง)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('ba_age_high_score') || '0', 10)
  })
  const [gameOver, setGameOver] = useState(false)

  // Register custom back action so navbar back button works
  useEffect(() => {
    if (setCustomBackAction) {
      setCustomBackAction(() => onBack)
    }
    return () => {
      if (setCustomBackAction) setCustomBackAction(null)
    }
  }, [setCustomBackAction, onBack])

  // Load characters on mount
  useEffect(() => {
    async function loadData() {
      const startTime = Date.now()
      try {
        const res = await fetch('/jp_data/story_characters_info.json')
        const data = await res.json()
        const studentsList = []

        for (const key in data) {
          const char = data[key]
          const ageVal = parseInt(char.Age)
          
          // Filter students (TemplateType === 'Character') with valid age and birthday
          if (
            (char.TemplateType === 'Character' || !char.TemplateType) &&
            char.Name &&
            char.NameEn &&
            !isNaN(ageVal) &&
            ageVal > 0 &&
            char.Birthday &&
            char.Birthday.includes('/')
          ) {
            const [m, d] = char.Birthday.split('/').map(Number)

            let portraitPath = char.PortraitLocalPath 
              ? char.PortraitLocalPath.replace(/^\.\//, '/') 
              : `/images/story_characters/portraits/${key.replace(/\s+/g, '_')}.png`

            let iconPath = char.IconLocalPath 
              ? char.IconLocalPath.replace(/^\.\//, '/') 
              : null

            studentsList.push({
              key,
              name: char.Name,
              nameEn: char.NameEn,
              nameJp: char.NameJp || char.Name,
              school: char.School || 'Other',
              schoolTh: char.SchoolTh || char.School || 'อื่นๆ',
              club: char.ClubTh || char.Club || 'ไม่มีสังกัด',
              age: ageVal,
              birthday: char.Birthday,
              birthMonth: m,
              birthDay: d,
              portraitPath,
              iconPath
            })
          }
        }

        setAllStudents(studentsList)

        if (studentsList.length >= 2) {
          setupNewPair(studentsList, null, null)
        }

        const elapsed = Date.now() - startTime
        const delay = Math.max(0, 400 - elapsed)
        setTimeout(() => {
          setFadeLoading(false)
          setTimeout(() => {
            setLoading(false)
          }, 300)
        }, delay)
      } catch (err) {
        console.error('Failed to load story characters:', err)
        setFadeLoading(false)
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Setup a new pair of students
  const setupNewPair = (list, prevRight = null, currentScore = null) => {
    const pool = list.length > 0 ? list : allStudents
    if (pool.length < 2) return

    let left = prevRight
    if (!left) {
      left = pool[Math.floor(Math.random() * pool.length)]
    }

    // Filter potential challenger (Right) to have a different age + birthday combo
    const availablePool = pool.filter(s => 
      s.key !== left.key && 
      !(s.age === left.age && s.birthMonth === left.birthMonth && s.birthDay === left.birthDay)
    )

    if (availablePool.length === 0) {
      const fallback = pool.find(s => s.key !== left.key)
      setLeftStudent(left)
      setRightStudent(fallback)
      return
    }

    const right = availablePool[Math.floor(Math.random() * availablePool.length)]
    setLeftStudent(left)
    setRightStudent(right)
    setRevealedAge(null)
    setRevealedBirthday(false)
    setIsRevealing(false)
    setGuessResult(null)
    setUserChoice(null)
    if (currentScore !== null) {
      setScore(currentScore)
    }
  }

  // Check seniority: B is older (พี่) compared to A
  const isOlder = (a, b) => {
    if (b.age !== a.age) {
      return b.age > a.age
    }
    if (b.birthMonth !== a.birthMonth) {
      return b.birthMonth < a.birthMonth // Born earlier in the year = older
    }
    return b.birthDay < a.birthDay
  }

  // Handle user guess
  const handleGuess = (choice) => {
    if (isRevealing || gameOver || !leftStudent || !rightStudent) return

    setIsRevealing(true)
    setUserChoice(choice)

    const isChallengerOlder = isOlder(leftStudent, rightStudent)
    const isCorrect = (choice === 'older' && isChallengerOlder) || (choice === 'younger' && !isChallengerOlder)

    // Quick ticker for age
    const startVal = 10
    const endVal = rightStudent.age
    const duration = 400 // 0.4s
    const steps = 16
    const stepTime = duration / steps
    let currentStep = 0

    const ticker = setInterval(() => {
      currentStep++
      const progress = currentStep / steps
      const currentAge = Math.round(startVal + (endVal - startVal) * progress)
      setRevealedAge(currentAge)

      if (currentStep >= steps) {
        clearInterval(ticker)
        setRevealedAge(endVal)
        setRevealedBirthday(true)
        
        // Show correct/incorrect feedback
        if (isCorrect) {
          setGuessResult('correct')
          playSound('success', soundEnabled)
          const newScore = score + 1
          if (newScore > highScore) {
            setHighScore(newScore)
            localStorage.setItem('ba_age_high_score', newScore.toString())
          }
          setTimeout(() => {
            setupNewPair(allStudents, rightStudent, newScore)
          }, 1500)
        } else {
          setGuessResult('incorrect')
          playSound('failure', soundEnabled)
          setTimeout(() => {
            setGameOver(true)
          }, 1200)
        }
      }
    }, stepTime)
  }

  const handleRestart = () => {
    setGameOver(false)
    setScore(0)
    setupNewPair(allStudents, null, 0)
  }

  if (loading) {
    return <LoadingScreen fadeOut={!fadeLoading} />
  }

  return (
    <div className="age-game-layout">
      {/* Header Info */}
      <div className="age-game-header">
        <div className="age-mode-info">
          <h2>พี่หรือน้อง? (Sibling Compare)</h2>
          <p>ทายว่านักเรียนทางขวาเป็น **พี่ (แก่กว่า)** หรือ **น้อง (เด็กกว่า)** นักเรียนทางซ้าย?</p>
          <div className="age-rule-tip">
            💡 *หากอายุเท่ากัน คนที่เกิดต้นปีมากกว่า (เกิดก่อน) จะถือว่าเป็นพี่*
          </div>
        </div>
        <div className="age-stats-bar">
          <div className="stat-badge streak">
            <span className="stat-label">STREAK CURRENT</span>
            <span className="stat-value text-accent">{score}</span>
          </div>
          <div className="stat-badge best">
            <Trophy className="w-4 h-4 text-gold" />
            <span className="stat-label">BEST STREAK</span>
            <span className="stat-value text-gold">{highScore}</span>
          </div>
        </div>
      </div>

      {/* Main Game Screen */}
      <div className="age-comparison-wrapper">
        
        {/* Left Student Card: Known Info */}
        {leftStudent && (
          <div className="age-student-card left-card" style={{ backgroundImage: getSchoolGradient(leftStudent.school) }}>
            <div className="card-school-badge">
              <span className="school-tag">{leftStudent.schoolTh}</span>
            </div>
            
            <div className="card-portrait-wrapper">
              <img 
                src={leftStudent.portraitPath} 
                alt={leftStudent.nameEn}
                className="student-portrait-img"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = leftStudent.iconPath || '/images/schoolicon/ETC.png'
                }}
              />
            </div>

            <div className="card-student-info">
              <h3 className="student-name-en">{leftStudent.nameEn}</h3>
              <p className="student-club-th">{leftStudent.club}</p>
              
              <div className="age-value-box">
                <span className="age-num">{leftStudent.age}</span>
                <span className="age-unit">ปี</span>
              </div>
              <div className="birth-value-box">
                <Calendar className="w-3.5 h-3.5 text-muted" />
                <span>เกิด {formatBirthdayTh(leftStudent.birthday)}</span>
              </div>
            </div>
          </div>
        )}

        {/* VS Badge */}
        <div className="age-vs-badge">
          <span>VS</span>
        </div>

        {/* Right Student Card: Guess Info */}
        {rightStudent && (
          <div className="age-student-card right-card" style={{ backgroundImage: getSchoolGradient(rightStudent.school) }}>
            <div className="card-school-badge">
              <span className="school-tag">{rightStudent.schoolTh}</span>
            </div>
            
            <div className="card-portrait-wrapper">
              <img 
                src={rightStudent.portraitPath} 
                alt={rightStudent.nameEn}
                className="student-portrait-img"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = rightStudent.iconPath || '/images/schoolicon/ETC.png'
                }}
              />
            </div>

            <div className="card-student-info">
              <h3 className="student-name-en">{rightStudent.nameEn}</h3>
              <p className="student-club-th">{rightStudent.club}</p>
              
              <div className="age-value-box">
                <span className={`age-num ${revealedAge !== null ? 'revealed' : 'masked'}`}>
                  {revealedAge !== null ? revealedAge : '?'}
                </span>
                <span className="age-unit">ปี</span>
              </div>
              <div className="birth-value-box">
                <Calendar className="w-3.5 h-3.5 text-muted" />
                <span className={revealedBirthday ? 'revealed' : 'masked'}>
                  {revealedBirthday ? `เกิด ${formatBirthdayTh(rightStudent.birthday)}` : 'เกิด ?/?'}
                </span>
              </div>
            </div>

            {/* Success/Failure Overlay */}
            {guessResult && (
              <div className={`age-reveal-overlay ${guessResult}`}>
                {guessResult === 'correct' ? (
                  <div className="feedback-content animate-bounce-in">
                    <div className="feedback-icon success">
                      <Check className="w-12 h-12 text-white" />
                    </div>
                    <span>ถูกต้อง! (+1)</span>
                  </div>
                ) : (
                  <div className="feedback-content animate-bounce-in">
                    <div className="feedback-icon failure">
                      <X className="w-12 h-12 text-white" />
                    </div>
                    <span>ผิดพลาด!</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control Buttons */}
      {!gameOver && (
        <div className="age-guess-controls">
          <button 
            onClick={() => handleGuess('older')}
            disabled={isRevealing}
            className={`age-guess-btn older ${userChoice === 'older' ? 'selected' : ''}`}
          >
            <span>พี่ (Older)</span>
          </button>

          <button 
            onClick={() => handleGuess('younger')}
            disabled={isRevealing}
            className={`age-guess-btn younger ${userChoice === 'younger' ? 'selected' : ''}`}
          >
            <span>น้อง (Younger)</span>
          </button>
        </div>
      )}

      {/* Game Over Screen */}
      {gameOver && (
        <div className="age-gameover-overlay">
          <div className="age-gameover-card">
            <div className="gameover-warning-icon">
              <ShieldAlert className="w-16 h-16 text-rose-500" />
            </div>
            <h2>สิ้นสุดการท้าทาย!</h2>
            <p>อายุจริงของ <strong>{rightStudent?.nameEn}</strong> คือ <strong>{rightStudent?.age} ปี</strong> (เกิด {rightStudent && formatBirthdayTh(rightStudent.birthday)})</p>
            
            <div className="gameover-stats-summary">
              <div className="summary-stat-box">
                <span className="label">ความยาวสตรีค</span>
                <span className="value text-accent">{score}</span>
              </div>
              <div className="summary-stat-box">
                <span className="label">สตรีคที่ดีที่สุด</span>
                <span className="value text-gold">{highScore}</span>
              </div>
            </div>

            <button onClick={handleRestart} className="age-restart-btn">
              <RotateCcw className="w-4 h-4" />
              <span>เล่นใหม่อีกครั้ง</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
