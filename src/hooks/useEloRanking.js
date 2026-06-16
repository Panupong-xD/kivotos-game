import { useState, useEffect, useCallback } from 'react'

const LOCAL_STORAGE_KEY = 'kivotos_elo_characters'

export default function useEloRanking() {
  const [characters, setCharacters] = useState([])
  const [currentDuel, setCurrentDuel] = useState(null)
  
  // Progress & Termination states
  const [voteCount, setVoteCount] = useState(0)
  const [consecutivePredictableVotes, setConsecutivePredictableVotes] = useState(0)
  const [isFinished, setIsFinished] = useState(false)
  
  // Undo history stack
  const [history, setHistory] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Choose matchmaking pair
  const generateMatch = useCallback((list) => {
    if (!list || list.length < 2) return null

    // Pick character A prioritizing those with the least matches
    const minMatches = Math.min(...list.map(c => c.matchesPlayed || 0))
    const poolA = list.filter(c => (c.matchesPlayed || 0) <= minMatches + 2)
    const charA = poolA[Math.floor(Math.random() * poolA.length)]

    // 70% close rating match, 30% random match
    const isCloseMatch = Math.random() < 0.70
    let charB = null

    if (isCloseMatch) {
      const sorted = [...list].sort((a, b) => a.rating - b.rating)
      const indexA = sorted.findIndex(c => c.key === charA.key)

      const windowSize = 15
      const candidatesB = []

      for (let i = -windowSize; i <= windowSize; i++) {
        if (i === 0) continue
        const targetIndex = indexA + i
        if (targetIndex >= 0 && targetIndex < sorted.length) {
          candidatesB.push(sorted[targetIndex])
        }
      }

      if (candidatesB.length > 0) {
        charB = candidatesB[Math.floor(Math.random() * candidatesB.length)]
      }
    }

    if (!charB) {
      const poolB = list.filter(c => c.key !== charA.key)
      charB = poolB[Math.floor(Math.random() * poolB.length)]
    }

    return [charA, charB]
  }, [])

  // Load characters on mount with migration and state restoration
  useEffect(() => {
    async function init() {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
        const savedVoteCount = localStorage.getItem('kivotos_elo_vote_count')
        const savedConsecutive = localStorage.getItem('kivotos_elo_consecutive')
        const savedFinished = localStorage.getItem('kivotos_elo_is_finished')
        const savedHistory = localStorage.getItem('kivotos_elo_history')

        const restoreVoteCount = savedVoteCount ? Number(savedVoteCount) : 0
        const restoreConsecutive = savedConsecutive ? Number(savedConsecutive) : 0
        const restoreFinished = savedFinished ? savedFinished === 'true' : false
        const restoreHistory = savedHistory ? JSON.parse(savedHistory) : []

        // Fetch character data from JSON file
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
              portraitPath,
              rating: 1500,
              wins: 0,
              losses: 0,
              draws: 0,
              matchesPlayed: 0
            })
          }
        }

        let finalCharactersList = []

        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && parsed.length > 0) {
            // Migrated/Merge logic: Add missing characters (NPCs) if they aren't in localStorage yet
            const mergedList = [...parsed]
            let hasAdditions = false

            fullDataset.forEach(student => {
              if (!parsed.some(c => c.key === student.key)) {
                mergedList.push(student)
                hasAdditions = true
              }
            })

            finalCharactersList = mergedList
            if (hasAdditions) {
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mergedList))
            }
          }
        }

        // If final characters list is still empty, use full dataset as initial
        if (finalCharactersList.length === 0) {
          finalCharactersList = fullDataset
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fullDataset))
        }

        setCharacters(finalCharactersList)
        setVoteCount(restoreVoteCount)
        setConsecutivePredictableVotes(restoreConsecutive)
        setIsFinished(restoreFinished)
        setHistory(restoreHistory)

        // Choose next match
        if (restoreFinished) {
          setCurrentDuel(null)
        } else {
          const pair = generateMatch(finalCharactersList)
          setCurrentDuel(pair)
        }

        setLoading(false)
      } catch (err) {
        console.error('Error loading Elo ratings data:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    init()
  }, [generateMatch])

  // Update Elo ratings after a duel match
  const updateElo = useCallback((charKeyA, charKeyB, outcome) => {
    setCharacters((prevList) => {
      const indexA = prevList.findIndex(c => c.key === charKeyA)
      const indexB = prevList.findIndex(c => c.key === charKeyB)

      if (indexA === -1 || indexB === -1) return prevList

      // Save previous state to history stack for Undo capability (limit stack to 15 items)
      const stateToSave = {
        characters: prevList.map(c => ({ ...c })),
        currentDuel,
        voteCount,
        consecutivePredictableVotes,
        isFinished
      }
      
      setHistory((prevHistory) => {
        const updatedHistory = [stateToSave, ...prevHistory].slice(0, 15)
        localStorage.setItem('kivotos_elo_history', JSON.stringify(updatedHistory))
        return updatedHistory
      })

      const charA = { ...prevList[indexA] }
      const charB = { ...prevList[indexB] }

      const R_A = charA.rating
      const R_B = charB.rating

      // Calculate expected scores
      const E_A = 1 / (1 + Math.pow(10, (R_B - R_A) / 400))
      const E_B = 1 / (1 + Math.pow(10, (R_A - R_B) / 400))

      let S_A, S_B
      if (outcome === 'A') {
        S_A = 1
        S_B = 0
        charA.wins += 1
        charB.losses += 1
      } else if (outcome === 'B') {
        S_A = 0
        S_B = 1
        charA.losses += 1
        charB.wins += 1
      } else {
        // Draw
        S_A = 0.5
        S_B = 0.5
        charA.draws += 1
        charB.draws += 1
      }

      // K-Factor = 32
      const K = 32
      const newRatingA = Math.round(R_A + K * (S_A - E_A))
      const newRatingB = Math.round(R_B + K * (S_B - E_B))

      charA.rating = newRatingA
      charA.matchesPlayed += 1

      charB.rating = newRatingB
      charB.matchesPlayed += 1

      const newList = [...prevList]
      newList[indexA] = charA
      newList[indexB] = charB

      // Save characters list
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newList))

      // Update vote counts
      const nextVoteCount = voteCount + 1
      setVoteCount(nextVoteCount)
      localStorage.setItem('kivotos_elo_vote_count', String(nextVoteCount))

      // Check stability: Did Sensei pick the one with higher rating?
      let isPredictable = false
      if (outcome === 'A' && R_A > R_B) isPredictable = true
      else if (outcome === 'B' && R_B > R_A) isPredictable = true
      else if (outcome === 'draw' && R_A === R_B) isPredictable = true

      const nextConsecutive = isPredictable ? consecutivePredictableVotes + 1 : 0
      setConsecutivePredictableVotes(nextConsecutive)
      localStorage.setItem('kivotos_elo_consecutive', String(nextConsecutive))

      // Check finish conditions
      const minVotes = Math.floor(prevList.length * 1.5)
      const hardCapVotes = prevList.length * 3

      let nextFinished = false
      if (nextVoteCount >= minVotes) {
        if (nextConsecutive >= 30) {
          nextFinished = true
        } else if (nextVoteCount >= hardCapVotes) {
          nextFinished = true
        }
      }

      if (nextFinished) {
        setIsFinished(true)
        localStorage.setItem('kivotos_elo_is_finished', 'true')
      }

      // Generate next match or clear duel
      setTimeout(() => {
        if (nextFinished) {
          setCurrentDuel(null)
        } else {
          setCurrentDuel(generateMatch(newList))
        }
      }, 0)

      return newList
    })
  }, [generateMatch, voteCount, consecutivePredictableVotes, isFinished, currentDuel])

  // Undo the last vote
  const undoLastVote = useCallback(() => {
    if (history.length === 0) return

    const prevHistory = [...history]
    const lastState = prevHistory.shift() // Pop most recent state

    // Restore state values
    setCharacters(lastState.characters)
    setCurrentDuel(lastState.currentDuel)
    setVoteCount(lastState.voteCount)
    setConsecutivePredictableVotes(lastState.consecutivePredictableVotes)
    setIsFinished(lastState.isFinished)
    setHistory(prevHistory)

    // Save restored states back to localStorage
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lastState.characters))
    localStorage.setItem('kivotos_elo_vote_count', String(lastState.voteCount))
    localStorage.setItem('kivotos_elo_consecutive', String(lastState.consecutivePredictableVotes))
    localStorage.setItem('kivotos_elo_is_finished', lastState.isFinished ? 'true' : 'false')
    localStorage.setItem('kivotos_elo_history', JSON.stringify(prevHistory))
  }, [history])

  // Skip match
  const skipMatch = useCallback(() => {
    if (characters.length > 1) {
      setCurrentDuel(generateMatch(characters))
    }
  }, [characters, generateMatch])

  // Reset ratings & progress
  const resetRatings = useCallback(async () => {
    setLoading(true)
    
    // Clear all LocalStorage keys
    localStorage.removeItem(LOCAL_STORAGE_KEY)
    localStorage.removeItem('kivotos_elo_vote_count')
    localStorage.removeItem('kivotos_elo_consecutive')
    localStorage.removeItem('kivotos_elo_is_finished')
    localStorage.removeItem('kivotos_elo_history')

    setVoteCount(0)
    setConsecutivePredictableVotes(0)
    setIsFinished(false)
    setHistory([])

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
            portraitPath,
            rating: 1500,
            wins: 0,
            losses: 0,
            draws: 0,
            matchesPlayed: 0
          })
        }
      }

      setCharacters(initialList)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialList))
      setCurrentDuel(generateMatch(initialList))
      setError(null)
    } catch (err) {
      console.error('Error resetting Elo ratings:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [generateMatch])

  const minVotes = Math.floor(characters.length * 1.5)
  const hardCapVotes = characters.length * 3

  return {
    characters,
    currentDuel,
    voteCount,
    consecutivePredictableVotes,
    isFinished,
    canUndo: history.length > 0,
    minVotes,
    hardCapVotes,
    loading,
    error,
    updateElo,
    skipMatch,
    resetRatings,
    undoLastVote
  }
}
