import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom'
import StudentGuesser from './games/StudentGuesser.jsx'
import SkillGuesser from './games/SkillGuesser.jsx'
import HaloGuesser from './games/HaloGuesser.jsx'
import WeaponGuesser from './games/WeaponGuesser.jsx'
import GearGuesser from './games/GearGuesser.jsx'
import ChocolateGuesser from './games/ChocolateGuesser.jsx'
import VoiceGuesser from './games/VoiceGuesser.jsx'
import HeightGuesser from './games/HeightGuesser.jsx'
import AgeGuesser from './games/AgeGuesser.jsx'
import EloRanker from './games/EloRanker.jsx'
import BlueArchiveWordGame from './games/BlueArchiveWordGame.jsx'
import LobbyGuesser from './games/LobbyGuesser.jsx'
import BlueArchiveEmojiGame from './games/BlueArchiveEmojiGame.jsx'
import StudentDatabase from './components/StudentDatabase.jsx'
import AboutSchale from './components/AboutSchale.jsx'
import BlueArchiveChess from './games/BlueArchiveChess.jsx'
import { Gamepad2, Award, BookOpen, Volume2, VolumeX, ArrowLeft, Lock, Menu, X, Users, Ruler, ArrowUpDown, Calendar, Swords, Compass, Camera } from 'lucide-react'

const tabToPath = (tab) => {
  switch (tab) {
    case 'lobby': return '/'
    case 'student': return '/student'
    case 'halo': return '/halo'
    case 'weapon': return '/weapon'
    case 'skill': return '/skill'
    case 'gear': return '/gear'
    case 'chocolate': return '/chocolate'
    case 'voice': return '/voice'
    case 'height': return '/height'
    case 'age': return '/age'
    case 'word': return '/word'
    case 'lobbyGuess': return '/lobby-guess'
    case 'emojiQuiz': return '/emoji-quiz'
    case 'eloRanker': return '/ranker'
    case 'database': return '/database'
    case 'about': return '/about'
    case 'chess': return '/chess'
    default: return '/'
  }
}

const pathToTab = (path) => {
  switch (path) {
    case '/': return 'lobby'
    case '/student': return 'student'
    case '/halo': return 'halo'
    case '/weapon': return 'weapon'
    case '/skill': return 'skill'
    case '/gear': return 'gear'
    case '/chocolate': return 'chocolate'
    case '/voice': return 'voice'
    case '/height': return 'height'
    case '/age': return 'age'
    case '/word': return 'word'
    case '/lobby-guess': return 'lobbyGuess'
    case '/emoji-quiz': return 'emojiQuiz'
    case '/ranker': return 'eloRanker'
    case '/database': return 'database'
    case '/about': return 'about'
    case '/chess': return 'chess'
    default: return 'lobby'
  }
}

