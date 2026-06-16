import { useState, useEffect, useCallback, useMemo } from 'react'

const LOCAL_STORAGE_KEYS = {
  CHARACTERS: 'kivotos_binary_characters',
  SORTED: 'kivotos_binary_sorted',
  CURRENT_INDEX: 'kivotos_binary_current_index',
  LOW: 'kivotos_binary_low',
  HIGH: 'kivotos_binary_high',
  VOTE_COUNT: 'kivotos_binary_vote_count',
  FINISHED: 'kivotos_binary_finished',
  HISTORY: 'kivotos_binary_history'
}

export default function useEloRanking() {
  const [state, setState] = useState({
    characters: [],
    sorted: [],
    currentIndex: 1,
    low: 0,
    high: 0,
    currentDuel: null,
    voteCount: 0,
    isFinished: false,
    history: []
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Shuffle helper
  const shuffleArray = (arr) => {
    const shuffled = [...arr]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Load characters on mount with defensive validation
  useEffect(() => {
    async function init() {
      try {
        let savedChars = localStorage.getItem(LOCAL_STORAGE_KEYS.CHARACTERS)
        let savedSorted = localStorage.getItem(LOCAL_STORAGE_KEYS.SORTED)
        const savedIndex = localStorage.getItem(LOCAL_STORAGE_KEYS.CURRENT_INDEX)
        const savedLow = localStorage.getItem(LOCAL_STORAGE_KEYS.LOW)
        const savedHigh = localStorage.getItem(LOCAL_STORAGE_KEYS.HIGH)
        const savedVoteCount = localStorage.getItem(LOCAL_STORAGE_KEYS.VOTE_COUNT)
        const savedFinished = localStorage.getItem(LOCAL_STORAGE_KEYS.FINISHED)
        const savedHistory = localStorage.getItem(LOCAL_STORAGE_KEYS.HISTORY)

        // Fetch character data
        const res = await fetch('/jp_data/story_characters_info.json')
        if (!res.ok) throw new Error('Failed to fetch character data')
        const data = await res.json()

        const fullDataset = []
        for (const key in data) {
          const char = data[key]
          const isCharOrNpc = char.TemplateType === 'Character' || char.TemplateType === 'NPC' || !char.TemplateType
          const hasName = char.Name && char.NameEn
          const hasAssets = char.IconLocalPath && char.PortraitLocalPath

          if (isCharOrNpc && hasName && hasAssets) {
            let iconPath = char.IconLocalPath.replace(/^\.\//, '/')
            let portraitPath = char.PortraitLocalPath.replace(/^\.\//, '/')
            fullDataset.push({
              key,
              name: char.Name,
              nameEn: char.NameEn,
              nameJp: char.NameJp || char.Name,
              school: char.School || 'Other',
              schoolTh: char.SchoolTh || char.School || 'อื่นๆ',
              club: char.ClubTh || char.Club || 'ไม่มีสังกัด',
              iconPath,
              portraitPath
            })
          }
        }

        if (fullDataset.length < 2) {
          throw new Error('Too few characters found in the database')
        }

        let loadedChars = []
        let loadedSorted = []
        let loadedIndex = 1
        let loadedLow = 0
        let loadedHigh = 0
        let loadedFinished = false
        let loadedVoteCount = 0
        let loadedHistoryList = []

        // Defensive validation of localStorage to prevent corrupt data crashes
        let isCorrupted = false
        if (savedChars && savedSorted) {
          try {
            loadedChars = JSON.parse(savedChars)
            loadedSorted = JSON.parse(savedSorted)
            loadedIndex = savedIndex ? Number(savedIndex) : 1
            loadedLow = savedLow ? Number(savedLow) : 0
            loadedHigh = savedHigh ? Number(savedHigh) : 0
            loadedFinished = savedFinished === 'true'
            loadedVoteCount = savedVoteCount ? Number(savedVoteCount) : 0
            loadedHistoryList = savedHistory ? JSON.parse(savedHistory) : []

             if (!Array.isArray(loadedChars) || !Array.isArray(loadedSorted) || loadedSorted.length === 0) {
               isCorrupted = true
             } else if (loadedIndex < 0 || loadedIndex > loadedChars.length) {
               isCorrupted = true
             } else if (loadedLow < 0 || loadedLow > loadedSorted.length || loadedHigh < -1 || loadedHigh >= loadedSorted.length) {
               isCorrupted = true
             } else {
               const charKeys = new Set(loadedChars.map(c => c.key))
               for (const s of loadedSorted) {
                 if (!s || !s.key || !charKeys.has(s.key)) {
                   isCorrupted = true
                   break
                 }
               }
               
               // Validate loadedHistoryList schema
               if (!isCorrupted) {
                 if (Array.isArray(loadedHistoryList)) {
                   for (const h of loadedHistoryList) {
                     if (!h || typeof h.currentIndex !== 'number' || !Array.isArray(h.sortedKeys)) {
                       isCorrupted = true
                       break
                     }
                   }
                 } else {
                   isCorrupted = true
                 }
               }
             }
           } catch (e) {
             isCorrupted = true
           }
        }

        if (isCorrupted) {
          console.warn("Detected corrupted localStorage data for KIVOTOS RANKER. Resetting state.")
          Object.values(LOCAL_STORAGE_KEYS).forEach(k => localStorage.removeItem(k))
          savedChars = null
          savedSorted = null
        }

        if (savedChars && savedSorted && !isCorrupted) {
          // Merge missing characters if the local dataset is smaller (e.g. migrating 144 to 198)
          let hasAdditions = false
          fullDataset.forEach(student => {
            if (!loadedChars.some(c => c.key === student.key)) {
              loadedChars.push(student)
              hasAdditions = true
            }
          })

          if (hasAdditions) {
            localStorage.setItem(LOCAL_STORAGE_KEYS.CHARACTERS, JSON.stringify(loadedChars))
          }
        } else {
          // Initialize brand new binary sort state
          const shuffled = shuffleArray(fullDataset)
          loadedChars = shuffled
          loadedSorted = [shuffled[0]]
          loadedIndex = 1
          loadedLow = 0
          loadedHigh = 0
          loadedFinished = false
          loadedVoteCount = 0
          loadedHistoryList = []

          localStorage.setItem(LOCAL_STORAGE_KEYS.CHARACTERS, JSON.stringify(shuffled))
          localStorage.setItem(LOCAL_STORAGE_KEYS.SORTED, JSON.stringify([shuffled[0]]))
          localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_INDEX, '1')
          localStorage.setItem(LOCAL_STORAGE_KEYS.LOW, '0')
          localStorage.setItem(LOCAL_STORAGE_KEYS.HIGH, '0')
          localStorage.setItem(LOCAL_STORAGE_KEYS.VOTE_COUNT, '0')
          localStorage.setItem(LOCAL_STORAGE_KEYS.FINISHED, 'false')
          localStorage.setItem(LOCAL_STORAGE_KEYS.HISTORY, JSON.stringify([]))
        }

        // Force finished if we have sorted all characters
        if (loadedIndex >= loadedChars.length) {
          loadedFinished = true
        }

        let initialDuel = null
        if (!loadedFinished) {
          const charA = loadedChars[loadedIndex]
          const midIndex = Math.floor((loadedLow + loadedHigh) / 2)
          const charB = loadedSorted[midIndex]
          if (charA && charB) {
            initialDuel = [charA, charB]
          } else {
            console.warn("Invalid initial duel characters detected. Marking as finished.", { charA, charB, loadedIndex, midIndex })
            loadedFinished = true
          }
        }

        setState({
          characters: loadedChars,
          sorted: loadedSorted,
          currentIndex: loadedIndex,
          low: loadedLow,
          high: loadedHigh,
          currentDuel: initialDuel,
          voteCount: loadedVoteCount,
          isFinished: loadedFinished,
          history: loadedHistoryList
        })

        setLoading(false)
      } catch (err) {
        console.error('Error loading binary sort data:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    init()
  }, [])

  // Preload potential next pivot images in background to eliminate mobile delays
  useEffect(() => {
    const { currentDuel, sorted, low, high, isFinished, currentIndex, characters } = state
    if (currentDuel && sorted.length > 0 && low <= high && !isFinished) {
      const mid = Math.floor((low + high) / 2)
      
      // If user chooses A (prefers the element), high becomes mid - 1
      const highIfA = mid - 1
      if (low <= highIfA) {
        const midA = Math.floor((low + highIfA) / 2)
        const nextPivotA = sorted[midA]
        if (nextPivotA && nextPivotA.portraitPath) {
          const img = new Image()
          img.src = nextPivotA.portraitPath
        }
      }
      
      // If user chooses B (prefers the pivot), low becomes mid + 1
      const lowIfB = mid + 1
      if (lowIfB <= high) {
        const midB = Math.floor((lowIfB + high) / 2)
        const nextPivotB = sorted[midB]
        if (nextPivotB && nextPivotB.portraitPath) {
          const img = new Image()
          img.src = nextPivotB.portraitPath
        }
      }

      // Preload the next character to sort
      if (low === high) {
        const nextIndex = currentIndex + 1
        if (nextIndex < characters.length) {
          const nextElement = characters[nextIndex]
          if (nextElement && nextElement.portraitPath) {
            const img = new Image()
            img.src = nextElement.portraitPath
          }
        }
      }
    }
  }, [state])

  // Update comparison result
  const updateElo = useCallback((charKeyA, charKeyB, outcome) => {
    setState((prevState) => {
      const {
        characters,
        sorted,
        currentIndex,
        low,
        high,
        currentDuel,
        voteCount,
        isFinished,
        history
      } = prevState

      if (isFinished || !currentDuel) return prevState

      // Double check bounds to prevent out-of-bounds crash
      if (currentIndex >= characters.length) {
        return {
          ...prevState,
          isFinished: true,
          currentDuel: null
        }
      }

      const currentElement = characters[currentIndex]
      if (!currentElement) {
        console.error("Binary ranker error: current element is undefined at index", currentIndex)
        return {
          ...prevState,
          isFinished: true,
          currentDuel: null
        }
      }

      // 1. Capture current state for History (Undo stack - limit stack to 20 items)
      const stateToSave = {
        currentIndex,
        low,
        high,
        sortedKeys: sorted.map(c => c.key),
        currentDuelKeys: currentDuel ? currentDuel.map(c => c.key) : null,
        isFinished,
        voteCount
      }
      const newHistory = [stateToSave, ...history].slice(0, 20)
      
      try {
        localStorage.setItem(LOCAL_STORAGE_KEYS.HISTORY, JSON.stringify(newHistory))
      } catch (e) {
        console.warn("Storage quota exceeded or restricted. Failed to save history.", e)
      }

      const nextVoteCount = voteCount + 1
      try {
        localStorage.setItem(LOCAL_STORAGE_KEYS.VOTE_COUNT, String(nextVoteCount))
      } catch (e) {}

      const mid = Math.floor((low + high) / 2)
      let nextLow = low
      let nextHigh = high

      if (outcome === 'A') {
        nextHigh = mid - 1
      } else {
        nextLow = mid + 1
      }

      let nextSorted = [...sorted]
      let nextIndex = currentIndex
      let nextFinished = false
      let nextDuelPair = null

      if (nextLow > nextHigh) {
        // Binary search completed! Insert element at correct index
        nextSorted.splice(nextLow, 0, currentElement)
        
        // Move to next student
        nextIndex = currentIndex + 1
        
        if (nextIndex >= characters.length) {
          nextFinished = true
          nextLow = 0
          nextHigh = 0
          nextDuelPair = null
        } else {
          // Reset pointers for next element
          nextLow = 0
          nextHigh = nextSorted.length - 1
          const newMid = Math.floor((nextLow + nextHigh) / 2)
          const nextElement = characters[nextIndex]
          const pivotElement = nextSorted[newMid]

          if (!nextElement || !pivotElement) {
            console.error("Binary ranker error: next element or pivot is undefined", { nextElement, pivotElement, nextIndex, newMid, nextSortedLength: nextSorted.length })
            nextFinished = true
            nextLow = 0
            nextHigh = 0
            nextDuelPair = null
          } else {
            nextDuelPair = [nextElement, pivotElement]
          }
        }
      } else {
        // Continue binary search
        const newMid = Math.floor((nextLow + nextHigh) / 2)
        const pivotElement = sorted[newMid]

        if (!pivotElement) {
          console.error("Binary ranker error: continue search pivot is undefined", { pivotElement, newMid, sortedLength: sorted.length })
          nextFinished = true
          nextLow = 0
          nextHigh = 0
          nextDuelPair = null
        } else {
          nextDuelPair = [currentElement, pivotElement]
        }
      }

      try {
        localStorage.setItem(LOCAL_STORAGE_KEYS.SORTED, JSON.stringify(nextSorted))
        localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_INDEX, String(nextIndex))
        localStorage.setItem(LOCAL_STORAGE_KEYS.LOW, String(nextLow))
        localStorage.setItem(LOCAL_STORAGE_KEYS.HIGH, String(nextHigh))
        localStorage.setItem(LOCAL_STORAGE_KEYS.FINISHED, nextFinished ? 'true' : 'false')
      } catch (e) {
        console.warn("Storage quota exceeded or restricted. Failed to save ranking state.", e)
      }

      return {
        characters,
        sorted: nextSorted,
        currentIndex: nextIndex,
        low: nextLow,
        high: nextHigh,
        currentDuel: nextDuelPair,
        voteCount: nextVoteCount,
        isFinished: nextFinished,
        history: newHistory
      }
    })
  }, [])

  // Undo last comparison
  const undoLastVote = useCallback(() => {
    setState((prevState) => {
      const { history, characters } = prevState
      if (history.length === 0) return prevState

      const prevHistory = [...history]
      const lastState = prevHistory.shift() // Pop most recent state

      // Map keys back to character objects defensively
      const charMap = {}
      characters.forEach(c => {
        if (c && c.key) {
          charMap[c.key] = c
        }
      })

      const restoredSorted = lastState.sortedKeys
        ? lastState.sortedKeys.map(key => charMap[key]).filter(Boolean)
        : []
      
      const restoredDuel = lastState.currentDuelKeys
        ? lastState.currentDuelKeys.map(key => charMap[key]).filter(Boolean)
        : null

      try {
        localStorage.setItem(LOCAL_STORAGE_KEYS.SORTED, JSON.stringify(restoredSorted))
        localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_INDEX, String(lastState.currentIndex))
        localStorage.setItem(LOCAL_STORAGE_KEYS.LOW, String(lastState.low))
        localStorage.setItem(LOCAL_STORAGE_KEYS.HIGH, String(lastState.high))
        localStorage.setItem(LOCAL_STORAGE_KEYS.VOTE_COUNT, String(lastState.voteCount))
        localStorage.setItem(LOCAL_STORAGE_KEYS.FINISHED, lastState.isFinished ? 'true' : 'false')
        localStorage.setItem(LOCAL_STORAGE_KEYS.HISTORY, JSON.stringify(prevHistory))
      } catch (e) {
        console.warn("Failed to write restored state to localStorage", e)
      }

      return {
        characters,
        sorted: restoredSorted,
        currentIndex: lastState.currentIndex,
        low: lastState.low,
        high: lastState.high,
        currentDuel: restoredDuel,
        voteCount: lastState.voteCount,
        isFinished: lastState.isFinished,
        history: prevHistory
      }
    })
  }, [])

  // Reset all
  const resetRatings = useCallback(async () => {
    setLoading(true)

    Object.values(LOCAL_STORAGE_KEYS).forEach(k => localStorage.removeItem(k))

    try {
      const res = await fetch('/jp_data/story_characters_info.json')
      const data = await res.json()

      const initialList = []
      for (const key in data) {
        const char = data[key]
        const isCharOrNpc = char.TemplateType === 'Character' || char.TemplateType === 'NPC' || !char.TemplateType
        const hasName = char.Name && char.NameEn
        const hasAssets = char.IconLocalPath && char.PortraitLocalPath

        if (isCharOrNpc && hasName && hasAssets) {
          let iconPath = char.IconLocalPath.replace(/^\.\//, '/')
          let portraitPath = char.PortraitLocalPath.replace(/^\.\//, '/')
          initialList.push({
            key,
            name: char.Name,
            nameEn: char.NameEn,
            nameJp: char.NameJp || char.Name,
            school: char.School || 'Other',
            schoolTh: char.SchoolTh || char.School || 'อื่นๆ',
            club: char.ClubTh || char.Club || 'ไม่มีสังกัด',
            iconPath,
            portraitPath
          })
        }
      }

      const shuffled = shuffleArray(initialList)
      
      setState({
        characters: shuffled,
        sorted: [shuffled[0]],
        currentIndex: 1,
        low: 0,
        high: 0,
        isFinished: false,
        history: [],
        currentDuel: [shuffled[1], shuffled[0]],
        voteCount: 0
      })

      localStorage.setItem(LOCAL_STORAGE_KEYS.CHARACTERS, JSON.stringify(shuffled))
      localStorage.setItem(LOCAL_STORAGE_KEYS.SORTED, JSON.stringify([shuffled[0]]))
      localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_INDEX, '1')
      localStorage.setItem(LOCAL_STORAGE_KEYS.LOW, '0')
      localStorage.setItem(LOCAL_STORAGE_KEYS.HIGH, '0')
      localStorage.setItem(LOCAL_STORAGE_KEYS.VOTE_COUNT, '0')
      localStorage.setItem(LOCAL_STORAGE_KEYS.FINISHED, 'false')
      localStorage.setItem(LOCAL_STORAGE_KEYS.HISTORY, JSON.stringify([]))
      setError(null)
    } catch (err) {
      console.error('Error resetting binary sort:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Import JSON rankings
  const importRankings = useCallback((importedList) => {
    if (!Array.isArray(importedList) || importedList.length === 0) return false

    // Validate characters list
    const validated = importedList.map(item => {
      return {
        key: item.key,
        name: item.name || item.nameEn,
        nameEn: item.nameEn,
        nameJp: item.nameJp || item.name || item.nameEn,
        school: item.school || 'Other',
        schoolTh: item.schoolTh || item.school || 'อื่นๆ',
        club: item.club || 'ไม่มีสังกัด',
        iconPath: item.iconPath,
        portraitPath: item.portraitPath
      }
    }).filter(c => c.key && c.nameEn && c.iconPath)

    if (validated.length === 0) return false

    setState({
      characters: validated,
      sorted: validated,
      currentIndex: validated.length,
      low: 0,
      high: 0,
      isFinished: true,
      history: [],
      currentDuel: null,
      voteCount: 0
    })

    localStorage.setItem(LOCAL_STORAGE_KEYS.CHARACTERS, JSON.stringify(validated))
    localStorage.setItem(LOCAL_STORAGE_KEYS.SORTED, JSON.stringify(validated))
    localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_INDEX, String(validated.length))
    localStorage.setItem(LOCAL_STORAGE_KEYS.LOW, '0')
    localStorage.setItem(LOCAL_STORAGE_KEYS.HIGH, '0')
    localStorage.setItem(LOCAL_STORAGE_KEYS.FINISHED, 'true')
    localStorage.setItem(LOCAL_STORAGE_KEYS.VOTE_COUNT, '0')
    localStorage.setItem(LOCAL_STORAGE_KEYS.HISTORY, JSON.stringify([]))

    return true
  }, [])

  // Map elements to pseudo-ratings for Leaderboard compatibility
  const charactersWithRatings = useMemo(() => {
    const { characters, sorted } = state
    const sortedIndexMap = {}
    sorted.forEach((char, idx) => {
      sortedIndexMap[char.key] = idx
    })

    return characters.map(char => {
      const idx = sortedIndexMap[char.key]
      const isSorted = idx !== undefined
      return {
        ...char,
        rating: isSorted ? (2000 - idx) : 1000,
        isSorted,
        wins: isSorted ? sorted.length - idx : 0,
        losses: 0,
        matchesPlayed: isSorted ? 1 : 0
      }
    })
  }, [state.characters, state.sorted])

  return {
    characters: charactersWithRatings,
    sortedCharactersCount: state.sorted.length,
    currentIndex: state.currentIndex,
    low: state.low,
    high: state.high,
    currentDuel: state.currentDuel,
    voteCount: state.voteCount,
    isFinished: state.isFinished,
    canUndo: state.history.length > 0,
    loading,
    error,
    updateElo,
    skipMatch: () => {},
    resetRatings,
    undoLastVote,
    importRankings
  }
}
