import React, { useState, useEffect, useRef } from 'react'
import Autocomplete from '../components/Autocomplete.jsx'
import LoadingScreen from '../components/LoadingScreen.jsx'
import { ArrowRight, Check, X, Sparkles, Eye } from 'lucide-react'
import SecureImage from '../components/SecureImage.jsx'
import { motion, AnimatePresence } from 'framer-motion'

// Set of 141 validated chocolate filename identifiers in public/images/item/icon and public/images/item/full
const VALID_CHOCOLATES = new Set([
  "airi", "akane", "akari", "ako", "aris", "arona", "aru", "asuna", "atsuko", "ayane", "azusa",
  "ch0069", "ch0070", "ch0071", "ch0079", "ch0080", "ch0081", "ch0088", "ch0089", "ch0095",
  "ch0107", "ch0109", "ch0110", "ch0113", "ch0114", "ch0124", "ch0135", "ch0137", "ch0138",
  "ch0139", "ch0141", "ch0144", "ch0145", "ch0152", "ch0155", "ch0156", "ch0158", "ch0159",
  "ch0160", "ch0161", "ch0166", "ch0167", "ch0169", "ch0170", "ch0187", "ch0198", "ch0214",
  "ch0222", "ch0224", "ch0225", "ch0228", "ch0229", "ch0238", "ch0242", "ch0243", "ch0245",
  "ch0263", "ch0288", "ch0304", "ch0306", "ch0309", "ch0317", "ch0318", "ch0319", "ch0335",
  "cherino", "chinatsu", "chise", "eimi", "fuuka", "hanae", "hanako", "hare", "haruka", "haruna",
  "hasumi", "hibiki", "hihumi", "hina", "hinata", "hiyori", "hoshino", "ibuki", "iori", "izumi",
  "izuna", "juri", "kaede", "karin", "kayoko", "kazusa", "kirara", "kirino", "koharu", "kotama",
  "kotori", "maki", "mari", "marina", "mashiro", "midori", "mimori", "misaki", "miyako", "moe",
  "momiji", "momoi", "momoka", "mutsuki", "nagisa", "neru", "nodoka", "nonomi", "np0013",
  "np0032", "np0035", "pina", "reizyo", "rin", "sakurako", "saori", "saya", "serika", "serina",
  "shigure", "shimiko", "shiroko", "shizuko", "shun", "sora", "sumire", "suzumi", "tomoe",
  "tsubaki", "tsurugi", "utaha", "wakamo", "yoshimi", "yuuka", "yuzu", "zunko"
]);

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
  if (parts.length === 1) {
    return capitalize(parts[0]);
  }
  
  const lastPart = parts[parts.length - 1];
  if (variantsMap[lastPart]) {
    const base = parts.slice(0, -1).map(capitalize).join(' ');
    return `${base} (${variantsMap[lastPart]})`;
  }
  
  return parts.map(capitalize).join(' ');
};

// Map a student to their chocolate filename identifier
const getChocolateNameForStudent = (student) => {
  if (!student) return null;
  const pName = (student.PathName || '').toLowerCase();
  const dName = (student.DevName || '').toLowerCase();
  
  if (VALID_CHOCOLATES.has(pName)) return pName;
  if (VALID_CHOCOLATES.has(dName)) return dName;
  
  return null;
};

