import React, { useState, useEffect, useRef } from 'react'
import Autocomplete from '../components/Autocomplete.jsx'
import LoadingScreen from '../components/LoadingScreen.jsx'
import { Timer, Trophy, Play, RotateCcw, AlertTriangle, ArrowRight, Check, X, Edit2, Sparkles, HelpCircle, Eye } from 'lucide-react'
import SecureImage from '../components/SecureImage.jsx'
import { motion, AnimatePresence } from 'framer-motion'

// Set of 122 validated weapon icons in public/images/weapon
const VALID_WEAPON_IMAGES = new Set([
  "weapon_icon_10000",
  "weapon_icon_10001",
  "weapon_icon_10002",
  "weapon_icon_10003",
  "weapon_icon_10004",
  "weapon_icon_10005",
  "weapon_icon_10006",
  "weapon_icon_10007",
  "weapon_icon_10008",
  "weapon_icon_10009",
  "weapon_icon_10010",
  "weapon_icon_10011",
  "weapon_icon_10012",
  "weapon_icon_10013",
  "weapon_icon_10014",
  "weapon_icon_10015",
  "weapon_icon_10016",
  "weapon_icon_10017",
  "weapon_icon_10018",
  "weapon_icon_10019",
  "weapon_icon_10020",
  "weapon_icon_10029",
  "weapon_icon_10033",
  "weapon_icon_10034",
  "weapon_icon_13000",
  "weapon_icon_13001",
  "weapon_icon_13002",
  "weapon_icon_13003",
  "weapon_icon_13004",
  "weapon_icon_13005",
  "weapon_icon_13006",
  "weapon_icon_13007",
  "weapon_icon_13008",
  "weapon_icon_13009",
  "weapon_icon_13010",
  "weapon_icon_13011",
  "weapon_icon_13012",
  "weapon_icon_16000",
  "weapon_icon_16001",
  "weapon_icon_16002",
  "weapon_icon_16003",
  "weapon_icon_16004",
  "weapon_icon_16007",
  "weapon_icon_16008",
  "weapon_icon_20000",
  "weapon_icon_20001",
  "weapon_icon_20002",
  "weapon_icon_20003",
  "weapon_icon_20007",
  "weapon_icon_20008",
  "weapon_icon_20012",
  "weapon_icon_20013",
  "weapon_icon_23000",
  "weapon_icon_23001",
  "weapon_icon_23002",
  "weapon_icon_23003",
  "weapon_icon_23004",
  "weapon_icon_23005",
  "weapon_icon_23006",
  "weapon_icon_23007",
  "weapon_icon_23008",
  "weapon_icon_26000",
  "weapon_icon_26001",
  "weapon_icon_26002",
  "weapon_icon_26003",
  "weapon_icon_26004",
  "weapon_icon_26005",
  "weapon_icon_26006",
  "weapon_icon_ch0069",
  "weapon_icon_ch0071",
  "weapon_icon_ch0073",
  "weapon_icon_ch0075",
  "weapon_icon_ch0079",
  "weapon_icon_ch0088",
  "weapon_icon_ch0089",
  "weapon_icon_ch0092",
  "weapon_icon_ch0095",
  "weapon_icon_ch0103",
  "weapon_icon_ch0104",
  "weapon_icon_ch0105",
  "weapon_icon_ch0106",
  "weapon_icon_ch0107",
  "weapon_icon_ch0110",
  "weapon_icon_ch0113",
  "weapon_icon_ch0114",
  "weapon_icon_ch0116",
  "weapon_icon_ch0119",
  "weapon_icon_ch0124",
  "weapon_icon_ch0135",
  "weapon_icon_ch0137",
  "weapon_icon_ch0138",
  "weapon_icon_ch0142",
  "weapon_icon_ch0143",
  "weapon_icon_ch0144",
  "weapon_icon_ch0145",
  "weapon_icon_ch0152",
  "weapon_icon_ch0156",
  "weapon_icon_ch0159",
  "weapon_icon_ch0161",
  "weapon_icon_ch0167",
  "weapon_icon_ch0169",
  "weapon_icon_ch0170",
  "weapon_icon_ch0175",
  "weapon_icon_ch0181",
  "weapon_icon_ch0185",
  "weapon_icon_ch0187",
  "weapon_icon_ch0198",
  "weapon_icon_ch0214",
  "weapon_icon_ch0219",
  "weapon_icon_ch0224",
  "weapon_icon_ch0225",
  "weapon_icon_ch0258_01",
  "weapon_icon_ch0263",
  "weapon_icon_ch9996",
  "weapon_icon_ch9997",
  "weapon_icon_ch9998",
  "weapon_icon_ibuki",
  "weapon_icon_kirara",
  "weapon_icon_momiji",
  "weapon_icon_nagisa",
  "weapon_icon_sakurako",
  "weapon_icon_shigure"
]);

