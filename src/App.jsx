import React, { useState } from 'react'
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
import StudentDatabase from './components/StudentDatabase.jsx'
import AboutSchale from './components/AboutSchale.jsx'
import { Gamepad2, Award, BookOpen, Volume2, VolumeX, ArrowLeft, Lock, Menu, X, Users, Ruler, ArrowUpDown, Calendar, Swords } from 'lucide-react'

export default function App() {
  const [activeTab, setActiveTab] = useState('lobby') // 'lobby', 'student', 'halo', 'weapon', 'skill', 'gear', 'chocolate', 'database', 'about', 'eloRanker'
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
          <nav className="desktop-nav-links">
            <button
              onClick={() => {
                setActiveTab('lobby')
              }}
              className={`nav-link-btn ${(activeTab === 'lobby' || activeTab === 'student' || activeTab === 'halo' || activeTab === 'weapon' || activeTab === 'skill' || activeTab === 'gear' || activeTab === 'chocolate' || activeTab === 'voice' || activeTab === 'height' || activeTab === 'age') ? 'active' : ''}`}
            >
              <Gamepad2 className="w-4 h-4 nav-link-icon" />
              <span>Arcade</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('eloRanker')
              }}
              className={`nav-link-btn ${activeTab === 'eloRanker' ? 'active' : ''}`}
            >
              <Swords className="w-4 h-4 nav-link-icon" />
              <span>BA Ranker</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('database')
              }}
              className={`nav-link-btn ${activeTab === 'database' ? 'active' : ''}`}
            >
              <BookOpen className="w-4 h-4 nav-link-icon" />
              <span>Student DB</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('about')
              }}
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
                  setActiveTab('lobby')
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
              className={`mobile-nav-link ${(activeTab === 'lobby' || activeTab === 'student' || activeTab === 'halo' || activeTab === 'weapon' || activeTab === 'skill' || activeTab === 'gear' || activeTab === 'chocolate' || activeTab === 'voice' || activeTab === 'height' || activeTab === 'age') ? 'active' : ''}`}
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
        {activeTab === 'lobby' && (
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

            </div>
          </div>
        )}

        {activeTab === 'student' && (
          <StudentGuesser soundEnabled={soundEnabled} onBack={() => setActiveTab('lobby')} />
        )}

        {activeTab === 'halo' && (
          <HaloGuesser 
            soundEnabled={soundEnabled} 
            onBack={() => setActiveTab('lobby')} 
          />
        )}

        {activeTab === 'weapon' && (
          <WeaponGuesser 
            soundEnabled={soundEnabled} 
            onBack={() => setActiveTab('lobby')} 
          />
        )}

        {activeTab === 'skill' && (
          <SkillGuesser 
            soundEnabled={soundEnabled} 
            onBack={() => setActiveTab('lobby')} 
          />
        )}

        {activeTab === 'gear' && (
          <GearGuesser 
            soundEnabled={soundEnabled} 
            onBack={() => setActiveTab('lobby')} 
          />
        )}

        {activeTab === 'chocolate' && (
          <ChocolateGuesser 
            soundEnabled={soundEnabled} 
            onBack={() => setActiveTab('lobby')} 
          />
        )}

        {activeTab === 'voice' && (
          <VoiceGuesser 
            soundEnabled={soundEnabled} 
            onBack={() => setActiveTab('lobby')} 
          />
        )}

        {activeTab === 'height' && (
          <HeightGuesser 
            soundEnabled={soundEnabled} 
            onBack={() => setActiveTab('lobby')} 
          />
        )}

        {activeTab === 'age' && (
          <AgeGuesser 
            soundEnabled={soundEnabled} 
            onBack={() => setActiveTab('lobby')} 
          />
        )}

        {activeTab === 'eloRanker' && (
          <EloRanker 
            soundEnabled={soundEnabled} 
            onBack={() => setActiveTab('lobby')} 
          />
        )}

        {activeTab === 'database' && (
          <StudentDatabase />
        )}

        {activeTab === 'about' && (
          <AboutSchale />
        )}
      </main>

      {/* Minimal Sticky/Bottom Footer */}
      <footer className="site-footer">
        © 2026 Kivotos Arcade. Data belongs to Nexon Games & Yostar. Designed for Sensei with Love
      </footer>
    </div>
  )
}

