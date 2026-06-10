import React, { useState, useEffect } from 'react'
import Autocomplete from '../components/Autocomplete.jsx'
import WinModal from '../components/WinModal.jsx'
import { RotateCcw } from 'lucide-react'

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
}

// Convert school year labels
const formatSchoolYear = (yr) => {
  if (yr === '1年生') return '1st Year (ปี 1)'
  if (yr === '2年生') return '2nd Year (ปี 2)'
  if (yr === '3年生') return '3rd Year (ปี 3)'
  if (yr === '停学中') return 'Suspended (พักการเรียน)'
  if (yr === '中退') return 'Dropped out (ลาออก)'
  return 'N/A (ไม่มี)'
}

const calculateMaxAdaptation = (s, terrain) => {
  let base = 0;
  if (terrain === 'Street') base = s.StreetBattleAdaptation !== undefined ? s.StreetBattleAdaptation : 0;
  else if (terrain === 'Outdoor') base = s.OutdoorBattleAdaptation !== undefined ? s.OutdoorBattleAdaptation : 0;
  else if (terrain === 'Indoor') base = s.IndoorBattleAdaptation !== undefined ? s.IndoorBattleAdaptation : 0;

  if (s.Weapon && s.Weapon.AdaptationType === terrain && s.Weapon.AdaptationValue) {
    base += s.Weapon.AdaptationValue;
  }
  return base;
}

