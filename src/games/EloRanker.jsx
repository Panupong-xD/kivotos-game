import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Trophy, Search, RotateCcw, Download, Info, Swords, Sparkles, FileJson, Undo, Award } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useEloRanking from '../hooks/useEloRanking.js'
import LoadingScreen from '../components/LoadingScreen.jsx'
import './EloRanker.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("EloRanker Error Boundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px',
          background: 'rgba(74, 21, 32, 0.75)',
          border: '1px solid var(--border-failure, #f87171)',
          borderRadius: '16px',
          margin: '24px auto',
          maxWidth: '600px',
          color: '#fca5a5',
          fontFamily: 'Prompt, sans-serif',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '12px', color: '#f87171' }}>
            เกิดข้อผิดพลาดในการรันระบบจัดอันดับ (BA Ranker)
          </h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '16px', color: '#cbd5e1' }}>
            ตรวจพบข้อผิดพลาด: <strong>{this.state.error && this.state.error.toString()}</strong>
          </p>
          <pre style={{
            background: 'rgba(0,0,0,0.4)',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            overflow: 'auto',
            maxHeight: '200px',
            color: '#94a3b8',
            border: '1px solid rgba(255,255,255,0.05)',
            marginBottom: '16px',
            textAlign: 'left'
          }}>
            {this.state.error && this.state.error.stack}
          </pre>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{
                padding: '8px 16px',
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ล้างประวัติการโหวตและรีเซ็ตระบบ
            </button>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              รีโหลดหน้าเว็บ
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function EloRankerGame({ onBack, soundEnabled }) {
  const {
    characters,
    sortedCharactersCount,
    currentIndex,
    low,
    high,
    currentDuel,
    voteCount,
    isFinished,
    canUndo,
    loading,
    error,
    updateElo,
    resetRatings,
    undoLastVote
  } = useEloRanking()

  const [searchTerm, setSearchTerm] = useState('')
  const [pageSize, setPageSize] = useState(25) // 10, 25, 50, 'all'
  const [downloading, setDownloading] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  // Force page size to 'all' when finished to show the full leaderboard
  useEffect(() => {
    if (isFinished) {
      setPageSize('all')
    }
  }, [isFinished])

  // Audio effects
  const playSound = (type) => {
    if (!soundEnabled) return
    try {
      let audioPath = ''
      if (type === 'vote') audioPath = '/sounds/tap.mp3'
      else if (type === 'reset') audioPath = '/sounds/reset.mp3'
      
      if (audioPath) {
        const audio = new Audio(audioPath)
        audio.volume = 0.3
        audio.play().catch(() => {})
      }
    } catch (e) {
      // ignore audio playback errors
    }
  }

  // Handle vote outcome
  const handleVote = (outcome) => {
    if (!currentDuel || !currentDuel[0] || !currentDuel[1]) return
    playSound('vote')
    const [charA, charB] = currentDuel
    updateElo(charA.key, charB.key, outcome)
  }

  // Pre-sort all characters by rating for rank calculations
  const sortedAllCharacters = useMemo(() => {
    return [...characters].sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating
      }
      return (b.wins - b.losses) - (a.wins - a.losses) // tie breaker
    })
  }, [characters])

  // Map each character to their global rank
  const characterRanksMap = useMemo(() => {
    const ranks = {}
    sortedAllCharacters.forEach((char, index) => {
      ranks[char.key] = index + 1
    })
    return ranks
  }, [sortedAllCharacters])

  // Filtered list based on search term
  const filteredCharacters = useMemo(() => {
    if (!searchTerm.trim()) return sortedAllCharacters
    const term = searchTerm.toLowerCase()
    return sortedAllCharacters.filter(c => 
      c.nameEn.toLowerCase().includes(term) ||
      c.name.toLowerCase().includes(term) ||
      c.nameJp.toLowerCase().includes(term) ||
      c.schoolTh.toLowerCase().includes(term) ||
      c.school.toLowerCase().includes(term)
    )
  }, [sortedAllCharacters, searchTerm])

  // Paged characters
  const pagedCharacters = useMemo(() => {
    if (pageSize === 'all') return filteredCharacters
    return filteredCharacters.slice(0, Number(pageSize))
  }, [filteredCharacters, pageSize])

  // Calculate battle statistics
  const stats = useMemo(() => {
    let totalVotes = 0
    let maxRating = 1500
    let topStudent = null

    characters.forEach(c => {
      totalVotes += (c.matchesPlayed || 0)
      if (c.rating > maxRating) {
        maxRating = c.rating
      }
    })

    if (sortedAllCharacters.length > 0) {
      topStudent = sortedAllCharacters[0]
    }

    return {
      totalMatches: Math.floor(totalVotes / 2),
      maxRating,
      topStudent
    }
  }, [characters, sortedAllCharacters])

  // Helper to load image as Canvas resource
  const loadCanvasImage = (src) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = src
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
    })
  }

  // Download rankings as PNG Image Card
  const downloadLeaderboardPng = async (mode = 'top10') => {
    if (sortedAllCharacters.length === 0) return
    setDownloading(true)

    try {
      const isAll = mode === 'all'
      const targets = isAll ? sortedAllCharacters : sortedAllCharacters.slice(0, 10)
      const topN = sortedAllCharacters.slice(0, 10) // still need top 3 for podium

      const canvas = document.createElement('canvas')
      
      // Calculate Canvas dimensions dynamically (virtual dimensions)
      const baseWidth = isAll ? 1200 : 800
      let baseHeight = 1150
      
      const rowHeight = isAll ? 44 : 56
      const startY = isAll ? 480 : 500
      
      if (isAll) {
        const remainingCount = Math.max(0, sortedAllCharacters.length - 3)
        const colCount = 3
        const rowsPerCol = Math.ceil(remainingCount / colCount)
        baseHeight = startY + 30 + (rowsPerCol * rowHeight) + 80 // 30px headers, 80px footer
      } else {
        const top10Count = Math.min(10, sortedAllCharacters.length)
        baseHeight = startY + (top10Count * rowHeight) + 80
      }

      // 2x Retina Scaling for high resolution sharp results
      const scale = 2
      canvas.width = baseWidth * scale
      canvas.height = baseHeight * scale
      const ctx = canvas.getContext('2d')
      ctx.scale(scale, scale)

      // Draw background (using virtual height/width)
      const gradient = ctx.createLinearGradient(0, 0, 0, baseHeight)
      gradient.addColorStop(0, '#0C0C0E')
      gradient.addColorStop(0.3, '#141419')
      gradient.addColorStop(0.8, '#1C1C24')
      gradient.addColorStop(1, '#0C0C0E')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, baseWidth, baseHeight)

      const centerX = baseWidth / 2
      const radialGlow = ctx.createRadialGradient(centerX, -200, 100, centerX, -200, isAll ? 800 : 600)
      radialGlow.addColorStop(0, 'rgba(76, 154, 224, 0.25)')
      radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = radialGlow
      ctx.fillRect(0, 0, baseWidth, baseHeight)

      // Preload images
      const iconPromises = targets.map(c => loadCanvasImage(c.iconPath))
      const brandLogoPromise = loadCanvasImage('/images/icon/icon_x512.png')

      const [loadedIcons, brandLogo] = await Promise.all([
        Promise.all(iconPromises),
        brandLogoPromise
      ])

      // Draw Brand Logo & Header
      if (brandLogo) {
        ctx.drawImage(brandLogo, 50, 45, 60, 60)
      }
      
      ctx.font = 'bold 28px Outfit, Prompt, sans-serif'
      ctx.fillStyle = '#F5F5F7'
      ctx.fillText('KIVOTOS ARCADE', 130, 70)

      ctx.font = '500 14px Outfit, Prompt, sans-serif'
      ctx.fillStyle = '#4C9AE0'
      ctx.fillText(isAll ? 'SCHALE STUDENT FULL CHARACTER RANKINGS' : 'SCHALE STUDENT ELO RANKING', 130, 92)

      const dateText = new Date().toLocaleDateString('th-TH', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      })
      ctx.font = '13px Prompt, sans-serif'
      ctx.fillStyle = '#8E8E93'
      ctx.textAlign = 'right'
      ctx.fillText(`บันทึกข้อมูล ณ วันที่: ${dateText}`, baseWidth - 50, 80)
      ctx.textAlign = 'left'

      // Horizontal separator line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(50, 130)
      ctx.lineTo(baseWidth - 50, 130)
      ctx.stroke()

      // Draw Top 3 Podium
      const podiumSpots = [
        { rank: 2, x: centerX - 180, y: 310, label: '🥈 2nd', color: '#d1d5db', size: 100 },
        { rank: 1, x: centerX, y: 280, label: '🥇 1st', color: '#fbbf24', size: 120 },
        { rank: 3, x: centerX + 180, y: 320, label: '🥉 3rd', color: '#f97316', size: 90 }
      ]

      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
      ctx.shadowBlur = 15

      for (const spot of podiumSpots) {
        const student = sortedAllCharacters[spot.rank - 1]
        if (!student) continue

        const img = loadedIcons[spot.rank - 1]
        const radius = spot.size / 2

        ctx.strokeStyle = spot.color
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.arc(spot.x, spot.y, radius + 2, 0, Math.PI * 2)
        ctx.stroke()

        if (img) {
          ctx.save()
          ctx.beginPath()
          ctx.arc(spot.x, spot.y, radius, 0, Math.PI * 2)
          ctx.clip()
          ctx.drawImage(img, spot.x - radius, spot.y - radius, spot.size, spot.size)
          ctx.restore()
        } else {
          ctx.fillStyle = '#1C1C1E'
          ctx.beginPath()
          ctx.arc(spot.x, spot.y, radius, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.fillStyle = spot.color
        ctx.font = 'bold 13px Prompt, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(spot.label, spot.x, spot.y + radius + 22)

        ctx.fillStyle = '#F5F5F7'
        ctx.font = 'bold 15px Prompt, sans-serif'
        ctx.fillText(student.nameEn, spot.x, spot.y + radius + 42)

        ctx.fillStyle = '#fbbf24'
        ctx.font = 'bold 14px Outfit, sans-serif'
        ctx.fillText(`${student.rating} Elo`, spot.x, spot.y + radius + 60)
      }
      
      ctx.shadowBlur = 0

      // Separator line before list
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
      ctx.beginPath()
      ctx.moveTo(50, 440)
      ctx.lineTo(baseWidth - 50, 440)
      ctx.stroke()

      if (isAll) {
        // 3-Column List Layout for Ranks 4 to N
        const remainingCharacters = sortedAllCharacters.slice(3)
        const colCount = 3
        const rowsPerCol = Math.ceil(remainingCharacters.length / colCount)
        const columnWidth = 340
        const colGapX = 30
        const startX = 60

        // Draw Headers for each column
        for (let col = 0; col < colCount; col++) {
          const colX = startX + col * (columnWidth + colGapX)
          ctx.fillStyle = '#8E8E93'
          ctx.font = 'bold 12px Prompt, sans-serif'
          ctx.fillText('อันดับ', colX, startY)
          ctx.fillText('นักเรียน / สถาบัน', colX + 85, startY)
          ctx.textAlign = 'right'
          ctx.fillText('ELO', colX + columnWidth, startY)
          ctx.textAlign = 'left'

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(colX, startY + 10)
          ctx.lineTo(colX + columnWidth, startY + 10)
          ctx.stroke()
        }

        // Draw rows
        remainingCharacters.forEach((student, idx) => {
          const col = Math.floor(idx / rowsPerCol)
          const row = idx % rowsPerCol
          
          const colX = startX + col * (columnWidth + colGapX)
          const rowY = startY + 28 + row * rowHeight

          // Alternating background
          if (row % 2 === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.015)'
            ctx.fillRect(colX - 4, rowY - 14, columnWidth + 8, rowHeight)
          }

          // Draw Rank
          const globalRank = idx + 4
          ctx.fillStyle = '#8E8E93'
          ctx.font = '500 13px Prompt, sans-serif'
          ctx.fillText(`#${globalRank}`, colX + 4, rowY + 14)

          // Draw Avatar
          const img = loadedIcons[idx + 3] // Offset by 3
          const avatarSize = 28
          const avatarX = colX + 45
          const avatarY = rowY - 6
          if (img) {
            ctx.save()
            ctx.beginPath()
            ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, 4)
            ctx.clip()
            ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize)
            ctx.restore()
          }

          // Draw Name
          ctx.fillStyle = '#F5F5F7'
          ctx.font = 'bold 13px Prompt, sans-serif'
          ctx.fillText(student.nameEn, colX + 85, rowY + 6)

          // Draw School
          ctx.fillStyle = '#6E6E73'
          ctx.font = '10px Prompt, sans-serif'
          ctx.fillText(student.schoolTh, colX + 85, rowY + 18)

          // Draw ELO
          ctx.textAlign = 'right'
          ctx.fillStyle = '#fbbf24'
          ctx.font = 'bold 13px Outfit, sans-serif'
          ctx.fillText(student.rating, colX + columnWidth - 4, rowY + 14)
          ctx.textAlign = 'left'
        })

      } else {
        // Classic 1-Column Layout for Top 10
        ctx.fillStyle = '#8E8E93'
        ctx.font = 'bold 13px Prompt, sans-serif'
        ctx.fillText('อันดับ', 60, 470)
        ctx.fillText('ชื่อนักเรียน', 170, 470)
        ctx.textAlign = 'right'
        ctx.fillText('สถาบัน', 600, 470)
        ctx.fillText('ELO RATING', 740, 470)
        ctx.textAlign = 'left'

        const top10Count = Math.min(10, sortedAllCharacters.length)
        const top10List = sortedAllCharacters.slice(0, top10Count)

        top10List.forEach((student, index) => {
          const rowY = startY + (index * rowHeight)
          ctx.fillStyle = index % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
          ctx.fillRect(50, rowY - 18, 700, rowHeight)

          let rankStr = `#${index + 1}`
          if (index === 0) rankStr = '🥇'
          else if (index === 1) rankStr = '🥈'
          else if (index === 2) rankStr = '🥉'
          
          ctx.fillStyle = index === 0 ? '#fbbf24' : index === 1 ? '#d1d5db' : index === 2 ? '#f97316' : '#8E8E93'
          ctx.font = 'bold 15px Prompt, sans-serif'
          ctx.fillText(rankStr, 65, rowY + 16)

          const img = loadedIcons[index]
          const avatarSize = 36
          if (img) {
            ctx.save()
            ctx.beginPath()
            ctx.roundRect(110, rowY - 6, avatarSize, avatarSize, 6)
            ctx.clip()
            ctx.drawImage(img, 110, rowY - 6, avatarSize, avatarSize)
            ctx.restore()
          }

          ctx.fillStyle = '#F5F5F7'
          ctx.font = 'bold 15px Prompt, sans-serif'
          ctx.fillText(student.nameEn, 160, rowY + 10)

          ctx.fillStyle = '#8E8E93'
          ctx.font = '11px Prompt, sans-serif'
          ctx.fillText(student.nameJp, 160, rowY + 24)

          ctx.textAlign = 'right'
          ctx.fillStyle = '#8E8E93'
          ctx.font = '13px Prompt, sans-serif'
          ctx.fillText(student.schoolTh, 600, rowY + 16)

          ctx.fillStyle = '#fbbf24'
          ctx.font = 'bold 16px Outfit, sans-serif'
          ctx.fillText(student.rating, 740, rowY + 16)
          ctx.textAlign = 'left'
        })
      }

      // Draw Footer
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
      ctx.beginPath()
      ctx.moveTo(50, baseHeight - 70)
      ctx.lineTo(baseWidth - 50, baseHeight - 70)
      ctx.stroke()

      ctx.fillStyle = '#8E8E93'
      ctx.font = '13px Prompt, sans-serif'
      ctx.fillText('Kivotos Arcade - Character Ranker Poster', 60, baseHeight - 35)

      ctx.textAlign = 'right'
      ctx.fillText(`จำนวนโหวตทั้งหมด: ${voteCount} ครั้ง | ตัวละครทั้งหมด: ${sortedAllCharacters.length} คน`, baseWidth - 60, baseHeight - 35)
      ctx.textAlign = 'left'

      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `sensei_character_rankings_${mode}_${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error('Failed to generate PNG download:', e)
    } finally {
      setDownloading(false)
    }
  }

  // Export to JSON
  const exportRankingJson = () => {
    try {
      const dataStr = JSON.stringify(sortedAllCharacters, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.download = `ba_elo_rankings_${Date.now()}.json`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Failed to export JSON:', e)
    }
  }

  // Binary Sort Progress Calculations
  const progressPercent = characters.length > 0 
    ? Math.min(100, Math.floor((sortedCharactersCount / characters.length) * 100))
    : 0

  if (loading) {
    return <LoadingScreen message="กำลังโหลดข้อมูลนักเรียนและประวัติการดวล..." />
  }

  if (error) {
    return (
      <div className="elo-empty-state" style={{ border: '1px solid var(--border-failure)', background: 'rgba(74, 21, 32, 0.15)', borderRadius: '12px' }}>
        <p style={{ color: '#fca5a5', fontSize: '1.1rem', marginBottom: '16px' }}>เกิดข้อผิดพลาดในการโหลดระบบ Elo Rating: {error}</p>
        <button onClick={resetRatings} className="btn-danger">
          <RotateCcw className="w-4 h-4" /> รีเซ็ตข้อมูลและทดลองอีกครั้ง
        </button>
      </div>
    )
  }

  return (
    <div className="elo-ranker-container">
      {/* Header section with Stats & reset controls */}
      <div className="elo-header-section">
        <div className="elo-title-area">
          <h2>CHARACTER RANKER</h2>
          <p>จัดอันดับความชื่นชอบของนักเรียนผ่านการดวลเปรียบเทียบระบบ Elo Rating</p>
        </div>
        <div className="elo-header-actions">
          {confirmReset ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#fca5a5' }}>คุณครูต้องการล้างคะแนนทั้งหมดใช่หรือไม่?</span>
              <button 
                onClick={() => {
                  playSound('reset')
                  resetRatings()
                  setConfirmReset(false)
                }} 
                className="btn-danger"
                style={{ padding: '6px 12px' }}
              >
                ใช่, ล้างข้อมูล
              </button>
              <button 
                onClick={() => setConfirmReset(false)} 
                className="btn-secondary"
                style={{ padding: '6px 12px' }}
              >
                ยกเลิก
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmReset(true)} className="btn-secondary" title="รีเซ็ตคะแนนนักเรียนทั้งหมดกลับไปที่ 1500">
              <RotateCcw className="w-4 h-4" />
              <span>รีเซ็ตอันดับ</span>
            </button>
          )}
          
          <button onClick={exportRankingJson} className="btn-secondary" title="ส่งออกไฟล์ข้อมูลคะแนนทั้งหมด">
            <FileJson className="w-4 h-4" />
            <span>ส่งออก JSON</span>
          </button>
          
          <button 
            onClick={() => downloadLeaderboardPng('top10')} 
            disabled={downloading}
            className="btn-secondary" 
            title="ดาวน์โหลดภาพสรุปอันดับ Top 10"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? '...' : 'เซฟรูป Top 10'}</span>
          </button>
          
          <button 
            onClick={() => downloadLeaderboardPng('all')} 
            disabled={downloading}
            className="btn-secondary" 
            style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
            title="ดาวน์โหลดโปสเตอร์สรุปอันดับทั้งหมด"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? '...' : 'เซฟรูปทั้งหมด'}</span>
          </button>
        </div>
      </div>

      {/* Finished Summary Panel Banner */}
      {isFinished && (
        <div style={{
          background: 'rgba(251, 191, 36, 0.06)',
          border: '1px solid rgba(251, 191, 36, 0.25)',
          borderRadius: '16px',
          padding: '24px',
          textAlign: 'center',
          animation: 'scaleUp 0.5s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Trophy className="w-12 h-12 text-amber-400 animate-bounce" style={{ filter: 'drop-shadow(0 0 10px rgba(251,191,36,0.6))' }} />
          <h3 style={{ fontSize: '1.45rem', fontWeight: 'bold', color: '#fbbf24', fontFamily: 'Outfit, sans-serif' }}>
            การจัดอันดับนักเรียนเสร็จสมบูรณ์!
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '560px', lineHeight: '1.5' }}>
            ระบบได้เรียงลำดับความชื่นชอบของนักเรียนครบทุกตัวละคร ({characters.length} คน) ด้วยความแม่นยำ 100% แล้วค่ะ! (โหวตสะสมเปรียบเทียบทั้งหมด {voteCount} ครั้ง) คุณครูสามารถดาวน์โหลดการ์ดสรุปอันดับเพื่อแชร์ หรือกดส่งออกข้อมูลด้านบนได้เลย!
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button 
              onClick={() => downloadLeaderboardPng('top10')} 
              disabled={downloading}
              className="btn-secondary"
              style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff', borderColor: 'rgba(255, 255, 255, 0.2)', fontWeight: '600' }}
            >
              <Download className="w-4 h-4" />
              {downloading ? 'กำลังเซฟภาพ...' : 'ดาวน์โหลดสรุป Top 10'}
            </button>
            <button 
              onClick={() => downloadLeaderboardPng('all')} 
              disabled={downloading}
              className="btn-secondary"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #d97706)', color: '#000', borderColor: '#fbbf24', fontWeight: '700' }}
            >
              <Download className="w-4 h-4" />
              {downloading ? 'กำลังเซฟภาพ...' : 'ดาวน์โหลดโปสเตอร์ทั้งหมด (1-198)'}
            </button>
            <button 
              onClick={() => {
                playSound('reset')
                resetRatings()
              }} 
              className="btn-danger"
            >
              <RotateCcw className="w-4 h-4" />
              เริ่มต้นจัดอันดับใหม่
            </button>
          </div>
        </div>
      )}

      {/* Stats Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="elo-stat-box">
          <div className="elo-stat-box-val">{voteCount}</div>
          <div className="elo-stat-box-lbl">จำนวนการตัดสินใจสะสม (โหวต)</div>
        </div>
        <div className="elo-stat-box">
          <div className="elo-stat-box-val" style={{ color: '#fbbf24' }}>{sortedCharactersCount} / {characters.length}</div>
          <div className="elo-stat-box-lbl">จำนวนนักเรียนที่จัดอันดับแล้ว (คน)</div>
        </div>
        <div className="elo-stat-box">
          <div className="elo-stat-box-val" style={{ color: '#a78bfa' }}>
            {stats.topStudent ? stats.topStudent.nameEn : 'N/A'}
          </div>
          <div className="elo-stat-box-lbl">นักเรียนอันดับหนึ่ง ณ ปัจจุบัน</div>
        </div>
      </div>

      {/* Split Grid Layout */}
      <div className={`elo-layout-grid ${isFinished ? 'is-finished-layout' : ''}`}>
        
        {/* Left Column: Duel Arena (only shown if not finished) */}
        {!isFinished && (
          <div className="elo-arena-panel">
            <h3 className="elo-arena-title">
              <Swords className="w-5 h-5 text-sky-400" />
              <span>STUDENT ARENA (แมตช์จับคู่ดวล)</span>
            </h3>

            {/* Stability Progress Dashboard */}
            <div className="elo-stability-container">
              <div className="elo-stability-header">
                <span className="elo-stability-phase" style={{ color: 'var(--color-accent)' }}>
                  ความคืบหน้าการจัดอันดับ (Binary Insertion Sort)
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', fontFamily: 'Outfit, sans-serif' }}>
                  {sortedCharactersCount} / {characters.length} คน
                </span>
              </div>
              <div className="elo-stability-bar-bg">
                <div 
                  className="elo-stability-bar-fill" 
                  style={{ 
                    width: `${progressPercent}%`, 
                    background: 'var(--color-accent)' 
                  }}
                />
              </div>
              <p className="elo-stability-desc">
                {currentDuel 
                  ? `ระบบกำลังค้นหาตำแหน่งจัดอันดับที่ถูกต้องให้: ${currentDuel[0].nameEn} (${currentIndex + 1}/${characters.length})`
                  : 'จัดอันดับครบเรียบร้อยแล้วค่ะ'}
              </p>
            </div>

            {currentDuel ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="elo-duel-container">
                  
                  {/* Character A Card */}
                  <div 
                    className="elo-char-card" 
                    onClick={() => handleVote('A')}
                    title={`เลือก ${currentDuel[0].nameEn}`}
                  >
                    <div className="elo-char-portrait-container">
                      <img 
                        className="elo-char-portrait" 
                        src={currentDuel[0].portraitPath} 
                        alt={currentDuel[0].nameEn}
                      />
                      <div className="elo-char-overlay">
                        <span className="elo-char-school-badge">{currentDuel[0].school}</span>
                        <h4 className="elo-char-name-en">{currentDuel[0].nameEn}</h4>
                        <p className="elo-char-name-jp">{currentDuel[0].nameJp}</p>
                        <div className="elo-char-rating-badge">
                          <span>{currentDuel[0].rating}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>ELO</span>
                        </div>
                        <div className="elo-char-stats-row">
                          <span>ชื่นชอบ: {currentDuel[0].wins}</span>
                          <span>แพ้: {currentDuel[0].losses}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* VS Indicator */}
                  <div className="elo-vs-badge">VS</div>

                  {/* Character B Card */}
                  <div 
                    className="elo-char-card" 
                    onClick={() => handleVote('B')}
                    title={`เลือก ${currentDuel[1].nameEn}`}
                  >
                    <div className="elo-char-portrait-container">
                      <img 
                        className="elo-char-portrait" 
                        src={currentDuel[1].portraitPath} 
                        alt={currentDuel[1].nameEn}
                      />
                      <div className="elo-char-overlay">
                        <span className="elo-char-school-badge">{currentDuel[1].school}</span>
                        <h4 className="elo-char-name-en">{currentDuel[1].nameEn}</h4>
                        <p className="elo-char-name-jp">{currentDuel[1].nameJp}</p>
                        <div className="elo-char-rating-badge">
                          <span>{currentDuel[1].rating}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>ELO</span>
                        </div>
                        <div className="elo-char-stats-row">
                          <span>ชื่นชอบ: {currentDuel[1].wins}</span>
                          <span>แพ้: {currentDuel[1].losses}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="elo-controls">
                  <button className="btn-action-draw" onClick={() => handleVote('draw')} style={{ gridColumn: 'span 2' }}>
                    <Sparkles className="w-4 h-4" />
                    <span>ชื่นชอบพอๆ กัน (เสมอ)</span>
                  </button>

                  {/* Undo Button (ย้อนกลับการโหวตล่าสุด) */}
                  <button 
                    className="btn-action-undo" 
                    disabled={!canUndo} 
                    onClick={undoLastVote}
                    style={{ gridColumn: 'span 2' }}
                    title={canUndo ? "ย้อนกลับผลการเปรียบเทียบล่าสุดในกรณีที่กดผิด" : "ยังไม่มีประวัติการเปรียบเทียบ"}
                  >
                    <Undo className="w-4 h-4" />
                    <span>ย้อนกลับขั้นตอนที่แล้ว</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="elo-empty-state">
                ไม่พบคู่ดวล กรุณากดปุ่มรีเซ็ตเพื่อโหลดนักเรียนใหม่
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '8px' }}>
              <Info className="w-4 h-4 text-sky-400" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                <strong>ระบบจัดอันดับ Binary Insertion Sort:</strong> ระบบจะจับคู่นักเรียนมาให้เปรียบเทียบทีละคนและวางอันดับที่ถูกต้องให้ 100% (ตามหลักสัจพจน์ถ่ายทอด) ระบบจะเสร็จสิ้นเมื่อเรียงลำดับครบนักเรียนทั้ง {characters.length} คน คุณครูสามารถกด "ย้อนกลับขั้นตอนที่แล้ว" เพื่อแก้ไขคะแนนได้ค่ะ
              </p>
            </div>
          </div>
        )}

        {/* Right Column / Full screen: Animated Leaderboard */}
        <div className="elo-leaderboard-panel">
          <div className="elo-board-header">
            <h3 className="elo-board-title">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>
                {isFinished ? 'ตารางสรุปอันดับนักเรียนถาวร (1 - 198)' : `SENSEI'S LEADERBOARD (${filteredCharacters.length} คน)`}
              </span>
            </h3>
            
            {/* Search and Filters */}
            <div className="elo-filters-row">
              <div className="elo-search-wrapper">
                <Search className="elo-search-icon" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อนักเรียน/สถาบัน..."
                  className="elo-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {!isFinished && (
                <select
                  className="elo-select-filter"
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value)}
                  title="เลือกจำนวนแถวที่แสดงผล"
                >
                  <option value="10">แสดง 10 คน</option>
                  <option value="25">แสดง 25 คน</option>
                  <option value="50">แสดง 50 คน</option>
                  <option value="all">แสดงทั้งหมด</option>
                </select>
              )}
            </div>
          </div>

          <div className="elo-list-container">
            <div className="elo-list-header">
              <span>อันดับ</span>
              <span>รูป</span>
              <span>นักเรียน / สังกัด</span>
              <span style={{ textAlign: 'right' }}>ELO</span>
            </div>

            {pagedCharacters.length === 0 ? (
              <div className="elo-empty-state">
                ไม่พบข้อมูลนักเรียนที่ตรงตามเงื่อนไขค้นหา
              </div>
            ) : (
              // Framer Motion Layout Animation Container
              <AnimatePresence mode="popLayout">
                {pagedCharacters.map((char) => {
                  const globalRank = characterRanksMap[char.key]
                  let rankIcon = `#${globalRank}`
                  if (globalRank === 1) rankIcon = '🥇'
                  else if (globalRank === 2) rankIcon = '🥈'
                  else if (globalRank === 3) rankIcon = '🥉'

                  return (
                    <motion.div
                      key={char.key}
                      layout={globalRank <= 30}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                        mass: 0.8
                      }}
                      className={`elo-row rank-${globalRank}`}
                    >
                      <div className="elo-rank-col">
                        {rankIcon}
                      </div>
                      <div className="elo-avatar-col">
                        <img 
                          className="elo-avatar-img" 
                          src={char.iconPath} 
                          alt={char.nameEn}
                        />
                      </div>
                      <div className="elo-name-col">
                        <span className="elo-name-text">{char.nameEn}</span>
                        <span className="elo-sub-text">{char.nameJp} • {char.schoolTh}</span>
                      </div>
                      <div className="elo-rating-col">
                        {char.rating}
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EloRanker(props) {
  return (
    <ErrorBoundary>
      <EloRankerGame {...props} />
    </ErrorBoundary>
  )
}
