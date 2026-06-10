import React, { useState } from 'react'
import StudentGuesser from './games/StudentGuesser.jsx'
import SkillGuesser from './games/SkillGuesser.jsx'
import { Gamepad2, Award, BookOpen, Volume2, VolumeX, ArrowLeft, Lock } from 'lucide-react'

export default function App() {
  const [activeTab, setActiveTab] = useState('lobby') // 'lobby', 'student', 'skill'
  const [soundEnabled, setSoundEnabled] = useState(true)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Header Bar */}
      <header className="header-container">
        {/* Brand Logo and Title */}
        <div className="brand-wrapper" onClick={() => setActiveTab('lobby')}>
          <div className="brand-icon-box">
            <img src="/images/icon/icon_x512.png" alt="Kivotos Arcade Logo" className="brand-logo-img" />
          </div>
          <div className="brand-title-box">
            <h1>KIVOTOS ARCADE</h1>
            <p>SCHALE GAME STATION</p>
          </div>
        </div>

        {/* Header Control Buttons */}
        <div className="controls-wrapper">
          {activeTab !== 'lobby' && (
            <button
              onClick={() => setActiveTab('lobby')}
              className="header-back-btn"
            >
              <ArrowLeft className="w-4 h-4 back-icon" />
              <span>กลับหน้าหลัก</span>
            </button>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="sound-toggle-btn"
            title={soundEnabled ? 'ปิดเสียง' : 'เปิดเสียง'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main App Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 mt-4">
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

              {/* Card 2: Skill Guess (LOCKED) */}
              <div className="lobby-card locked">
                {/* Blurred Locked preview */}
                <div className="lobby-card-preview">
                  <div className="lock-preview-bg">
                    <div className="lock-icon-img"></div>
                    <div className="lock-icon-img"></div>
                    <div className="lock-icon-img"></div>
                    <div className="lock-icon-img"></div>
                  </div>
                  <Lock className="w-8 h-8 lock-overlay-symbol" />
                </div>
                
                <div className="lobby-card-info">
                  <h3 className="lobby-card-title text-muted">เร็วๆนี้</h3>
                  <span className="lobby-card-tag locked">LOCKED</span>
                </div>
                
                <button disabled className="lobby-card-btn locked">
                  COMING SOON
                </button>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'student' && (
          <StudentGuesser soundEnabled={soundEnabled} onBack={() => setActiveTab('lobby')} />
        )}

        {activeTab === 'skill' && (
          <SkillGuesser onBack={() => setActiveTab('lobby')} />
        )}
      </main>

      {/* Minimal Sticky/Bottom Footer */}
      <footer className="site-footer">
        © 2026 Kivotos Arcade. Data belongs to Nexon Games & Yostar. Designed for Sensei with Love
      </footer>
    </div>
  )
}