export default function StudentGuesser({ soundEnabled }) {
  const [students, setStudents] = useState([])
  const [target, setTarget] = useState(null)
  const [guesses, setGuesses] = useState([])
  const [gameStatus, setGameStatus] = useState('playing') // 'playing', 'won', 'revealed'
  const [loading, setLoading] = useState(true)
  const [fadeLoading, setFadeLoading] = useState(true) // For smooth fade-out transition
  const [showModal, setShowModal] = useState(true)

  // Load students data on mount
  useEffect(() => {
    async function loadData() {
      const startTime = Date.now()
      try {
        const res = await fetch('/jp_data/students.min.json')
        const data = await res.json()
        
        const list = []
        for (const id in data) {
          const s = data[id]
          // Filter only released students
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
              equipment: s.Equipment || [],
              characterSSRNew: s.CharacterSSRNew || 'ยินดีที่ได้พบกันค่ะ คุณครู',
              charHeightMetric: s.CharHeightMetric || 'N/A',
              defaultOrder: s.DefaultOrder !== undefined ? s.DefaultOrder : 999,
              exCost: s.Skills && s.Skills.Ex && s.Skills.Ex.Cost && s.Skills.Ex.Cost.length > 0
                ? s.Skills.Ex.Cost[s.Skills.Ex.Cost.length - 1]
                : 0,
              tacticRole: s.TacticRole || 'DamageDealer',
              streetBattleAdaptation: calculateMaxAdaptation(s, 'Street'),
              outdoorBattleAdaptation: calculateMaxAdaptation(s, 'Outdoor'),
              indoorBattleAdaptation: calculateMaxAdaptation(s, 'Indoor')
            })
          }
        }
        
        setStudents(list)
        
        // Load save state from localStorage if available
        const savedTargetId = localStorage.getItem('ba_guess_target_id')
        const savedGuessesIds = localStorage.getItem('ba_guess_history_ids')
        const savedStatus = localStorage.getItem('ba_guess_status')
        
        let initialTarget = null
        if (savedTargetId) {
          initialTarget = list.find(s => s.id.toString() === savedTargetId)
        }
        
        if (initialTarget) {
          setTarget(initialTarget)
          setGameStatus(savedStatus || 'playing')
          
          if (savedGuessesIds) {
            const ids = JSON.parse(savedGuessesIds)
            const historicalGuesses = ids.map(id => list.find(s => s.id === id)).filter(Boolean)
            setGuesses(historicalGuesses)
          }
        } else {
          // Select new random target
          const rand = list[Math.floor(Math.random() * list.length)]
          setTarget(rand)
          localStorage.setItem('ba_guess_target_id', rand.id.toString())
          localStorage.setItem('ba_guess_history_ids', JSON.stringify([]))
          localStorage.setItem('ba_guess_status', 'playing')
        }
        
        // Ensure loader is visible for at least 400ms to allow a smooth animation transition
        const elapsed = Date.now() - startTime
        const delay = Math.max(0, 300 - elapsed)
        
        setTimeout(() => {
          setFadeLoading(false)
          setTimeout(() => {
            setLoading(false)
          }, 300) // 300ms matches the fadeOut animation in CSS
        }, delay)
      } catch (err) {
        console.error('Failed to load student data:', err)
        setFadeLoading(false)
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Play Web Audio Beeps
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

  // Handle Guess Selection
  const handleGuess = (student) => {
    if (gameStatus !== 'playing') return

    // Check if student already in guesses (avoid duplicate inserts)
    if (guesses.some(g => g.id === student.id)) return;

    const nextGuesses = [...guesses, student]
    setGuesses(nextGuesses)
    
    // Update local storage
    localStorage.setItem('ba_guess_history_ids', JSON.stringify(nextGuesses.map(s => s.id)))

    if (student.id === target.id) {
      setGameStatus('won')
      setShowModal(true)
      localStorage.setItem('ba_guess_status', 'won')
      setTimeout(() => playSound('victory'), 600)
    } else {
      playSound('failure')
    }
  }

  // Give Up & Reveal target directly in table without full-screen block
  const handleGiveUp = () => {
    if (gameStatus !== 'playing' || !target) return

    playSound('failure')
    
    // Append correct target if not already guessed
    if (!guesses.some(g => g.id === target.id)) {
      const nextGuesses = [...guesses, target]
      setGuesses(nextGuesses)
      localStorage.setItem('ba_guess_history_ids', JSON.stringify(nextGuesses.map(s => s.id)))
    }

    setGameStatus('revealed')
    localStorage.setItem('ba_guess_status', 'revealed')
  }

  // Restart / Reset Game
  const handleReset = () => {
    if (students.length === 0) return
    const rand = students[Math.floor(Math.random() * students.length)]
    setTarget(rand)
    setGuesses([])
    setGameStatus('playing')
    setShowModal(true)
    
    localStorage.setItem('ba_guess_target_id', rand.id.toString())
    localStorage.setItem('ba_guess_history_ids', JSON.stringify([]))
    localStorage.setItem('ba_guess_status', 'playing')
  }

  // Get school icon path (safety fallback mapping)
  const getSchoolIcon = (school) => {
    const schoolMap = {
      'Abydos': 'Abydos.png',
      'Arius': 'Arius.png',
      'Gehenna': 'Gehenna.png',
      'Hyakkiyako': 'Hyakkiyako.png',
      'Millennium': 'Millennium.png',
      'RedWinter': 'RedWinter.png',
      'SRT': 'SRT.png',
      'Shanhaijing': 'Shanhaijing.png',
      'Tokiwadai': 'Tokiwadai.png',
      'Trinity': 'Trinity.png',
      'Valkyrie': 'Valkyrie.png',
      'ETC': 'ETC.png',
      'Highlander': 'ETC.png',
      'WildHunt': 'ETC.png',
      'Sakugawa': 'ETC.png'
    }
    const icon = schoolMap[school] || 'ETC.png'
    return `/images/schoolicon/${icon}`
  }

  // Formatting helpers for rendering
  const getBulletPillClass = (type) => {
    if (type === 'Explosion') return 'pill-explosion'
    if (type === 'Pierce') return 'pill-pierce'
    if (type === 'Mystic') return 'pill-mystic'
    if (type === 'Sonic') return 'pill-sonic'
    return 'pill-normal'
  }

  const getBulletLabel = (type) => {
    if (type === 'Explosion') return 'Explosion / 爆発 (ระเบิด)'
    if (type === 'Pierce') return 'Pierce / 貫通 (ทะลวง)'
    if (type === 'Mystic') return 'Mystic / 神秘 (ลึกลับ)'
    if (type === 'Sonic') return 'Sonic / 振動 (สั่นสะเทือน)'
    return 'Normal (ปกติ)'
  }

  const getArmorPillClass = (type) => {
    if (type === 'LightArmor') return 'pill-explosion'
    if (type === 'HeavyArmor') return 'pill-pierce'
    if (type === 'Unarmed') return 'pill-mystic'
    if (type === 'ElasticArmor') return 'pill-sonic'
    return 'pill-normal'
  }

  const getArmorLabel = (type) => {
    if (type === 'LightArmor') return 'Light / 軽装備 (เบา)'
    if (type === 'HeavyArmor') return 'Heavy / 重装甲 (หนัก)'
    if (type === 'Unarmed') return 'Special / 特殊装甲 (พิเศษ)'
    if (type === 'ElasticArmor') return 'Elastic / 弾力装甲 (ยืดหยุ่น)'
    return 'Normal (ปกติ)'
  }

  const getTacticRoleIcon = (role) => {
    const roleIconMap = {
      'DamageDealer': 'Role_DamageDealer.png',
      'Tanker': 'Role_Tanker.png',
      'Healer': 'Role_Healer.png',
      'Supporter': 'Role_Supporter.png',
      'Vehicle': 'Role_Vehicle.png'
    }
    const iconName = roleIconMap[role] || 'Role_DamageDealer.png'
    return (
      <img
        src={`/images/ui/${iconName}`}
        alt={role}
        className="role-icon-img"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = '/images/schoolicon/ETC.png';
        }}
      />
    )
  }

  const getTacticRoleLabel = (role) => {
    if (role === 'DamageDealer') return 'Attacker'
    if (role === 'Tanker') return 'Tanker'
    if (role === 'Healer') return 'Healer'
    if (role === 'Supporter') return 'Support'
    if (role === 'Vehicle') return 'T.S.'
    return role || 'N/A'
  }

  const getRankLabel = (val) => {
    const ranks = ['D', 'C', 'B', 'A', 'S', 'SS']
    const capped = Math.min(Math.max(val, 0), ranks.length - 1)
    return ranks[capped] || 'D'
  }

  const StreetIcon = ({ className }) => (
    <img
      src="/images/ui/Terrain_Street.png"
      alt="Street"
      className={className}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = '/images/schoolicon/ETC.png';
      }}
    />
  )

  const OutdoorIcon = ({ className }) => (
    <img
      src="/images/ui/Terrain_Outdoor.png"
      alt="Outdoor"
      className={className}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = '/images/schoolicon/ETC.png';
      }}
    />
  )

  const IndoorIcon = ({ className }) => (
    <img
      src="/images/ui/Terrain_Indoor.png"
      alt="Indoor"
      className={className}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = '/images/schoolicon/ETC.png';
      }}
    />
  )

  const getAdaptationIcon = (val) => {
    const ranks = ['D', 'C', 'B', 'A', 'S', 'SS']
    const capped = Math.min(Math.max(val, 0), ranks.length - 1)
    const rankName = ranks[capped] || 'D'
    return (
      <img
        src={`/images/ui/Ingame_Emo_Adaptresult${rankName}.png`}
        alt={rankName}
        className="adaptation-rank-img"
        title={rankName}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = '/images/schoolicon/ETC.png';
        }}
      />
    )
  }

  if (loading) {
    return (
      <div className={`ba-loading-screen ${!fadeLoading ? 'fade-out' : ''}`}>
        <div className="ba-loading-halo-wrapper">
          <div className="ba-loading-ring outer"></div>
          <div className="ba-loading-ring inner"></div>
          <div className="ba-loading-logo">
            <img 
              src="/images/icon/icon_x512.png" 
              alt="SCHALE Logo" 
              className="ba-loading-logo-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/schoolicon/ETC.png';
              }} 
            />
          </div>
        </div>
        <p className="ba-loading-text">กำลังโหลดข้อมูลนักเรียน SCHALE...</p>
        <div className="ba-loading-progress-bar">
          <div className="ba-loading-progress-fill"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="lobby-layout">
      
      {/* Game Overview Banner */}
      <section className="lobby-header">
        <h2 className="lobby-title" style={{ fontFamily: 'Outfit, sans-serif' }}>
          STUDENT GUESSER
        </h2>
        <p className="lobby-desc">
          ทายตัวละครนักเรียนคิโวทอสของคุณครู! ช่องสีเขียวสว่างจะแสดงข้อมูลที่ตรงกับตัวละครเป้าหมาย
        </p>
      </section>

      {/* Input / Control Panel */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        {gameStatus !== 'playing' ? (
          /* Finished game banner (won or revealed) */
          <div className="solved-banner">
            <div className="solved-banner-text">
              <span className={`solved-banner-tag ${gameStatus === 'won' ? 'won' : 'revealed'}`}>
                {gameStatus === 'won' ? 'RECRUITMENT SUCCESS' : 'RECRUITMENT REVEALED'}
              </span>
              <h3>
                {gameStatus === 'won' ? 'ทายถูกต้อง! คำตอบคือ ' : 'เฉลยคำตอบหลัก: '}
                <span style={{ color: '#00e5ff', fontWeight: '800' }}>{target.englishName}</span> ({target.name})
              </h3>
            </div>
            
            <div className="solved-banner-btn-group">
              {gameStatus === 'won' && !showModal && (
                <button
                  onClick={() => setShowModal(true)}
                  className="solved-banner-btn-card"
                >
                  ดูการ์ด
                </button>
              )}
              <button
                onClick={handleReset}
                className="solved-banner-btn-reset"
              >
                เล่นอีกครั้ง
              </button>
            </div>
          </div>
        ) : (
          /* Active search & autocomplete panel */
          <div className="game-input-wrapper">
            <div style={{ flex: 1 }}>
              <Autocomplete
                suggestions={students}
                onSelect={handleGuess}
                guessedIds={guesses.map(g => g.id)}
                placeholder="พิมพ์ชื่อนักเรียนเพื่อค้นหา... (เช่น Aru, Shiroko, Hina)"
              />
            </div>

            <button
              onClick={handleGiveUp}
              className="game-btn-reveal"
            >
              ยอมแพ้ (Give Up)
            </button>
            
            <button
              onClick={handleReset}
              className="game-btn-reset"
              title="เริ่มเกมใหม่"
            >
              <RotateCcw style={{ width: '18px', height: '18px' }} />
            </button>
          </div>
        )}
      </div>

      {/* Guesses Log Area */}
      {guesses.length > 0 && (
        <div className="guess-table-container">
          <div className="guess-table-scroller">
            {/* Table Header (Hidden on Mobile via CSS) */}
            <div className="guess-grid-header">
              <div>นักเรียน</div>
              <div>โรงเรียน</div>
              <div>ประเภท</div>
              <div>บทบาท</div>
              <div>ประเภทการโจมตี</div>
              <div>ประเภทการป้องกัน</div>
              <div>ตำแหน่ง</div>
              <div>ระดับดาว</div>
              <div>ชั้นปี</div>
              <div>Cost (EX)</div>
              <div>ส่วนสูง</div>
              <div className="header-terrain-cell" title="สตรีท (Street)">
                <StreetIcon className="header-terrain-img" />
              </div>
              <div className="header-terrain-cell" title="เอาท์ดอร์ (Outdoor)">
                <OutdoorIcon className="header-terrain-img" />
              </div>
              <div className="header-terrain-cell" title="อินดอร์ (Indoor)">
                <IndoorIcon className="header-terrain-img" />
              </div>
              <div>อุปกรณ์ 1</div>
              <div>อุปกรณ์ 2</div>
              <div>อุปกรณ์ 3</div>
            </div>

            {/* List of Guesses in reverse chronological order (newest first) */}
            <div style={{ display: 'flex', flexDirection: 'column-reverse' }}>
              {guesses.map((g, idx) => {
                const isCorrect = g.id === target.id
                const isSchoolMatch = g.school === target.school
                const isSquadMatch = g.squadType === target.squadType
                const isTacticRoleMatch = g.tacticRole === target.tacticRole
                const isBulletMatch = g.bulletType === target.bulletType
                const isArmorMatch = g.armorType === target.armorType
                const isPosMatch = g.position === target.position
                const isStarMatch = g.starGrade === target.starGrade
                const isYearMatch = g.schoolYear === target.schoolYear
                
                // Numeric matches
                const isCostMatch = g.exCost === target.exCost
                const gHeight = parseInt(g.charHeightMetric) || 0
                const targetHeight = parseInt(target.charHeightMetric) || 0
                const isHeightMatch = gHeight === targetHeight && gHeight !== 0
                const isStreetMatch = g.streetBattleAdaptation === target.streetBattleAdaptation
                const isOutdoorMatch = g.outdoorBattleAdaptation === target.outdoorBattleAdaptation
                const isIndoorMatch = g.indoorBattleAdaptation === target.indoorBattleAdaptation
                
                return (
                  <div key={`${g.id}-${idx}`} className="guess-row">
                    {/* 1. Face Icon & Name */}
                    <div className={`guess-cell ${isCorrect ? 'success' : 'failure'}`} data-label="นักเรียน">
                      <img
                        src={`/images/student/icon/${g.id}.webp`}
                        alt={g.englishName}
                        className="cell-icon cell-avatar"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/schoolicon/ETC.png';
                        }}
                      />
                      <span className="student-name">
                        {g.englishName}
                      </span>
                    </div>

                    {/* 2. School */}
                    <div className={`guess-cell ${isSchoolMatch ? 'success' : 'failure'}`} data-label="โรงเรียน">
                      <div className="cell-school-logo-container">
                        <img
                          src={getSchoolIcon(g.school)}
                          alt={g.school}
                          className="cell-school-img"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/schoolicon/ETC.png';
                          }}
                        />
                        <span className="cell-school-name">{g.school}</span>
                      </div>
                    </div>

                    {/* 3. SquadType */}
                    <div className={`guess-cell ${isSquadMatch ? 'success' : 'failure'}`} data-label="ประเภท">
                      <span className="cell-squad-type">
                        {g.squadType === 'Main' ? 'STRIKER' : 'SPECIAL'}
                      </span>
                    </div>

                    {/* 3b. TacticRole */}
                    <div className={`guess-cell ${isTacticRoleMatch ? 'success' : 'failure'}`} data-label="บทบาท">
                      <div className="cell-role-container">
                        {getTacticRoleIcon(g.tacticRole)}
                        <span className="cell-role-label">{getTacticRoleLabel(g.tacticRole)}</span>
                      </div>
                    </div>

                    {/* 4. BulletType */}
                    <div className={`guess-cell ${isBulletMatch ? 'success' : 'failure'}`} data-label="ประเภทโจมตี">
                      <span className={`${getBulletPillClass(g.bulletType)}`}>
                        {getBulletLabel(g.bulletType).split(' ')[0]}
                      </span>
                    </div>

                    {/* 5. ArmorType */}
                    <div className={`guess-cell ${isArmorMatch ? 'success' : 'failure'}`} data-label="ประเภทป้องกัน">
                      <span className={`${getArmorPillClass(g.armorType)}`}>
                        {getArmorLabel(g.armorType).split(' ')[0]}
                      </span>
                    </div>

                    {/* 6. Position */}
                    <div className={`guess-cell ${isPosMatch ? 'success' : 'failure'}`} data-label="ตำแหน่ง">
                      <span className="cell-position">{g.position}</span>
                    </div>

                    {/* 7. StarGrade */}
                    <div className={`guess-cell ${isStarMatch ? 'success' : 'failure'}`} data-label="ระดับดาว">
                      <div className="star-container">
                        <div className="star-row">
                          {Array.from({ length: g.starGrade }).map((_, i) => '★').join('')}
                        </div>
                        {!isStarMatch && (
                          <span className={`arrow-indicator ${g.starGrade < target.starGrade ? 'text-cyan-400' : 'text-rose-400'}`} style={{
                            color: g.starGrade < target.starGrade ? '#00e5ff' : '#ef4444'
                          }}>
                            {g.starGrade < target.starGrade ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 8. SchoolYear */}
                    <div className={`guess-cell ${isYearMatch ? 'success' : 'failure'}`} data-label="ชั้นปี">
                      <span className="cell-school-year">
                        {formatSchoolYear(g.schoolYear).split(' ')[0]}
                      </span>
                    </div>

                    {/* 9. Cost EX */}
                    <div className={`guess-cell ${isCostMatch ? 'success' : ''}`} data-label="Cost (EX)">
                      <span className="cell-ex-cost">{g.exCost}</span>
                      {!isCostMatch && (
                        <span className="arrow-indicator" style={{ color: g.exCost < target.exCost ? '#00e5ff' : '#ef4444' }}>
                          {g.exCost < target.exCost ? '↑' : '↓'}
                        </span>
                      )}
                    </div>

                    {/* 10. Height */}
                    <div className={`guess-cell ${isHeightMatch ? 'success' : ''}`} data-label="ส่วนสูง">
                      <span className="cell-height">{g.charHeightMetric}</span>
                      {!isHeightMatch && gHeight !== 0 && targetHeight !== 0 && (
                        <span className="arrow-indicator" style={{ color: gHeight < targetHeight ? '#00e5ff' : '#ef4444' }}>
                          {gHeight < targetHeight ? '↑' : '↓'}
                        </span>
                      )}
                    </div>

                    {/* 10b. Street Adaptation */}
                    <div className={`guess-cell ${isStreetMatch ? 'success' : 'failure'}`} data-label="สตรีท (Street)">
                      <div className="adaptation-container">
                        <div className="adaptation-pill">
                          <StreetIcon className="adaptation-img" />
                          {getAdaptationIcon(g.streetBattleAdaptation)}
                        </div>
                        {!isStreetMatch && (
                          <span className="arrow-indicator" style={{ color: g.streetBattleAdaptation < target.streetBattleAdaptation ? '#00e5ff' : '#ef4444' }}>
                            {g.streetBattleAdaptation < target.streetBattleAdaptation ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 10c. Outdoor Adaptation */}
                    <div className={`guess-cell ${isOutdoorMatch ? 'success' : 'failure'}`} data-label="เอาท์ดอร์ (Outdoor)">
                      <div className="adaptation-container">
                        <div className="adaptation-pill">
                          <OutdoorIcon className="adaptation-img" />
                          {getAdaptationIcon(g.outdoorBattleAdaptation)}
                        </div>
                        {!isOutdoorMatch && (
                          <span className="arrow-indicator" style={{ color: g.outdoorBattleAdaptation < target.outdoorBattleAdaptation ? '#00e5ff' : '#ef4444' }}>
                            {g.outdoorBattleAdaptation < target.outdoorBattleAdaptation ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 10d. Indoor Adaptation */}
                    <div className={`guess-cell ${isIndoorMatch ? 'success' : 'failure'}`} data-label="อินดอร์ (Indoor)">
                      <div className="adaptation-container">
                        <div className="adaptation-pill">
                          <IndoorIcon className="adaptation-img" />
                          {getAdaptationIcon(g.indoorBattleAdaptation)}
                        </div>
                        {!isIndoorMatch && (
                          <span className="arrow-indicator" style={{ color: g.indoorBattleAdaptation < target.indoorBattleAdaptation ? '#00e5ff' : '#ef4444' }}>
                            {g.indoorBattleAdaptation < target.indoorBattleAdaptation ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </div>



                    {/* 12. Equipment 1 */}
                    <div className={`guess-cell ${g.equipment && g.equipment[0] && target.equipment && g.equipment[0] === target.equipment[0] ? 'success' : 'failure'}`} data-label="อุปกรณ์ 1">
                      {g.equipment && g.equipment[0] ? (
                        <img
                          src={`/images/equipment/icon/equipment_icon_${g.equipment[0].toLowerCase()}_tier1.webp`}
                          alt={g.equipment[0]}
                          className="cell-equipment-img"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/schoolicon/ETC.png';
                          }}
                        />
                      ) : (
                        <span className="cell-na-text">N/A</span>
                      )}
                    </div>

                    {/* 10. Equipment 2 */}
                    <div className={`guess-cell ${g.equipment && g.equipment[1] && target.equipment && g.equipment[1] === target.equipment[1] ? 'success' : 'failure'}`} data-label="อุปกรณ์ 2">
                      {g.equipment && g.equipment[1] ? (
                        <img
                          src={`/images/equipment/icon/equipment_icon_${g.equipment[1].toLowerCase()}_tier1.webp`}
                          alt={g.equipment[1]}
                          className="cell-equipment-img"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/schoolicon/ETC.png';
                          }}
                        />
                      ) : (
                        <span className="cell-na-text">N/A</span>
                      )}
                    </div>

                    {/* 11. Equipment 3 */}
                    <div className={`guess-cell ${g.equipment && g.equipment[2] && target.equipment && g.equipment[2] === target.equipment[2] ? 'success' : 'failure'}`} data-label="อุปกรณ์ 3">
                      {g.equipment && g.equipment[2] ? (
                        <img
                          src={`/images/equipment/icon/equipment_icon_${g.equipment[2].toLowerCase()}_tier1.webp`}
                          alt={g.equipment[2]}
                          className="cell-equipment-img"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/schoolicon/ETC.png';
                          }}
                        />
                      ) : (
                        <span className="cell-na-text">N/A</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Win Modal Overlay (only shown when won and not dismissed) */}
      {gameStatus === 'won' && showModal && target && (
        <WinModal
          target={target}
          guessesCount={guesses.length}
          guesses={guesses}
          onReset={handleReset}
          onClose={() => setShowModal(false)}
        />
      )}

    </div>
  )
}
