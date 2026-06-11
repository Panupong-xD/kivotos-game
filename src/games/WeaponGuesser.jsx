import React, { useState, useEffect, useRef } from 'react'
import Autocomplete from '../components/Autocomplete.jsx'
import LoadingScreen from '../components/LoadingScreen.jsx'
import Leaderboard from '../components/Leaderboard.jsx'
import { Timer, Trophy, Play, RotateCcw, AlertTriangle, ArrowRight, Check, X, Edit2, Sparkles, HelpCircle } from 'lucide-react'

import { db } from '../firebase.js'
import { collection, doc, setDoc, getDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore'

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

const getOrCreatePlayerUuid = () => {
  let uuid = localStorage.getItem('ba_weapon_player_uuid')
  if (!uuid) {
    uuid = 'user_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
    localStorage.setItem('ba_weapon_player_uuid', uuid)
  }
  return uuid
}

export default function WeaponGuesser({ soundEnabled, onBack, setCustomBackAction }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [fadeLoading, setFadeLoading] = useState(true)

  // 'lobby', 'time-attack', 'practice'
  const [mode, setMode] = useState('lobby')

  // Play States
  const [currentTarget, setCurrentTarget] = useState(null) // { student, weaponFile }
  const [previousTargets, setPreviousTargets] = useState([])
  const [guesses, setGuesses] = useState([])
  const [solved, setSolved] = useState(false)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(1)
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('ba_weapon_high_score') || '0', 10)
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
  
  const lastFetchTimeRef = useRef(0)
  const lastSavedNameRef = useRef(localStorage.getItem('ba_weapon_player_name') || 'Anonymous Sensei')

  // Leaderboard States
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('ba_weapon_player_name') || 'Anonymous Sensei'
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
        const docRef = doc(db, 'weapon_leaderboard', uuid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const dbData = docSnap.data()
          if (dbData.score && dbData.score > highScore) {
            setHighScore(dbData.score)
            localStorage.setItem('ba_weapon_high_score', dbData.score.toString())
          }
          if (dbData.name) {
            lastSavedNameRef.current = dbData.name
            if (!localStorage.getItem('ba_weapon_player_name')) {
              setPlayerName(dbData.name)
              localStorage.setItem('ba_weapon_player_name', dbData.name)
            }
          }
        }
      } catch (err) {
        console.warn("Failed to sync profile with database:", err)
      }
    }
    syncProfileWithDb()
  }, [db])

  // Save Name
  const handleSaveName = async () => {
    const finalName = tempName.trim() ? tempName.trim() : "Anonymous Sensei"
    setPlayerName(finalName)
    localStorage.setItem('ba_weapon_player_name', finalName)
    setIsEditingName(false)

    if (finalName === lastSavedNameRef.current) return

    if (db && highScore > 0) {
      setSubmittingScore(true)
      try {
        const uuid = getOrCreatePlayerUuid()
        await setDoc(doc(db, 'weapon_leaderboard', uuid), {
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
          localStorage.setItem('ba_weapon_high_score', score.toString())
          isNewHighScore = true
        }

        if (db) {
          try {
            const uuid = getOrCreatePlayerUuid()
            const finalName = playerName.trim() ? playerName.trim() : "Anonymous Sensei"
            
            const docRef = doc(db, 'weapon_leaderboard', uuid)
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
  }, [gameOver, score, mode, db])

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
  const selectNextTarget = (studentsPool = students, currentUsed = previousTargets) => {
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
    selectNextTarget(students, [])
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
    selectNextTarget(students, [])

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
      playBeep(combo >= 3 ? 'combo' : 'success')

      if (mode === 'time-attack') {
        const addedTime = 5
        const baseScore = 100
        const scoreGained = baseScore * combo
        const newScore = score + scoreGained
        setScore(newScore)

        if (newScore > highScore) {
          setHighScore(newScore)
          localStorage.setItem('ba_weapon_high_score', newScore.toString())
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
          const newUsed = [...previousTargets, currentTarget.student.weaponImg]
          setPreviousTargets(newUsed)
          selectNextTarget(students, newUsed)
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
      const newUsed = [...previousTargets, currentTarget.student.weaponImg]
      setPreviousTargets(newUsed)
      selectNextTarget(students, newUsed)
    } else {
      const newUsed = [...previousTargets, currentTarget.student.weaponImg]
      setPreviousTargets(newUsed)
      selectNextTarget(students, newUsed)
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
            <span className="halo-lobby-badge" style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', borderColor: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4' }}>
              Mini-Game
            </span>
            <h2 className="halo-lobby-title">WEAPON GUESSER</h2>
            <p className="halo-lobby-subtitle">ทายภาพอาวุธคู่ใจของเหล่านักเรียนแห่งคิโวทอส!</p>
          </div>

          <div className="lobby-profile-row animate-scaleUp">
            {/* Personal Best */}
            <div className="halo-highscore-box" style={{ backgroundColor: 'rgba(6, 182, 212, 0.05)', borderColor: 'rgba(6, 182, 212, 0.2)' }}>
              <Trophy className="highscore-trophy-icon animate-pulse" style={{ color: '#06b6d4' }} />
              <div>
                <span className="highscore-label" style={{ color: '#06b6d4' }}>PERSONAL BEST SCORE</span>
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
            <div className="halo-mode-card time-attack" onClick={startTimeAttack}>
              <div className="mode-card-visual">
                <Timer className="mode-icon" />
              </div>
              <div className="mode-card-content">
                <h3>TIME ATTACK (โหมดจำกัดเวลา)</h3>
                <p>ทายอาวุธสุ่มแข่งกับเวลา 60 วินาที! ตอบถูกเพิ่มเวลา ตอบผิดลดเวลา มีระบบ Combo ทวีคูณคะแนนเพื่อชิงความเป็นหนึ่ง!</p>
                <button className="mode-start-btn speed-accent">START TIME ATTACK</button>
              </div>
            </div>

            <div className="halo-mode-card practice" onClick={startPractice}>
              <div className="mode-card-visual">
                <HelpCircle className="mode-icon" />
              </div>
              <div className="mode-card-content">
                <h3>PRACTICE (โหมดฝึกซ้อม)</h3>
                <p>วิเคราะห์ภาพปืนและทายแบบไร้ขีดจำกัดแรงกดดัน พร้อมระบบวิเคราะห์ความสอดคล้องของ ปืน โรงเรียน และประเภทกระสุน</p>
                <button className="mode-start-btn practice-accent">START PRACTICE</button>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <Leaderboard db={db} collectionName="weapon_leaderboard" refreshTrigger={refreshTrigger} />

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
              <span className={`gameplay-badge ${mode === 'time-attack' ? 'time-attack-mode' : 'practice-mode'}`} style={mode === 'practice' ? { backgroundColor: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', borderColor: 'rgba(6, 182, 212, 0.2)' } : {}}>
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
                style={{ width: `${(timeLeft / 60) * 100}%` }}
              ></div>
            </div>
          )}

          <div className="halo-gameplay-workspace">
            
            {/* Left Column: Weapon Graphic Viewport */}
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

                <div className={`halo-graphic-viewport bg-style-${bgStyle}`} style={{ padding: '10px' }}>
                  <img
                    src={`/images/weapon/${currentTarget.weaponFile}`}
                    alt="Mystery Weapon"
                    className={`mystery-halo-image ${solved ? 'solved-glow' : ''}`}
                    style={{ maxHeight: '98%', maxWidth: '98%', objectFit: 'contain', filter: solved ? 'drop-shadow(0 2px 15px rgba(0,229,255,0.6))' : 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/schoolicon/ETC.png';
                    }}
                  />
                  
                  {solved && (
                    <div className="halo-viewport-solved-overlay">
                      <Sparkles className="solved-sparkle-icon" style={{ color: '#00e5ff' }} />
                      <span style={{ color: '#00e5ff' }}>CORRECT CHARACTER!</span>
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
                      <p>{currentTarget.student.school} • {currentTarget.student.weaponType} ({currentTarget.student.weaponName})</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Autocomplete Input and Guess log */}
            <div className="halo-guesser-section">
              
              {!solved ? (
                <div className="halo-input-container">
                  <h4 className="guesser-input-title">ป้อนชื่อนักเรียนที่เป็นเจ้าของอาวุธชิ้นนี้:</h4>
                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <div style={{ flex: 1 }}>
                      <Autocomplete
                        ref={autocompleteRef}
                        suggestions={students}
                        onSelect={handleGuess}
                        guessedIds={guesses.map(g => g.id)}
                        placeholder="ค้นหาตามชื่อนักเรียน (เช่น Aru, Shiroko, Aris)..."
                      />
                    </div>
                    
                    <button onClick={handleSkip} className="gameplay-skip-btn">
                      ข้าม
                    </button>
                    {mode === 'practice' && (
                      <button onClick={handleReveal} className="gameplay-reveal-btn" style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', borderColor: 'rgba(6, 182, 212, 0.2)' }}>
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
                    อาวุธ <strong style={{ color: '#00e5ff' }}>{currentTarget.student.weaponName}</strong> คือปืนประจำตัวของ <strong className="text-cyan-400">{currentTarget.student.englishName}</strong>
                  </p>
                  
                  {mode === 'practice' && (
                    <button 
                      onClick={() => {
                        const newUsed = [...previousTargets, currentTarget.student.weaponImg]
                        setPreviousTargets(newUsed)
                        selectNextTarget(students, newUsed)
                      }}
                      className="practice-next-btn animate-pulse"
                      style={{ backgroundColor: '#06b6d4' }}
                    >
                      อาวุธถัดไป <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Guesses Log Column */}
              <div className="halo-guess-logs-container">
                <h4 className="logs-header-title">ประวัติการทายในรอบนี้ ({guesses.length})</h4>
                
                {guesses.length === 0 ? (
                  <div className="logs-empty-state">
                    ยังไม่มีข้อมูลการทายสำหรับอาวุธชิ้นนี้ ป้อนชื่อนักเรียนเพื่อเริ่มทาย!
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
                            {/* Weapon Type Match */}
                            <span className={`log-pill ${g.weaponTypeMatch ? 'match' : 'no-match'}`} title="ประเภทปืน">
                              {g.weaponTypeMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              {g.weaponType}
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
            <AlertTriangle className="gameover-warning-icon" style={{ color: '#06b6d4' }} />
            <h2 className="gameover-title">TIME UP!</h2>
            <p className="gameover-subtitle">หมดเวลาความท้าทายทายอาวุธนักเรียน</p>
          </div>

          <div className="gameover-stats-grid">
            <div className="gameover-stat-card final-score" style={{ borderTopColor: '#06b6d4' }}>
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
            <h4 className="gameover-answers-title">อาวุธของนักเรียนที่คุณครูทายถูกในรอบนี้:</h4>
            
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
                        <span className="school">{item.student.school} ({item.student.weaponName})</span>
                      </div>
                    </div>

                    <div className="gameover-row-points">
                      <span className="points-added" style={{ color: '#06b6d4' }}>+{item.scoreGained} PTS</span>
                      {item.combo > 1 && <span className="points-combo" style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>{item.combo}x Combo</span>}
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
                    <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
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
            <button onClick={startTimeAttack} className="gameover-btn-restart" style={{ backgroundColor: '#06b6d4' }}>
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
