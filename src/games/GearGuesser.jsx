import React, { useState, useEffect, useRef } from 'react'
import Autocomplete from '../components/Autocomplete.jsx'
import LoadingScreen from '../components/LoadingScreen.jsx'
import Leaderboard from '../components/Leaderboard.jsx'
import { Timer, Trophy, Play, RotateCcw, AlertTriangle, ArrowRight, Check, X, Edit2, Sparkles, HelpCircle } from 'lucide-react'

import { db } from '../firebase.js'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import SecureImage from '../components/SecureImage.jsx'

// Set of 37 student IDs with validated gear images in public/images/gear/icon and public/images/gear/full
const GEAR_ICON_IDS = new Set([
  10000, 10001, 10004, 10005, 10008, 10009, 10010, 10012, 10013, 10022,
  10025, 10028, 10033, 10034, 10036, 10038, 10039, 10041, 10047, 10065,
  10066, 13001, 13004, 13007, 13008, 13010, 16003, 16006, 20005, 20006,
  20009, 20015, 20021, 23003, 23004, 23007, 26005
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

// Reusable translation labels
const getBulletLabel = (type) => {
  if (type === 'Explosion') return 'Explosion (ระเบิด)'
  if (type === 'Pierce') return 'Pierce (ทะลวง)'
  if (type === 'Mystic') return 'Mystic (ลึกลับ)'
  if (type === 'Sonic') return 'Sonic (สั่นสะเทือน)'
  return 'Normal (ปกติ)'
};

const getArmorLabel = (type) => {
  if (type === 'LightArmor') return 'Light (เบา)'
  if (type === 'HeavyArmor') return 'Heavy (หนัก)'
  if (type === 'Unarmed') return 'Special (พิเศษ)'
  if (type === 'ElasticArmor') return 'Elastic (ยืดหยุ่น)'
  return 'Normal (ปกติ)'
};

const getOrCreatePlayerUuid = () => {
  let uuid = localStorage.getItem('ba_player_uuid')
  if (!uuid) {
    uuid = 'user_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
    localStorage.setItem('ba_player_uuid', uuid)
  }
  return uuid
}

export default function GearGuesser({ soundEnabled, onBack, setCustomBackAction }) {
  const [allStudents, setAllStudents] = useState([]) // For autocomplete suggestions
  const [targetStudents, setTargetStudents] = useState([]) // Pool of students who have gears
  const [loading, setLoading] = useState(true)
  const [fadeLoading, setFadeLoading] = useState(true)

  // 'lobby', 'time-attack', 'practice'
  const [mode, setMode] = useState('lobby')

  // Play States
  const [currentTarget, setCurrentTarget] = useState(null) // { student }
  const [previousTargets, setPreviousTargets] = useState([])
  const [guesses, setGuesses] = useState([])
  const [solved, setSolved] = useState(false)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(1)
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('ba_gear_high_score') || '0', 10)
  })

  // Timer (Time Attack)
  const [timeLeft, setTimeLeft] = useState(60)
  const [timerActive, setTimerActive] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [correctAnswersList, setCorrectAnswersList] = useState([])

  // Visual background style
  const [bgStyle, setBgStyle] = useState('slate')

  const autocompleteRef = useRef(null)
  const nextRoundTimeoutRef = useRef(null)
  
  const lastSavedNameRef = useRef(localStorage.getItem('ba_player_name') || 'Anonymous Sensei')

  // Leaderboard States
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('ba_player_name') || 'Anonymous Sensei'
  })
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState('')
  const [submittingScore, setSubmittingScore] = useState(false)
  const [scoreSubmitted, setScoreSubmitted] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Sync profile from DB on mount
  useEffect(() => {
    const syncProfileWithDb = async () => {
      if (!db) return
      const uuid = getOrCreatePlayerUuid()
      try {
        const docRef = doc(db, 'gear_leaderboard', uuid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const dbData = docSnap.data()
          if (dbData.score && dbData.score > highScore) {
            setHighScore(dbData.score)
            localStorage.setItem('ba_gear_high_score', dbData.score.toString())
          }
          if (dbData.name) {
            lastSavedNameRef.current = dbData.name
            if (!localStorage.getItem('ba_player_name')) {
              setPlayerName(dbData.name)
              localStorage.setItem('ba_player_name', dbData.name)
            }
          }
        }
      } catch (err) {
        console.warn("Failed to sync profile with database:", err)
      }
    }
    syncProfileWithDb()
  }, [])

  // Save Name
  const handleSaveName = async () => {
    const finalName = tempName.trim() ? tempName.trim() : "Anonymous Sensei"
    setPlayerName(finalName)
    localStorage.setItem('ba_player_name', finalName)
    setIsEditingName(false)

    if (finalName === lastSavedNameRef.current) return

    if (db && highScore > 0) {
      setSubmittingScore(true)
      try {
        const uuid = getOrCreatePlayerUuid()
        await setDoc(doc(db, 'gear_leaderboard', uuid), {
          name: finalName
        }, { merge: true })
        lastSavedNameRef.current = finalName
        setRefreshTrigger(prev => prev + 1)
      } catch (err) {
        console.warn("Failed to update name in database:", err)
      } finally {
        setSubmittingScore(false)
      }
    }
  }

  // Auto-submit high score
  useEffect(() => {
    if (gameOver && mode === 'time-attack' && score > 0) {
      const autoSubmitScore = async () => {
        let isNewHighScore = false
        if (score > highScore) {
          setHighScore(score)
          localStorage.setItem('ba_gear_high_score', score.toString())
          isNewHighScore = true
        }

        if (db) {
          try {
            const uuid = getOrCreatePlayerUuid()
            const finalName = playerName.trim() ? playerName.trim() : "Anonymous Sensei"
            
            const docRef = doc(db, 'gear_leaderboard', uuid)
            const docSnap = await getDoc(docRef)
            let shouldWrite = true
            
            if (docSnap.exists()) {
              const currentDbScore = docSnap.data().score || 0
              if (score <= currentDbScore) {
                shouldWrite = false
              }
            }

            if (shouldWrite) {
              setSubmittingScore(true)
              await setDoc(docRef, {
                name: finalName,
                score: score,
                createdAt: serverTimestamp()
              }, { merge: true })
              setScoreSubmitted(true)
              setRefreshTrigger(prev => prev + 1)
            }
          } catch (err) {
            console.error("Error auto-submitting score:", err)
          } finally {
            setSubmittingScore(false)
          }
        }
      }
      autoSubmitScore()
    }
  }, [gameOver, score, mode])

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
      } else if (type === 'gameover') {
        const notes = [392, 349.23, 311.13, 261.63]
        notes.forEach((f, i) => {
          setTimeout(() => {
            const oscG = ctx.createOscillator()
            const gainG = ctx.createGain()
            oscG.connect(gainG)
            gainG.connect(ctx.destination)
            oscG.frequency.value = f
            gainG.gain.setValueAtTime(0.06, ctx.currentTime)
            oscG.start()
            oscG.stop(ctx.currentTime + 0.3)
          }, i * 150)
        })
      }
    } catch (e) {
      console.warn(e)
    }
  }

  // Load students & match gear list
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
              gearName: s.Gear ? s.Gear.Name : 'Unknown Unique Gear'
            }

            suggestionsList.push(studentObj)

            if (GEAR_ICON_IDS.has(s.Id)) {
              targetPool.push(studentObj)
            }
          }
        }

        setAllStudents(suggestionsList)
        setTargetStudents(targetPool)
        
        const elapsed = Date.now() - startTime
        const delay = Math.max(0, 300 - elapsed)
        
        setTimeout(() => {
          setFadeLoading(false)
          setTimeout(() => {
            setLoading(false)
          }, 300)
        }, delay)
      } catch (err) {
        console.error("Failed to load students in GearGuesser:", err)
        setFadeLoading(false)
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    return () => {
      if (nextRoundTimeoutRef.current) clearTimeout(nextRoundTimeoutRef.current)
      if (setCustomBackAction) {
        setCustomBackAction(null)
      }
    }
  }, [setCustomBackAction])

  // Timer logic for Time Attack
  useEffect(() => {
    let interval = null
    if (timerActive) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setTimerActive(false)
            setGameOver(true)
            playBeep('gameover')
            if (nextRoundTimeoutRef.current) {
              clearTimeout(nextRoundTimeoutRef.current)
            }
            clearInterval(interval)
            return 0
          }
          if (prev <= 11) {
            playBeep('warning')
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerActive])

  // Select next target
  const selectNextTarget = (pool = targetStudents, currentUsed = previousTargets) => {
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

    setTimeout(() => {
      if (autocompleteRef.current) {
        autocompleteRef.current.focus()
      }
    }, 50)
  }

  // Mode Initializations
  const startTimeAttack = () => {
    if (nextRoundTimeoutRef.current) clearTimeout(nextRoundTimeoutRef.current)
    setMode('time-attack')
    setTimeLeft(60)
    setScore(0)
    setCombo(1)
    setGameOver(false)
    setCorrectAnswersList([])
    setPreviousTargets([])
    setScoreSubmitted(false)
    selectNextTarget(targetStudents, [])
    setTimerActive(true)

    if (setCustomBackAction) {
      setCustomBackAction(() => exitToLobby)
    }
  }

  const startPractice = () => {
    if (nextRoundTimeoutRef.current) clearTimeout(nextRoundTimeoutRef.current)
    setMode('practice')
    setGuesses([])
    setSolved(false)
    setPreviousTargets([])
    selectNextTarget(targetStudents, [])

    if (setCustomBackAction) {
      setCustomBackAction(() => exitToLobby)
    }
  }

  const exitToLobby = () => {
    setTimerActive(false)
    if (nextRoundTimeoutRef.current) clearTimeout(nextRoundTimeoutRef.current)
    setMode('lobby')
    setGameOver(false)
    if (setCustomBackAction) {
      setCustomBackAction(null)
    }
  }

  // Handle Guess selection
  const handleGuess = (guessedStudent) => {
    if (solved || gameOver || !currentTarget) return

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
      playBeep(combo >= 3 ? 'combo' : 'success')

      if (mode === 'time-attack') {
        const addedTime = 5
        const baseScore = 100
        const scoreGained = baseScore * combo
        const newScore = score + scoreGained
        setScore(newScore)

        if (newScore > highScore) {
          setHighScore(newScore)
          localStorage.setItem('ba_gear_high_score', newScore.toString())
        }

        setCorrectAnswersList(prev => [
          ...prev, 
          { 
            student: currentTarget.student, 
            scoreGained, 
            combo 
          }
        ])

        setTimeLeft(prev => Math.min(prev + addedTime, 99))
        setCombo(prev => Math.min(prev + 1, 5))

        nextRoundTimeoutRef.current = setTimeout(() => {
          const newUsed = [...previousTargets, currentTarget.student.id]
          setPreviousTargets(newUsed)
          selectNextTarget(targetStudents, newUsed)
        }, 1000)
      }
    } else {
      playBeep('failure')
      if (mode === 'time-attack') {
        setCombo(1)
        setTimeLeft(prev => Math.max(prev - 3, 0))
      }
    }
  }

  // Controls
  const handleSkip = () => {
    if (gameOver || !currentTarget) return
    playBeep('failure')
    
    if (mode === 'time-attack') {
      setCombo(1)
      setTimeLeft(prev => Math.max(prev - 2, 0))
      const newUsed = [...previousTargets, currentTarget.student.id]
      setPreviousTargets(newUsed)
      selectNextTarget(targetStudents, newUsed)
    } else {
      const newUsed = [...previousTargets, currentTarget.student.id]
      setPreviousTargets(newUsed)
      selectNextTarget(targetStudents, newUsed)
    }
  }

  const handleReveal = () => {
    if (mode !== 'practice' || solved) return
    setSolved(true)
    playBeep('failure')
  }

  if (loading) {
    return <LoadingScreen fadeLoading={fadeLoading} />
  }

  return (
    <div className="halo-guesser-container font-prompt">
      
      {/* 1. LOBBY / MODE SELECTION */}
      {mode === 'lobby' && (
        <div className="halo-lobby-panel animate-scaleUp">
          <div className="halo-lobby-header">
            <span className="halo-lobby-badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
              Mini-Game
            </span>
            <h2 className="halo-lobby-title">GEAR GUESSER</h2>
            <p className="halo-lobby-subtitle">ทายภาพ Unique Gear ไอเทมเฉพาะตัวของเหล่านักเรียนแห่งคิโวทอส!</p>
          </div>

          <div className="lobby-profile-row animate-scaleUp">
            {/* Personal Best */}
            <div className="halo-highscore-box" style={{ backgroundColor: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
              <Trophy className="highscore-trophy-icon animate-pulse" style={{ color: '#f59e0b' }} />
              <div>
                <span className="highscore-label" style={{ color: '#f59e0b' }}>PERSONAL BEST SCORE</span>
                <h4 className="highscore-value">{highScore.toLocaleString()} PTS</h4>
              </div>
            </div>

            {/* Profile Setup */}
            <div className="halo-profile-box">
              <span className="profile-label">SENSEI NAME (ชื่อของคุณครู)</span>
              {!isEditingName ? (
                <div className="profile-display-mode">
                  <span className="profile-name-text">{playerName}</span>
                  <button 
                    onClick={() => {
                      setTempName(playerName)
                      setIsEditingName(true)
                    }}
                    className="profile-edit-btn"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> แก้ไข
                  </button>
                </div>
              ) : (
                <div className="profile-edit-mode">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value.slice(0, 15))}
                    placeholder="ชื่อของคุณครู..."
                    className="profile-name-input-edit"
                    autoFocus
                  />
                  <div className="profile-edit-actions">
                    <button 
                      onClick={handleSaveName}
                      disabled={submittingScore}
                      className="profile-action-btn save"
                    >
                      <Check className="w-3 h-3" /> บันทึก
                    </button>
                    <button 
                      onClick={() => setIsEditingName(false)}
                      className="profile-action-btn cancel"
                    >
                      <X className="w-3 h-3" /> ยกเลิก
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mode Selection */}
          <div className="halo-mode-grid">
            <div 
              className="halo-mode-card time-attack" 
              onClick={startTimeAttack}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)';
                e.currentTarget.style.background = 'linear-gradient(180deg, rgba(28, 28, 30, 0.8) 0%, rgba(245, 158, 11, 0.03) 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '';
                e.currentTarget.style.background = '';
              }}
            >
              <div className="mode-card-visual" style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.15)' }}>
                <Timer className="mode-icon" />
              </div>
              <div className="mode-card-content">
                <h3>TIME ATTACK (โหมดจำกัดเวลา)</h3>
                <p>ทายไอเทมเฉพาะตัว (Unique Gear) สุ่มแข่งกับเวลา 60 วินาที! ตอบถูกเพิ่มเวลา ตอบผิดลดเวลา เก็บคะแนนสูงสุดประดับบอร์ดผู้นำรวม!</p>
                <button 
                  className="mode-start-btn" 
                  style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f59e0b';
                    e.target.style.color = '#ffffff';
                    e.target.style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
                    e.target.style.color = '#f59e0b';
                    e.target.style.boxShadow = '';
                  }}
                >
                  START TIME ATTACK
                </button>
              </div>
            </div>

            <div 
              className="halo-mode-card practice" 
              onClick={startPractice}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)';
                e.currentTarget.style.background = 'linear-gradient(180deg, rgba(28, 28, 30, 0.8) 0%, rgba(245, 158, 11, 0.03) 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '';
                e.currentTarget.style.background = '';
              }}
            >
              <div className="mode-card-visual" style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.15)' }}>
                <HelpCircle className="mode-icon" />
              </div>
              <div className="mode-card-content">
                <h3>PRACTICE (โหมดฝึกซ้อม)</h3>
                <p>วิเคราะห์ภาพของใช้ส่วนตัวและทายแบบไร้ขีดจำกัดแรงกดดัน พร้อมระบบวิเคราะห์คุณสมบัติกระสุน เกราะ และประเภทหน่วยรบ</p>
                <button 
                  className="mode-start-btn"
                  style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f59e0b';
                    e.target.style.color = '#ffffff';
                    e.target.style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
                    e.target.style.color = '#f59e0b';
                    e.target.style.boxShadow = '';
                  }}
                >
                  START PRACTICE
                </button>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <Leaderboard db={db} collectionName="gear_leaderboard" refreshTrigger={refreshTrigger} />

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
            <button onClick={onBack} className="header-back-btn">
              กลับหน้าหลัก
            </button>
          </div>
        </div>
      )}

      {/* 2. ACTIVE GAMEPLAY INTERFACE */}
      {mode !== 'lobby' && !gameOver && currentTarget && (
        <div className="halo-gameplay-layout animate-fadeInUp">
          
          <div className="halo-gameplay-header">
            <div className="gameplay-title-area">
              <span className="gameplay-badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.2)', borderWidth: '1px' }}>
                {mode === 'time-attack' ? 'TIME ATTACK' : 'PRACTICE MODE'}
              </span>
              <button onClick={exitToLobby} className="gameplay-exit-btn">
                ออกเกม
              </button>
            </div>

            {mode === 'time-attack' && (
              <div className="gameplay-hud-stats">
                <div className="hud-stat-box score">
                  <span>SCORE</span>
                  <div className="hud-val">{score}</div>
                </div>
                
                <div className="hud-stat-box combo">
                  <span>COMBO</span>
                  <div className={`hud-val combo-glow ${combo > 1 ? 'active' : ''}`}>
                    {combo}x
                  </div>
                </div>

                <div className="hud-stat-box timer">
                  <span>TIME LEFT</span>
                  <div className={`hud-val timer-number ${timeLeft <= 10 ? 'timer-danger' : ''}`}>
                    {timeLeft}s
                  </div>
                </div>
              </div>
            )}
          </div>

          {mode === 'time-attack' && (
            <div className="glowing-timer-bar-wrapper">
              <div 
                className={`glowing-timer-bar ${timeLeft <= 10 ? 'danger' : ''}`}
                style={{ 
                  width: `${(timeLeft / 60) * 100}%`,
                  background: timeLeft <= 10 ? 'linear-gradient(90deg, #ef4444, #f43f5e)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                  boxShadow: timeLeft <= 10 ? '0 0 10px rgba(239, 68, 68, 0.8)' : '0 0 8px rgba(245, 158, 11, 0.5)'
                }}
              ></div>
            </div>
          )}

          <div className="halo-gameplay-workspace">
            
            {/* Left Column: Gear Graphic Viewport */}
            <div className="halo-display-section">
              <div className="halo-card-wrapper">
                
                {/* Contrast controls */}
                <div className="halo-contrast-controls">
                  <button 
                    onClick={() => setBgStyle('slate')} 
                    className={`contrast-btn ${bgStyle === 'slate' ? 'active' : ''}`}
                  >
                    Dark Slate
                  </button>
                  <button 
                    onClick={() => setBgStyle('chess')} 
                    className={`contrast-btn ${bgStyle === 'chess' ? 'active' : ''}`}
                  >
                    Checker
                  </button>
                  <button 
                    onClick={() => setBgStyle('light')} 
                    className={`contrast-btn ${bgStyle === 'light' ? 'active' : ''}`}
                  >
                    Light
                  </button>
                </div>

                <div className={`halo-graphic-viewport bg-style-${bgStyle}`} style={{ padding: '20px' }}>
                  <SecureImage
                    src={`/images/gear/full/${currentTarget.student.id}.webp`}
                    alt="Mystery Unique Gear"
                    className={`mystery-halo-image ${solved ? 'solved-glow' : ''}`}
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    onContextMenu={(e) => e.preventDefault()}
                    style={{ 
                      maxHeight: '98%', 
                      maxWidth: '98%', 
                      objectFit: 'contain', 
                      filter: solved ? 'drop-shadow(0 2px 20px rgba(245, 158, 11, 0.8))' : 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))', 
                      pointerEvents: 'none', 
                      userSelect: 'none', 
                      WebkitUserDrag: 'none' 
                    }}
                    onError={(e) => {
                      if (e.target.src.includes('/full/')) {
                        e.target.src = `/images/gear/icon/${currentTarget.student.id}.webp`;
                      } else {
                        e.target.src = '/images/schoolicon/ETC.png';
                      }
                    }}
                  />
                  
                  {solved && (
                    <div className="halo-viewport-solved-overlay">
                      <Sparkles className="solved-sparkle-icon" style={{ color: '#f59e0b' }} />
                      <span style={{ color: '#f59e0b' }}>CORRECT CHARACTER!</span>
                    </div>
                  )}
                </div>

                {/* Target profile preview when solved */}
                {solved && (
                  <div className="solved-target-profile-card animate-scaleUp">
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
                      <p style={{ color: '#f59e0b', fontWeight: '500', fontSize: '0.8rem', marginTop: '2px' }}>
                        ⚙️ {currentTarget.student.gearName}
                      </p>
                      <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>{currentTarget.student.school}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Autocomplete Input and Guess log */}
            <div className="halo-guesser-section">
              
              {!solved ? (
                <div className="halo-input-container">
                  <h4 className="guesser-input-title">ป้อนชื่อนักเรียนที่เป็นเจ้าของ Unique Gear ชิ้นนี้:</h4>
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
                    
                    <button onClick={handleSkip} className="gameplay-skip-btn">
                      ข้าม
                    </button>
                    {mode === 'practice' && (
                      <button onClick={handleReveal} className="gameplay-reveal-btn" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                        เฉลย
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="halo-round-solved-card animate-scaleUp" style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                  <div className="round-solved-header">
                    <Check className="w-5 h-5 text-emerald-400" />
                    <span>ทายถูกต้อง!</span>
                  </div>
                  <p className="round-solved-desc">
                    ไอเทมเฉพาะตัว <strong style={{ color: '#f59e0b' }}>{currentTarget.student.gearName}</strong> เป็นของ <strong className="text-cyan-400">{currentTarget.student.englishName}</strong>
                  </p>
                  
                  {mode === 'practice' && (
                    <button 
                      onClick={() => {
                        const newUsed = [...previousTargets, currentTarget.student.id]
                        setPreviousTargets(newUsed)
                        selectNextTarget(targetStudents, newUsed)
                      }}
                      className="practice-next-btn animate-pulse"
                      style={{ backgroundColor: '#f59e0b' }}
                    >
                      อุปกรณ์ถัดไป <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Guesses Log Column */}
              <div className="halo-guess-logs-container">
                <h4 className="logs-header-title">ประวัติการทายในรอบนี้ ({guesses.length})</h4>
                
                {guesses.length === 0 ? (
                  <div className="logs-empty-state">
                    ยังไม่มีข้อมูลการทายสำหรับ Unique Gear ชิ้นนี้ ป้อนชื่อนักเรียนเพื่อเริ่มทาย!
                  </div>
                ) : (
                  <div className="logs-scroll-area">
                    {[...guesses].reverse().map((g, index) => (
                      <div key={`${g.id}-${index}`} className={`guess-log-row ${g.isCorrect ? 'correct' : 'incorrect'}`}>
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

                        {mode === 'practice' && (
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
                        )}

                        <div className="log-status-icon-box">
                          {g.isCorrect ? (
                            <span className="log-status-text correct">CORRECT</span>
                          ) : (
                            <span className="log-status-text incorrect">WRONG</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* 3. GAME OVER SCREEN */}
      {gameOver && (
        <div className="halo-gameover-panel animate-scaleUp">
          <div className="gameover-header">
            <AlertTriangle className="gameover-warning-icon" style={{ color: '#f59e0b' }} />
            <h2 className="gameover-title">TIME UP!</h2>
            <p className="gameover-subtitle">หมดเวลาการท้าทายทาย Unique Gear นักเรียน</p>
          </div>

          <div className="gameover-stats-grid">
            <div className="gameover-stat-card final-score" style={{ borderTopColor: '#f59e0b' }}>
              <span>FINAL SCORE</span>
              <h3>{score}</h3>
            </div>
            
            <div className="gameover-stat-card correct-count" style={{ borderTopColor: '#10b981' }}>
              <span>CORRECT ANSWERS</span>
              <h3>{correctAnswersList.length}</h3>
            </div>

            <div className="gameover-stat-card pr-trophy" style={{ borderTopColor: '#f59e0b' }}>
              <span>HIGH SCORE</span>
              <h3>{highScore}</h3>
            </div>
          </div>

          <div className="gameover-answers-log-container">
            <h4 className="gameover-answers-title">Unique Gear ที่คุณครูทายถูกในรอบนี้:</h4>
            
            {correctAnswersList.length === 0 ? (
              <div className="gameover-answers-empty">
                คุณครูยังทายไม่ถูกเลยในรอบนี้... มาพยายามใหม่อีกครั้งกันเถอะ!
              </div>
            ) : (
              <div className="gameover-answers-scroll">
                {correctAnswersList.map((item, idx) => (
                  <div key={`${item.student.id}-${idx}`} className="gameover-answer-row">
                    <div className="gameover-row-student">
                      <span className="row-index">#{idx + 1}</span>
                      <img 
                        src={`/images/student/icon/${item.student.id}.webp`}
                        alt={item.student.englishName}
                        className="gameover-row-avatar"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/schoolicon/ETC.png';
                        }}
                      />
                      <div className="gameover-row-name">
                        <span className="eng">{item.student.englishName}</span>
                        <span className="school">{item.student.school} ({item.student.gearName})</span>
                      </div>
                    </div>

                    <div className="gameover-row-points">
                      <span className="points-added" style={{ color: '#f59e0b' }}>+{item.scoreGained} PTS</span>
                      {item.combo > 1 && <span className="points-combo" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>{item.combo}x Combo</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {score > 0 && (
            <div className="gameover-leaderboard-section">
              {db ? (
                scoreSubmitted ? (
                  <div className="leaderboard-submitted-msg animate-scaleUp">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span>บันทึกสถิติสูงสุดใหม่ของคุณไปยังบอร์ดคะแนนระดับโลกแล้ว! (ครู: {playerName})</span>
                  </div>
                ) : (
                  <div className="leaderboard-submitted-msg info animate-scaleUp">
                    <span>ทำคะแนนให้มากกว่าสถิติสูงสุดเดิมของคุณครูเพื่ออัปเดตบอร์ดผู้นำรวม!</span>
                  </div>
                )
              ) : (
                <div className="gameover-leaderboard-offline">
                  <span>⚠️ Leaderboard ออฟไลน์อยู่ (คะแนนของคุณถูกบันทึกเฉพาะในเบราว์เซอร์นี้)</span>
                </div>
              )}
            </div>
          )}

          <div className="gameover-actions">
            <button onClick={startTimeAttack} className="gameover-btn-restart" style={{ backgroundColor: '#f59e0b' }}>
              <RotateCcw className="w-4 h-4" /> ท้าทายอีกครั้ง
            </button>
            <button onClick={exitToLobby} className="gameover-btn-exit">
              กลับหน้าเลือกโหมด
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
