import React from 'react'
import { Sparkles, RefreshCw, Share2 } from 'lucide-react'

export default function WinModal({ target, guessesCount, onReset, guesses = [], onClose }) {
  
  // Format quotes (replace newline with <br/>)
  const renderQuote = (quote) => {
    if (!quote) return 'ยินดีด้วยนะคุณครู! ในที่สุดเราก็เจอกันแล้ว'
    return quote.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)
  }

  // Share results to clipboard in Wordle format
  const handleShare = () => {
    let shareText = `Kivotos Student Guesser 🎉\nทายตัวละครใน ${guessesCount} ครั้ง!\n\n`
    
    guesses.forEach(g => {
      const rowEmojis = []
      rowEmojis.push(g.id === target.id ? '🟩' : '🟥')
      rowEmojis.push(g.school === target.school ? '🟩' : '🟥')
      rowEmojis.push(g.squadType === target.squadType ? '🟩' : '🟥')
      rowEmojis.push(g.tacticRole === target.tacticRole ? '🟩' : '🟥')
      rowEmojis.push(g.bulletType === target.bulletType ? '🟩' : '🟥')
      rowEmojis.push(g.armorType === target.armorType ? '🟩' : '🟥')
      rowEmojis.push(g.position === target.position ? '🟩' : '🟥')
      rowEmojis.push(g.starGrade === target.starGrade ? '🟩' : '🟥')
      rowEmojis.push(g.schoolYear === target.schoolYear ? '🟩' : '🟥')
      
      // Cost EX
      rowEmojis.push(g.exCost === target.exCost ? '🟩' : (g.exCost < target.exCost ? '⬆️' : '⬇️'))

      // Height
      const gHeight = parseInt(g.charHeightMetric) || 0
      const targetHeight = parseInt(target.charHeightMetric) || 0
      rowEmojis.push(gHeight === targetHeight ? '🟩' : (gHeight < targetHeight ? '⬆️' : '⬇️'))

      // Adaptations
      rowEmojis.push(g.streetBattleAdaptation === target.streetBattleAdaptation ? '🟩' : (g.streetBattleAdaptation < target.streetBattleAdaptation ? '⬆️' : '⬇️'))
      rowEmojis.push(g.outdoorBattleAdaptation === target.outdoorBattleAdaptation ? '🟩' : (g.outdoorBattleAdaptation < target.outdoorBattleAdaptation ? '⬆️' : '⬇️'))
      rowEmojis.push(g.indoorBattleAdaptation === target.indoorBattleAdaptation ? '🟩' : (g.indoorBattleAdaptation < target.indoorBattleAdaptation ? '⬆️' : '⬇️'))

      
      rowEmojis.push(g.equipment && g.equipment[0] && target.equipment && g.equipment[0] === target.equipment[0] ? '🟩' : '🟥')
      rowEmojis.push(g.equipment && g.equipment[1] && target.equipment && g.equipment[1] === target.equipment[1] ? '🟩' : '🟥')
      rowEmojis.push(g.equipment && g.equipment[2] && target.equipment && g.equipment[2] === target.equipment[2] ? '🟩' : '🟥')

      shareText += rowEmojis.join('') + '\n'
    })

    shareText += `\nไปทายตัวละครกันเลยที่ Kivotos Arcade!`
    
    navigator.clipboard.writeText(shareText)
      .then(() => alert('คัดลอกผลลัพธ์ลง Clipboard แล้ว! สามารถส่งแชร์ให้เพื่อนๆ ได้เลย 📝'))
      .catch(() => alert('ไม่สามารถคัดลอกได้โดยอัตโนมัติ กรุณาคัดลอกด้วยตัวเอง'))
  }

  return (
    <div className="win-modal-overlay">
      <div className="win-modal-card">
        
        {/* Sparkly Top banner */}
        <div className="win-modal-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles style={{ width: '16px', height: '16px' }} />
            <span>RECRUITMENT SUCCESSFUL</span>
          </div>
          
          {onClose && (
            <button
              onClick={onClose}
              className="win-modal-close-x"
              title="ปิดหน้าต่าง"
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Dynamic Portrait View (Constrained height container) */}
        <div className="win-modal-portrait-box">
          <img
            src={`/images/student/portrait/${target.id}.webp`}
            alt={target.englishName}
            className="win-modal-portrait-img"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `/images/student/icon/${target.id}.webp`;
              e.target.style.width = '120px';
              e.target.style.height = '120px';
              e.target.style.objectFit = 'contain';
              e.target.style.borderRadius = '50%';
              e.target.style.border = '4px solid #00e5ff';
              e.target.style.padding = '8px';
              e.target.style.background = '#080c14';
            }}
          />
          
          {/* Character Name Ribbon */}
          <div className="win-modal-ribbon">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{
                background: '#00e5ff',
                color: '#080c14',
                fontSize: '9px',
                fontWeight: '900',
                padding: '1px 6px',
                borderRadius: '4px'
              }}>
                {target.squadType === 'Main' ? 'STRIKER' : 'SPECIAL'}
              </span>
              <span style={{ color: '#fbbf24', fontSize: '12px' }}>
                {Array.from({ length: target.starGrade }).map((_, i) => '★').join('')}
              </span>
            </div>
            <h2>{target.englishName}</h2>
            <p>{target.name}</p>
          </div>
        </div>

        {/* Character Quote Box */}
        <div className="win-modal-quote-box">
          <p>
            {renderQuote(target.characterSSRNew)}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="win-modal-stats-section">
          <div className="win-modal-stat-pill">
            <span>จำนวนครั้งที่ทาย</span>
            <h4>{guessesCount}</h4>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="win-modal-actions-box">
          <button
            onClick={handleShare}
            className="win-modal-btn-share"
          >
            <Share2 style={{ width: '14px', height: '14px', color: '#00e5ff' }} />
            <span>แชร์สถิติ (Share)</span>
          </button>
          
          <button
            onClick={onReset}
            className="win-modal-btn-reset"
          >
            <RefreshCw style={{ width: '14px', height: '14px' }} />
            <span>เล่นอีกครั้ง (Play Again)</span>
          </button>
        </div>
        
      </div>
    </div>
  )
}
