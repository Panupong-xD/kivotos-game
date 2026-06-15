import React, { useState, useEffect, useRef } from 'react'
import Autocomplete from '../components/Autocomplete.jsx'
import LoadingScreen from '../components/LoadingScreen.jsx'
import Leaderboard from '../components/Leaderboard.jsx'
import { 
  Timer, Trophy, Play, Pause, RotateCcw, AlertTriangle, 
  ArrowRight, Check, X, Edit2, Sparkles, HelpCircle, 
  Volume2, VolumeX, Info, Shield, Swords, Music, Lock
} from 'lucide-react'

import { db } from '../firebase.js'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'

// Base URL for SchaleDB CDN Voice files
const CDN_BASE_URL = 'https://r2.schaledb.com/voice/';

// Helpers for translations and formatting
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

const formatSchoolYear = (yr) => {
  if (!yr) return 'N/A';
  if (yr === '1年生') return '1st Year (ปี 1)'
  if (yr === '2年生') return '2nd Year (ปี 2)'
  if (yr === '3年生') return '3rd Year (ปี 3)'
  if (yr === '停学中') return 'Suspended (พักการเรียน)'
  if (yr === '中退') return 'Dropped out (ลาออก)'
  return yr;
}

const formatAge = (age) => {
  if (!age) return 'N/A';
  return age.replace('歳', ' ปี').replace('years old', ' ปี');
}

const formatCV = (cv) => {
  if (!cv) return 'N/A';
  return cv;
}

const getOrCreatePlayerUuid = () => {
  let uuid = localStorage.getItem('ba_player_uuid')
  if (!uuid) {
    uuid = 'user_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
    localStorage.setItem('ba_player_uuid', uuid)
  }
  return uuid
}

