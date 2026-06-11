import React, { useState, useEffect, useRef } from 'react'
import { Trophy, AlertTriangle } from 'lucide-react'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'

export default function Leaderboard({ db, collectionName, refreshTrigger }) {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(false)
  const lastFetchTimeRef = useRef(0)

  const fetchLeaderboard = async (force = false) => {
    if (!db) return
    // Throttle reads to once every 10 seconds unless forced
    if (!force && Date.now() - lastFetchTimeRef.current < 10000) {
      return
    }
    setLoading(true)
    try {
      const q = query(
        collection(db, collectionName),
        orderBy('score', 'desc'),
        limit(5)
      )
      const querySnapshot = await getDocs(q)
      const list = []
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() })
      })
      setLeaderboard(list)
      lastFetchTimeRef.current = Date.now()
    } catch (err) {
      console.warn(`Failed to fetch leaderboard for ${collectionName}:`, err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch on mount or when collectionName/refreshTrigger changes
  useEffect(() => {
    fetchLeaderboard(true)
  }, [collectionName, refreshTrigger])

  if (!db) {
    return (
      <div className="halo-leaderboard-card offline animate-scaleUp">
        <div className="leaderboard-header">
          <AlertTriangle className="leaderboard-trophy-icon text-amber-500" />
          <h3 className="leaderboard-title text-amber-500">GLOBAL LEADERBOARD OFFLINE</h3>
        </div>
        <p className="leaderboard-empty text-xs" style={{ textAlign: 'center', margin: '8px 0' }}>
          กรุณาตั้งค่า Firebase Environment Variables เพื่อเชื่อมต่อบอร์ดคะแนนระดับโลก
        </p>
      </div>
    )
  }

  return (
    <div className="halo-leaderboard-card animate-scaleUp">
      <div className="leaderboard-header">
        <Trophy className="leaderboard-trophy-icon" style={{ color: '#06b6d4' }} />
        <h3 className="leaderboard-title">GLOBAL LEADERBOARD (TOP 5)</h3>
      </div>
      {loading ? (
        <div className="leaderboard-loading">
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="leaderboard-empty">
          ยังไม่มีคะแนนบันทึกไว้ในระบบ
        </div>
      ) : (
        <div className="leaderboard-list">
          {leaderboard.map((item, index) => (
            <div key={item.id} className={`leaderboard-item rank-${index + 1}`}>
              <div className="leaderboard-rank-badge">
                {index + 1 === 1 ? '🥇' : index + 1 === 2 ? '🥈' : index + 1 === 3 ? '🥉' : `#${index + 1}`}
              </div>
              <div className="leaderboard-item-name">{item.name}</div>
              <div className="leaderboard-item-score">{(item.score || 0).toLocaleString()} PTS</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
