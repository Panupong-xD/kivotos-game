import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { Search } from 'lucide-react'

const Autocomplete = forwardRef(({ suggestions, onSelect, guessedIds = [], placeholder = 'ค้นหาชื่อตัวละคร...' }, ref) => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [filtered, setFiltered] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Expose focus method to parent
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }))

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

    // Sort by relevance before slicing (e.g. prioritize exact name / exact word matches)
    matches.sort((a, b) => {
      const aEng = a.englishName.toLowerCase().trim()
      const bEng = b.englishName.toLowerCase().trim()
      
      // 1. Exact match on English Name
      const aExact = aEng === cleanQuery
      const bExact = bEng === cleanQuery
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1

      // 2. Exact word match (e.g. user typed "aru" and it matches the word "aru" in "rikuhachima aru" exactly)
      const hasExactWord = (name) => {
        const clean = name.replace(/\(.*?\)/g, '').trim()
        const words = clean.split(/\s+/)
        return words.includes(cleanQuery)
      }
      const aWordExact = hasExactWord(aEng)
      const bWordExact = hasExactWord(bEng)
      if (aWordExact && !bWordExact) return -1
      if (!aWordExact && bWordExact) return 1

      // Helper to get given name (last word after removing parentheses)
      const getGivenName = (name) => {
        const clean = name.replace(/\(.*?\)/g, '').trim()
        const words = clean.split(/\s+/)
        return words[words.length - 1] || ''
      }

      const aGiven = getGivenName(aEng)
      const bGiven = getGivenName(bEng)

      // 3. Starts with Given Name (First name)
      const aGivenStarts = aGiven.startsWith(cleanQuery)
      const bGivenStarts = bGiven.startsWith(cleanQuery)
      if (aGivenStarts && !bGivenStarts) return -1
      if (!aGivenStarts && bGivenStarts) return 1

      // 4. Starts with Full Name (or Family Name)
      const aFullStarts = aEng.startsWith(cleanQuery)
      const bFullStarts = bEng.startsWith(cleanQuery)
      if (aFullStarts && !bFullStarts) return -1
      if (!aFullStarts && bFullStarts) return 1

      // 5. Starts with any word in the name
      const anyWordStarts = (name) => {
        const clean = name.replace(/\(.*?\)/g, '').trim()
        const words = clean.split(/\s+/)
        return words.some(w => w.startsWith(cleanQuery))
      }
      const aWordStarts = anyWordStarts(aEng)
      const bWordStarts = anyWordStarts(bEng)
      if (aWordStarts && !bWordStarts) return -1
      if (!aWordStarts && bWordStarts) return 1

      // 6. Contains English Name (or Dev Name, or PathName)
      const aPath = a.pathName ? a.pathName.toLowerCase() : ''
      const bPath = b.pathName ? b.pathName.toLowerCase() : ''
      const aDev = a.devName ? a.devName.toLowerCase() : ''
      const bDev = b.devName ? b.devName.toLowerCase() : ''
      const aNameContains = aEng.includes(cleanQuery) || aDev.includes(cleanQuery) || aPath.includes(cleanQuery)
      const bNameContains = bEng.includes(cleanQuery) || bDev.includes(cleanQuery) || bPath.includes(cleanQuery)
      if (aNameContains && !bNameContains) return -1
      if (!aNameContains && bNameContains) return 1

      // Fallback to ID order
      const aId = String(a.id)
      const bId = String(b.id)
      return aId.localeCompare(bId, undefined, { numeric: true })
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
    // Refocus input field immediately to keep typing smooth
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div className="autocomplete-container" ref={containerRef}>
      {/* Search Input Box */}
      <div className="autocomplete-input-wrapper">
        <input
          ref={inputRef}
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
                src={item.icon || `/images/student/icon/${item.id}.webp`}
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
                  {item.school}
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
})

export default Autocomplete
