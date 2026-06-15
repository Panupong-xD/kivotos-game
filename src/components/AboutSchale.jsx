import React, { useState, useEffect } from 'react'
import { Info, Sparkles, User, Calendar, BookOpen, Scaling, Users, ExternalLink, Globe, X } from 'lucide-react'
import LoadingScreen from './LoadingScreen.jsx'

// Helper to sort groups by priority
const groupOrder = [
  'Abydos', 'Gehenna', 'Trinity', 'Millennium', 'Hyakkiyako', 
  'RedWinter', 'SRT', 'Shanhaijing', 'Valkyrie', 'Arius', 'Highlander', 'WildHunt',
  'General Student Council', 'Gematria', 'SCHALE'
]

const getGroupPriority = (name) => {
  const idx = groupOrder.indexOf(name)
  return idx !== -1 ? idx : 999
}

export default function AboutSchale() {
  const [characterGroups, setCharacterGroups] = useState({})
  const [groupKeys, setGroupKeys] = useState([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedCharacter, setSelectedCharacter] = useState(null)

  useEffect(() => {
    async function loadStoryCharacters() {
      try {
        const res = await fetch('/jp_data/story_characters_info.json')
        const data = await res.json()
        
        // 1. First Pass: Group characters by School or Faction
        const schoolGroups = {} // SchoolName -> { characters: [] }
        const rawNonSchoolGroups = {} // FactionName -> Character[]
        
        for (const key in data) {
          const char = data[key]
          
          // Filter out invalid items that do not have a Name or NameEn
          if (!char.Name || !char.NameEn) continue;

          let schoolName = char.School
          if (schoolName && schoolName.toLowerCase() === 'srt') {
            schoolName = 'SRT'
          }

          const charObj = {
            name: char.Name,
            nameEn: char.NameEn,
            nameJp: char.NameJp,
            templateType: char.TemplateType || 'Character',
            school: schoolName,
            schoolTh: schoolName === 'SRT' ? 'สถาบันพิเศษ SRT' : char.SchoolTh,
            club: char.Club,
            clubTh: char.ClubTh,
            affiliations: char.Affiliations || [],
            age: char.Age || 'N/A',
            birthday: char.Birthday || 'N/A',
            height: char.Height || 'N/A',
            voiceActor: char.VoiceActor || 'N/A',
            illustrator: char.Illustrator || 'N/A',
            description: char.Description || 'ไม่มีข้อมูลรายละเอียดตัวละคร',
            iconPath: char.IconLocalPath ? char.IconLocalPath.replace(/^\.\//, '/') : null,
            portraitPath: char.PortraitLocalPath 
              ? char.PortraitLocalPath.replace(/^\.\//, '/') 
              : `/images/story_characters/portraits/${key.replace(/\s+/g, '_')}.png`
          }

          if (schoolName && schoolName.trim() !== '') {
            if (!schoolGroups[schoolName]) {
              schoolGroups[schoolName] = {
                name: schoolName,
                nameTh: schoolName === 'SRT' ? 'สถาบันพิเศษ SRT' : (char.SchoolThLong || char.SchoolTh || schoolName),
                isSchool: true,
                characters: []
              }
            }
            schoolGroups[schoolName].characters.push(charObj)
          } else {
            // Non-school character: group by primary affiliation or "Other"
            const primaryAff = (char.Affiliations && char.Affiliations[0]) || 'Other'
            if (!rawNonSchoolGroups[primaryAff]) {
              rawNonSchoolGroups[primaryAff] = []
            }
            rawNonSchoolGroups[primaryAff].push(charObj)
          }
        }

        // 2. Second Pass: Determine top-level categories
        const finalizedTopGroups = {}
        
        // Add all schools to top-level
        for (const schoolName in schoolGroups) {
          finalizedTopGroups[schoolName] = schoolGroups[schoolName]
        }

        // Filter non-school groups. Major ones (>= 4 members) get their own top category
        const otherCharacters = []
        for (const affName in rawNonSchoolGroups) {
          const chars = rawNonSchoolGroups[affName]
          if (chars.length >= 4) {
            let nameTh = affName
            if (affName === 'General Student Council') nameTh = 'องค์การนักเรียนเทศบาล (GSC)'
            else if (affName === 'Gematria') nameTh = 'เกมาเทรีย (Gematria)'
            else if (affName === 'SCHALE') nameTh = 'ชาเล่ต์ (SCHALE)'
            else if (affName === 'Highlander Supervisory Office' || affName === 'Highlander Railroad Academy') nameTh = 'ไฮแลนเดอร์ (Highlander)'
            else if (affName === 'Street Ghost Troupe') nameTh = 'ชมรมวิญญาณถนน (Street Ghost)'
            
            finalizedTopGroups[affName] = {
              name: affName,
              nameTh: nameTh,
              isSchool: false,
              characters: chars
            }
          } else {
            // Add smaller factions to the catch-all "Other" group
            otherCharacters.push(...chars)
          }
        }

        // Add catch-all "Other" category if there are members
        if (otherCharacters.length > 0) {
          finalizedTopGroups['Other'] = {
            name: 'Other',
            nameTh: 'อื่นๆ / ไม่สังกัดโรงเรียน',
            isSchool: false,
            characters: otherCharacters
          }
        }

        // 3. Third Pass: Subgroup characters inside each top-level group (Clubs/Affiliations)
        const processedGroups = {}
        
        for (const groupKey in finalizedTopGroups) {
          const group = finalizedTopGroups[groupKey]
          const subgroups = {} // subgroupName -> { name, nameTh, characters: [] }

          for (const char of group.characters) {
            let subKey = 'Other'
            let subTh = 'อิสระ / ไม่ระบุชมรม'

            if (group.isSchool) {
              // Group by Club
              if (char.club && char.club.trim() !== '') {
                subKey = char.club
                subTh = char.clubTh || char.club
              }
            } else {
              // Non-school grouping
              if (groupKey === 'Other') {
                // Inside catch-all, group by their actual primary affiliation
                if (char.affiliations && char.affiliations.length > 0) {
                  subKey = char.affiliations[0]
                  subTh = char.affiliations[0]
                  if (subKey === 'Street Ghost Troupe') subTh = 'ชมรมวิญญาณถนน (Street Ghost)'
                  else if (subKey === 'Saint Nephthys Company') subTh = 'บริษัทเซนต์เนฟธิส'
                  else if (subKey === 'Kaiser Corporation') subTh = 'ไคเซอร์ คอร์ปอเรชัน'
                  else if (subKey === 'Seekers of Certain Happiness') subTh = 'Seekers of Certain Happiness'
                }
              } else {
                // Inside major factions (like GSC), group by secondary affiliation or Club if available
                if (char.club && char.club.trim() !== '') {
                  subKey = char.club
                  subTh = char.clubTh || char.club
                } else if (char.affiliations && char.affiliations.length > 1) {
                  subKey = char.affiliations[1]
                  subTh = char.affiliations[1]
                  if (subKey === 'SCHALE') subTh = 'สำนักงานชาเล่ต์ (SCHALE)'
                } else {
                  subKey = groupKey
                  subTh = group.nameTh
                }
              }
            }

            if (!subgroups[subKey]) {
              subgroups[subKey] = {
                name: subKey,
                nameTh: subTh,
                characters: []
              }
            }
            subgroups[subKey].characters.push(char)
          }

          // Convert subgroups object to a sorted array
          const sortedSubgroups = Object.values(subgroups).sort((a, b) => {
            if (a.name === 'Other') return 1 // Put 'Other' subgroup at the end
            if (b.name === 'Other') return -1
            return a.nameTh.localeCompare(b.nameTh)
          })

          // Sort character lists inside each subgroup alphabetically by NameEn
          for (const sub of sortedSubgroups) {
            sub.characters.sort((a, b) => a.nameEn.localeCompare(b.nameEn))
          }

          processedGroups[groupKey] = {
            name: group.name,
            nameTh: group.nameTh,
            isSchool: group.isSchool,
            totalCount: group.characters.length,
            subgroups: sortedSubgroups
          }
        }

        // 4. Fourth Pass: Create the unified "All" group
        const allCharactersList = []
        for (const groupKey in processedGroups) {
          const group = processedGroups[groupKey]
          for (const subgroup of group.subgroups) {
            allCharactersList.push(...subgroup.characters)
          }
        }

        // Group all characters by their top-level school or faction
        const allSubgroups = {}
        for (const char of allCharactersList) {
          let subKey = 'Other'
          let subTh = 'อื่นๆ / ไม่สังกัดโรงเรียน'

          if (char.school && char.school.trim() !== '') {
            subKey = char.school
            // Find school's Thai name from processedGroups if available
            subTh = (processedGroups[char.school] && processedGroups[char.school].nameTh) || char.schoolTh || char.school
          } else if (char.affiliations && char.affiliations.length > 0) {
            const primaryAff = char.affiliations[0]
            if (processedGroups[primaryAff]) {
              subKey = primaryAff
              subTh = processedGroups[primaryAff].nameTh
            } else {
              subKey = 'Other'
              subTh = 'อื่นๆ / ไม่สังกัดโรงเรียน'
            }
          }

          if (!allSubgroups[subKey]) {
            allSubgroups[subKey] = {
              name: subKey,
              nameTh: subTh,
              characters: []
            }
          }
          allSubgroups[subKey].characters.push(char)
        }

        // Sort the subgroups in "All" view by predefined priority
        const sortedAllSubgroups = Object.values(allSubgroups).sort((a, b) => {
          if (a.name === 'Other') return 1
          if (b.name === 'Other') return -1
          const pA = getGroupPriority(a.name)
          const pB = getGroupPriority(b.name)
          if (pA !== pB) return pA - pB
          return a.nameTh.localeCompare(b.nameTh)
        })

        // Sort characters inside each subgroup
        for (const sub of sortedAllSubgroups) {
          sub.characters.sort((a, b) => a.nameEn.localeCompare(b.nameEn))
        }

        processedGroups['All'] = {
          name: 'All',
          nameTh: 'ทั้งหมด (All Characters)',
          isSchool: false,
          totalCount: allCharactersList.length,
          subgroups: sortedAllSubgroups
        }

        // Sort group keys: put 'All' first, then sort major groups, and 'Other' at the end
        const sortedKeys = [
          'All',
          ...Object.keys(processedGroups)
            .filter(k => k !== 'All' && k !== 'Other')
            .sort((a, b) => {
              const pA = getGroupPriority(a)
              const pB = getGroupPriority(b)
              if (pA !== pB) return pA - pB
              return a.localeCompare(b)
            })
        ]
        
        if (processedGroups['Other']) {
          sortedKeys.push('Other')
        }

        setCharacterGroups(processedGroups)
        setGroupKeys(sortedKeys)
        setSelectedGroup('All') // default to All
        setLoading(false)
      } catch (err) {
        console.error('Failed to load story characters:', err)
        setLoading(false)
      }
    }
    loadStoryCharacters()
  }, [])

  // Get school/group icon path
  const getGroupIcon = (groupName) => {
    if (groupName === 'All') {
      return '/images/schoolicon/ETC.png' // Use generic icon for All
    }
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
      'Highlander': 'Highlander.png',
      'WildHunt': 'Wildhunt.png',
      'Wildhunt': 'Wildhunt.png'
    }
    const iconName = schoolMap[groupName]
    return iconName ? `/images/schoolicon/${iconName}` : '/images/schoolicon/ETC.png'
  }

  // Format biography text with paragraph breaks
  const renderDescription = (text) => {
    if (!text) return 'ไม่มีข้อมูลประวัติในแฟ้มคลังสืบสวน'
    return text.split('\n\n').map((para, i) => (
      <p key={i} className="about-modal-desc-para">
        {para}
      </p>
    ))
  }

  if (loading) {
    return <LoadingScreen fadeLoading={false} />
  }

  const activeGroup = characterGroups[selectedGroup]

  return (
    <div className="about-layout">
      {/* Title Header */}
      <section className="about-header-section">
        <span className="lobby-subtitle-tag">KIVOTOS DOSSIER CONTROL</span>
        <h2 className="lobby-title" style={{ fontFamily: 'Outfit, sans-serif' }}>
          STORY CHARACTERS ARCHIVE
        </h2>
        <p className="lobby-desc">
          ทำเนียบตัวละครจริงและสารานุกรมตัวละครในเนื้อเรื่องหลัก แยกกลุ่มตามโรงเรียนและชมรมย่อยเพื่อการสืบค้นที่ง่ายขึ้น
        </p>
      </section>

      {/* Main Container Layout */}
      <div className="about-content-container">
        
        {/* Left Side: Schools & Affiliations Menu */}
        <aside className="about-sidebar">
          <h4 className="about-sidebar-title">
            <Users style={{ width: '16px', height: '16px', color: '#4C9AE0' }} />
            <span>โรงเรียน & ฝ่ายหลัก (Factions)</span>
          </h4>
          <div className="about-sidebar-list">
            {groupKeys.map(key => {
              const grp = characterGroups[key]
              const isActive = selectedGroup === key
              return (
                <button
                  key={key}
                  className={`about-sidebar-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedGroup(key)}
                >
                  <div className="about-sidebar-badge-box">
                    <img
                      src={getGroupIcon(key)}
                      alt={key}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/schoolicon/ETC.png';
                      }}
                    />
                  </div>
                  <div className="about-sidebar-text-box">
                    <span className="about-sidebar-name-en">{key}</span>
                    <span className="about-sidebar-name-th">{grp.nameTh}</span>
                  </div>
                  <span className="about-sidebar-count-badge">
                    {grp.totalCount}
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Right Side: Roster Panel */}
        <main className="about-main-panel">
          {activeGroup && (
            <div className="about-roster-header">
              <div className="about-roster-meta">
                <div className="about-roster-logo-box">
                  <img
                    src={getGroupIcon(selectedGroup)}
                    alt={selectedGroup}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/schoolicon/ETC.png';
                    }}
                  />
                </div>
                <div className="about-roster-title-box">
                  <h3>{activeGroup.nameTh}</h3>
                  <p>สังกัด {selectedGroup} (พบตัวละครลงทะเบียนทั้งหมด {activeGroup.totalCount} ราย)</p>
                </div>
              </div>
            </div>
          )}

          {/* Roster Content Grouped by Subgroups */}
          {activeGroup && activeGroup.subgroups && activeGroup.subgroups.length > 0 ? (
            <div className="about-roster-content">
              {activeGroup.subgroups.map(subgroup => (
                <div key={subgroup.name} className="about-subgroup-section">
                  <div className="about-subgroup-header">
                    <h4>{subgroup.nameTh}</h4>
                    <span className="about-subgroup-count">{subgroup.characters.length} คน</span>
                  </div>
                  <div className="about-characters-grid">
                    {subgroup.characters.map(char => (
                      <div
                        key={char.name}
                        className="about-character-card"
                        onClick={() => setSelectedCharacter(char)}
                      >
                        <div className="about-card-avatar">
                          <img
                            src={char.iconPath || '/images/schoolicon/ETC.png'}
                            alt={char.nameEn}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/images/schoolicon/ETC.png';
                            }}
                          />
                        </div>
                        <div className="about-card-info">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className={`about-card-tag-type ${char.templateType === 'NPC' ? 'npc' : 'playable'}`}>
                              {char.templateType}
                            </span>
                          </div>
                          <h4>{char.nameEn}</h4>
                          <p>{char.nameJp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="about-empty-roster">
              <Users style={{ width: '48px', height: '48px', opacity: 0.3, marginBottom: '12px' }} />
              <p>ไม่มีข้อมูลตัวละคร</p>
            </div>
          )}
        </main>

      </div>

      {/* Story Character Dossier Detail Modal */}
      {selectedCharacter && (
        <div className="about-modal-overlay" onClick={() => setSelectedCharacter(null)}>
          <div className="about-modal-card" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="about-modal-header">
              <div className="about-modal-header-title">
                <Sparkles style={{ width: '16px', height: '16px', color: '#fbbf24' }} />
                <span>DOSSIER: {selectedCharacter.nameEn}</span>
              </div>
              <button className="about-modal-close-btn" onClick={() => setSelectedCharacter(null)}>
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="about-modal-body">
              {/* Left Column: Portrait */}
              <div className="about-modal-portrait-col">
                <div className="about-modal-portrait-frame">
                  <img
                    src={selectedCharacter.portraitPath || selectedCharacter.iconPath || '/images/schoolicon/ETC.png'}
                    alt={selectedCharacter.nameEn}
                    className="about-modal-portrait-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = selectedCharacter.iconPath || '/images/schoolicon/ETC.png';
                      e.target.style.width = '140px';
                      e.target.style.height = '140px';
                      e.target.style.objectFit = 'contain';
                      e.target.style.borderRadius = '50%';
                      e.target.style.border = '4px solid #D4A853';
                      e.target.style.background = '#0C0C0E';
                      e.target.style.padding = '8px';
                    }}
                  />
                  
                  {/* Name overlay */}
                  <div className="about-modal-name-banner">
                    <span className={`about-card-tag-type ${selectedCharacter.templateType === 'NPC' ? 'npc' : 'playable'}`} style={{ marginBottom: '6px' }}>
                      {selectedCharacter.templateType}
                    </span>
                    <h3>{selectedCharacter.nameEn}</h3>
                    <p>{selectedCharacter.nameJp}</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Full Details */}
              <div className="about-modal-details-col">
                {/* School & Club info */}
                <div className="about-details-section-box">
                  <h4 className="about-details-section-title">สังกัดและบทบาท (Affiliations)</h4>
                  <div className="about-affiliations-tags">
                    {selectedCharacter.school && (
                      <span className="about-aff-tag school">
                        โรงเรียน: {selectedCharacter.schoolTh || selectedCharacter.school}
                      </span>
                    )}
                    {selectedCharacter.club && (
                      <span className="about-aff-tag club">
                        ชมรม: {selectedCharacter.clubTh || selectedCharacter.club}
                      </span>
                    )}
                    {selectedCharacter.affiliations.map(aff => (
                      <span key={aff} className="about-aff-tag general">
                        {aff}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Profile Grid */}
                <div className="about-details-section-box">
                  <h4 className="about-details-section-title">ข้อมูลส่วนตัว (Profile)</h4>
                  <div className="about-details-grid">
                    <div className="about-detail-cell">
                      <div className="about-detail-label">
                        <User style={{ width: '12px', height: '12px' }} />
                        <span>อายุ (Age)</span>
                      </div>
                      <span className="about-detail-value">{selectedCharacter.age} ปี</span>
                    </div>

                    <div className="about-detail-cell">
                      <div className="about-detail-label">
                        <Calendar style={{ width: '12px', height: '12px' }} />
                        <span>วันเกิด (Birthday)</span>
                      </div>
                      <span className="about-detail-value">{selectedCharacter.birthday}</span>
                    </div>

                    <div className="about-detail-cell">
                      <div className="about-detail-label">
                        <Scaling style={{ width: '12px', height: '12px' }} />
                        <span>ส่วนสูง (Height)</span>
                      </div>
                      <span className="about-detail-value">
                        {selectedCharacter.height !== 'N/A' && selectedCharacter.height !== 'Unknown' && !selectedCharacter.height.includes('cm')
                          ? `${selectedCharacter.height} cm`
                          : selectedCharacter.height}
                      </span>
                    </div>

                    <div className="about-detail-cell">
                      <div className="about-detail-label">
                        <BookOpen style={{ width: '12px', height: '12px' }} />
                        <span>ผู้พากย์เสียง (CV)</span>
                      </div>
                      <span className="about-detail-value">{selectedCharacter.voiceActor}</span>
                    </div>

                    <div className="about-detail-cell" style={{ gridColumn: 'span 2' }}>
                      <div className="about-detail-label">
                        <Users style={{ width: '12px', height: '12px' }} />
                        <span>ผู้วาดภาพ (Illustrator)</span>
                      </div>
                      <span className="about-detail-value">{selectedCharacter.illustrator}</span>
                    </div>
                  </div>
                </div>

                {/* Biography Description */}
                <div className="about-details-section-box">
                  <h4 className="about-details-section-title">ประวัติความเป็นมา (Biography)</h4>
                  <div className="about-modal-description-box">
                    {renderDescription(selectedCharacter.description)}
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="about-modal-footer">
              <button className="about-modal-close-action-btn" onClick={() => setSelectedCharacter(null)}>
                ปิดแฟ้มสืบสวน
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