function AppContent() {
  const location = useLocation()
  const navigate = useNavigate()

  const initialTab = pathToTab(location.pathname)
  const [activeTab, setActiveTabVal] = useState(initialTab)
  const [renderTab, setRenderTab] = useState(initialTab)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false)

  const controls = useAnimation()
  const navContainerRef = useRef(null)

  // Track the active button and animate the persistent glass switcher smoothly (spring + jelly keyframes)
  useEffect(() => {
    const updateIndicator = () => {
      const activeBtn = navContainerRef.current?.querySelector('.nav-link-btn.active')
if (activeBtn) {
  const { offsetLeft, offsetWidth } = activeBtn
  controls.start({
    left: offsetLeft,
    width: offsetWidth,
    opacity: 1,
    
    // คีย์เฟรมยืดหด 5 จังหวะของคุณ (Duration 0.8s)
    scaleX: [1, 1.30, 0.90, 1.05, 1], 
    scaleY: [1, 0.70, 1.18, 0.95, 1],
    
    backgroundColor: [
      "rgba(255, 255, 255, 0.09)", // 0% : เริ่มออกตัว (ขุ่น)
      "rgba(255, 255, 255, 0.01)", // 10% : พุ่งตัว (ใสทันที)
      "rgba(255, 255, 255, 0.01)", // 30% : รั้งความใสไว้แป๊บเดียวพอ
      "rgba(255, 255, 255, 0.09)"  // 65% : กลับมาขุ่นเต็มที่แล้ว! (ก่อนอนิเมชั่นทั้งหมดจะจบที่ 100%)
    ],
    backdropFilter: [
      "blur(16px)", // 0%
      "blur(0px)",  // 10%
      "blur(0px)",  // 30%
      "blur(16px)"  // 65% กลับมาเบลอขุ่นรอไว้เลยก่อนเด้งดึ๋งจบ
    ],
    WebkitBackdropFilter: [
      "blur(16px)",
      "blur(0px)",
      "blur(0px)",
      "blur(16px)"
    ],
    
    transition: {
      left: { type: 'spring', stiffness: 450, damping: 32, mass: 0.6 },
      width: { type: 'spring', stiffness: 450, damping: 32, mass: 0.6 },
      
      scaleX: { duration: 0.8, ease: [0.16, 1, 0.8, 1] },
      scaleY: { duration: 0.8, ease: [0.16, 1, 0.8, 1] },
      
      // ปรับจังหวะความใส/ขุ่น ให้จบก่อนอนิเมชั่นหลัก
      backgroundColor: { 
        duration: 0.8, 
        ease: "easeOut", // เปลี่ยนเป็น easeOut ให้ช่วงขุ่นกลับมานุ่มนวลขึ้น
        times: [0, 0.10, 0.30, 0.65] // <--- ร่นเวลาจาก 0.45->0.30 และ 1.0->0.65
      },
      backdropFilter: { 
        duration: 0.8, 
        ease: "easeOut",
        times: [0, 0.10, 0.30, 0.65] 
      },
      WebkitBackdropFilter: { 
        duration: 0.8, 
        ease: "easeOut",
        times: [0, 0.10, 0.30, 0.65] 
      }
    }
  })
} else {
        controls.start({ opacity: 0 })
      }
    }

    updateIndicator()
    const timeoutId = setTimeout(updateIndicator, 50)

    window.addEventListener('resize', updateIndicator)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updateIndicator)
    }
  }, [activeTab, controls])

  // Listen to path changes and manage transition states
  useEffect(() => {
    const tab = pathToTab(location.pathname)
    
    // Redirect if it's an invalid path (e.g. unknown subpath)
    const validPaths = ['/', '/student', '/halo', '/weapon', '/skill', '/gear', '/chocolate', '/voice', '/height', '/age', '/word', '/lobby-guess', '/emoji-quiz', '/ranker', '/database', '/about', '/chess']
    if (!validPaths.includes(location.pathname)) {
      navigate('/', { replace: true })
      return
    }

    if (tab !== renderTab) {
      setActiveTabVal(tab) // pill animation starts immediately
      setIsWorkspaceLoading(true)
      
      const timer = setTimeout(() => {
        setRenderTab(tab)
        const innerTimer = setTimeout(() => {
          setIsWorkspaceLoading(false)
        }, 150)
        return () => clearTimeout(innerTimer)
      }, 150)
      return () => clearTimeout(timer)
    } else {
      setActiveTabVal(tab)
    }
  }, [location.pathname, renderTab, navigate])

  const handleTabChange = (tab) => {
    const path = tabToPath(tab)
    if (path !== location.pathname) {
      navigate(path)
    }
  }

  const setActiveTab = handleTabChange

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Header / Navigation Bar */}
      <header className="navbar-container">
        <div className="navbar-inner">
          
          {/* Left Side: Brand Logo and Title */}
          <div className="brand-wrapper" onClick={() => {
            setMobileMenuOpen(false)
            setActiveTab('lobby')
          }}>
            <div className="brand-icon-box">
              <img src="/images/icon/icon_x512.png" alt="Kivotos Arcade Logo" className="brand-logo-img" />
            </div>
            <div className="brand-title-box">
              <h1>KIVOTOS ARCADE</h1>
              <p>SCHALE GAME STATION</p>
            </div>
          </div>

          {/* Center Side: Desktop Navigation Links */}
          <nav className="desktop-nav-links" ref={navContainerRef}>
            <motion.div 
              className="nav-sliding-indicator" 
              animate={controls}
              initial={{ opacity: 0 }}
            />
            <button
              onClick={() => handleTabChange('lobby')}
              className={`nav-link-btn ${['lobby', 'student', 'halo', 'weapon', 'skill', 'gear', 'chocolate', 'voice', 'height', 'age', 'word', 'lobbyGuess', 'emojiQuiz'].includes(activeTab) ? 'active' : ''}`}
            >
              <Gamepad2 className="w-4 h-4 nav-link-icon" />
              <span>Arcade</span>
            </button>
            <button
              onClick={() => handleTabChange('eloRanker')}
              className={`nav-link-btn ${activeTab === 'eloRanker' ? 'active' : ''}`}
            >
              <Swords className="w-4 h-4 nav-link-icon" />
              <span>BA Ranker</span>
            </button>
            <button
              onClick={() => handleTabChange('database')}
              className={`nav-link-btn ${activeTab === 'database' ? 'active' : ''}`}
            >
              <BookOpen className="w-4 h-4 nav-link-icon" />
              <span>Student DB</span>
            </button>
            <button
              onClick={() => handleTabChange('about')}
              className={`nav-link-btn ${activeTab === 'about' ? 'active' : ''}`}
            >
              <Users className="w-4 h-4 nav-link-icon" />
              <span>Characters</span>
            </button>
          </nav>

          {/* Right Side: Header Control Buttons & Hamburger */}
          <div className="controls-wrapper">
            {/* Back Button (Only shown inside active games, e.g. when not on lobby, database, or about) */}
            {activeTab !== 'lobby' && activeTab !== 'database' && activeTab !== 'about' && (
              <button
                onClick={() => {
                  handleTabChange('lobby')
                }}
                className="header-back-btn"
              >
                <ArrowLeft className="w-4 h-4 back-icon" />
                <span className="back-btn-text">กลับหน้าหลัก</span>
              </button>
            )}

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="sound-toggle-btn"
              title={soundEnabled ? 'ปิดเสียง' : 'เปิดเสียง'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-hamburger-btn"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer Dropdown */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer">
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                setActiveTab('lobby')
              }}
              className={`mobile-nav-link ${(activeTab === 'lobby' || activeTab === 'student' || activeTab === 'halo' || activeTab === 'weapon' || activeTab === 'skill' || activeTab === 'gear' || activeTab === 'chocolate' || activeTab === 'voice' || activeTab === 'height' || activeTab === 'age' || activeTab === 'word' || activeTab === 'lobbyGuess' || activeTab === 'emojiQuiz') ? 'active' : ''}`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Arcade (ห้องเกม)</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                setActiveTab('eloRanker')
              }}
              className={`mobile-nav-link ${activeTab === 'eloRanker' ? 'active' : ''}`}
            >
              <Swords className="w-4 h-4" />
              <span>BA Ranker (จัดอันดับ)</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                setActiveTab('database')
              }}
              className={`mobile-nav-link ${activeTab === 'database' ? 'active' : ''}`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Student DB (ฐานข้อมูล)</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                setActiveTab('about')
              }}
              className={`mobile-nav-link ${activeTab === 'about' ? 'active' : ''}`}
            >
              <Users className="w-4 h-4" />
              <span>Characters (ทำเนียบ)</span>
            </button>
          </div>
        )}
      </header>

      {/* Main App Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 mt-12">
        {renderTab === 'lobby' && (
          <div className="lobby-layout">
            
            {/* Header Title Section */}
            <div className="lobby-header">
              <span className="lobby-subtitle-tag">Welcome, Sensei</span>
              <h2 className="lobby-title" style={{ fontFamily: 'Outfit, sans-serif' }}>
                SELECT GAME MODE
              </h2>
              <p className="lobby-desc">
                เลือกโหมดเพื่อทดสอบความรู้เกี่ยวกับนักเรียนของคุณ!
              </p>
            </div>

            {/* Graphical GUI Grid Selection */}
            <div className="lobby-game-grid">
              
              {/* Card 1: Student Guess (PLAYABLE) */}
              <div 
                onClick={() => setActiveTab('student')}
                className="lobby-card"
              >
                {/* Visual collage preview */}
                <div className="lobby-card-preview">
                  <div className="collage-grid">
                    <img src="/images/student/icon/10000.webp" alt="Aru" className="collage-img" />
                    <img src="/images/student/icon/10010.webp" alt="Shiroko" className="collage-img" />
                    <img src="/images/student/icon/10004.webp" alt="Hina" className="collage-img" />
                    <img src="/images/student/icon/10005.webp" alt="Hoshino" className="collage-img" />
                  </div>
                </div>
                
                <div className="lobby-card-info">
                  <h3 className="lobby-card-title">ทายตัวละครนักเรียน</h3>
                  <span className="lobby-card-tag ready">READY</span>
                </div>
                
                <button className="lobby-card-btn ready">
                  PLAY CLASSIC MODE
                </button>
              </div>

              {/* Card 2: Halo Guess (PLAYABLE) [NEW] */}
              <div 
                onClick={() => setActiveTab('halo')}
                className="lobby-card"
              >
                {/* Visual collage preview of Halos */}
                <div className="lobby-card-preview">
                  <div className="collage-grid">
                    <img src="/images/halos/Aru_Halo.png" alt="Aru Halo" className="collage-img" style={{ objectFit: 'contain', padding: '4px' }} />
                    <img src="/images/halos/Shiroko_Halo.png" alt="Shiroko Halo" className="collage-img" style={{ objectFit: 'contain', padding: '4px' }} />
                    <img src="/images/halos/Hina_Halo.png" alt="Hina Halo" className="collage-img" style={{ objectFit: 'contain', padding: '4px' }} />
                    <img src="/images/halos/Yuuka_Halo.png" alt="Yuuka Halo" className="collage-img" style={{ objectFit: 'contain', padding: '4px' }} />
                  </div>
                </div>
                
                <div className="lobby-card-info">
                  <h3 className="lobby-card-title">ทายฮาโลนักเรียน</h3>
                  <span className="lobby-card-tag ready">READY</span>
                </div>
                
                <button className="lobby-card-btn ready">
                  PLAY HALO MODE
                </button>
              </div>

              {/* Card 3: Weapon Guess (PLAYABLE) */}
              <div 
                onClick={() => setActiveTab('weapon')}
                className="lobby-card"
              >
                {/* Visual collage preview of Weapons */}
                <div className="lobby-card-preview">
                  <div className="collage-grid">
                    <img src="/images/weapon/weapon_icon_10000.webp" alt="Aru Weapon" className="collage-img" style={{ objectFit: 'contain', padding: '4px' }} />
                    <img src="/images/weapon/weapon_icon_10010.webp" alt="Shiroko Weapon" className="collage-img" style={{ objectFit: 'contain', padding: '4px' }} />
                    <img src="/images/weapon/weapon_icon_10004.webp" alt="Hina Weapon" className="collage-img" style={{ objectFit: 'contain', padding: '4px' }} />
                    <img src="/images/weapon/weapon_icon_10005.webp" alt="Hoshino Weapon" className="collage-img" style={{ objectFit: 'contain', padding: '4px' }} />
                  </div>
                </div>
                
                <div className="lobby-card-info">
                  <h3 className="lobby-card-title">ทายอาวุธนักเรียน</h3>
                  <span className="lobby-card-tag ready">READY</span>
                </div>
                
                <button className="lobby-card-btn ready">
                  PLAY WEAPON MODE
                </button>
              </div>

              {/* Card 4: Hint Guess (PLAYABLE) [NEW] */}
              <div 
                onClick={() => setActiveTab('skill')}
                className="lobby-card"
              >
                {/* Visual collage preview for Hints (Silhouette, Halo, Gift, Weapon) */}
                <div className="lobby-card-preview">
                  <div className="collage-grid">
                    <img src="/images/student/icon/20059.webp" alt="Aru Silhouette" className="collage-img" style={{ objectFit: 'contain', padding: '2px' }} />
                    <img src="/images/halos/Shiroko_Halo.png" alt="Aru Halo" className="collage-img" style={{ objectFit: 'contain', padding: '4px' }} />
                    <img src="/images/gear/icon/10033.webp" alt="wakamo gear" className="collage-img" style={{ objectFit: 'contain', padding: '4px' }} />
                    <img src="/images/weapon/weapon_icon_10015.webp" alt="Aru Weapon" className="collage-img" style={{ objectFit: 'contain', padding: '4px' }} />
                  </div>
                </div>
                
                <div className="lobby-card-info">
                  <h3 className="lobby-card-title">นักเรียนคนนี้คือใคร?</h3>
                  <span className="lobby-card-tag ready">READY</span>
                </div>
                
                <button className="lobby-card-btn ready">
                  PLAY HINT MODE
                </button>
              </div>

              {/* Card 5: Gear Guess (PLAYABLE) [NEW] */}
              <div 
                onClick={() => setActiveTab('gear')}
                className="lobby-card"
              >
                {/* Visual collage preview of Gear */}
                <div className="lobby-card-preview">
                  <div className="collage-grid">
                    <img src="/images/gear/icon/10000.webp" alt="Aru Gear" className="collage-img" style={{ objectFit: 'contain', padding: '4px' }} />
                    <img src="/images/gear/icon/10010.webp" alt="Shiroko Gear" className="collage-img" style={{ objectFit: 'contain', padding: '4px' }} />
                    <img src="/images/gear/icon/10004.webp" alt="Hina Gear" className="collage-img" style={{ objectFit: 'contain', padding: '4px' }} />
                    <img src="/images/gear/icon/10005.webp" alt="Hoshino Gear" className="collage-img" style={{ objectFit: 'contain', padding: '4px' }} />
                  </div>
                </div>
                
                <div className="lobby-card-info">
                  <h3 className="lobby-card-title">ทายของรักนักเรียน</h3>
                  <span className="lobby-card-tag ready">READY</span>
                </div>
                
                <button className="lobby-card-btn ready">
                  PLAY GEAR MODE
                </button>
              </div>

              {/* Card 6: Chocolate Guess (PLAYABLE) [NEW] */}
              <div 
                onClick={() => setActiveTab('chocolate')}
                className="lobby-card"
              >
                {/* Visual collage preview of Chocolates */}
                <div className="lobby-card-preview">
                  <div className="collage-grid">
                    <img src="/images/item/icon/event_vallentine_chocolate_airi.webp" alt="Airi Chocolate" className="collage-img" style={{ objectFit: 'contain', padding: '4px' }} />
                    <img src="/images/item/icon/event_vallentine_chocolate_aru.webp" alt="Aru Chocolate" className="collage-img" style={{ objectFit: 'contain', padding: '4px' }} />
                    <img src="/images/item/icon/event_vallentine_chocolate_hina.webp" alt="Hina Chocolate" className="collage-img" style={{ objectFit: 'contain', padding: '4px' }} />
                    <img src="/images/item/icon/event_vallentine_chocolate_shiroko.webp" alt="Shiroko Chocolate" className="collage-img" style={{ objectFit: 'contain', padding: '4px' }} />
                  </div>
                </div>
                
                <div className="lobby-card-info">
                  <h3 className="lobby-card-title">ทายช็อกโกแลต</h3>
                  <span className="lobby-card-tag ready">READY</span>
                </div>
                
                <button className="lobby-card-btn ready">
                  PLAY VALENTINE MODE
                </button>
              </div>

              {/* Card 7: Voice Guess (PLAYABLE) [NEW] */}
              <div 
                onClick={() => setActiveTab('voice')}
                className="lobby-card"
              >
                <div className="lobby-card-preview" style={{ position: 'relative' }}>
                  <div className="collage-grid">
                    <img src="/images/student/icon/10012.webp" alt="Serika" className="collage-img" />
                    <img src="/images/student/icon/10000.webp" alt="Aru" className="collage-img" />
                    <img src="/images/student/icon/13010.webp" alt="Hanako" className="collage-img" />
                    <img src="/images/student/icon/10002.webp" alt="Kayoko" className="collage-img" />
                  </div>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Volume2 style={{ width: '48px', height: '48px', color: '#06b6d4', filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.8))' }} />
                  </div>
                </div>
                
                <div className="lobby-card-info">
                  <h3 className="lobby-card-title">ทายเสียงนักเรียน</h3>
                  <span className="lobby-card-tag ready">READY</span>
                </div>
                
                <button className="lobby-card-btn ready">
                  PLAY VOICE MODE
                </button>
              </div>
 
              {/* Card 8: Height Guess (PLAYABLE) [NEW] */}
              <div 
                onClick={() => setActiveTab('height')}
                className="lobby-card"
              >
                <div className="lobby-card-preview" style={{ position: 'relative' }}>
                  <div className="collage-grid">
                    <img src="/images/student/icon/10005.webp" alt="Hoshino" className="collage-img" />
                    <img src="/images/student/icon/10004.webp" alt="Hina" className="collage-img" />
                    <img src="/images/student/icon/10008.webp" alt="Hasumi" className="collage-img" />
                    <img src="/images/student/icon/20009.webp" alt="Tsukuyo" className="collage-img" />
                  </div>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ArrowUpDown style={{ width: '48px', height: '48px', color: '#fbbf24', filter: 'drop-shadow(0 0 8px rgba(251,191,37,0.8))' }} />
                  </div>
                </div>
                
                <div className="lobby-card-info">
                  <h3 className="lobby-card-title">วัดส่วนสูงนักเรียน</h3>
                  <span className="lobby-card-tag ready">READY</span>
                </div>
                
                <button className="lobby-card-btn ready">
                  PLAY HEIGHT MODE
                </button>
              </div>

              {/* Card 9: Sibling Guess (PLAYABLE) [NEW] */}
              <div 
                onClick={() => setActiveTab('age')}
                className="lobby-card"
              >
                <div className="lobby-card-preview" style={{ position: 'relative' }}>
                  <div className="collage-grid">
                    <img src="/images/student/icon/10050.webp" alt="Kokona" className="collage-img" />
                    <img src="/images/student/icon/10009.webp" alt="Cherino" className="collage-img" />
                    <img src="/images/student/icon/10008.webp" alt="Hasumi" className="collage-img" />
                    <img src="/images/student/icon/10036.webp" alt="Shun" className="collage-img" />
                  </div>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Users style={{ width: '48px', height: '48px', color: '#ec4899', filter: 'drop-shadow(0 0 8px rgba(236,72,153,0.8))' }} />
                  </div>
                </div>
                
                <div className="lobby-card-info">
                  <h3 className="lobby-card-title">พี่หรือน้อง?</h3>
                  <span className="lobby-card-tag ready">READY</span>
                </div>
                
                <button className="lobby-card-btn ready">
                  PLAY SIBLING MODE
                </button>
              </div>

              {/* Card 10: Word Association (PLAYABLE) [NEW] */}
              <div 
                onClick={() => setActiveTab('word')}
                className="lobby-card"
              >
                <div className="lobby-card-preview" style={{ position: 'relative' }}>
                  <div className="collage-grid">
                    <img src="/images/student/icon/10005.webp" alt="Hoshino" className="collage-img" />
                    <img src="/images/student/icon/20059.webp" alt="Aru" className="collage-img" />
                    <img src="/images/student/icon/10015.webp" alt="Mika" className="collage-img" />
                    <img src="/images/student/icon/10012.webp" alt="Shiroko" className="collage-img" />
                  </div>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Compass style={{ width: '48px', height: '48px', color: '#22d3ee', filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.8))' }} />
                  </div>
                </div>
                
                <div className="lobby-card-info">
                  <h3 className="lobby-card-title">เดาคำความเกี่ยวข้อง</h3>
                  <span className="lobby-card-tag ready">READY</span>
                </div>
                
                <button className="lobby-card-btn ready">
                  PLAY WORD MODE
                </button>
              </div>

              {/* Card 11: Lobby Guess (PLAYABLE) [NEW] */}
              <div 
                onClick={() => setActiveTab('lobbyGuess')}
                className="lobby-card"
              >
                <div className="lobby-card-preview" style={{ position: 'relative' }}>
                  <div className="collage-grid">
                    <img src="/images/student/icon/10000.webp" alt="Aru" className="collage-img" />
                    <img src="/images/student/icon/10004.webp" alt="Hina" className="collage-img" />
                    <img src="/images/student/icon/10005.webp" alt="Hoshino" className="collage-img" />
                    <img src="/images/student/icon/10015.webp" alt="Aris" className="collage-img" />
                  </div>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Camera style={{ width: '48px', height: '48px', color: '#a855f7', filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.8))' }} />
                  </div>
                </div>
                
                <div className="lobby-card-info">
                  <h3 className="lobby-card-title">ทายภาพล็อบบี้ L2D</h3>
                  <span className="lobby-card-tag ready">READY</span>
                </div>
                
                <button className="lobby-card-btn ready">
                  PLAY LOBBY MODE
                </button>
              </div>

              {/* Card 12: Emoji & Symbol Quiz (PLAYABLE) [NEW] */}
              <div 
                onClick={() => setActiveTab('emojiQuiz')}
                className="lobby-card"
              >
                <div className="lobby-card-preview" style={{ position: 'relative' }}>
                  <div className="collage-grid">
                    <img src="/images/student/icon/10012.webp" alt="Shiroko" className="collage-img" />
                    <img src="/images/student/icon/10015.webp" alt="Mika" className="collage-img" />
                    <img src="/images/student/icon/20059.webp" alt="Aru" className="collage-img" />
                    <img src="/images/student/icon/10005.webp" alt="Hoshino" className="collage-img" />
                  </div>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Gamepad2 style={{ width: '48px', height: '48px', color: '#a855f7', filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.8))' }} />
                  </div>
                </div>
                
                <div className="lobby-card-info">
                  <h3 className="lobby-card-title">ทายนักเรียนด้วยอิโมจิ</h3>
                  <span className="lobby-card-tag ready">READY</span>
                </div>
                
                <button className="lobby-card-btn ready">
                  PLAY EMOJI MODE
                </button>
              </div>

              {/* Card 13: Blue Archive Chess (PLAYABLE) [NEW] */}
              <div 
                onClick={() => setActiveTab('chess')}
                className="lobby-card"
              >
                <div className="lobby-card-preview" style={{ position: 'relative' }}>
                  <div className="collage-grid">
                    <img src="/images/student/icon/10059.webp" alt="Mika" className="collage-img" />
                    <img src="/images/student/icon/10004.webp" alt="Hina" className="collage-img" />
                    <img src="/images/student/icon/13010.webp" alt="Yuuka" className="collage-img" />
                    <img src="/images/student/icon/10010.webp" alt="Shiroko" className="collage-img" />
                  </div>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Swords style={{ width: '48px', height: '48px', color: '#06b6d4', filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.8))' }} />
                  </div>
                </div>
                
                <div className="lobby-card-info">
                  <h3 className="lobby-card-title">Blue Archive Chess</h3>
                  <span className="lobby-card-tag ready">READY</span>
                </div>
                
                <button className="lobby-card-btn ready">
                  PLAY CHESS MODE
                </button>
              </div>

            </div>
          </div>
        )}

        {renderTab === 'student' && (
          <StudentGuesser soundEnabled={soundEnabled} onBack={() => setActiveTab('lobby')} />
        )}

        {renderTab === 'halo' && (
          <HaloGuesser 
            soundEnabled={soundEnabled} 
            onBack={() => setActiveTab('lobby')} 
          />
        )}

        {renderTab === 'weapon' && (
          <WeaponGuesser 
            soundEnabled={soundEnabled} 
            onBack={() => setActiveTab('lobby')} 
          />
        )}

        {renderTab === 'skill' && (
          <SkillGuesser 
            soundEnabled={soundEnabled} 
            onBack={() => setActiveTab('lobby')} 
          />
        )}

        {renderTab === 'gear' && (
          <GearGuesser 
            soundEnabled={soundEnabled} 
            onBack={() => setActiveTab('lobby')} 
          />
        )}

        {renderTab === 'chocolate' && (
          <ChocolateGuesser 
            soundEnabled={soundEnabled} 
            onBack={() => setActiveTab('lobby')} 
          />
        )}

        {renderTab === 'voice' && (
          <VoiceGuesser 
            soundEnabled={soundEnabled} 
            onBack={() => setActiveTab('lobby')} 
          />
        )}

        {renderTab === 'height' && (
          <HeightGuesser 
            soundEnabled={soundEnabled} 
            onBack={() => setActiveTab('lobby')} 
          />
        )}

        {renderTab === 'age' && (
          <AgeGuesser 
            soundEnabled={soundEnabled} 
            onBack={() => setActiveTab('lobby')} 
          />
        )}

        {renderTab === 'word' && (
          <BlueArchiveWordGame 
            soundEnabled={soundEnabled} 
            onBack={() => setActiveTab('lobby')} 
          />
        )}

        {renderTab === 'lobbyGuess' && (
          <LobbyGuesser 
            soundEnabled={soundEnabled} 
            onBack={() => setActiveTab('lobby')} 
          />
        )}

        {renderTab === 'emojiQuiz' && (
          <BlueArchiveEmojiGame 
            soundEnabled={soundEnabled} 
            onBack={() => setActiveTab('lobby')} 
          />
        )}

        {renderTab === 'eloRanker' && (
          <EloRanker 
            soundEnabled={soundEnabled} 
            onBack={() => setActiveTab('lobby')} 
          />
        )}

        {renderTab === 'chess' && (
          <BlueArchiveChess 
            soundEnabled={soundEnabled} 
            onBack={() => setActiveTab('lobby')} 
          />
        )}

        {renderTab === 'database' && (
          <StudentDatabase />
        )}

        {renderTab === 'about' && (
          <AboutSchale />
        )}
      </main>

      {/* Minimal Sticky/Bottom Footer */}
      <footer className="site-footer">
        © 2026 Kivotos Arcade. Data belongs to Nexon Games & Yostar. Designed for Sensei with Love
      </footer>

      <AnimatePresence>
        {isWorkspaceLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(12, 12, 14, 0.6)',
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 850, // Sit behind the navbar (z-index 900) so the header remains clear and interactive
              pointerEvents: 'all'
            }}
          >
            {/* Blue Archive Modern Loading Screen */}
            <div className="ba-loading-screen">
              <div className="ba-loading-halo-wrapper">
                <div className="ba-loading-ring outer" />
                <div className="ba-loading-ring inner" />
                <div className="ba-loading-logo">
                  <img src="/images/icon/icon_x512.png" className="ba-loading-logo-img" alt="logo" />
                </div>
              </div>
              <p className="ba-loading-text">กำลังเชื่อมต่อข้อมูลชาเล่ต์...</p>
              <div className="ba-loading-progress-bar">
                <div className="ba-loading-progress-fill" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

