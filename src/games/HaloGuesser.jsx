import React, { useState, useEffect, useRef } from 'react'
import Autocomplete from '../components/Autocomplete.jsx'
import LoadingScreen from '../components/LoadingScreen.jsx'
import Leaderboard from '../components/Leaderboard.jsx'
import { Timer, Trophy, Play, RotateCcw, AlertTriangle, ArrowRight, Eye, Volume2, VolumeX, Sparkles, HelpCircle, RefreshCw, LayoutGrid, Check, X, Edit2 } from 'lucide-react'

import { db } from '../firebase.js'
import { collection, doc, setDoc, getDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore'
import SecureImage from '../components/SecureImage.jsx'

// Validated list of 183 halo image filenames in public/images/halos
const HALO_FILES = [
  "Airi_Halo.png",
  "Akane_Halo.png",
  "Akari_Halo.png",
  "Akemi_Halo.png",
  "Akira_Halo.png",
  "Ako_Halo.png",
  "Alice_Halo.png",
  "Aoi_Halo.png",
  "Arata_Halo.png",
  "Arona_Angered_Halo.png",
  "Arona_Halo.png",
  "Arona_Happy_Halo.png",
  "Arona_Motivated_Halo.png",
  "Arona_Sad_Halo.png",
  "Arona_Shocked_Halo.png",
  "Aru_Halo.png",
  "Asuna_Halo.png",
  "Atsuko_Halo.png",
  "Ayame_Halo.png",
  "Ayane_Halo.png",
  "Ayumu_Halo.png",
  "Azusa_Halo.png",
  "Binah_Halo.png",
  "Cherino_Halo.png",
  "Chesed_Halo.png",
  "Chihiro_Halo.png",
  "Chinatsu_Halo.png",
  "Chise_Halo.png",
  "Chokmah_Halo.png",
  "Da'at_Halo.png",
  "Decagrammaton_Halo.png",
  "Eimi_Halo.png",
  "Eri_Halo.png",
  "Erika_Halo.png",
  "Fubuki_Halo.png",
  "Fuuka_Halo.png",
  "Fuyu_Halo.png",
  "GSC_President_Halo.png",
  "Geburah_Halo.png",
  "Haine_Halo.png",
  "Hanae_Halo.png",
  "Hanako_Halo.png",
  "Hare_Halo.png",
  "Haruka_Halo.png",
  "Haruna_Halo.png",
  "Hasumi_Halo.png",
  "Hibiki_Halo.png",
  "Hifumi_Halo.png",
  "Hikari_Halo.png",
  "Himari_Halo.png",
  "Hina_Halo.png",
  "Hinata_Halo.png",
  "Hiromi_Halo.png",
  "Hiyori_Halo.png",
  "Hod_Halo.png",
  "Hoshino_Halo.png",
  "Ibuki_Halo.png",
  "Ichika_Halo.png",
  "Iori_Halo.png",
  "Iroha_Halo.png",
  "Izumi_Halo.png",
  "Izuna_Halo.png",
  "Junko_Halo.png",
  "Juri_Halo.png",
  "Kaede_Halo.png",
  "Kaguya_Halo.png",
  "Kaho_Halo.png",
  "Kai_Halo.png",
  "Kanna_Halo.png",
  "Kanoe_Halo.png",
  "Karin_Halo.png",
  "Kasumi_Halo.png",
  "Kaya_Halo.png",
  "Kayoko_Halo.png",
  "Kazusa_Halo.png",
  "Kei_Halo.png",
  "Kether_Halo.png",
  "Kirara_Halo.png",
  "Kirino_Halo.png",
  "Kisaki_Halo.png",
  "Koharu_Halo.png",
  "Kokona_Halo.png",
  "Kokuriko_Halo.png",
  "Konoka_Halo.png",
  "Kotama_Halo.png",
  "Kotori_Halo.png",
  "Koyuki_Halo.png",
  "Kurumi_Halo.png",
  "Kuzunoha_Halo.png",
  "Mai_Halo.png",
  "Maia_Halo.png",
  "Maki_Halo.png",
  "Makoto_Halo.png",
  "Malkuth_Halo.png",
  "Mari_Halo.png",
  "Marina_Halo.png",
  "Mashiro_Halo.png",
  "Megu_Halo.png",
  "Meru_Halo.png",
  "Michiru_Halo.png",
  "Midori_Halo.png",
  "Mika_Halo.png",
  "Miku_Halo.png",
  "Mimori_Halo.png",
  "Mina_Halo.png",
  "Mine_Halo.png",
  "Minori_Halo.png",
  "Mirai_Halo.png",
  "Misaka_Mikoto_Halo.png",
  "Misaki_Halo.png",
  "Misuzu_Halo.png",
  "Miyako_Halo.png",
  "Miyo_Halo.png",
  "Miyu_Halo.png",
  "Moe_Halo.png",
  "Momiji_Halo.png",
  "Momoi_Halo.png",
  "Momoka_Halo.png",
  "Mutsuki_Halo.png",
  "Nagisa_Halo.png",
  "Nagusa_Halo.png",
  "Natsu_Halo.png",
  "Neru_Halo.png",
  "Niko_Halo.png",
  "Niya_Halo.png",
  "Noa_Halo.png",
  "Nodoka_Halo.png",
  "Nonomi_Halo.png",
  "Nozomi_Halo.png",
  "Otogi_Halo.png",
  "Pina_Halo.png",
  "Plana_Halo.png",
  "Rabu_Halo.png",
  "Reijo_Halo.png",
  "Reisa_Halo.png",
  "Rena_Halo.png",
  "Rin_Halo.png",
  "Rio_Halo.png",
  "Ritsu_Halo.png",
  "Rumi_Halo.png",
  "Saki_Halo.png",
  "Sakurako_Halo.png",
  "Saori_Halo.png",
  "Saten_Ruiko_Halo.png",
  "Satsuki_Halo.png",
  "Saya_Halo.png",
  "Seia_Halo.png",
  "Sena_Halo.png",
  "Serika_Halo.png",
  "Serina_Halo.png",
  "Shigure_Halo.png",
  "Shimiko_Halo.png",
  "Shinon_Halo.png",
  "Shiroko_Halo.png",
  "Shiroko_Terror_Halo.png",
  "Shizuko_Halo.png",
  "Shokuhou_Misaki_Halo.png",
  "Shun_Halo.png",
  "Shuro_Halo.png",
  "Sora_Halo.png",
  "Subaru_Halo.png",
  "Sumire_Halo.png",
  "Sumomo_Halo.png",
  "Suzumi_Halo.png",
  "Takane_Halo.png",
  "Tiphareth_Halo.png",
  "Toki_Halo.png",
  "Tomoe_Halo.png",
  "Tsubaki_Halo.png",
  "Tsubasa_Halo.png",
  "Tsukuyo_Halo.png",
  "Tsumugi_Halo.png",
  "Tsurugi_Halo.png",
  "Ui_Halo.png",
  "Umika_Halo.png",
  "Utaha_Halo.png",
  "Wakamo_Halo.png",
  "Yakumo_Halo.png",
  "Yesod_Halo.png",
  "Yoshimi_Halo.png",
  "Yukino_Halo.png",
  "Yuuka_Halo.png",
  "Yuzu_Halo.png"
];

// Helper to map a story character to their halo file
const findHaloForStoryCharacter = (char) => {
  if (!char || !char.NameEn) return null;
  const nameEn = char.NameEn;
  const nameParts = nameEn.toLowerCase().split(' ');
  let matchedHalo = null;
  
  // 1. Try exact match on NameEn (replacing spaces with underscores)
  const exactEnFile = `${nameEn.replace(/ /g, '_')}_Halo.png`;
  if (HALO_FILES.includes(exactEnFile)) {
    matchedHalo = exactEnFile;
  }
  
  // 2. Try matching by first name or last name
  if (!matchedHalo) {
    for (const part of nameParts) {
      if (part.length <= 2) continue;
      const candidate = `${part.charAt(0).toUpperCase() + part.slice(1)}_Halo.png`;
      if (HALO_FILES.includes(candidate)) {
        matchedHalo = candidate;
        break;
      }
    }
  }

  // 3. Fallback manually defined mappings for special cases
  if (!matchedHalo) {
    const lower = nameEn.toLowerCase();
    if (lower === 'arona') matchedHalo = 'Arona_Halo.png';
    else if (lower === 'plana') matchedHalo = 'Plana_Halo.png';
    else if (lower === 'tendou alice') matchedHalo = 'Alice_Halo.png';
    else if (lower === 'tendou kei') matchedHalo = 'Kei_Halo.png';
    else if (lower === 'hatsune miku') matchedHalo = 'Miku_Halo.png';
    else if (lower === 'misaka mikoto') matchedHalo = 'Misaka_Mikoto_Halo.png';
    else if (lower === 'shokuhou misaki') matchedHalo = 'Shokuhou_Misaki_Halo.png';
    else if (lower === 'saten ruiko') matchedHalo = 'Saten_Ruiko_Halo.png';
    else if (lower === 'shiroko terror') matchedHalo = 'Shiroko_Terror_Halo.png';
    else if (lower === 'nanagami rin') matchedHalo = 'Rin_Halo.png';
    else if (lower === 'okusora ayane') matchedHalo = 'Ayane_Halo.png';
    else if (lower === 'arakawa arata') matchedHalo = 'Arata_Halo.png';
    else if (lower === 'yurizono seia') matchedHalo = 'Seia_Halo.png';
    else if (lower === 'komakaze rabu') matchedHalo = 'Rabu_Halo.png';
    else if (lower === 'goryou nagusa') matchedHalo = 'Nagusa_Halo.png';
  }

  return matchedHalo;
};

// Helper to get or generate persistent player UUID
const getOrCreatePlayerUuid = () => {
  let uuid = localStorage.getItem('ba_player_uuid')
  if (!uuid) {
    uuid = 'user_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
    localStorage.setItem('ba_player_uuid', uuid)
  }
  return uuid
}

export default function HaloGuesser({ soundEnabled, onBack, setCustomBackAction }) {
  // Database States
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [fadeLoading, setFadeLoading] = useState(true) // For smooth fade-out transition

  // Game Mode States: 'lobby', 'time-attack', 'practice'
  const [mode, setMode] = useState('lobby')

  // Play States
  const [currentTarget, setCurrentTarget] = useState(null) // { student, haloFile }
  const [previousTargets, setPreviousTargets] = useState([]) // list of already answered targets in current session
  const [guesses, setGuesses] = useState([]) // current round guesses
  const [solved, setSolved] = useState(false)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(1)
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('ba_halo_high_score') || '0', 10)
  })

  // Timer States (for Time Attack)
  const [timeLeft, setTimeLeft] = useState(60)
  const [timerActive, setTimerActive] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [correctAnswersList, setCorrectAnswersList] = useState([]) // { student, scoreGained, combo }

  // Visual customizer: 'slate' | 'chess' | 'light'
  const [bgStyle, setBgStyle] = useState('slate')

  const timerRef = useRef(null)
  const autocompleteRef = useRef(null)
  const nextRoundTimeoutRef = useRef(null)
  
  // Anti-spam caching refs
  const lastFetchTimeRef = useRef(0)
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

  // Sync player profile & high score from Firestore on mount
  useEffect(() => {
    const syncProfileWithDb = async () => {
      if (!db) return
      const uuid = getOrCreatePlayerUuid()
      try {
        const docRef = doc(db, 'halo_leaderboard', uuid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const dbData = docSnap.data()
          if (dbData.score && dbData.score > highScore) {
            setHighScore(dbData.score)
            localStorage.setItem('ba_halo_high_score', dbData.score.toString())
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

  // Save name changes to local storage and Firestore database (with comparison check)
  const handleSaveName = async () => {
    const finalName = tempName.trim() ? tempName.trim() : "Anonymous Sensei"
    setPlayerName(finalName)
    localStorage.setItem('ba_player_name', finalName)
    setIsEditingName(false)

    // Skip write if the name has not actually changed
    if (finalName === lastSavedNameRef.current) return

    if (db && highScore > 0) {
      setSubmittingScore(true)
      try {
        const uuid = getOrCreatePlayerUuid()
        await setDoc(doc(db, 'halo_leaderboard', uuid), {
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


  // Auto-submit score when gameOver is triggered (only if it's a new personal best or database high)
  useEffect(() => {
    if (gameOver && mode === 'time-attack' && score > 0) {
      const autoSubmitScore = async () => {
        let isNewHighScore = false
        if (score > highScore) {
          setHighScore(score)
          localStorage.setItem('ba_halo_high_score', score.toString())
          isNewHighScore = true
        }

        if (db) {
          try {
            const uuid = getOrCreatePlayerUuid()
            const finalName = playerName.trim() ? playerName.trim() : "Anonymous Sensei"
            
            // Check if score is higher than current record in DB
            const docRef = doc(db, 'halo_leaderboard', uuid)
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



  // Audio Context synth helper
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
        const notes = [392, 523.25, 659.25, 783.99] // G4, C5, E5, G5
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
        const notes = [392, 349.23, 311.13, 261.63] // G4, F4, Eb4, C4
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

  // Load story characters & prepare database
  useEffect(() => {
    async function loadData() {
      const startTime = Date.now()
      try {
        const res = await fetch('/jp_data/story_characters_info.json')
        const data = await res.json()
        const list = []
        for (const name in data) {
          const char = data[name]
          const haloFile = findHaloForStoryCharacter(char)
          if (haloFile) {
            list.push({
              id: char.NameEn.replace(/ /g, '_'),
              name: char.Name,
              devName: char.NameEn,
              pathName: char.NameEn.replace(/ /g, '_').toLowerCase(),
              englishName: char.NameEn,
              school: char.School || 'ETC',
              schoolTh: char.SchoolTh || 'อื่นๆ',
              schoolYear: char.Age || 'N/A',
              icon: char.IconLocalPath ? char.IconLocalPath.replace('./', '/') : '',
              haloFile: haloFile
            })
          }
        }
        setStudents(list)
        
        // Ensure loader is visible for at least 300ms to allow a smooth animation transition
        const elapsed = Date.now() - startTime
        const delay = Math.max(0, 300 - elapsed)
        
        setTimeout(() => {
          setFadeLoading(false)
          setTimeout(() => {
            setLoading(false)
          }, 300)
        }, delay)
      } catch (err) {
        console.error("Failed to load story characters in HaloGuesser:", err)
        setFadeLoading(false)
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Cleanup ref timeouts and back action on unmount
  useEffect(() => {
    return () => {
      if (nextRoundTimeoutRef.current) clearTimeout(nextRoundTimeoutRef.current)
      if (setCustomBackAction) {
        setCustomBackAction(null)
      }
    }
  }, [setCustomBackAction])

  // Timer handler for Time Attack
  useEffect(() => {
    let interval = null
    if (timerActive) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // End Game immediately
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

  // Select next halo
  const selectNextTarget = (studentsPool = students, currentUsed = previousTargets) => {
    if (studentsPool.length === 0) return

    // Try to filter out already answered targets to avoid immediate repeating
    let available = studentsPool.filter(s => !currentUsed.includes(s.haloFile))
    if (available.length === 0) {
      // Reset if all are used
      available = studentsPool
      setPreviousTargets([])
    }

    // Pick a random student
    const randomStudent = available[Math.floor(Math.random() * available.length)]
    
    setCurrentTarget({
      student: randomStudent,
      haloFile: randomStudent.haloFile
    })
    setGuesses([])
    setSolved(false)

    // Automatically focus the Autocomplete input field
    setTimeout(() => {
      if (autocompleteRef.current) {
        autocompleteRef.current.focus()
      }
    }, 50)
  }

  // Start Time Attack Mode
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

  // Start Practice Mode
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

  // Exit Game back to Halo lobby
  const exitToLobby = () => {
    setTimerActive(false)
    if (timerRef.current) clearInterval(timerRef.current)
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

    // Avoid duplicate guesses for same target
    if (guesses.some(g => g.id === guessedStudent.id)) return

    const isCorrect = guessedStudent.haloFile === currentTarget.haloFile

    // Add guess to history
    const updatedGuesses = [...guesses, {
      ...guessedStudent,
      isCorrect,
      schoolMatch: guessedStudent.school === currentTarget.student.school,
      yearMatch: guessedStudent.schoolYear === currentTarget.student.schoolYear,
      squadMatch: guessedStudent.squadType === currentTarget.student.squadType,
      armorMatch: guessedStudent.armorType === currentTarget.student.armorType,
    }]
    setGuesses(updatedGuesses)

    if (isCorrect) {
      // CORRECT ANSWER!
      setSolved(true)
      playBeep(combo >= 3 ? 'combo' : 'success')

      if (mode === 'time-attack') {
        const addedTime = 5
        const baseScore = 100
        const scoreGained = baseScore * combo
        const newScore = score + scoreGained
        setScore(newScore)

        // Save High Score if higher
        if (newScore > highScore) {
          setHighScore(newScore)
          localStorage.setItem('ba_halo_high_score', newScore.toString())
        }

        // Add correct details
        setCorrectAnswersList(prev => [
          ...prev, 
          { 
            student: currentTarget.student, 
            scoreGained, 
            combo 
          }
        ])

        // Add time bonus
        setTimeLeft(prev => Math.min(prev + addedTime, 99))

        // Increase combo (max 5x)
        setCombo(prev => Math.min(prev + 1, 5))

        // Auto advance to next halo in Time Attack after brief delay
        nextRoundTimeoutRef.current = setTimeout(() => {
          const newUsed = [...previousTargets, currentTarget.haloFile]
          setPreviousTargets(newUsed)
          selectNextTarget(students, newUsed)
        }, 1000)
      }
    } else {
      // INCORRECT ANSWER
      playBeep('failure')

      if (mode === 'time-attack') {
        // Reset Combo
        setCombo(1)
        // Time Penalty
        setTimeLeft(prev => Math.max(prev - 3, 0))
      }
    }
  }

  // Skip the current halo
  const handleSkip = () => {
    if (gameOver || !currentTarget) return

    playBeep('failure')
    
    if (mode === 'time-attack') {
      setCombo(1)
      // Skip penalty
      setTimeLeft(prev => Math.max(prev - 2, 0))
      
      const newUsed = [...previousTargets, currentTarget.haloFile]
      setPreviousTargets(newUsed)
      selectNextTarget(students, newUsed)
    } else {
      // In practice mode, we skip directly or let them reveal first.
      // Let's just advance to the next target.
      const newUsed = [...previousTargets, currentTarget.haloFile]
      setPreviousTargets(newUsed)
      selectNextTarget(students, newUsed)
    }
  }

  // Reveal Answer in Practice Mode
  const handleReveal = () => {
    if (mode !== 'practice' || solved) return
    setSolved(true)
    playBeep('failure')
  }

  // Render Loader
  if (loading) {
    return <LoadingScreen fadeLoading={fadeLoading} />
  }

  return (
    <div className="halo-guesser-container font-prompt">
      
      {/* 1. LOBBY / MODE SELECTION */}
      {mode === 'lobby' && (
        <div className="halo-lobby-panel animate-scaleUp">
          <div className="halo-lobby-header">
            <span className="halo-lobby-badge">Mini-Game</span>
            <h2 className="halo-lobby-title">HALO GUESSER</h2>
            <p className="halo-lobby-subtitle">ทายวงฮาโลปริศนาของเหล่านักเรียนแห่งคิโวทอส!</p>
          </div>

          {/* Lobby Profile & Score Side-by-Side Row */}
          <div className="lobby-profile-row animate-scaleUp">
            {/* High Score Trophy Section */}
            <div className="halo-highscore-box">
              <Trophy className="highscore-trophy-icon animate-pulse" />
              <div>
                <span className="highscore-label">PERSONAL BEST SCORE</span>
                <h4 className="highscore-value">{highScore.toLocaleString()} PTS</h4>
              </div>
            </div>

            {/* Sensei Profile Setup Box */}
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
                      title="บันทึก"
                    >
                      <Check className="w-3 h-3" /> บันทึก
                    </button>
                    <button 
                      onClick={() => setIsEditingName(false)}
                      className="profile-action-btn cancel"
                      title="ยกเลิก"
                    >
                      <X className="w-3 h-3" /> ยกเลิก
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Selection Cards */}
          <div className="halo-mode-grid">
            
            {/* Card 1: Time Attack (Main Mode) */}
            <div className="halo-mode-card time-attack" onClick={startTimeAttack}>
              <div className="mode-card-visual">
                <Timer className="mode-icon" />
              </div>
              <div className="mode-card-content">
                <h3>TIME ATTACK (โหมดจำกัดเวลา)</h3>
                <p>ทำคะแนนสูงสุดทายฮาโลแข่งกับเวลา 60 วินาที! ตอบถูกเพิ่มเวลา ตอบผิดลดเวลา มีระบบ Combo ทวีคูณคะแนน</p>
                <button className="mode-start-btn speed-accent">START TIME ATTACK</button>
              </div>
            </div>

            {/* Card 2: Practice Mode */}
            <div className="halo-mode-card practice" onClick={startPractice}>
              <div className="mode-card-visual">
                <HelpCircle className="mode-icon" />
              </div>
              <div className="mode-card-content">
                <h3>PRACTICE (โหมดฝึกซ้อม)</h3>
                <p>ทายฮาโลแบบไร้แรงกดดัน ไม่มีจับเวลา เหมาะสำหรับฝึกฝนจดจำฮาโลพร้อมระบบวิเคราะห์เบาะแสโรงเรียนและชั้นปี</p>
                <button className="mode-start-btn practice-accent">START PRACTICE</button>
              </div>
            </div>

          </div>

          {/* Leaderboard */}
          <Leaderboard db={db} collectionName="halo_leaderboard" refreshTrigger={refreshTrigger} />

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
          
          {/* Top Info Bar */}
          <div className="halo-gameplay-header">
            <div className="gameplay-title-area">
              <span className={`gameplay-badge ${mode === 'time-attack' ? 'time-attack-mode' : 'practice-mode'}`}>
                {mode === 'time-attack' ? 'TIME ATTACK' : 'PRACTICE MODE'}
              </span>
              <button onClick={exitToLobby} className="gameplay-exit-btn">
                ออกเกม
              </button>
            </div>

            {/* Time Attack HUD */}
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

          {/* Time Attack Linear Glowing progress bar */}
          {mode === 'time-attack' && (
            <div className="glowing-timer-bar-wrapper">
              <div 
                className={`glowing-timer-bar ${timeLeft <= 10 ? 'danger' : ''}`}
                style={{ width: `${(timeLeft / 60) * 100}%` }}
              ></div>
            </div>
          )}

          {/* Main Workspace split */}
          <div className="halo-gameplay-workspace">
            
            {/* Left side: Halo Display Card */}
            <div className="halo-display-section">
              <div className="halo-card-wrapper">
                
                {/* Contrast control toggles */}
                <div className="halo-contrast-controls">
                  <button 
                    onClick={() => setBgStyle('slate')} 
                    className={`contrast-btn ${bgStyle === 'slate' ? 'active' : ''}`}
                    title="พื้นหลังสีเข้มหรูหรา"
                  >
                    Dark Slate
                  </button>
                  <button 
                    onClick={() => setBgStyle('chess')} 
                    className={`contrast-btn ${bgStyle === 'chess' ? 'active' : ''}`}
                    title="พื้นหลังตาหมากรุก"
                  >
                    Checker
                  </button>
                  <button 
                    onClick={() => setBgStyle('light')} 
                    className={`contrast-btn ${bgStyle === 'light' ? 'active' : ''}`}
                    title="พื้นหลังสีสว่าง"
                  >
                    Light
                  </button>
                </div>

                {/* Halo graphic display */}
                <div className={`halo-graphic-viewport bg-style-${bgStyle}`}>
                  <SecureImage
                    src={`/images/halos/${currentTarget.haloFile}`}
                    alt="Mystery Halo"
                    className={`mystery-halo-image ${solved ? 'solved-glow' : ''}`}
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    onContextMenu={(e) => e.preventDefault()}
                    style={{ pointerEvents: 'none', userSelect: 'none', WebkitUserDrag: 'none' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/schoolicon/ETC.png';
                    }}
                  />
                  
                  {/* Solved overlay indicator */}
                  {solved && (
                    <div className="halo-viewport-solved-overlay">
                      <Sparkles className="solved-sparkle-icon" />
                      <span>CORRECT CHARACTER!</span>
                    </div>
                  )}
                </div>

                {/* Target profile preview when solved */}
                {solved && (
                  <div className="solved-target-profile-card animate-scaleUp">
                    <img 
                      src={currentTarget.student.icon || '/images/schoolicon/ETC.png'}
                      alt={currentTarget.student.englishName}
                      className="solved-profile-avatar"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/schoolicon/ETC.png';
                      }}
                    />
                    <div className="solved-profile-details">
                      <h3>{currentTarget.student.englishName}</h3>
                      <p>{currentTarget.student.name} • {currentTarget.student.school}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Guesser & Logs */}
            <div className="halo-guesser-section">
              
              {/* Guess Autocomplete Box */}
              {!solved ? (
                <div className="halo-input-container">
                  <h4 className="guesser-input-title">ป้อนชื่อนักเรียนที่เป็นเจ้าของฮาโลนี้:</h4>
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
                    
                    {/* Game Controls */}
                    <button onClick={handleSkip} className="gameplay-skip-btn">
                      ข้าม
                    </button>
                    {mode === 'practice' && (
                      <button onClick={handleReveal} className="gameplay-reveal-btn">
                        เฉลย
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Next Round Banner */
                <div className="halo-round-solved-card animate-scaleUp">
                  <div className="round-solved-header">
                    <Check className="w-5 h-5 text-emerald-400" />
                    <span>ทายถูกต้อง!</span>
                  </div>
                  <p className="round-solved-desc">
                    ฮาโลนี้คือของ <strong className="text-cyan-400">{currentTarget.student.englishName}</strong>
                  </p>
                  
                  {mode === 'practice' && (
                    <button 
                      onClick={() => {
                        const newUsed = [...previousTargets, currentTarget.haloFile]
                        setPreviousTargets(newUsed)
                        selectNextTarget(students, newUsed)
                      }}
                      className="practice-next-btn animate-pulse"
                    >
                      ฮาโลถัดไป <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Guesses Log Column */}
              <div className="halo-guess-logs-container">
                <h4 className="logs-header-title">ประวัติการทายในรอบนี้ ({guesses.length})</h4>
                
                {guesses.length === 0 ? (
                  <div className="logs-empty-state">
                    ยังไม่มีข้อมูลการทายสำหรับฮาโลนี้ ป้อนชื่อนักเรียนเพื่อเริ่มทาย!
                  </div>
                ) : (
                  <div className="logs-scroll-area">
                    {/* Guess rows in reverse chronological order */}
                    {[...guesses].reverse().map((g, index) => (
                      <div key={`${g.id}-${index}`} className={`guess-log-row ${g.isCorrect ? 'correct' : 'incorrect'}`}>
                        {/* Avatar & Name */}
                        <div className="log-student-info">
                          <img
                            src={g.icon || '/images/schoolicon/ETC.png'}
                            alt={g.englishName}
                            className="log-student-avatar"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/images/schoolicon/ETC.png';
                            }}
                          />
                          <span className="log-student-name">{g.englishName}</span>
                        </div>

                        {/* Attribute comparison pills (Only shown in Practice Mode for education) */}
                        {mode === 'practice' && (
                          <div className="log-pills-row">
                            <span className={`log-pill ${g.schoolMatch ? 'match' : 'no-match'}`} title="โรงเรียน">
                              {g.schoolMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              {g.school}
                            </span>
                            <span className={`log-pill ${g.yearMatch ? 'match' : 'no-match'}`} title="อายุ">
                              {g.yearMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              {g.schoolYear === 'N/A' ? 'อายุ: N/A' : `อายุ: ${g.schoolYear} ปี`}
                            </span>
                          </div>
                        )}

                        {/* Status Icon */}
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

      {/* 3. TIME ATTACK GAME OVER SCREEN */}
      {gameOver && (
        <div className="halo-gameover-panel animate-scaleUp">
          <div className="gameover-header">
            <AlertTriangle className="gameover-warning-icon" />
            <h2 className="gameover-title">TIME UP!</h2>
            <p className="gameover-subtitle">หมดเวลาการท้าทายคิโวทอสฮาโลสเตชั่น</p>
          </div>

          {/* Stats Summary cards */}
          <div className="gameover-stats-grid">
            <div className="gameover-stat-card final-score">
              <span>FINAL SCORE</span>
              <h3>{score}</h3>
            </div>
            
            <div className="gameover-stat-card correct-count">
              <span>CORRECT ANSWERS</span>
              <h3>{correctAnswersList.length}</h3>
            </div>

            <div className="gameover-stat-card pr-trophy">
              <span>HIGH SCORE</span>
              <h3>{highScore}</h3>
            </div>
          </div>

          {/* List of correct answers encountered */}
          <div className="gameover-answers-log-container">
            <h4 className="gameover-answers-title">นักเรียนที่คุณครูทายถูกในรอบนี้:</h4>
            
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
                        src={item.student.icon || '/images/schoolicon/ETC.png'}
                        alt={item.student.englishName}
                        className="gameover-row-avatar"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/schoolicon/ETC.png';
                        }}
                      />
                      <div className="gameover-row-name">
                        <span className="eng">{item.student.englishName}</span>
                        <span className="school">{item.student.school}</span>
                      </div>
                    </div>

                    <div className="gameover-row-points">
                      <span className="points-added">+{item.scoreGained} PTS</span>
                      {item.combo > 1 && <span className="points-combo">{item.combo}x Combo</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leaderboard Auto-Save Notice */}
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

          {/* Buttons to restart or exit */}
          <div className="gameover-actions">
            <button onClick={startTimeAttack} className="gameover-btn-restart">
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