export default function VoiceGuesser({ soundEnabled, onBack, setCustomBackAction }) {
  // DB & Loading States
  const [allStudents, setAllStudents] = useState([])
  const [targetStudents, setTargetStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [fadeLoading, setFadeLoading] = useState(true)

  // 'lobby', 'time-attack', 'practice'
  const [mode, setMode] = useState('lobby')

  // Gameplay Target Pool
  const [currentTarget, setCurrentTarget] = useState(null) // { student, voiceLines, primaryVoice, secondaryVoice }
  const [previousTargets, setPreviousTargets] = useState([])
  const [guesses, setGuesses] = useState([])
  const [solved, setSolved] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(1)
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('ba_voice_high_score') || '0', 10)
  })

  // Audio Streaming Player States
  const [isPlaying, setIsPlaying] = useState(false)
  const [isAudioLoading, setIsAudioLoading] = useState(false)
  const [playbackError, setPlaybackError] = useState(false)
  const [volume, setVolume] = useState(0.5)

  // Secondary hint audio player states
  const [isHintPlaying, setIsHintPlaying] = useState(false)
  const [isHintAudioLoading, setIsHintAudioLoading] = useState(false)

  // Timer States (Time Attack)
  const [timeLeft, setTimeLeft] = useState(60)
  const [timerActive, setTimerActive] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [correctAnswersList, setCorrectAnswersList] = useState([])

  const autocompleteRef = useRef(null)
  const nextRoundTimeoutRef = useRef(null)
  
  // Audio Refs
  const audioRef = useRef(null)
  const hintAudioRef = useRef(null)

  // Leaderboard States
  const lastSavedNameRef = useRef(localStorage.getItem('ba_player_name') || 'Anonymous Sensei')
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('ba_player_name') || 'Anonymous Sensei'
  })
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState('')
  const [submittingScore, setSubmittingScore] = useState(false)
  const [scoreSubmitted, setScoreSubmitted] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Sync personal high score with Firestore on mount
  useEffect(() => {
    const syncProfileWithDb = async () => {
      if (!db) return
      const uuid = getOrCreatePlayerUuid()
      try {
        const docRef = doc(db, 'voice_leaderboard', uuid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const dbData = docSnap.data()
          if (dbData.score && dbData.score > highScore) {
            setHighScore(dbData.score)
            localStorage.setItem('ba_voice_high_score', dbData.score.toString())
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
  }, [db])

  // Save Player Name to LocalStorage / Firebase
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
        await setDoc(doc(db, 'voice_leaderboard', uuid), {
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

  // Auto-submit score on game over
  useEffect(() => {
    if (gameOver && mode === 'time-attack' && score > 0) {
      const autoSubmitScore = async () => {
        let isNewHighScore = false
        if (score > highScore) {
          setHighScore(score)
          localStorage.setItem('ba_voice_high_score', score.toString())
          isNewHighScore = true
        }

        if (db) {
          try {
            const uuid = getOrCreatePlayerUuid()
            const finalName = playerName.trim() ? playerName.trim() : "Anonymous Sensei"
            
            const docRef = doc(db, 'voice_leaderboard', uuid)
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

  // Play Web Audio synth beeps for UI interactions
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

  // Load target lists and voice JSON mapping
  useEffect(() => {
    async function loadData() {
      const startTime = Date.now()
      try {
        const [studentRes, voiceRes] = await Promise.all([
          fetch('/jp_data/students.min.json'),
          fetch('/jp_data/voice.min.json')
        ])

        const studentsData = await studentRes.json()
        const voiceData = await voiceRes.json()

        const suggestionsList = []
        const targetsList = []

        for (const id in studentsData) {
          const s = studentsData[id]
          if (s.IsReleased && s.IsReleased[0]) {
            const studentObj = {
              id: s.Id,
              name: s.Name,
              devName: s.DevName,
              pathName: s.PathName,
              englishName: getEnglishName(s.PathName, s.DevName),
              school: s.School,
              club: s.Club || 'N/A',
              schoolYear: s.SchoolYear || 'N/A',
              squadType: s.SquadType,
              bulletType: s.BulletType,
              armorType: s.ArmorType,
              weaponType: s.WeaponType,
              age: s.CharacterAge || 'N/A',
              birthday: s.Birthday || 'N/A',
              cv: s.CharacterVoice || 'N/A',
              hobby: Array.isArray(s.Hobby) ? s.Hobby.join(', ') : s.Hobby || 'N/A',
            }

            suggestionsList.push(studentObj)

            // Verify if student has voice entries
            const voiceEntry = voiceData[id]
            if (voiceEntry) {
              const clips = []
              const parseClips = (arr, cat) => {
                if (arr) {
                  arr.forEach(c => {
                    if (c.AudioClip) {
                      clips.push({
                        group: c.Group,
                        audioClip: c.AudioClip,
                        transcription: c.Transcription || '',
                        category: cat
                      })
                    }
                  })
                }
              }

              parseClips(voiceEntry.Normal, 'Normal')
              parseClips(voiceEntry.Lobby, 'Lobby')
              parseClips(voiceEntry.Battle, 'Battle')

              if (clips.length > 0) {
                targetsList.push({
                  student: studentObj,
                  voiceLines: clips
                })
              }
            }
          }
        }

        setAllStudents(suggestionsList)
        setTargetStudents(targetsList)

        const elapsed = Date.now() - startTime
        const delay = Math.max(0, 300 - elapsed)
        setTimeout(() => {
          setFadeLoading(false)
          setTimeout(() => {
            setLoading(false)
          }, 300)
        }, delay)

      } catch (err) {
        console.error("Failed to load voice guesser data:", err)
        setFadeLoading(false)
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Cleanup audios and actions on unmount
  useEffect(() => {
    return () => {
      stopAudio()
      stopHintAudio()
      if (nextRoundTimeoutRef.current) clearTimeout(nextRoundTimeoutRef.current)
      if (setCustomBackAction) {
        setCustomBackAction(null)
      }
    }
  }, [setCustomBackAction])

  // Timer Tick logic
  useEffect(() => {
    let interval = null
    if (timerActive) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setTimerActive(false)
            setGameOver(true)
            stopAudio()
            stopHintAudio()
            playBeep('gameover')
            if (nextRoundTimeoutRef.current) clearTimeout(nextRoundTimeoutRef.current)
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

  // Audio control functions (Triggering PLAY synchronously under direct user gestures)
  const playPrimaryAudio = () => {
    if (!currentTarget || !currentTarget.primaryVoice) return

    stopHintAudio()

    // Toggle Play/Pause on existing audio instance
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        setIsAudioLoading(true)
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true)
            setIsAudioLoading(false)
          })
          .catch(err => {
            console.error("Failed to resume primary audio:", err)
            setIsAudioLoading(false)
            setPlaybackError(true)
          })
      }
      return
    }

    // Initialize new audio instance
    const fullUrl = `${CDN_BASE_URL}${currentTarget.primaryVoice.audioClip}`
    setIsAudioLoading(true)
    setPlaybackError(false)

    const audio = new Audio(fullUrl)
    audio.volume = soundEnabled ? volume : 0
    audioRef.current = audio

    // Attach listeners
    audio.onplay = () => setIsPlaying(true)
    audio.onplaying = () => {
      setIsPlaying(true)
      setIsAudioLoading(false)
    }
    audio.onpause = () => setIsPlaying(false)
    audio.onended = () => setIsPlaying(false)
    audio.onerror = () => {
      setIsAudioLoading(false)
      setIsPlaying(false)
      setPlaybackError(true)
    }

    // Call play synchronously to bypass autoplay policies
    audio.play()
      .then(() => {
        setIsAudioLoading(false)
      })
      .catch(err => {
        console.warn("Direct primary play failed:", err)
        setIsAudioLoading(false)
        setPlaybackError(true)
      })
  }

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setIsPlaying(false)
      setIsAudioLoading(false)
    }
  }

  const playSecondaryAudio = () => {
    if (!currentTarget || !currentTarget.secondaryVoice) return

    stopAudio()

    if (hintAudioRef.current) {
      if (isHintPlaying) {
        hintAudioRef.current.pause()
        setIsHintPlaying(false)
      } else {
        setIsHintAudioLoading(true)
        hintAudioRef.current.play()
          .then(() => {
            setIsHintPlaying(true)
            setIsHintAudioLoading(false)
          })
          .catch(err => {
            console.error("Failed to play secondary audio:", err)
            setIsHintAudioLoading(false)
          })
      }
      return
    }

    const fullUrl = `${CDN_BASE_URL}${currentTarget.secondaryVoice.audioClip}`
    setIsHintAudioLoading(true)

    const audio = new Audio(fullUrl)
    audio.volume = soundEnabled ? volume : 0
    hintAudioRef.current = audio

    audio.onplay = () => setIsHintPlaying(true)
    audio.onplaying = () => {
      setIsHintPlaying(true)
      setIsHintAudioLoading(false)
    }
    audio.onpause = () => setIsHintPlaying(false)
    audio.onended = () => setIsHintPlaying(false)
    audio.onerror = () => {
      setIsHintAudioLoading(false)
      setIsHintPlaying(false)
    }

    // Call play synchronously
    audio.play()
      .then(() => {
        setIsHintAudioLoading(false)
      })
      .catch(err => {
        console.warn("Direct hint play failed:", err)
        setIsHintAudioLoading(false)
      })
  }

  const stopHintAudio = () => {
    if (hintAudioRef.current) {
      hintAudioRef.current.pause()
      hintAudioRef.current = null
      setIsHintPlaying(false)
      setIsHintAudioLoading(false)
    }
  }

  // Adjust volume dynamically
  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    if (audioRef.current) {
      audioRef.current.volume = soundEnabled ? val : 0
    }
    if (hintAudioRef.current) {
      hintAudioRef.current.volume = soundEnabled ? val : 0
    }
  }

  // Choose next puzzle target
  const selectNextTarget = (pool = targetStudents, currentUsed = previousTargets) => {
    if (pool.length === 0) return

    let available = pool.filter(t => !currentUsed.includes(t.student.id))
    if (available.length === 0) {
      available = pool
      setPreviousTargets([])
    }

    // Pick random target
    const randomTarget = available[Math.floor(Math.random() * available.length)]
    
    // Choose primary voice clip (prefer lobby or normal over battle, if available)
    const voicePool = randomTarget.voiceLines
    const mainPool = voicePool.filter(c => c.category === 'Lobby' || c.category === 'Normal')
    const primaryVoice = mainPool.length > 0 
      ? mainPool[Math.floor(Math.random() * mainPool.length)]
      : voicePool[Math.floor(Math.random() * voicePool.length)]

    // Choose secondary voice clip for Hint 2 (must be different)
    const remainingPool = voicePool.filter(c => c.audioClip !== primaryVoice.audioClip)
    const secondaryVoice = remainingPool.length > 0 
      ? remainingPool[Math.floor(Math.random() * remainingPool.length)]
      : primaryVoice // Fallback if only 1 voice line exists

    setCurrentTarget({
      student: randomTarget.student,
      voiceLines: voicePool,
      primaryVoice,
      secondaryVoice
    })

    setGuesses([])
    setAttempts(0)
    setSolved(false)
    stopAudio()
    stopHintAudio()

    setTimeout(() => {
      if (autocompleteRef.current) {
        autocompleteRef.current.focus()
      }
    }, 100)
  }

  // Censoring logic for Transcription text
  const censorTranscriptionText = (text, student) => {
    if (!text) return ''
    let censored = text
    const words = new Set()

    if (student.name) words.add(student.name)
    if (student.devName) words.add(student.devName)
    if (student.englishName) {
      words.add(student.englishName)
      const base = student.englishName.split(' ')[0]
      if (base) words.add(base)
    }
    if (student.pathName) {
      words.add(student.pathName)
      const parts = student.pathName.split('_')
      parts.forEach(p => words.add(p))
    }

    const sortedWords = Array.from(words)
      .filter(w => w && w.length > 1)
      .sort((a, b) => b.length - a.length)

    for (const word of sortedWords) {
      const esc = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
      const regex = new RegExp(esc, 'gi')
      censored = censored.replace(regex, '[???]')
    }

    return censored
  }

  // Find transcript clue: scans through voice lines to find one that has transcription text
  const getRedactedTranscriptClue = () => {
    if (!currentTarget) return ''
    // Check primary voice first
    if (currentTarget.primaryVoice.transcription) {
      return censorTranscriptionText(currentTarget.primaryVoice.transcription, currentTarget.student)
    }
    // Search remaining
    const withText = currentTarget.voiceLines.find(c => c.transcription)
    if (withText) {
      return censorTranscriptionText(withText.transcription, currentTarget.student)
    }
    return `[ไม่มีบทพูดบันทึกในระบบ] (หมวดหมู่เสียง: ${currentTarget.primaryVoice.category})`
  }

  // Main Guess submit handler
  const handleGuess = (guessedStudent) => {
    if (solved || gameOver || !currentTarget) return
    if (guesses.some(g => g.id === guessedStudent.id)) return

    const isCorrect = guessedStudent.id === currentTarget.student.id
    const newAttempt = attempts + 1
    setAttempts(newAttempt)

    const updatedGuesses = [...guesses, {
      ...guessedStudent,
      isCorrect,
      schoolMatch: guessedStudent.school === currentTarget.student.school,
      clubMatch: guessedStudent.club === currentTarget.student.club,
      squadTypeMatch: guessedStudent.squadType === currentTarget.student.squadType,
      bulletTypeMatch: guessedStudent.bulletType === currentTarget.student.bulletType,
      armorTypeMatch: guessedStudent.armorType === currentTarget.student.armorType
    }]

    setGuesses(updatedGuesses)

    if (isCorrect) {
      setSolved(true)
      stopAudio()
      stopHintAudio()
      playBeep(combo >= 3 ? 'combo' : 'success')

      if (mode === 'time-attack') {
        const addedTime = 5
        const baseScore = 100
        const scoreGained = baseScore * combo
        const newScore = score + scoreGained
        setScore(newScore)

        if (newScore > highScore) {
          setHighScore(newScore)
          localStorage.setItem('ba_voice_high_score', newScore.toString())
        }

        setCorrectAnswersList(prev => [
          ...prev,
          { student: currentTarget.student, scoreGained, combo }
        ])

        setTimeLeft(prev => Math.min(prev + addedTime, 99))
        setCombo(prev => Math.min(prev + 1, 5))

        nextRoundTimeoutRef.current = setTimeout(() => {
          const newUsed = [...previousTargets, currentTarget.student.id]
          setPreviousTargets(newUsed)
          selectNextTarget(targetStudents, newUsed)
        }, 1200)
      }
    } else {
      playBeep('failure')
      if (mode === 'time-attack') {
        setCombo(1)
        setTimeLeft(prev => Math.max(prev - 3, 0))
      } else {
        // Practice Mode: check if failed completely (5 attempts max)
        if (newAttempt >= 5) {
          setSolved(true)
          stopAudio()
          stopHintAudio()
        }
      }
    }
  }

  // Skip round
  const handleSkip = () => {
    if (gameOver || !currentTarget) return
    playBeep('failure')
    stopAudio()
    stopHintAudio()

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
    stopAudio()
    stopHintAudio()
    playBeep('failure')
  }

  // Lobby mode starters
  const startTimeAttack = () => {
    if (nextRoundTimeoutRef.current) clearTimeout(nextRoundTimeoutRef.current)
    setMode('time-attack')
    setTimeLeft(60)
    setScore(0)
    setCombo(1)
    setAttempts(0)
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
    setAttempts(0)
    setSolved(false)
    setPreviousTargets([])
    selectNextTarget(targetStudents, [])

    if (setCustomBackAction) {
      setCustomBackAction(() => exitToLobby)
    }
  }

  const exitToLobby = () => {
    setTimerActive(false)
    stopAudio()
    stopHintAudio()
    if (nextRoundTimeoutRef.current) clearTimeout(nextRoundTimeoutRef.current)
    setMode('lobby')
    setGameOver(false)
    if (setCustomBackAction) {
      setCustomBackAction(null)
    }
  }

  if (loading) {
    return <LoadingScreen fadeLoading={fadeLoading} />
  }

  return (
    <div className="halo-guesser-container font-prompt">
      <style dangerouslySetInnerHTML={{__html: `
        /* Visual visualizer media dashboard inside left section */
        .media-disc-viewport {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background: radial-gradient(circle, #0f172a 35%, #1e293b 40%, #090d16 100%);
          border: 4px solid rgba(6, 182, 212, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: inset 0 0 20px rgba(0,0,0,0.8), 0 4px 15px rgba(0,0,0,0.5);
        }

        .media-disc-spin {
          animation: disc-spin 5s linear infinite;
        }

        @keyframes disc-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .audio-waveform-bars {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 4px;
          height: 36px;
          width: 100%;
          margin-top: 24px;
        }

        .waveform-bar-item {
          width: 4px;
          height: 6px;
          background: rgba(6, 182, 212, 0.4);
          border-radius: 2px;
          transition: height 0.15s ease;
        }

        .waveform-bar-item.animating {
          animation: bounce-wave 1s ease-in-out infinite alternate;
        }

        .waveform-bar-item:nth-child(2) { animation-delay: 0.1s; animation-duration: 0.8s; }
        .waveform-bar-item:nth-child(3) { animation-delay: 0.3s; animation-duration: 1.2s; }
        .waveform-bar-item:nth-child(4) { animation-delay: 0.15s; animation-duration: 0.9s; }
        .waveform-bar-item:nth-child(5) { animation-delay: 0.4s; animation-duration: 0.7s; }
        .waveform-bar-item:nth-child(6) { animation-delay: 0.2s; animation-duration: 1.1s; }
        .waveform-bar-item:nth-child(7) { animation-delay: 0.35s; animation-duration: 1.0s; }
        .waveform-bar-item:nth-child(8) { animation-delay: 0.05s; animation-duration: 1.3s; }
        .waveform-bar-item:nth-child(9) { animation-delay: 0.45s; animation-duration: 0.8s; }
        .waveform-bar-item:nth-child(10) { animation-delay: 0.25s; animation-duration: 1.0s; }

        @keyframes bounce-wave {
          0% { height: 6px; background: #0891b2; }
          100% { height: 36px; background: #22d3ee; }
        }

        .play-trigger-btn {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: #06b6d4;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          box-shadow: 0 4px 15px rgba(6, 182, 212, 0.4);
          transition: all 0.2s;
          cursor: pointer;
          margin-top: 16px;
        }
        .play-trigger-btn:hover:not(:disabled) {
          transform: scale(1.08);
          background: #0891b2;
          box-shadow: 0 4px 20px rgba(6, 182, 212, 0.6);
        }
        .play-trigger-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .voice-volume-row {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 80%;
          color: #94a3b8;
          font-size: 0.8rem;
          margin-top: 16px;
        }

        .voice-volume-input {
          flex: 1;
          accent-color: #06b6d4;
          height: 4px;
          border-radius: 2px;
          cursor: pointer;
        }

        .category-text-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: #06b6d4;
          background: rgba(6, 182, 212, 0.08);
          border: 1px solid rgba(6, 182, 212, 0.2);
          padding: 3px 12px;
          border-radius: 20px;
          margin-top: 16px;
          letter-spacing: 0.05em;
        }

        /* Clues styling in Practice mode */
        .voice-clues-section {
          width: 100%;
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .voice-clue-card {
          background: rgba(28, 28, 30, 0.6);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .voice-clue-card .label {
          font-weight: 700;
          color: #06b6d4;
          font-size: 0.75rem;
          min-width: 80px;
          text-transform: uppercase;
        }

        .voice-clue-card .content {
          color: #e2e8f0;
          flex: 1;
        }

        .voice-clue-card .locked {
          color: #4b5563;
          font-style: italic;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .inline-audio-play-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.2);
          color: #06b6d4;
          font-weight: 600;
          font-size: 0.75rem;
          padding: 4px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .inline-audio-play-btn:hover {
          background: rgba(6, 182, 212, 0.25);
          border-color: #06b6d4;
        }
      `}} />

      {/* 1. LOBBY / MODE SELECTION */}
      {mode === 'lobby' && (
        <div className="halo-lobby-panel animate-scaleUp">
          <div className="halo-lobby-header">
            <span className="halo-lobby-badge" style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', borderColor: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4' }}>
              MINI-GAME
            </span>
            <h2 className="halo-lobby-title" style={{ fontFamily: 'Outfit, sans-serif' }}>KIVOTOS VOICE GUESSER</h2>
            <p className="halo-lobby-subtitle">ทายเสียงพูดสื่อความรู้สึกของเหล่านักเรียนแห่งคิโวทอส!</p>
          </div>

          <div className="lobby-profile-row animate-scaleUp">
            {/* Personal Best */}
            <div className="halo-highscore-box" style={{ backgroundColor: 'rgba(6, 182, 212, 0.05)', borderColor: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4' }}>
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
            <div 
              className="halo-mode-card time-attack" 
              onClick={startTimeAttack}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)';
                e.currentTarget.style.background = 'linear-gradient(180deg, rgba(28, 28, 30, 0.8) 0%, rgba(6, 182, 212, 0.03) 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '';
                e.currentTarget.style.background = '';
              }}
            >
              <div className="mode-card-visual" style={{ color: '#44c1ef', backgroundColor: 'rgba(68, 185, 239, 0.05)', borderColor: 'rgba(68, 202, 239, 0.15)' }}>
                <Timer className="mode-icon" />
              </div>
              <div className="mode-card-content">
                <h3>TIME ATTACK (โหมดจับเวลา)</h3>
                <p>แข่งกับเวลา 60 วินาที! ตอบถูกเพิ่มเวลาโบนัส +5 วินาที พร้อมเพิ่มตัวคูณ Combo ตอบผิดหัก -3 วินาที และการข้ามหัก -2 วินาที!</p>
                <button 
                  className="mode-start-btn" 
                  style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', border: '1px solid rgba(6, 182, 212, 0.2)' }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#06b6d4';
                    e.target.style.color = '#ffffff';
                    e.target.style.boxShadow = '0 0 15px rgba(6, 182, 212, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(6, 182, 212, 0.1)';
                    e.target.style.color = '#06b6d4';
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
                e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)';
                e.currentTarget.style.background = 'linear-gradient(180deg, rgba(28, 28, 30, 0.8) 0%, rgba(6, 182, 212, 0.03) 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '';
                e.currentTarget.style.background = '';
              }}
            >
              <div className="mode-card-visual" style={{ color: '#06b6d4', backgroundColor: 'rgba(6, 182, 212, 0.05)', borderColor: 'rgba(6, 182, 212, 0.15)' }}>
                <HelpCircle className="mode-icon" />
              </div>
              <div className="mode-card-content">
                <h3>PRACTICE (โหมดฝึกซ้อม)</h3>
                <p>ฝึกฝนการวิเคราะห์เสียงพูดของนักเรียนได้ไม่จำกัดเวลา มีโอกาสทาย 5 ครั้ง และระบบจะค่อยๆ ปลดคำใบ้ออกมาทุกครั้งที่ตอบผิด!</p>
                <button 
                  className="mode-start-btn"
                  style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', border: '1px solid rgba(6, 182, 212, 0.2)' }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#06b6d4';
                    e.target.style.color = '#ffffff';
                    e.target.style.boxShadow = '0 0 15px rgba(6, 182, 212, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(6, 182, 212, 0.1)';
                    e.target.style.color = '#06b6d4';
                    e.target.style.boxShadow = '';
                  }}
                >
                  START PRACTICE
                </button>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <Leaderboard db={db} collectionName="voice_leaderboard" refreshTrigger={refreshTrigger} />

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
              <span className="gameplay-badge" style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', borderColor: 'rgba(6, 182, 212, 0.2)', borderWidth: '1px' }}>
                {mode === 'time-attack' ? 'TIME ATTACK' : 'PRACTICE MODE'}
              </span>
              <button onClick={exitToLobby} className="gameplay-exit-btn">
                ออกเกม
              </button>
            </div>

            <div className="gameplay-hud-stats">
              {mode === 'time-attack' ? (
                <>
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
                </>
              ) : (
                <>
                  <div className="hud-stat-box score">
                    <span>ATTEMPTS</span>
                    <div className="hud-val">{attempts} / 5</div>
                  </div>
                  <div className="hud-stat-box timer">
                    <span>CLIPS POOL</span>
                    <div className="hud-val" style={{ color: '#06b6d4' }}>{currentTarget.voiceLines.length}</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {mode === 'time-attack' && (
            <div className="glowing-timer-bar-wrapper">
              <div 
                className={`glowing-timer-bar ${timeLeft <= 10 ? 'danger' : ''}`}
                style={{ 
                  width: `${(timeLeft / 60) * 100}%`,
                  background: timeLeft <= 10 ? 'linear-gradient(90deg, #ef4444, #f43f5e)' : 'linear-gradient(90deg, #06b6d4, #22d3ee)',
                  boxShadow: timeLeft <= 10 ? '0 0 10px rgba(239, 68, 68, 0.8)' : '0 0 8px rgba(6, 182, 212, 0.5)'
                }}
              ></div>
            </div>
          )}

          <div className="halo-gameplay-workspace">
            
            {/* Left Column: Audio Graphic Viewport */}
            <div className="halo-display-section">
              <div className="halo-card-wrapper">
                <div className="halo-graphic-viewport bg-style-slate" style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  
                  {solved ? (
                    <div className="media-disc-viewport solved-avatar-glow animate-scaleUp" style={{ width: '130px', height: '130px' }}>
                      <img 
                        src={`/images/student/icon/${currentTarget.student.id}.webp`}
                        alt={currentTarget.student.englishName}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/schoolicon/ETC.png';
                        }}
                      />
                    </div>
                  ) : (
                    <div className={`media-disc-viewport ${isPlaying ? 'media-disc-spin' : ''}`}>
                      <div className="absolute inset-2 border border-slate-700/50 rounded-full border-dashed"></div>
                      <Volume2 className={`w-12 h-12 text-cyan-400 ${isPlaying ? 'animate-pulse' : ''}`} style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.6))' }} />
                    </div>
                  )}

                  {/* Waveform */}
                  <div className="audio-waveform-bars">
                    <div className={`waveform-bar-item ${isPlaying ? 'animating' : ''}`}></div>
                    <div className={`waveform-bar-item ${isPlaying ? 'animating' : ''}`}></div>
                    <div className={`waveform-bar-item ${isPlaying ? 'animating' : ''}`}></div>
                    <div className={`waveform-bar-item ${isPlaying ? 'animating' : ''}`}></div>
                    <div className={`waveform-bar-item ${isPlaying ? 'animating' : ''}`}></div>
                    <div className={`waveform-bar-item ${isPlaying ? 'animating' : ''}`}></div>
                    <div className={`waveform-bar-item ${isPlaying ? 'animating' : ''}`}></div>
                    <div className={`waveform-bar-item ${isPlaying ? 'animating' : ''}`}></div>
                    <div className={`waveform-bar-item ${isPlaying ? 'animating' : ''}`}></div>
                    <div className={`waveform-bar-item ${isPlaying ? 'animating' : ''}`}></div>
                  </div>

                  {/* Play Controller button */}
                  <button 
                    onClick={playPrimaryAudio} 
                    disabled={isAudioLoading}
                    className="play-trigger-btn"
                    title={isPlaying ? 'หยุดชั่วคราว' : 'เล่นไฟล์เสียง'}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                  </button>

                  {/* Volume controller */}
                  <div className="voice-volume-row">
                    {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.05" 
                      value={volume} 
                      onChange={handleVolumeChange} 
                      className="voice-volume-input"
                    />
                    <span>{Math.round(volume * 100)}%</span>
                  </div>

                  {/* Voice type label */}
                  <span className="category-text-label">
                    หมวดหมู่เสียง: {currentTarget.primaryVoice.category === 'Lobby' ? 'เสียงหน้าล็อบบี้' : currentTarget.primaryVoice.category === 'Normal' ? 'เสียงปฏิสัมพันธ์ทั่วไป' : 'เสียงระหว่างต่อสู้'}
                  </span>

                  {solved && (
                    <div className="halo-viewport-solved-overlay">
                      <Sparkles className="solved-sparkle-icon" style={{ color: '#06b6d4' }} />
                      <span style={{ color: '#06b6d4' }}>CORRECT CHARACTER!</span>
                    </div>
                  )}
                </div>

                {/* Target profile preview when solved */}
                {solved && (
                  <div className="solved-target-profile-card animate-scaleUp" style={{ borderColor: 'rgba(6, 182, 212, 0.2)' }}>
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
                      <p style={{ color: '#06b6d4', fontWeight: '500', fontSize: '0.8rem', marginTop: '2px' }}>
                        🔊 ผู้พากย์ (CV): {formatCV(currentTarget.student.cv)}
                      </p>
                      <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>{currentTarget.student.school} | {currentTarget.student.club}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Clues layout for Practice mode */}
              {mode === 'practice' && (
                <div className="voice-clues-section">
                  {/* Clue 1: School & Club */}
                  <div className="voice-clue-card">
                    <span className="label">คำใบ้ 1</span>
                    <div className="content">
                      {attempts >= 1 || solved ? (
                        <span>โรงเรียน: <strong className="text-cyan-400">{currentTarget.student.school}</strong> | ชมรม/สังกัด: <strong className="text-slate-300">{currentTarget.student.club}</strong></span>
                      ) : (
                        <span className="locked"><Lock className="w-3.5 h-3.5" /> ปลดล็อคเมื่อทายผิด 1 ครั้ง</span>
                      )}
                    </div>
                  </div>

                  {/* Clue 2: Supplementary voice clip */}
                  <div className="voice-clue-card">
                    <span className="label">คำใบ้ 2</span>
                    <div className="content">
                      {attempts >= 2 || solved ? (
                        <div className="flex items-center gap-2">
                          <span>คลิปเสียงอื่นเพิ่มเติม: </span>
                          <button onClick={playSecondaryAudio} disabled={isHintAudioLoading} className="inline-audio-play-btn">
                            {isHintPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-cyan-400" />}
                            {isHintAudioLoading ? 'กำลังโหลด...' : isHintPlaying ? 'หยุดเสียง' : 'กดฟังเสียงบอกใบ้'}
                          </button>
                        </div>
                      ) : (
                        <span className="locked"><Lock className="w-3.5 h-3.5" /> ปลดล็อคเมื่อทายผิด 2 ครั้ง</span>
                      )}
                    </div>
                  </div>

                  {/* Clue 3: Combat info */}
                  <div className="voice-clue-card">
                    <span className="label">คำใบ้ 3</span>
                    <div className="content">
                      {attempts >= 3 || solved ? (
                        <div className="flex flex-wrap gap-x-4 text-xs">
                          <span>ตำแหน่งรบ: <strong className="text-emerald-400">{currentTarget.student.squadType}</strong></span>
                          <span>ประเภทกระสุน: <strong className="text-yellow-500">{getBulletLabel(currentTarget.student.bulletType)}</strong></span>
                          <span>เกราะหลัก: <strong className="text-sky-400">{getArmorLabel(currentTarget.student.armorType)}</strong></span>
                        </div>
                      ) : (
                        <span className="locked"><Lock className="w-3.5 h-3.5" /> ปลดล็อคเมื่อทายผิด 3 ครั้ง</span>
                      )}
                    </div>
                  </div>

                  {/* Clue 4: Text transcription */}
                  <div className="voice-clue-card">
                    <span className="label">คำใบ้ 4</span>
                    <div className="content">
                      {attempts >= 4 || solved ? (
                        <span className="italic text-cyan-200 text-xs">“ {getRedactedTranscriptClue()} ”</span>
                      ) : (
                        <span className="locked"><Lock className="w-3.5 h-3.5" /> ปลดล็อคเมื่อทายผิด 4 ครั้ง</span>
                      )}
                    </div>
                  </div>

                  {/* Clue 5: Personal details */}
                  <div className="voice-clue-card">
                    <span className="label">คำใบ้ 5</span>
                    <div className="content">
                      {attempts >= 5 || solved ? (
                        <div className="flex flex-wrap gap-x-4 text-xs">
                          <span>ชั้นปี: <strong className="text-white">{formatSchoolYear(currentTarget.student.schoolYear)}</strong></span>
                          <span>อายุ: <strong className="text-pink-400">{formatAge(currentTarget.student.age)}</strong></span>
                          <span>งานอดิเรก: <strong className="text-slate-300">{currentTarget.student.hobby}</strong></span>
                        </div>
                      ) : (
                        <span className="locked"><Lock className="w-3.5 h-3.5" /> ปลดล็อคเมื่อทายผิด 5 ครั้ง</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Right Column: Autocomplete Input and Guess log */}
            <div className="halo-guesser-section">
              
              {!solved ? (
                <div className="halo-input-container">
                  <h4 className="guesser-input-title">ป้อนชื่อตัวละครนักเรียนที่พูดประโยคข้างต้น:</h4>
                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <div style={{ flex: 1 }}>
                      <Autocomplete
                        ref={autocompleteRef}
                        suggestions={allStudents}
                        onSelect={handleGuess}
                        guessedIds={guesses.map(g => g.id)}
                        placeholder="ค้นหาชื่อตัวละครนักเรียน (เช่น Aru, Shiroko, Hina)..."
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
                <div className={`halo-round-solved-card animate-scaleUp ${attempts >= 5 && guesses.every(g => !g.isCorrect) ? 'failed' : ''}`} style={attempts >= 5 && guesses.every(g => !g.isCorrect) ? { backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' } : { backgroundColor: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                  {attempts >= 5 && guesses.every(g => !g.isCorrect) ? (
                    <>
                      <div className="round-solved-header">
                        <X className="w-5 h-5 text-red-500" />
                        <span className="text-red-500">หมดโอกาสทาย!</span>
                      </div>
                      <p className="round-solved-desc">
                        คุณครูใช้สิทธิ์เดาครบ 5 ครั้งแล้ว คำตอบที่ถูกต้องคือ: <strong className="text-cyan-400">{currentTarget.student.englishName}</strong>
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="round-solved-header">
                        <Check className="w-5 h-5 text-emerald-400" />
                        <span>ทายถูกต้อง!</span>
                      </div>
                      <p className="round-solved-desc">
                        เสียงคำพูดปริศนานี้เป็นของนักเรียน <strong className="text-cyan-400">{currentTarget.student.englishName}</strong>
                      </p>
                    </>
                  )}

                  {/* Play extra voice lines of solved character */}
                  <div style={{ textAlign: 'left', background: 'rgba(15, 23, 42, 0.4)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>🎯 ฟังเสียงคลิปอื่นๆ ของ {currentTarget.student.englishName} ({currentTarget.voiceLines.length} คลิป):</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {currentTarget.voiceLines.slice(0, 10).map((vc, idx) => (
                        <button 
                          key={idx}
                          onClick={() => {
                            stopAudio()
                            stopHintAudio()
                            setIsAudioLoading(true)
                            const audio = new Audio(`${CDN_BASE_URL}${vc.audioClip}`)
                            audio.volume = soundEnabled ? volume : 0
                            audioRef.current = audio
                            audio.play()
                              .then(() => {
                                setIsAudioLoading(false)
                                setIsPlaying(true)
                              })
                              .catch(() => setIsAudioLoading(false))
                          }}
                          className="solved-playback-chip"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem', padding: '3px 8px', borderRadius: '4px', color: '#cbd5e1', cursor: 'pointer' }}
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          {vc.group.replace('Idle', ' ').replace('UILobby', 'Lobby ').replace('Battle', 'Battle ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {mode === 'practice' && (
                    <button 
                      onClick={() => {
                        const newUsed = [...previousTargets, currentTarget.student.id]
                        setPreviousTargets(newUsed)
                        selectNextTarget(targetStudents, newUsed)
                      }}
                      className="practice-next-btn animate-pulse"
                      style={{ backgroundColor: '#06b6d4' }}
                    >
                      นักเรียนถัดไป <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Guesses Log Column */}
              <div className="halo-guess-logs-container">
                <h4 className="logs-header-title">ประวัติการทายในรอบนี้ ({guesses.length})</h4>
                
                {guesses.length === 0 ? (
                  <div className="logs-empty-state">
                    ยังไม่มีข้อมูลการทายสำหรับคลิปนี้ ป้อนชื่อนักเรียนเพื่อเริ่มเดา!
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
                            <span className={`log-pill ${g.schoolMatch ? 'match' : 'no-match'}`} title="โรงเรียน">
                              {g.schoolMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              {g.school}
                            </span>
                            <span className={`log-pill ${g.bulletTypeMatch ? 'match' : 'no-match'}`} title="ประเภทกระสุน" style={g.bulletTypeMatch ? { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.2)' } : { backgroundColor: 'rgba(239, 68, 68, 0.08)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.15)' }}>
                              {g.bulletTypeMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              {g.bulletType}
                            </span>
                          </div>
                        )}

                        <div className="log-status-icon-box">
                          {g.isCorrect ? (
                            <span className="log-status-text correct">ถูกต้อง</span>
                          ) : (
                            <span className="log-status-text incorrect">ไม่ใช่</span>
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
            <p className="gameover-subtitle">หมดเวลากิจกรรมท้าทายเสียงพูดของเหล่านักเรียน</p>
          </div>

          <div className="gameover-stats-grid">
            <div className="gameover-stat-card final-score" style={{ borderTopColor: '#ef4444' }}>
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
            <h4 className="gameover-answers-title">นักเรียนที่คุณครูทายเสียงถูกในรอบนี้:</h4>
            
            {correctAnswersList.length === 0 ? (
              <div className="gameover-answers-empty">
                คุณครูยังทายเสียงนักเรียนไม่ถูกเลยในรอบนี้... มาพยายามใหม่อีกครั้งนะ! 🔊
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
                        <span className="school">{item.student.school} | {item.student.club}</span>
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
                    <Sparkles className="w-4 h-4 text-cyan-500 animate-pulse" />
                    <span>บันทึกคะแนนเสียงพูดสูงสุดใหม่ของคุณเรียบร้อยแล้ว! (คุณครู: {playerName})</span>
                  </div>
                ) : (
                  <div className="leaderboard-submitted-msg info animate-scaleUp">
                    <span>ทำคะแนนให้มากกว่าคะแนนสูงสุดเดิมเพื่อส่งผลรวมลงกระดานเกียรติยศ!</span>
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