export default function ChocolateGuesser({ soundEnabled, onBack }) {
  const [allStudents, setAllStudents] = useState([]) // For autocomplete suggestions
  const [targetStudents, setTargetStudents] = useState([]) // Pool of students who have chocolates
  const [loading, setLoading] = useState(true)
  const [fadeLoading, setFadeLoading] = useState(true)

  // Game Mode States: 'practice'
  const [mode] = useState('practice')

  // Play States
  const [currentTarget, setCurrentTarget] = useState(null) // { student }
  const [previousTargets, setPreviousTargets] = useState([])
  const [guesses, setGuesses] = useState([])
  const [solved, setSolved] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)

  // Visual background style
  const [bgStyle, setBgStyle] = useState('slate')

  const autocompleteRef = useRef(null)
  const nextRoundTimeoutRef = useRef(null)

  // Play Sound Beeps
  const playBeep = (type) => {
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
        }, 80)
      } else if (type === 'failure') {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(150, ctx.currentTime)
        gain.gain.setValueAtTime(0.08, ctx.currentTime)
        osc.start()
        osc.stop(ctx.currentTime + 0.25)
      } else if (type === 'warning') {
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(880, ctx.currentTime) // A5
        gain.gain.setValueAtTime(0.05, ctx.currentTime)
        osc.start()
        osc.stop(ctx.currentTime + 0.05)
      } else if (type === 'combo') {
        osc.type = 'sine'
        const notes = [392, 523.25, 659.25, 783.99]
        notes.forEach((f, i) => {
          setTimeout(() => {
            const oscC = ctx.createOscillator()
            const gainC = ctx.createGain()
            oscC.connect(gainC)
            gainC.connect(ctx.destination)
            oscC.frequency.value = f
            gainC.gain.setValueAtTime(0.05, ctx.currentTime)
            oscC.start()
            oscC.stop(ctx.currentTime + 0.1)
          }, i * 60)
        })
      }
    } catch (e) {
      console.warn(e)
    }
  }

  // Load students & match chocolate list
  useEffect(() => {
    async function loadData() {
      const startTime = Date.now()
      try {
        const res = await fetch('/jp_data/students.min.json')
        const data = await res.json()
        
        const suggestionsList = []
        const targetPool = []

        for (const id in data) {
          const s = data[id]
          if (s.IsReleased && s.IsReleased[0]) {
            const chocName = getChocolateNameForStudent(s)
            
            const studentObj = {
              id: s.Id,
              name: s.Name,
              devName: s.DevName,
              pathName: s.PathName,
              englishName: getEnglishName(s.PathName, s.DevName),
              school: s.School,
              schoolYear: s.SchoolYear || 'N/A',
              squadType: s.SquadType,
              bulletType: s.BulletType,
              armorType: s.ArmorType,
              weaponType: s.WeaponType,
              chocolateFile: chocName ? `event_vallentine_chocolate_${chocName}.webp` : null
            }

            suggestionsList.push(studentObj)

            if (chocName) {
              targetPool.push(studentObj)
            }
          }
        }

        setAllStudents(suggestionsList)
        setTargetStudents(targetPool)
        selectNextTarget(targetPool, [])
        
        const elapsed = Date.now() - startTime
        const delay = Math.max(0, 300 - elapsed)
        
        setTimeout(() => {
          setFadeLoading(false)
          setTimeout(() => {
            setLoading(false)
          }, 300)
        }, delay)
      } catch (err) {
        console.error("Failed to load students in ChocolateGuesser:", err)
        setFadeLoading(false)
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    return () => {
      if (nextRoundTimeoutRef.current) clearTimeout(nextRoundTimeoutRef.current)
    }
  }, [])

  // Select next target
  const selectNextTarget = (pool = targetStudents, currentUsed = previousTargets) => {
    if (nextRoundTimeoutRef.current) clearTimeout(nextRoundTimeoutRef.current)
    if (pool.length === 0) return

    let available = pool.filter(s => !currentUsed.includes(s.id))
    if (available.length === 0) {
      available = pool
      setPreviousTargets([])
    }

    const randomStudent = available[Math.floor(Math.random() * available.length)]
    
    setCurrentTarget({
      student: randomStudent
    })
    setGuesses([])
    setSolved(false)
    setIsRevealed(false)

    setTimeout(() => {
      if (autocompleteRef.current) {
        autocompleteRef.current.focus()
      }
    }, 50)
  }

  // Handle Guess selection
  const handleGuess = (guessedStudent) => {
    if (solved || !currentTarget) return

    if (guesses.some(g => g.id === guessedStudent.id)) return

    const isCorrect = guessedStudent.id === currentTarget.student.id

    const updatedGuesses = [...guesses, {
      ...guessedStudent,
      isCorrect,
      schoolMatch: guessedStudent.school === currentTarget.student.school,
      squadTypeMatch: guessedStudent.squadType === currentTarget.student.squadType,
      bulletTypeMatch: guessedStudent.bulletType === currentTarget.student.bulletType,
      armorTypeMatch: guessedStudent.armorType === currentTarget.student.armorType
    }]
    setGuesses(updatedGuesses)

    if (isCorrect) {
      setSolved(true)
      playBeep('success')
      nextRoundTimeoutRef.current = setTimeout(() => {
        const newUsed = [...previousTargets, currentTarget.student.id]
        setPreviousTargets(newUsed)
        selectNextTarget(targetStudents, newUsed)
      }, 1500)
    } else {
      playBeep('failure')
    }
  }

  // Controls
  const handleSkip = () => {
    if (!currentTarget) return
    playBeep('failure')
    const newUsed = [...previousTargets, currentTarget.student.id]
    setPreviousTargets(newUsed)
    selectNextTarget(targetStudents, newUsed)
  }

  const handleReveal = () => {
    if (solved) return
    setSolved(true)
    setIsRevealed(true)
    playBeep('failure')
  }

  if (loading) {
    return <LoadingScreen fadeLoading={fadeLoading} />
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="halo-guesser-container font-prompt"
    >
      {currentTarget && (
        <div className="halo-gameplay-layout animate-fadeInUp">
          
          <div className="halo-gameplay-header">
            <div className="gameplay-title-area">
              <span 
                className="gameplay-badge practice-mode" 
                style={{ backgroundColor: 'rgba(76, 154, 224, 0.1)', color: 'var(--color-accent)', borderColor: 'rgba(76, 154, 224, 0.2)', borderWidth: '1px' }}
              >
                MINI GAME
              </span>
              <button onClick={onBack} className="gameplay-exit-btn">
                กลับหน้าหลัก
              </button>
            </div>
          </div>

          <div className="halo-gameplay-workspace">
            
            {/* Left Column: Chocolate Graphic Viewport */}
            <div className="halo-display-section">
              <div className="halo-card-wrapper" style={{ borderColor: 'rgba(76, 154, 224, 0.3)' }}>
                
                {/* Contrast controls */}
                <div className="halo-contrast-controls">
                  <button 
                    onClick={() => setBgStyle('slate')} 
                    className={`contrast-btn ${bgStyle === 'slate' ? 'active' : ''}`}
                    style={bgStyle === 'slate' ? { backgroundColor: 'var(--color-accent)' } : {}}
                  >
                    Dark Slate
                  </button>
                  <button 
                    onClick={() => setBgStyle('chess')} 
                    className={`contrast-btn ${bgStyle === 'chess' ? 'active' : ''}`}
                    style={bgStyle === 'chess' ? { backgroundColor: 'var(--color-accent)' } : {}}
                  >
                    Checker
                  </button>
                  <button 
                    onClick={() => setBgStyle('light')} 
                    className={`contrast-btn ${bgStyle === 'light' ? 'active' : ''}`}
                    style={bgStyle === 'light' ? { backgroundColor: 'var(--color-accent)' } : {}}
                  >
                    Light
                  </button>
                </div>

                <div className={`halo-graphic-viewport bg-style-${bgStyle}`} style={{ padding: '20px' }}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}
                  >
                    <SecureImage
                      src={`/images/item/full/${currentTarget.student.chocolateFile}`}
                      alt="Mystery Valentine Chocolate"
                      className={`mystery-halo-image ${solved ? 'solved-glow' : ''}`}
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      onContextMenu={(e) => e.preventDefault()}
                      style={{ 
                        maxHeight: '98%', 
                        maxWidth: '98%', 
                        objectFit: 'contain', 
                        filter: solved ? 'drop-shadow(0 2px 20px rgba(76, 154, 224, 0.8))' : 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))', 
                        pointerEvents: 'none', 
                        userSelect: 'none', 
                        WebkitUserDrag: 'none' 
                      }}
                      onError={(e) => {
                        if (e.target.src.includes('/full/')) {
                          e.target.src = `/images/item/icon/${currentTarget.student.chocolateFile}`;
                        } else {
                          e.target.src = '/images/schoolicon/ETC.png';
                        }
                      }}
                    />
                  </motion.div>
                  
                  {solved && (
                    <div className="halo-viewport-solved-overlay" style={isRevealed ? { background: 'rgba(28, 28, 30, 0.85)', borderColor: 'rgba(255, 255, 255, 0.15)' } : {}}>
                      <Sparkles className="solved-sparkle-icon animate-pulse" style={isRevealed ? { color: '#8e8e93' } : { color: 'var(--color-accent)' }} />
                      <span style={isRevealed ? { color: '#8e8e93' } : { color: 'var(--color-accent)' }}>{isRevealed ? 'REVEALED!' : 'CORRECT CHARACTER!'}</span>
                    </div>
                  )}
                </div>

                {/* Target profile preview when solved */}
                <AnimatePresence>
                  {solved && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="solved-target-profile-card"
                      style={{ borderLeftColor: isRevealed ? '#8e8e93' : 'var(--color-accent)' }}
                    >
                      <img 
                        src={`/images/student/icon/${currentTarget.student.id}.webp`}
                        alt={currentTarget.student.englishName}
                        className="solved-profile-avatar"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/schoolicon/ETC.png';
                        }}
                      />
                      <div className="solved-profile-details">
                        <h3>{currentTarget.student.englishName}</h3>
                        <p style={{ color: 'var(--color-accent)', fontWeight: '500', fontSize: '0.8rem', marginTop: '2px' }}>
                          💝 ช็อกโกแลตของ {currentTarget.student.englishName}
                        </p>
                        <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>{currentTarget.student.school}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Column: Autocomplete Input and Guess log */}
            <div className="halo-guesser-section">
              
              <AnimatePresence mode="wait">
                {!solved ? (
                  <motion.div 
                    key="input-panel"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="halo-input-container"
                  >
                    <h4 className="guesser-input-title" style={{ color: 'var(--color-accent)' }}>ป้อนชื่อนักเรียนที่เป็นเจ้าของช็อกโกแลตสื่อรักกล่องนี้:</h4>
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      <div style={{ flex: 1 }}>
                        <Autocomplete
                          ref={autocompleteRef}
                          suggestions={allStudents}
                          onSelect={handleGuess}
                          guessedIds={guesses.map(g => g.id)}
                          placeholder="ค้นหาตามชื่อนักเรียน (เช่น Aru, Shiroko, Aris)..."
                        />
                      </div>
                      
                      <button onClick={handleSkip} className="gameplay-skip-btn" style={{ borderColor: 'rgba(76, 154, 224, 0.4)' }}>
                        ข้าม
                      </button>
                      <button onClick={handleReveal} className="gameplay-reveal-btn" style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}>
                        เฉลย
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="solved-panel"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="halo-round-solved-card" 
                    style={{ borderLeftColor: isRevealed ? '#8e8e93' : 'var(--color-accent)' }}
                  >
                    <div className="round-solved-header">
                      {isRevealed ? (
                        <>
                          <Eye className="w-5 h-5 text-amber-500" />
                          <span className="text-amber-500">เฉลยคำตอบ</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5 text-emerald-400" />
                          <span>ทายถูกต้อง!</span>
                        </>
                      )}
                    </div>
                    <p className="round-solved-desc">
                      การ์ดช็อกโกแลต 💝 <strong style={{ color: 'var(--color-accent)' }}>ช็อกโกแลตสื่อรักของ {currentTarget.student.englishName}</strong> เป็นของ <strong className="text-cyan-400">{currentTarget.student.englishName}</strong>
                    </p>
                    
                    <button 
                      onClick={() => {
                        const newUsed = [...previousTargets, currentTarget.student.id]
                        setPreviousTargets(newUsed)
                        selectNextTarget(targetStudents, newUsed)
                      }}
                      className="practice-next-btn animate-pulse"
                      style={{ backgroundColor: 'var(--color-accent)' }}
                    >
                      ช็อกโกแลตถัดไป <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Guesses Log Column */}
              <div className="halo-guess-logs-container">
                <h4 className="logs-header-title">ประวัติการทายในรอบนี้ ({guesses.length})</h4>
                
                {guesses.length === 0 ? (
                  <div className="logs-empty-state">
                    ยังไม่มีข้อมูลการทายสำหรับช็อกโกแลตสื่อรักกล่องนี้ ป้อนชื่อนักเรียนเพื่อเริ่มทาย!
                  </div>
                ) : (
                  <div className="logs-scroll-area">
                    <AnimatePresence initial={false}>
                      {[...guesses].reverse().map((g, index) => (
                        <motion.div 
                          key={`${g.id}-${index}`}
                          initial={{ opacity: 0, x: -10, y: 5 }}
                          animate={{ opacity: 1, x: 0, y: 0 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className={`guess-log-row ${g.isCorrect ? 'correct' : 'incorrect'}`}
                        >
                          <div className="log-student-info">
                            <img
                              src={`/images/student/icon/${g.id}.webp`}
                              alt={g.englishName}
                              className="log-student-avatar"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/images/schoolicon/ETC.png';
                              }}
                            />
                            <span className="log-student-name">{g.englishName}</span>
                          </div>

                          <div className="log-pills-row" style={{ flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '60%' }}>
                            {/* School Match */}
                            <span className={`log-pill ${g.schoolMatch ? 'match' : 'no-match'}`} title="โรงเรียน">
                              {g.schoolMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              {g.school}
                            </span>
                            {/* Squad Type Match */}
                            <span className={`log-pill ${g.squadTypeMatch ? 'match' : 'no-match'}`} title="ประเภทหน่วย">
                              {g.squadTypeMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              {g.squadType}
                            </span>
                            {/* Attack Type (Bullet Type) Match */}
                            <span className={`log-pill ${g.bulletTypeMatch ? 'match' : 'no-match'}`} title="ประเภทกระสุน" style={g.bulletTypeMatch ? { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.2)' } : { backgroundColor: 'rgba(239, 68, 68, 0.08)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.15)' }}>
                              {g.bulletTypeMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              {g.bulletType}
                            </span>
                          </div>

                          <div className="log-status-icon-box">
                            {g.isCorrect ? (
                              <span className="log-status-text correct">CORRECT</span>
                            ) : (
                              <span className="log-status-text incorrect">WRONG</span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      )}
    </motion.div>
  )
}
