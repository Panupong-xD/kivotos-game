import React, { useState, useEffect, useRef } from 'react'
import LoadingScreen from './LoadingScreen.jsx'
import { Search, Filter, X, Info, Sparkles, BookOpen } from 'lucide-react'

// Helper to convert school year labels
const formatSchoolYear = (yr) => {
  if (yr === '1年生') return '1st Year (ปี 1)'
  if (yr === '2年生') return '2nd Year (ปี 2)'
  if (yr === '3年生') return '3rd Year (ปี 3)'
  if (yr === '停学中') return 'Suspended (พักการเรียน)'
  if (yr === '中退') return 'Dropped out (ลาออก)'
  return 'N/A (ไม่มี)'
}

// Capitalization helper for English names derived from PathName
const getEnglishName = (pathName, devName) => {
  if (!pathName) return devName || "Unknown";
  
  const capitalize = (str) => {
    if (!str) return '';
    if (str === 'miku') return 'Miku';
    if (str === 'hatsune') return 'Hatsune';
    if (str === 'ruiko') return 'Ruiko';
    if (str === 'saten') return 'Saten';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const variantsMap = {
    'swimsuit': 'Swimsuit',
    'newyear': 'New Year',
    'dress': 'Dress',
    'bunnygirl': 'Bunny',
    'bunny': 'Bunny',
    'track': 'Track',
    'gym': 'Gym',
    'casual': 'Casual',
    'hotspring': 'Hot Spring',
    'onsen': 'Hot Spring',
    'cheerleader': 'Cheerleader',
    'guide': 'Guide',
    'kid': 'Kid',
    'child': 'Kid',
    'small': 'Kid',
    'christmas': 'Christmas',
    'parttime': 'Part-time',
    'uniform': 'Uniform',
    'band': 'Band',
    'idol': 'Idol',
    'battle': 'Battle',
    'camp': 'Camp',
    'qipao': 'Qipao',
    'pajama': 'Pajama',
    'riding': 'Cycling',
    'cycling': 'Cycling',
    'dressup': 'Dress',
    'wildcard': 'Wildcard'
  };

  const parts = pathName.split('_');
  if (parts.length === 1) {
    return capitalize(parts[0]);
  }
  
  const lastPart = parts[parts.length - 1];
  if (variantsMap[lastPart]) {
    const base = parts.slice(0, -1).map(capitalize).join(' ');
    return `${base} (${variantsMap[lastPart]})`;
  }
  
  return parts.map(capitalize).join(' ');
}

const calculateMaxAdaptation = (s, terrain) => {
  let base = 0;
  if (terrain === 'Street') base = s.StreetBattleAdaptation !== undefined ? s.StreetBattleAdaptation : 0;
  else if (terrain === 'Outdoor') base = s.OutdoorBattleAdaptation !== undefined ? s.OutdoorBattleAdaptation : 0;
  else if (terrain === 'Indoor') base = s.IndoorBattleAdaptation !== undefined ? s.IndoorBattleAdaptation : 0;

  if (s.Weapon && s.Weapon.AdaptationType === terrain && s.Weapon.AdaptationValue) {
    base += s.Weapon.AdaptationValue;
  }
  return base;
}

export default function StudentDatabase() {
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [visibleCount, setVisibleCount] = useState(24)

  const sentinelRef = useRef(null)

  // Infinite Scroll Observer
  useEffect(() => {
    if (loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && filteredStudents.length > visibleCount) {
          setVisibleCount((prev) => prev + 24)
        }
      },
      { rootMargin: '250px' }
    )

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [loading, filteredStudents.length, visibleCount])
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSchool, setSelectedSchool] = useState('All')
  const [selectedRole, setSelectedRole] = useState('All')
  const [selectedBullet, setSelectedBullet] = useState('All')
  const [selectedArmor, setSelectedArmor] = useState('All')

  // List of schools for filter dropdown
  const schoolsList = [
    'Abydos', 'Arius', 'Gehenna', 'Hyakkiyako', 'Millennium',
    'RedWinter', 'SRT', 'Shanhaijing', 'Tokiwadai', 'Trinity',
    'Valkyrie', 'Highlander', 'WildHunt', 'ETC'
  ]

  // Roles list
  const rolesList = [
    { value: 'DamageDealer', label: 'Attacker' },
    { value: 'Tanker', label: 'Tanker' },
    { value: 'Healer', label: 'Healer' },
    { value: 'Supporter', label: 'Supporter' },
    { value: 'Vehicle', label: 'T.S. (Vehicle)' }
  ]

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/jp_data/students.min.json')
        const data = await res.json()
        const list = []
        for (const id in data) {
          const s = data[id]
          if (s.IsReleased && s.IsReleased[0]) {
            list.push({
              id: s.Id,
              name: s.Name,
              devName: s.DevName,
              pathName: s.PathName,
              englishName: getEnglishName(s.PathName, s.DevName),
              school: s.School,
              squadType: s.SquadType,
              bulletType: s.BulletType,
              armorType: s.ArmorType,
              position: s.Position,
              starGrade: s.StarGrade,
              schoolYear: s.SchoolYear,
              equipment: s.Equipment || [],
              characterSSRNew: s.CharacterSSRNew || 'ยินดีที่ได้พบกันค่ะ คุณครู',
              charHeightMetric: s.CharHeightMetric || 'N/A',
              defaultOrder: s.DefaultOrder !== undefined ? s.DefaultOrder : 999,
              exCost: s.Skills && s.Skills.Ex && s.Skills.Ex.Cost && s.Skills.Ex.Cost.length > 0
                ? s.Skills.Ex.Cost[s.Skills.Ex.Cost.length - 1]
                : 0,
              tacticRole: s.TacticRole || 'DamageDealer',
              streetBattleAdaptation: calculateMaxAdaptation(s, 'Street'),
              outdoorBattleAdaptation: calculateMaxAdaptation(s, 'Outdoor'),
              indoorBattleAdaptation: calculateMaxAdaptation(s, 'Indoor'),
              weapon: s.Weapon || null
            })
          }
        }
        // Sort students alphabetically
        list.sort((a, b) => a.englishName.localeCompare(b.englishName))
        setStudents(list)
        setFilteredStudents(list)
        setLoading(false)
      } catch (err) {
        console.error('Failed to load students in database:', err)
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Apply filters
  useEffect(() => {
    let result = [...students]

    if (searchTerm.trim() !== '') {
      const query = searchTerm.toLowerCase()
      result = result.filter(s => 
        s.englishName.toLowerCase().includes(query) || 
        s.name.toLowerCase().includes(query) || 
        s.devName.toLowerCase().includes(query)
      )
    }

    if (selectedSchool !== 'All') {
      result = result.filter(s => s.school === selectedSchool)
    }

    if (selectedRole !== 'All') {
      result = result.filter(s => s.tacticRole === selectedRole)
    }

    if (selectedBullet !== 'All') {
      result = result.filter(s => s.bulletType === selectedBullet)
    }

    if (selectedArmor !== 'All') {
      result = result.filter(s => s.armorType === selectedArmor)
    }

    setFilteredStudents(result)
    setVisibleCount(24) // Reset visible items on filter change
  }, [searchTerm, selectedSchool, selectedRole, selectedBullet, selectedArmor, students])

  // Get school icon path
  const getSchoolIcon = (school) => {
    const schoolMap = {
      'Abydos': 'Abydos.png',
      'Arius': 'Arius.png',
      'Gehenna': 'Gehenna.png',
      'Hyakkiyako': 'Hyakkiyako.png',
      'Millennium': 'Millennium.png',
      'RedWinter': 'RedWinter.png',
      'SRT': 'SRT.png',
      'Srt': 'SRT.png',
      'Shanhaijing': 'Shanhaijing.png',
      'Tokiwadai': 'Tokiwadai.png',
      'Trinity': 'Trinity.png',
      'Valkyrie': 'Valkyrie.png',
      'ETC': 'ETC.png',
      'Highlander': 'Highlander.png',
      'WildHunt': 'Wildhunt.png',
      'Wildhunt': 'Wildhunt.png',
      'Sakugawa': 'ETC.png'
    }
    return `/images/schoolicon/${schoolMap[school] || 'ETC.png'}`
  }

  // Get role icon path
  const getTacticRoleIcon = (role) => {
    const roleIconMap = {
      'DamageDealer': 'Role_DamageDealer.png',
      'Tanker': 'Role_Tanker.png',
      'Healer': 'Role_Healer.png',
      'Supporter': 'Role_Supporter.png',
      'Vehicle': 'Role_Vehicle.png'
    }
    return `/images/ui/${roleIconMap[role] || 'Role_DamageDealer.png'}`
  }

  const getTacticRoleLabel = (role) => {
    if (role === 'DamageDealer') return 'Attacker'
    if (role === 'Tanker') return 'Tanker'
    if (role === 'Healer') return 'Healer'
    if (role === 'Supporter') return 'Support'
    if (role === 'Vehicle') return 'T.S.'
    return role || 'N/A'
  }

  // Formatting helpers for rendering
  const getBulletPillClass = (type) => {
    if (type === 'Explosion') return 'pill-explosion'
    if (type === 'Pierce') return 'pill-pierce'
    if (type === 'Mystic') return 'pill-mystic'
    if (type === 'Sonic') return 'pill-sonic'
    return 'pill-normal'
  }

  const getArmorPillClass = (type) => {
    if (type === 'LightArmor') return 'pill-explosion'
    if (type === 'HeavyArmor') return 'pill-pierce'
    if (type === 'Unarmed') return 'pill-mystic'
    if (type === 'ElasticArmor') return 'pill-sonic'
    return 'pill-normal'
  }

  const getAdaptationIcon = (val) => {
    const ranks = ['D', 'C', 'B', 'A', 'S', 'SS']
    const capped = Math.min(Math.max(val, 0), ranks.length - 1)
    const rankName = ranks[capped] || 'D'
    return `/images/ui/Ingame_Emo_Adaptresult${rankName}.png`
  }

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedSchool('All')
    setSelectedRole('All')
    setSelectedBullet('All')
    setSelectedArmor('All')
  }

  if (loading) {
    return <LoadingScreen fadeLoading={false} />
  }

  return (
    <div className="db-layout">
      {/* DB Title Section */}
      <section className="db-header-section">
        <span className="lobby-subtitle-tag">SCHALE Information Desk</span>
        <h2 className="lobby-title" style={{ fontFamily: 'Outfit, sans-serif' }}>
          STUDENT DATABASE
        </h2>
        <p className="lobby-desc">
          ข้อมูลประวัตินักเรียนสังกัดชมรมและโรงเรียนต่างๆ ในคิโวทอส ค้นหาข้อมูลเชิงลึกและรายละเอียดความสามารถ
        </p>
      </section>

      {/* Filter and Search Panel */}
      <div className="db-controls-card">
        <div className="db-search-bar-wrapper">
          <Search className="db-search-icon" />
          <input
            type="text"
            className="db-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาด้วยชื่อนักเรียน... (เช่น Aru, Yuuka, Shiroko)"
          />
          {searchTerm && (
            <button className="db-clear-search-btn" onClick={() => setSearchTerm('')}>
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          )}
        </div>

        <div className="db-filters-grid">
          {/* School filter */}
          <div className="db-filter-item">
            <label>โรงเรียน (School)</label>
            <select value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)}>
              <option value="All">ทุกโรงเรียน (All Schools)</option>
              {schoolsList.map(school => (
                <option key={school} value={school}>{school}</option>
              ))}
            </select>
          </div>

          {/* Role filter */}
          <div className="db-filter-item">
            <label>บทบาท (Combat Role)</label>
            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
              <option value="All">ทุกบทบาท (All Roles)</option>
              {rolesList.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Bullet Type filter */}
          <div className="db-filter-item">
            <label>ประเภทการโจมตี (Attack Type)</label>
            <select value={selectedBullet} onChange={(e) => setSelectedBullet(e.target.value)}>
              <option value="All">ทุกโจมตี (All Attacks)</option>
              <option value="Explosion">Explosion (ระเบิด)</option>
              <option value="Pierce">Pierce (ทะลวง)</option>
              <option value="Mystic">Mystic (ลึกลับ)</option>
              <option value="Sonic">Sonic (สั่นสะเทือน)</option>
            </select>
          </div>

          {/* Armor Type filter */}
          <div className="db-filter-item">
            <label>ประเภทการป้องกัน (Defense Type)</label>
            <select value={selectedArmor} onChange={(e) => setSelectedArmor(e.target.value)}>
              <option value="All">ทุกป้องกัน (All Defenses)</option>
              <option value="LightArmor">Light (เบา)</option>
              <option value="HeavyArmor">Heavy (หนัก)</option>
              <option value="Unarmed">Special (พิเศษ/ลึกลับ)</option>
              <option value="ElasticArmor">Elastic (ยืดหยุ่น)</option>
            </select>
          </div>
        </div>

        {(searchTerm || selectedSchool !== 'All' || selectedRole !== 'All' || selectedBullet !== 'All' || selectedArmor !== 'All') && (
          <div className="db-filter-reset-wrapper">
            <button className="db-reset-filters-btn" onClick={resetFilters}>
              ล้างตัวกรองทั้งหมด (Reset Filters)
            </button>
          </div>
        )}
      </div>

      {/* Result Count */}
      <div className="db-result-counter">
        พบข้อมูลนักเรียนทั้งหมด <span>{filteredStudents.length}</span> คน
      </div>

      {/* Database Grid */}
      {filteredStudents.length > 0 ? (
        <>
          <div className="db-student-grid">
            {filteredStudents.slice(0, visibleCount).map(student => (
              <div
                key={student.id}
                className="db-student-card"
                onClick={() => setSelectedStudent(student)}
              >
                {/* Card top badge */}
                <div className="db-card-school-badge">
                  <img
                    src={getSchoolIcon(student.school)}
                    alt={student.school}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/schoolicon/ETC.png';
                    }}
                  />
                </div>

                {/* Student avatar */}
                <div className="db-card-avatar-box">
                  <img
                    src={`/images/student/icon/${student.id}.webp`}
                    alt={student.englishName}
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/schoolicon/ETC.png';
                    }}
                  />
                </div>

                {/* Student basic info */}
                <div className="db-card-info-box">
                  <div className="db-card-stars">
                    {Array.from({ length: student.starGrade }).map((_, i) => '★').join('')}
                  </div>
                  <h3 className="db-card-name-eng">{student.englishName}</h3>
                  <span className="db-card-name-jp">{student.name}</span>
                  
                  {/* Secondary stats */}
                  <div className="db-card-metadata">
                    <span className="db-meta-school-tag">{student.school}</span>
                    <div className="db-meta-role">
                      <img
                        src={getTacticRoleIcon(student.tacticRole)}
                        alt={student.tacticRole}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/schoolicon/ETC.png';
                        }}
                      />
                      <span>{getTacticRoleLabel(student.tacticRole)}</span>
                    </div>
                  </div>

                  {/* Tactical pills */}
                  <div className="db-card-tactical-pills">
                    <span className={`db-pill ${getBulletPillClass(student.bulletType)}`}>
                      {student.bulletType}
                    </span>
                    <span className={`db-pill ${getArmorPillClass(student.armorType)}`}>
                      {student.armorType === 'LightArmor' ? 'Light' : student.armorType === 'HeavyArmor' ? 'Heavy' : student.armorType === 'Unarmed' ? 'Special' : 'Elastic'}
                    </span>
                  </div>
                </div>

                <div className="db-card-action-bar">
                  <span>ดูโปรไฟล์เชิงลึก</span>
                  <Info style={{ width: '14px', height: '14px' }} />
                </div>
              </div>
            ))}
          </div>

          {filteredStudents.length > visibleCount && (
            <div ref={sentinelRef} className="db-infinite-loading">
              <div className="db-infinite-spinner"></div>
              <span>กำลังโหลดข้อมูลเพิ่มเติม...</span>
            </div>
          )}
        </>
      ) : (
        <div className="db-no-results">
          <BookOpen style={{ width: '48px', height: '48px', opacity: 0.3, marginBottom: '12px' }} />
          <h3>ไม่พบข้อมูลนักเรียนตามตัวกรองที่กำหนด</h3>
          <p>กรุณาลองเปลี่ยนคำค้นหาหรือล้างตัวกรองทั้งหมด</p>
          <button className="db-reset-filters-btn-empty" onClick={resetFilters}>
            ล้างตัวกรอง (Clear Filters)
          </button>
        </div>
      )}

      {/* Detailed Student Modal */}
      {selectedStudent && (
        <div className="db-modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="db-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="db-modal-header">
              <div className="db-modal-header-title">
                <Sparkles style={{ width: '16px', height: '16px', color: '#00e5ff' }} />
                <span>STUDENT DOSSIER / แฟ้มประวัตินักเรียน</span>
              </div>
              <button className="db-modal-close-btn" onClick={() => setSelectedStudent(null)}>
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            {/* Modal Body Container */}
            <div className="db-modal-content">
              {/* Left Column: Portrait and Ribbon */}
              <div className="db-modal-portrait-section">
                <div className="db-modal-portrait-frame">
                  <img
                    src={`/images/student/portrait/${selectedStudent.id}.webp`}
                    alt={selectedStudent.englishName}
                    className="db-modal-portrait-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `/images/student/icon/${selectedStudent.id}.webp`;
                      e.target.style.width = '140px';
                      e.target.style.height = '140px';
                      e.target.style.objectFit = 'contain';
                      e.target.style.borderRadius = '50%';
                      e.target.style.border = '4px solid #4C9AE0';
                      e.target.style.background = '#0C0C0E';
                      e.target.style.margin = 'auto';
                      e.target.style.padding = '8px';
                    }}
                  />
                  
                  {/* Name overlay */}
                  <div className="db-modal-name-ribbon">
                    <span className="db-modal-squad-tag">
                      {selectedStudent.squadType === 'Main' ? 'STRIKER' : 'SPECIAL'}
                    </span>
                    <h2>{selectedStudent.englishName}</h2>
                    <p>{selectedStudent.name} ({selectedStudent.devName})</p>
                  </div>
                </div>

                <div className="db-modal-quote-container">
                  <p>"{selectedStudent.characterSSRNew}"</p>
                </div>
              </div>

              {/* Right Column: Full Info Sheet */}
              <div className="db-modal-details-section">
                {/* General Info Grid */}
                <div className="db-details-block">
                  <h4 className="db-section-title">ข้อมูลทั่วไป (General)</h4>
                  <div className="db-details-grid">
                    <div className="db-detail-cell">
                      <span className="db-cell-label">สังกัดโรงเรียน</span>
                      <span className="db-cell-value db-school-value">
                        <img
                          src={getSchoolIcon(selectedStudent.school)}
                          alt={selectedStudent.school}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/schoolicon/ETC.png';
                          }}
                        />
                        {selectedStudent.school}
                      </span>
                    </div>

                    <div className="db-detail-cell">
                      <span className="db-cell-label">ระดับดาวเริ่มต้น</span>
                      <span className="db-cell-value" style={{ color: '#fbbf24' }}>
                        {Array.from({ length: selectedStudent.starGrade }).map((_, i) => '★').join('')}
                      </span>
                    </div>

                    <div className="db-detail-cell">
                      <span className="db-cell-label">ตำแหน่ง (Position)</span>
                      <span className="db-cell-value">{selectedStudent.position}</span>
                    </div>

                    <div className="db-detail-cell">
                      <span className="db-cell-label">ชั้นปี (School Year)</span>
                      <span className="db-cell-value">{formatSchoolYear(selectedStudent.schoolYear)}</span>
                    </div>

                    <div className="db-detail-cell">
                      <span className="db-cell-label">ส่วนสูง (Height)</span>
                      <span className="db-cell-value">{selectedStudent.charHeightMetric} cm</span>
                    </div>

                    <div className="db-detail-cell">
                      <span className="db-cell-label">Cost (EX Skill)</span>
                      <span className="db-cell-value" style={{ color: '#00e5ff', fontWeight: 'bold' }}>
                        {selectedStudent.exCost} Cost
                      </span>
                    </div>
                  </div>
                </div>

                {/* Combat Stats Grid */}
                <div className="db-details-block">
                  <h4 className="db-section-title">การต่อสู้ (Combat Information)</h4>
                  <div className="db-details-grid">
                    <div className="db-detail-cell">
                      <span className="db-cell-label">ประเภทการโจมตี</span>
                      <span className={`db-cell-value-badge ${getBulletPillClass(selectedStudent.bulletType)}`}>
                        {selectedStudent.bulletType}
                      </span>
                    </div>

                    <div className="db-detail-cell">
                      <span className="db-cell-label">ประเภทการป้องกัน</span>
                      <span className={`db-cell-value-badge ${getArmorPillClass(selectedStudent.armorType)}`}>
                        {selectedStudent.armorType === 'LightArmor' ? 'Light' : selectedStudent.armorType === 'HeavyArmor' ? 'Heavy' : selectedStudent.armorType === 'Unarmed' ? 'Special' : 'Elastic'}
                      </span>
                    </div>

                    <div className="db-detail-cell">
                      <span className="db-cell-label">บทบาทควบคุมการรบ</span>
                      <span className="db-cell-value db-role-value">
                        <img
                          src={getTacticRoleIcon(selectedStudent.tacticRole)}
                          alt={selectedStudent.tacticRole}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/schoolicon/ETC.png';
                          }}
                        />
                        {getTacticRoleLabel(selectedStudent.tacticRole)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Terrain Adaptation Section */}
                <div className="db-details-block">
                  <h4 className="db-section-title">ความเหมาะสมของสมรภูมิ (Terrain Adaptation)</h4>
                  <div className="db-terrain-container">
                    <div className="db-terrain-card">
                      <img src="/images/ui/Terrain_Street.png" alt="Street" className="db-terrain-img" />
                      <span>สตรีท (Street)</span>
                      <img
                        src={getAdaptationIcon(selectedStudent.streetBattleAdaptation)}
                        alt="Adaptation"
                        className="db-adapt-rank-img"
                      />
                    </div>
                    <div className="db-terrain-card">
                      <img src="/images/ui/Terrain_Outdoor.png" alt="Outdoor" className="db-terrain-img" />
                      <span>เอาท์ดอร์ (Outdoor)</span>
                      <img
                        src={getAdaptationIcon(selectedStudent.outdoorBattleAdaptation)}
                        alt="Adaptation"
                        className="db-adapt-rank-img"
                      />
                    </div>
                    <div className="db-terrain-card">
                      <img src="/images/ui/Terrain_Indoor.png" alt="Indoor" className="db-terrain-img" />
                      <span>อินดอร์ (Indoor)</span>
                      <img
                        src={getAdaptationIcon(selectedStudent.indoorBattleAdaptation)}
                        alt="Adaptation"
                        className="db-adapt-rank-img"
                      />
                    </div>
                  </div>
                </div>

                {/* Weapon and Equipment Block */}
                <div className="db-details-block">
                  <h4 className="db-section-title">อุปกรณ์และอาวุธ (Equipment & Weapon)</h4>
                  
                  {/* Weapons */}
                  {selectedStudent.weapon ? (
                    <div className="db-weapon-row">
                      <div className="db-weapon-icon-box">
                        <img
                          src={`/images/weapon/weapon_icon_${selectedStudent.id}.webp`}
                          alt="Weapon"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/schoolicon/ETC.png';
                          }}
                        />
                      </div>
                      <div className="db-weapon-info">
                        <h5>{selectedStudent.weapon.Name || 'อาวุธเฉพาะตัว'}</h5>
                        <p>ประเภท: {selectedStudent.weapon.WeaponType || 'N/A'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="db-no-weapon">ไม่พบข้อมูลอาวุธเฉพาะตัว</div>
                  )}

                  {/* Equipment items */}
                  <div className="db-equipments-row">
                    {selectedStudent.equipment.map((equip, idx) => (
                      <div key={idx} className="db-equipment-card">
                        <div className="db-equipment-img-box">
                          <img
                            src={`/images/equipment/icon/equipment_icon_${equip.toLowerCase()}_tier1.webp`}
                            alt={equip}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/images/schoolicon/ETC.png';
                            }}
                          />
                        </div>
                        <span>ช่องที่ {idx + 1}: {equip}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="db-modal-footer">
              <button className="db-modal-close-action-btn" onClick={() => setSelectedStudent(null)}>
                ปิดหน้าต่างประวัติ
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
