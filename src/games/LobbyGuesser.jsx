import React, { useState, useEffect, useRef } from 'react'
import Autocomplete from '../components/Autocomplete.jsx'
import LoadingScreen from '../components/LoadingScreen.jsx'
import { RotateCcw, AlertTriangle, ArrowRight, Eye, Sparkles, HelpCircle, Check, X, Camera, RefreshCw, Compass } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './LobbyGuesser.css'

// Zoom progression steps based on number of wrong guesses (closer zoom, more gradual steps)
const ZOOM_LEVELS = [1200, 950, 750, 580, 440, 320, 220, 150, 100]

export default function LobbyGuesser({ soundEnabled, onBack }) {
  const [students, setStudents] = useState([])
  const [lobbyPool, setLobbyPool] = useState([])
  const [target, setTarget] = useState(null)
  const [guesses, setGuesses] = useState([])
  const [gameStatus, setGameStatus] = useState('playing') // 'playing', 'won', 'revealed'
  
  // Random crop coordinates
  const [cropCoords, setCropCoords] = useState({ x: 50, y: 50 })
  const [rerollsUsed, setRerollsUsed] = useState(0)
  const maxRerolls = 3

  const [loading, setLoading] = useState(true)
  const [fadeLoading, setFadeLoading] = useState(true)
  const autocompleteRef = useRef(null)

  // Load students & lobbies data on mount
  useEffect(() => {
    async function loadData() {
      const startTime = Date.now()
      try {
        // Fetch student list (with cache buster)
        const resStudents = await fetch(`/jp_data/students.min.json?v=${Date.now()}`)
        const dataStudents = await resStudents.json()
        
        const list = []
        for (const id in dataStudents) {
          const s = dataStudents[id]
          if (s.IsReleased && s.IsReleased[0]) {
            list.push({
              id: s.Id,
              name: s.Name,
              devName: s.DevName,
              pathName: s.PathName,
              englishName: getEnglishName(s.PathName, s.DevName),
              school: s.School,
              squadType: s.SquadType,
              bulletType: s.BulletType,
              armorType: s.ArmorType,
              position: s.Position,
              starGrade: s.StarGrade,
              schoolYear: s.SchoolYear,
              characterSSRNew: s.CharacterSSRNew || 'ยินดีที่ได้พบกันค่ะ คุณครู'
            })
          }
        }
        setStudents(list)

        // Fetch lobbies map (with cache buster)
        const resLobbies = await fetch(`/jp_data/lobbies_map.json?v=${Date.now()}`)
        const dataLobbies = await resLobbies.json()
        setLobbyPool(dataLobbies)

        // Start initial round
        startNewRound(dataLobbies)

        // Loading delay for smooth entry
        const elapsed = Date.now() - startTime
        const delay = Math.max(0, 300 - elapsed)
        setTimeout(() => {
          setFadeLoading(false)
          setTimeout(() => {
            setLoading(false)
            setTimeout(() => {
              if (autocompleteRef.current) autocompleteRef.current.focus()
            }, 100)
          }, 250)
        }, delay)

      } catch (err) {
        console.error('Failed to load Lobby Guesser data:', err)
        setFadeLoading(false)
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Auto-advance to next round on victory (2 seconds delay)
  useEffect(() => {
    if (gameStatus === 'won') {
      const timer = setTimeout(() => {
        startNewRound()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [gameStatus])

  // Refocus input field whenever a new round starts (gameStatus goes to 'playing')
  useEffect(() => {
    if (gameStatus === 'playing' && !loading) {
      const timer = setTimeout(() => {
        if (autocompleteRef.current) {
          autocompleteRef.current.focus()
        }
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [gameStatus, loading, target])

  // Capitalization helper for English names derived from PathName
  const getEnglishName = (pathName, devName) => {
    if (!pathName) return devName || "Unknown";
    const capitalize = (str) => {
      if (!str) return '';
      if (str === 'miku') return 'Miku';
      if (str === 'hatsune') return 'Hatsune';
      if (str === 'ruiko') return 'Ruiko';
      if (str === 'saten') return 'Saten';
      return str.charAt(0).toUpperCase() + str.slice(1);
    };
    const variantsMap = {
      'swimsuit': 'Swimsuit',
      'newyear': 'New Year',
      'dress': 'Dress',
      'bunnygirl': 'Bunny',
      'bunny': 'Bunny',
      'track': 'Track',
      'gym': 'Gym',
      'casual': 'Casual',
      'hotspring': 'Hot Spring',
      'onsen': 'Hot Spring',
      'cheerleader': 'Cheerleader',
      'guide': 'Guide',
      'kid': 'Kid',
      'child': 'Kid',
      'small': 'Kid',
      'christmas': 'Christmas',
      'parttime': 'Part-time',
      'uniform': 'Uniform',
      'band': 'Band',
      'idol': 'Idol',
      'battle': 'Battle',
      'camp': 'Camp',
      'qipao': 'Qipao',
      'pajama': 'Pajama',
      'riding': 'Cycling',
      'cycling': 'Cycling',
      'dressup': 'Dress',
      'wildcard': 'Wildcard'
    };
    const parts = pathName.split('_');
    if (parts.length === 1) return capitalize(parts[0]);
    const lastPart = parts[parts.length - 1];
    if (variantsMap[lastPart]) {
      const base = parts.slice(0, -1).map(capitalize).join(' ');
      return `${base} (${variantsMap[lastPart]})`;
    }
    return parts.map(capitalize).join(' ');
  }

  // Choose a random target and randomize coordinate
  const startNewRound = (pool = lobbyPool) => {
    if (pool.length === 0) return
    const randTarget = pool[Math.floor(Math.random() * pool.length)]
    setTarget(randTarget)
    setGuesses([])
    setGameStatus('playing')
    setRerollsUsed(0)
    randomizeCoords()
  }

  // Randomize focus coordinate within 25% - 75% boundary
  const randomizeCoords = () => {
    const rx = Math.floor(Math.random() * 50) + 25 // 25% to 75%
    const ry = Math.floor(Math.random() * 40) + 30 // 30% to 70% (slightly tighter vertical to focus on face/body)
    setCropCoords({ x: rx, y: ry })
  }

  // Trigger oscillator beep sounds
  const playSound = (type) => {
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
        
        setTimeout(() => {
          const osc2 = ctx.createOscillator()
          const gain2 = ctx.createGain()
          osc2.connect(gain2)
          gain2.connect(ctx.destination)
          osc2.frequency.setValueAtTime(659.25, ctx.currentTime) // E5
          gain2.gain.setValueAtTime(0.08, ctx.currentTime)
          osc2.start()
          osc2.stop(ctx.currentTime + 0.12)
        }, 100)
      } else if (type === 'failure') {
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(180, ctx.currentTime)
        gain.gain.setValueAtTime(0.08, ctx.currentTime)
        osc.start()
        osc.stop(ctx.currentTime + 0.2)
      } else if (type === 'victory') {
        const notes = [261.63, 329.63, 392.00, 523.25]
        notes.forEach((freq, idx) => {
          setTimeout(() => {
            const oscV = ctx.createOscillator()
            const gainV = ctx.createGain()
            oscV.connect(gainV)
            gainV.connect(ctx.destination)
            oscV.frequency.value = freq
            gainV.gain.setValueAtTime(0.06, ctx.currentTime)
            gainV.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5)
            oscV.start()
            oscV.stop(ctx.currentTime + 0.5)
          }, idx * 100)
        })
      }
    } catch (e) {
      console.warn('Audio Context error:', e)
    }
  }

  // Handle re-rolling the focus coords
  const handleRerollCoords = () => {
    if (rerollsUsed >= maxRerolls || gameStatus !== 'playing') return
    randomizeCoords()
    setRerollsUsed(prev => prev + 1)
    if (autocompleteRef.current) {
      setTimeout(() => {
        autocompleteRef.current.focus()
      }, 50)
    }
  }

  // Check if guessed student shares base character with target
  const checkIsCloseVariant = (guessStudent, targetLobby) => {
    // Extract tokens from English names
    const getTokens = (name) => {
      return name
        .toLowerCase()
        .replace(/\(.*?\)/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2 && w !== 'terror');
    };

    const targetTokens = getTokens(targetLobby.englishName)
    const guessTokens = getTokens(guessStudent.englishName)
    
    // Check if there is any intersection in name tokens
    return guessTokens.some(token => targetTokens.includes(token))
  }

  // Handle Guess selection
  const handleGuess = (student) => {
    if (gameStatus !== 'playing' || !target) return

    // Avoid duplicate guesses
    if (guesses.some(g => g.id === student.id)) return

    const isExactMatch = student.id === target.studentId
    const isCloseVariant = !isExactMatch && checkIsCloseVariant(student, target)
    const schoolMatch = student.school === target.school

    const guessResult = {
      ...student,
      isCorrect: isExactMatch,
      isCloseVariant: isCloseVariant,
      schoolMatch: schoolMatch
    }

    const updatedGuesses = [...guesses, guessResult]
    setGuesses(updatedGuesses)

    if (isExactMatch) {
      setGameStatus('won')
      playSound('victory')
    } else {
      playSound('failure')
    }

    if (autocompleteRef.current) {
      setTimeout(() => {
        autocompleteRef.current.focus()
      }, 50)
    }
  }

  // Give up / Reveal target
  const handleReveal = () => {
    if (gameStatus !== 'playing') return
    setGameStatus('revealed')
    playSound('failure')
  }

  // Get current zoom percentage
  const getZoomPercent = () => {
    if (gameStatus !== 'playing') return 100 // Fully zoomed out/revealed
    const wrongGuessesCount = guesses.filter(g => !g.isCorrect).length
    return ZOOM_LEVELS[Math.min(wrongGuessesCount, ZOOM_LEVELS.length - 1)]
  }

  const currentZoom = getZoomPercent()
  const isSolved = gameStatus === 'won'
  const isRevealed = gameStatus === 'revealed'
  const isGameOver = isSolved || isRevealed

  // Count wrong guesses for HUD zoom scale display
  const wrongGuesses = guesses.filter(g => !g.isCorrect).length

  return (
    <div className="lobby-guesser-container font-prompt">
      <AnimatePresence>
        {loading && (
          <LoadingScreen 
            fadeLoading={fadeLoading} 
            loadingText="กำลังสแกนสัญญาณภาพและข้อมูลล็อบบี้..." 
          />
        )}
      </AnimatePresence>

      {/* Header and Intro */}
      <div className="halo-gameplay-header">
        <div className="gameplay-title-area">
          <Camera style={{ color: 'var(--color-accent)', width: '24px', height: '24px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '0.03em', fontFamily: 'Outfit, sans-serif' }}>
            L2D LOBBY GUESSER
          </h2>
          <span className="gameplay-badge practice-mode">LOBBY MODE</span>
        </div>
        <button onClick={onBack} className="gameplay-exit-btn">
          กลับหน้าหลัก (Back)
        </button>
      </div>

      <div className="lobby-gameplay-workspace">
        {/* VIEWPORT AREA */}
        <div className="lobby-display-section">
          <div className="lobby-card-wrapper">
            <div className="lobby-camera-viewport">
              {/* Scanlines & Grid HUD */}
              <div className="lobby-camera-scanlines" />
              <div className="lobby-camera-grid" />
              <div className="lobby-camera-corners" />

              {/* Dynamic Viewfinder Image */}
              {target && (
                <div 
                  className={`lobby-viewfinder-img ${guesses.length > 0 ? 'animate-zoom' : ''}`}
                  style={{
                    backgroundImage: `url(/images/student/lobbies/${target.file})`,
                    backgroundSize: `${currentZoom}%`,
                    backgroundPosition: isGameOver 
                      ? 'center center' 
                      : `${cropCoords.x}% ${cropCoords.y}%`
                  }}
                />
              )}

              {/* Viewfinder Camera HUD overlay */}
              <div className="lobby-camera-hud">
                <div className="lobby-hud-top">
                  <div className="lobby-hud-rec">
                    <div className="lobby-hud-dot" />
                    <span>L2D SCAN</span>
                  </div>
                  <div>CAM_0{target ? (target.studentId % 9) + 1 : 1}</div>
                </div>

                <div className="lobby-hud-bottom">
                  <div className="lobby-hud-coordinates">
                    <span>X: {isGameOver ? '50.0' : cropCoords.x.toFixed(1)}%</span>
                    <span>Y: {isGameOver ? '50.0' : cropCoords.y.toFixed(1)}%</span>
                  </div>
                  <div className="lobby-hud-zoom">
                    ZOOM: {(currentZoom / 100).toFixed(1)}x
                  </div>
                </div>
              </div>

              {/* Solved / Victory / Revealed overlays */}
              <AnimatePresence>
                {isGameOver && target && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="lobby-viewport-solved-overlay"
                  >
                    <Sparkles className="solved-sparkle-icon" style={{ color: isRevealed ? '#8e8e93' : 'var(--color-accent)' }} />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                      {isSolved ? 'ปลดล็อคสัญญาณข้อมูลสำเร็จ!' : 'ยอมจำนนและเผยข้อมูล'}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                      {isSolved ? 'คุณเดาตัวละครได้อย่างแม่นยำ!' : 'Sensei ยอมแพ้ให้กับสัญญาณภาพนี้'}
                    </p>

                    <div className="solved-target-profile-card">
                      <img 
                        src={`/images/student/icon/${target.studentId}.webp`} 
                        alt={target.englishName} 
                        className="solved-profile-avatar"
                        onError={(e) => { e.target.src = '/images/schoolicon/ETC.png' }}
                      />
                      <div className="solved-profile-details">
                        <span className="solved-profile-name">{target.englishName}</span>
                        <span className="solved-profile-school">{target.school}</span>
                      </div>
                    </div>

                    <p className="lobby-quote-bubble">
                      "ยินดีที่ได้พบกันค่ะ คุณครู"
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Viewport Footer actions */}
            <div className="lobby-action-row">
              <button 
                onClick={handleRerollCoords}
                disabled={rerollsUsed >= maxRerolls || isGameOver}
                className="lobby-reroll-btn"
                title="สุ่มย้ายกล้องไปส่องบริเวณอื่นของภาพตัวละครนี้"
              >
                <Compass style={{ width: '16px', height: '16px' }} />
                ย้ายตำแหน่งกล้อง ({rerollsUsed}/{maxRerolls})
              </button>
              <span className="lobby-reroll-limit">
                ซูมออกเมื่อทายผิด ({wrongGuesses}/{ZOOM_LEVELS.length - 1} ครั้ง)
              </span>
            </div>
          </div>

          {/* Mode Guide Info */}
          <div className="lobby-info-card">
            <HelpCircle className="lobby-info-icon" />
            <div className="lobby-info-text">
              <strong>วิธีเล่น:</strong> ทายว่าล็อบบี้ L2D ด้านบนเป็นของใคร โดยพิมพ์ชื่อในกล่องด้านขวา หากทายผิดกล้องจะค่อยๆ ซูมออกทีละขั้นเพื่อเปิดเผยภาพมากขึ้น หรือกดปุ่ม <strong>ย้ายตำแหน่งกล้อง</strong> เพื่อขยับพิกัดส่องไปจุดอื่นหากมุมเดิมมองยากเกินไป!
            </div>
          </div>
        </div>

        {/* INPUT & GUESS LOGS AREA */}
        <div className="lobby-guesser-section">
          {/* Main Guess Action Panel */}
          <div className="lobby-input-card">
            {isGameOver ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isSolved ? '#34d399' : '#fbbf24', fontWeight: 600 }}>
                  {isSolved ? <Check className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  <span>{isSolved ? 'เดาถูกสำเร็จ!' : 'เผยคำตอบแล้ว'}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  ตัวละครในภาพคือ: <strong>{target?.englishName} ({target?.name})</strong> โรงเรียน <strong>{target?.school}</strong>
                </p>
                <button
                  onClick={() => startNewRound()}
                  className="practice-next-btn animate-pulse"
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'var(--color-accent)', border: 'none', color: '#fff', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  เล่นต่อรอบถัดไป <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <h4 className="lobby-input-title" style={{ color: 'var(--color-accent)' }}>
                  ทายชื่อนักเรียนในล็อบบี้นี้:
                </h4>
                <div className="lobby-input-wrapper">
                  <div style={{ flex: 1 }}>
                    <Autocomplete
                      ref={autocompleteRef}
                      suggestions={students}
                      onSelect={handleGuess}
                      guessedIds={guesses.map(g => g.id)}
                      placeholder="ค้นหาและเลือกชื่อนักเรียน..."
                    />
                  </div>
                  
                  <button 
                    onClick={handleReveal}
                    className="gameplay-reveal-btn"
                    style={{ background: '#7f1d1d', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    ยอมแพ้
                  </button>

                  <button
                    onClick={() => startNewRound()}
                    className="gameplay-skip-btn"
                    style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer' }}
                    title="ข้ามไปรูปถัดไป"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Guess History Logs */}
          <div className="lobby-guess-logs-container">
            <h4 className="lobby-logs-header">
              ประวัติการทายในรอบนี้ ({guesses.length})
            </h4>

            {guesses.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 10px', color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center', gap: '8px' }}>
                <HelpCircle className="w-8 h-8 opacity-30" />
                <span>ยังไม่มีประวัติการเดาในรอบนี้</span>
              </div>
            ) : (
              <div className="lobby-logs-scroll">
                {[...guesses].reverse().map((g, idx) => (
                  <div 
                    key={idx}
                    className={`lobby-guess-row ${g.isCorrect ? 'correct' : g.isCloseVariant ? 'close-variant' : 'incorrect'}`}
                  >
                    <div className="lobby-guess-student">
                      <img 
                        src={`/images/student/icon/${g.id}.webp`} 
                        alt={g.englishName} 
                        className="lobby-guess-avatar"
                        onError={(e) => { e.target.src = '/images/schoolicon/ETC.png' }}
                      />
                      <div className="lobby-guess-names">
                        <span className="lobby-guess-english">{g.englishName}</span>
                        <span className="lobby-guess-subtext">{g.school}</span>
                      </div>
                    </div>

                    <div className="lobby-guess-pills">
                      {g.isCloseVariant && (
                        <span className="lobby-pill" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24' }}>
                          <AlertTriangle className="w-3 h-3" /> ผิดชุด/ชุดอื่น
                        </span>
                      )}
                      
                      <span className={`lobby-pill ${g.schoolMatch ? 'match' : 'no-match'}`}>
                        {g.schoolMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        โรงเรียน
                      </span>
                    </div>

                    <div className="lobby-status-label-box">
                      <span className={`lobby-status-label ${g.isCorrect ? 'correct' : g.isCloseVariant ? 'close-variant' : 'incorrect'}`}>
                        {g.isCorrect ? 'ถูกต้อง' : g.isCloseVariant ? 'เกือบถูก' : 'ผิด'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
