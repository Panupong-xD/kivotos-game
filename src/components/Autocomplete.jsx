import React, { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'

export default function Autocomplete({ suggestions, onSelect, guessedIds = [], placeholder = 'ค้นหาชื่อตัวละคร...' }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [filtered, setFiltered] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef(null)

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter suggestions when query or guessedIds changes
  useEffect(() => {
    if (!query.trim()) {
      setFiltered([])
      return
    }

    const cleanQuery = query.toLowerCase().trim()
    const matches = suggestions.filter(item => {
      // Exclude already guessed students
      if (guessedIds.includes(item.id)) return false

      const engName = item.englishName.toLowerCase()
      const jpName = item.name.toLowerCase()
      const devName = item.devName.toLowerCase()
      const school = item.school.toLowerCase()

      return engName.includes(cleanQuery) || 
             jpName.includes(cleanQuery) || 
             devName.includes(cleanQuery) ||
             school.includes(cleanQuery)
    })

    setFiltered(matches.slice(0, 10)) // Limit to 10 suggestions for performance
    setActiveIndex(0)
  }, [query, suggestions, guessedIds])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => (prev + 1) % Math.max(1, filtered.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[activeIndex]) {
        handleSelectItem(filtered[activeIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleSelectItem = (item) => {
    onSelect(item)
    setQuery('')
    setIsOpen(false)
  }

  return (
    <div className="autocomplete-container" ref={containerRef}>
      {/* Search Input Box */}
      <div className="autocomplete-input-wrapper">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="autocomplete-input"
        />
        <Search className="autocomplete-search-icon" />
      </div>

      {/* Suggestion Dropdown List (No School Badges) */}
      {isOpen && filtered.length > 0 && (
        <ul className="autocomplete-list">
          {filtered.map((item, idx) => (
            <li
              key={item.id}
              onClick={() => handleSelectItem(item)}
              onMouseEnter={() => setActiveIndex(idx)}
              className={`autocomplete-item ${idx === activeIndex ? 'active' : ''}`}
            >
              {/* Face Icon */}
              <img
                src={`/images/student/icon/${item.id}.webp`}
                alt={item.englishName}
                className="autocomplete-avatar"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/schoolicon/ETC.png';
                }}
              />

              {/* Name Details */}
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.englishName}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.name}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* No matching suggestions fallback */}
      {isOpen && query.trim() !== '' && filtered.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '8px',
          padding: '16px',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: '#64748b',
          background: 'rgba(11, 15, 25, 0.95)',
          border: '1px solid rgba(56, 182, 255, 0.15)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-card)',
          zIndex: 100
        }}>
          ไม่พบตัวละครที่ตรงกับคำค้นหา
        </div>
      )}
    </div>
  )
}