// Capitalization helper for English names
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

export default function WeaponGuesser({ soundEnabled, onBack }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [fadeLoading, setFadeLoading] = useState(true)

  // 'practice'
  const [mode, setMode] = useState('practice')

  // Play States
  const [currentTarget, setCurrentTarget] = useState(null) // { student, weaponFile }
  const [previousTargets, setPreviousTargets] = useState([])
  const [guesses, setGuesses] = useState([])
  const [solved, setSolved] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)

  // Visual background style
  const [bgStyle, setBgStyle] = useState('slate')

  const autocompleteRef = useRef(null)
  const nextRoundTimeoutRef = useRef(null)

  // Audio helper
  const playBeep = (type) => {
    if (!soundEnabled) return
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime)
        gain.gain.setValueAtTime(0.08, ctx.currentTime)
        osc.start()
        osc.stop(ctx.currentTime + 0.08)
        
        setTimeout(() => {
          const osc2 = ctx.createOscillator()
          const gain2 = ctx.createGain()
          osc2.connect(gain2)
          gain2.connect(ctx.destination)
          osc2.frequency.setValueAtTime(659.25, ctx.currentTime)
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
      }
    } catch (e) {
      console.warn(e)
    }
  }

  // Load students & match valid weapons
  useEffect(() => {
    async function loadData() {
      const startTime = Date.now()
      try {
        const res = await fetch('/jp_data/students.min.json')
        const data = await res.json()
        const list = []
        for (const id in data) {
          const s = data[id]
          if (s.IsReleased && s.IsReleased[0] && s.WeaponImg) {
            if (VALID_WEAPON_IMAGES.has(s.WeaponImg)) {
              list.push({
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
                weaponName: s.Weapon ? s.Weapon.Name : 'Unknown Weapon',
                weaponImg: s.WeaponImg
              })
            }
          }
        }
        setStudents(list)
        selectNextTarget(list, [])
        
        const elapsed = Date.now() - startTime
        const delay = Math.max(0, 300 - elapsed)
        
        setTimeout(() => {
          setFadeLoading(false)
          setTimeout(() => {
            setLoading(false)
          }, 300)
        }, delay)
      } catch (err) {
        console.error("Failed to load students in WeaponGuesser:", err)
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

  const selectNextTarget = (studentsPool = students, currentUsed = previousTargets) => {
    if (nextRoundTimeoutRef.current) clearTimeout(nextRoundTimeoutRef.current)
    if (studentsPool.length === 0) return

    let available = studentsPool.filter(s => !currentUsed.includes(s.weaponImg))
    if (available.length === 0) {
      available = studentsPool
      setPreviousTargets([])
    }

    const randomStudent = available[Math.floor(Math.random() * available.length)]
    
    setCurrentTarget({
      student: randomStudent,
      weaponFile: `${randomStudent.weaponImg}.webp`
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

    const isCorrect = guessedStudent.weaponImg === currentTarget.student.weaponImg

    const updatedGuesses = [...guesses, {
      ...guessedStudent,
      isCorrect,
      schoolMatch: guessedStudent.school === currentTarget.student.school,
      weaponTypeMatch: guessedStudent.weaponType === currentTarget.student.weaponType,
      squadTypeMatch: guessedStudent.squadType === currentTarget.student.squadType,
      bulletTypeMatch: guessedStudent.bulletType === currentTarget.student.bulletType
    }]
    setGuesses(updatedGuesses)

    if (isCorrect) {
      setSolved(true)
      playBeep('success')
      nextRoundTimeoutRef.current = setTimeout(() => {
        const newUsed = [...previousTargets, currentTarget.student.weaponImg]
        setPreviousTargets(newUsed)
        selectNextTarget(students, newUsed)
      }, 1500)
    } else {
      playBeep('failure')
    }
  }

  const handleSkip = () => {
    if (!currentTarget) return

    playBeep('failure')
    
    const newUsed = [...previousTargets, currentTarget.student.weaponImg]
    setPreviousTargets(newUsed)
    selectNextTarget(students, newUsed)
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
                PRACTICE MODE (เล่นชิลๆ)
              </span>
              <button onClick={onBack} className="gameplay-exit-btn">
                กลับหน้าหลัก
              </button>
            </div>
          </div>

          <div className="halo-gameplay-workspace">
            
            <div className="halo-display-section">
              <div className="halo-card-wrapper" style={{ borderColor: 'rgba(76, 154, 224, 0.3)' }}>
                
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

                <div className={`halo-graphic-viewport bg-style-${bgStyle}`}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}
                  >
                    <SecureImage
                      src={`/images/weapon/${currentTarget.weaponFile}`}
                      alt="Mystery Weapon"
                      className={`mystery-halo-image ${solved ? 'solved-glow' : ''}`}
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      onContextMenu={(e) => e.preventDefault()}
                      style={{ pointerEvents: 'none', userSelect: 'none', WebkitUserDrag: 'none', objectFit: 'contain', width: '95%', height: '95%', maxWidth: '95%', maxHeight: '95%', padding: '4px' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/schoolicon/ETC.png';
                      }}
                    />
                  </motion.div>
                  
                  {solved && (
                    <div className="halo-viewport-solved-overlay" style={isRevealed ? { background: 'rgba(28, 28, 30, 0.85)', borderColor: 'rgba(255, 255, 255, 0.15)' } : {}}>
                      <Sparkles className="solved-sparkle-icon animate-pulse" style={isRevealed ? { color: '#8e8e93' } : { color: 'var(--color-accent)' }} />
                      <span>{isRevealed ? 'REVEALED!' : 'CORRECT WEAPON!'}</span>
                    </div>
                  )}
                </div>

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
                        <p>ปืน: {currentTarget.student.weaponName} ({currentTarget.student.weaponType})</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="halo-guesser-section">
              
              <AnimatePresence mode="wait">
                {!solved ? (
                  <motion.div 
                    key="input-section"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="halo-input-container"
                  >
                    <h4 className="guesser-input-title" style={{ color: 'var(--color-accent)' }}>ป้อนชื่อนักเรียนที่เป็นเจ้าของอาวุธนี้:</h4>
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      <div style={{ flex: 1 }}>
                        <Autocomplete
                          ref={autocompleteRef}
                          suggestions={students}
                          onSelect={handleGuess}
                          guessedIds={guesses.map(g => g.id)}
                          placeholder="ค้นหาตามชื่อนักเรียน..."
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
                    key="solved-section"
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
                      อาวุธนี้คือของปืน <strong className="text-cyan-400">{currentTarget.student.englishName}</strong> (ชื่อปืน: {currentTarget.student.weaponName})
                    </p>
                    
                    <button 
                      onClick={() => {
                        const newUsed = [...previousTargets, currentTarget.student.weaponImg]
                        setPreviousTargets(newUsed)
                        selectNextTarget(students, newUsed)
                      }}
                      className="practice-next-btn animate-pulse"
                      style={{ backgroundColor: 'var(--color-accent)' }}
                    >
                      อาวุธถัดไป <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="halo-guess-logs-container">
                <h4 className="logs-header-title">ประวัติการทายในรอบนี้ ({guesses.length})</h4>
                
                {guesses.length === 0 ? (
                  <div className="logs-empty-state">
                    ยังไม่มีข้อมูลการทายสำหรับอาวุธนี้ ป้อนชื่อนักเรียนเพื่อเริ่มทาย!
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
                            <span className={`log-pill ${g.schoolMatch ? 'match' : 'no-match'}`} title="โรงเรียน">
                              {g.schoolMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              {g.school}
                            </span>
                            <span className={`log-pill ${g.weaponTypeMatch ? 'match' : 'no-match'}`} title="ประเภทปืน">
                              {g.weaponTypeMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              {g.weaponType}
                            </span>
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
