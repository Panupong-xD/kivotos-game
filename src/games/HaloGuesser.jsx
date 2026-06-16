import React, { useState, useEffect, useRef } from 'react'
import Autocomplete from '../components/Autocomplete.jsx'
import LoadingScreen from '../components/LoadingScreen.jsx'
import { Timer, Trophy, Play, RotateCcw, AlertTriangle, ArrowRight, Eye, Volume2, VolumeX, Sparkles, HelpCircle, RefreshCw, LayoutGrid, Check, X, Edit2 } from 'lucide-react'
import SecureImage from '../components/SecureImage.jsx'
import { motion, AnimatePresence } from 'framer-motion'

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

export default function HaloGuesser({ soundEnabled, onBack }) {
  // Database States
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [fadeLoading, setFadeLoading] = useState(true) // For smooth fade-out transition

  // Game Mode States: 'practice'
  const [mode, setMode] = useState('practice')

  // Play States
  const [currentTarget, setCurrentTarget] = useState(null) // { student, haloFile }
  const [previousTargets, setPreviousTargets] = useState([]) // list of already answered targets in current session
  const [solved, setSolved] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const [guesses, setGuesses] = useState([])

  // Visual customizer: 'slate' | 'chess' | 'light'
  const [bgStyle, setBgStyle] = useState('slate')

  const autocompleteRef = useRef(null)
  const nextRoundTimeoutRef = useRef(null)

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
        selectNextTarget(list, [])
        
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

  // Cleanup ref timeouts on unmount
  useEffect(() => {
    return () => {
      if (nextRoundTimeoutRef.current) clearTimeout(nextRoundTimeoutRef.current)
    }
  }, [])

  // Select next halo
  const selectNextTarget = (studentsPool = students, currentUsed = previousTargets) => {
    if (nextRoundTimeoutRef.current) clearTimeout(nextRoundTimeoutRef.current)
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
    setIsRevealed(false)

    // Automatically focus the Autocomplete input field
    setTimeout(() => {
      if (autocompleteRef.current) {
        autocompleteRef.current.focus()
      }
    }, 50)
  }

  // Handle Guess selection
  const handleGuess = (guessedStudent) => {
    if (solved || !currentTarget) return

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
      playBeep('success')
      nextRoundTimeoutRef.current = setTimeout(() => {
        const newUsed = [...previousTargets, currentTarget.haloFile]
        setPreviousTargets(newUsed)
        selectNextTarget(students, newUsed)
      }, 1500)
    } else {
      // INCORRECT ANSWER
      playBeep('failure')
    }
  }

  // Skip the current halo
  const handleSkip = () => {
    if (!currentTarget) return

    playBeep('failure')
    
    const newUsed = [...previousTargets, currentTarget.haloFile]
    setPreviousTargets(newUsed)
    selectNextTarget(students, newUsed)
  }

  // Reveal Answer in Practice Mode
  const handleReveal = () => {
    if (solved) return
    setSolved(true)
    setIsRevealed(true)
    playBeep('failure')
  }

  // Render Loader
  if (loading) {
    return <LoadingScreen fadeLoading={fadeLoading} />
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="halo-guesser-container font-prompt"
    >
      {currentTarget && (
        <div className="halo-gameplay-layout">
          
          {/* Top Info Bar */}
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

          {/* Main Workspace split */}
          <div className="halo-gameplay-workspace">
            
            {/* Left side: Halo Display Card */}
            <div className="halo-display-section">
              <div className="halo-card-wrapper" style={{ borderColor: 'rgba(76, 154, 224, 0.3)' }}>
                
                {/* Contrast control toggles */}
                <div className="halo-contrast-controls">
                  <button 
                    onClick={() => setBgStyle('slate')} 
                    className={`contrast-btn ${bgStyle === 'slate' ? 'active' : ''}`}
                    style={bgStyle === 'slate' ? { backgroundColor: 'var(--color-accent)' } : {}}
                    title="พื้นหลังสีเข้มหรูหรา"
                  >
                    Dark Slate
                  </button>
                  <button 
                    onClick={() => setBgStyle('chess')} 
                    className={`contrast-btn ${bgStyle === 'chess' ? 'active' : ''}`}
                    style={bgStyle === 'chess' ? { backgroundColor: 'var(--color-accent)' } : {}}
                    title="พื้นหลังตาหมากรุก"
                  >
                    Checker
                  </button>
                  <button 
                    onClick={() => setBgStyle('light')} 
                    className={`contrast-btn ${bgStyle === 'light' ? 'active' : ''}`}
                    style={bgStyle === 'light' ? { backgroundColor: 'var(--color-accent)' } : {}}
                    title="พื้นหลังสีสว่าง"
                  >
                    Light
                  </button>
                </div>

                {/* Halo graphic display */}
                <motion.div 
                  whileHover={{ scale: 1.015 }}
                  className={`halo-graphic-viewport bg-style-${bgStyle}`}
                >
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
                    <div className="halo-viewport-solved-overlay" style={isRevealed ? { background: 'rgba(28, 28, 30, 0.85)', borderColor: 'rgba(255, 255, 255, 0.15)' } : {}}>
                      <Sparkles className="solved-sparkle-icon animate-pulse" style={isRevealed ? { color: '#8e8e93' } : { color: 'var(--color-accent)' }} />
                      <span>{isRevealed ? 'REVEALED!' : 'CORRECT CHARACTER!'}</span>
                    </div>
                  )}
                </motion.div>

                {/* Target profile preview when solved */}
                <AnimatePresence>
                  {solved && (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="solved-target-profile-card"
                      style={{ borderLeftColor: isRevealed ? '#8e8e93' : 'var(--color-accent)' }}
                    >
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right side: Guesser & Logs */}
            <div className="halo-guesser-section">
              
              {/* Guess Autocomplete Box */}
              <AnimatePresence mode="wait">
                {!solved ? (
                  <motion.div 
                    key="input-box"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="halo-input-container"
                  >
                    <h4 className="guesser-input-title" style={{ color: 'var(--color-accent)' }}>ป้อนชื่อนักเรียนที่เป็นเจ้าของฮาโลนี้:</h4>
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
                      <button onClick={handleSkip} className="gameplay-skip-btn" style={{ borderColor: 'rgba(76, 154, 224, 0.4)' }}>
                        ข้าม
                      </button>
                      <button onClick={handleReveal} className="gameplay-reveal-btn" style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}>
                        เฉลย
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* Next Round Banner */
                  <motion.div 
                    key="solved-box"
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
                      ฮาโลนี้คือของ <strong className="text-cyan-400">{currentTarget.student.englishName}</strong>
                    </p>
                    
                    <button 
                      onClick={() => {
                        const newUsed = [...previousTargets, currentTarget.haloFile]
                        setPreviousTargets(newUsed)
                        selectNextTarget(students, newUsed)
                      }}
                      className="practice-next-btn animate-pulse"
                      style={{ backgroundColor: 'var(--color-accent)' }}
                    >
                      ฮาโลถัดไป <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Guesses Log Column */}
              <div className="halo-guess-logs-container">
                <h4 className="logs-header-title">ประวัติการทายในรอบนี้ ({guesses.length})</h4>
                
                {guesses.length === 0 ? (
                  <div className="logs-empty-state">
                    ยังไม่มีข้อมูลการทายสำหรับฮาโลนี้ ป้อนชื่อนักเรียนเพื่อเริ่มทาย!
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

                          {/* Attribute comparison pills */}
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

                          {/* Status Icon */}
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
