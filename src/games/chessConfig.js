/**
 * BLUE ARCHIVE CHESS - REDESIGNED GAME BALANCING CONFIGURATION
 * 
 * Skills are now bound to specific Student IDs.
 * Pawns are locked as generic Mobs with NO EX skills.
 */

// Student EX Skills Dictionary
export const STUDENT_SKILLS = {
  // KING / Sensei (Special)
  "arona": {
    studentId: "arona",
    name: "Sensei (Arona)",
    skillName: "Adult's Card",
    displayName: "Adult's Card (บัตรผู้ใหญ่)",
    cost: 10,
    description: "ชุบชีวิตเบี้ยประกอบ (Pawn) ที่ตายไปแล้ว 1 ตัว ขึ้นมาใหม่ในช่องว่างรอบตัวเซนเซ (8 ทิศทาง)"
  },
  "plana": {
    studentId: "plana",
    name: "Sensei (Plana)",
    skillName: "Adult's Card",
    displayName: "Adult's Card (บัตรผู้ใหญ่)",
    cost: 10,
    description: "ชุบชีวิตเบี้ยประกอบ (Pawn) ที่ตายไปแล้ว 1 ตัว ขึ้นมาใหม่ในช่องว่างรอบตัวเซนเซ (8 ทิศทาง)"
  },

  // QUEEN (School Leaders)
  "10059": { // Mika
    studentId: "10059",
    name: "Mika",
    skillName: "Kyrie Eleison",
    displayName: "Kyrie Eleison (เสียงสวดภาวนา)",
    cost: 6,
    description: "สกิลโจมตีระยะไกล (ไม่ย้ายที่): สไนป์กำจัดหมากศัตรู 1 ตัวในทิศทางใดก็ได้ (ตรงหรือทแยง) ระยะไกลสุด 4 ช่อง โดยที่ตัว Mika จะยืนอยู่กับที่ช่องเดิมไม่ขยับ (หากยิงโดน King ศัตรู จะทำให้ King ติดสถานะ Frozen ชะงักแทนการโดนกิน)"
  },
  "10004": { // Hina
    studentId: "10004",
    name: "Hina",
    skillName: "End of Babel",
    displayName: "End of Babel (จุดจบแห่งบาเบล)",
    cost: 6,
    description: "สกิลโจมตีหมู่ระยะไกล (ไม่ย้ายที่): พ่นกระสุนกวาดล้างศัตรูทั้งหมดในระยะพัดหน้า 2 แถว (1 ช่องตรงหน้า และ 3 ช่องในแถวถัดไป รวม 4 ช่อง) โดยที่ตัว Hina จะยืนอยู่กับที่ช่องเดิมไม่ขยับ (หากโดน King ศัตรู จะทำให้ King ติดสถานะ Frozen ชะงักแทนการโดนกิน)"
  },

  // ROOK (Frontline Tanks)
  "13010": { // Yuuka
    studentId: "13010",
    name: "Yuuka",
    skillName: "Q.E.D. Calculation Shield",
    displayName: "Calculation Shield (โล่คำนวณ)",
    cost: 3,
    description: "กางบาเรียให้ตัวเอง: ตัว Yuuka จะได้รับบาเรียป้องกันการโดนกิน โดยหมากตัวนี้จะไม่สามารถถูกกินได้ใน 1 เทิร์นถัดไปของศัตรู"
  },
  "10005": { // Hoshino
    studentId: "10005",
    name: "Hoshino",
    skillName: "Tactical Shield / Stun",
    displayName: "Tactical Shield / Stun (โล่กางบาเรีย & สตัน)",
    cost: 4,
    description: "กางบาเรียป้องกันตนเอง & แช่แข็งรอบข้าง: ตัว Hoshino จะได้รับบาเรียป้องกันการโดนกินในเทิร์นถัดไปของศัตรู พร้อมกับแช่แข็ง (Freeze) หมากศัตรูทุกตัวที่ยืนติดอยู่รอบข้างในทิศทางตรง (4 ทิศ) ทำให้ศัตรูเหล่านั้นขยับหรือใช้สกิลไม่ได้ในเทิร์นถัดไป"
  },

  // BISHOP (Sniper / Support)
  "10006": { // Iori
    studentId: "10006",
    name: "Iori",
    skillName: "Swift Shot",
    displayName: "Swift Shot (ยิงด่วน)",
    cost: 4,
    description: "สกิลโจมตีระยะไกล (ไม่ย้ายที่): ยิงสไนเปอร์กำจัดหมากศัตรูในแนวทแยงมุมระยะ 3 ช่อง โดยตัว Iori จะยืนอยู่กับที่ช่องเดิมไม่ขยับ (หากยิงโดน King ศัตรู จะทำให้ King ติดสถานะ Frozen ชะงักแทนการโดนกิน)"
  },
  "26003": { // Serina
    studentId: "26003",
    name: "Serina",
    skillName: "Trinitarian Healing",
    displayName: "Trinitarian Healing (การฟื้นฟูแห่งทรีนิตี้)",
    cost: 3,
    description: "กางบาเรียให้เพื่อนข้ามแผนที่: เลือกกางบาเรียป้องกันการโดนกินให้หมากฝ่ายเดียวกัน 1 ตัวที่ตำแหน่งใดก็ได้บนกระดาน โดยที่ตัว Serina จะยืนอยู่กับที่ช่องเดิมไม่ขยับ"
  },

  // KNIGHT (Flanker / Striker)
  "10010": { // Shiroko
    studentId: "10010",
    name: "Shiroko",
    skillName: "Drone Support",
    displayName: "Drone Support (โดรนสนับสนุน)",
    cost: 3,
    description: "สกิลโจมตีระยะไกล (ไม่ย้ายที่): สั่งโดรนลอบโจมตีกำจัดหมากศัตรูในระยะ L-Shape ของม้า โดยตัว Shiroko จะยืนปักหลักอยู่ที่เดิมช่องเดิม ไม่ย้ายตำแหน่งไปทับช่องศัตรู และผู้เล่นจะได้รับ Cost คืนทันที 1 แต้ม (Net Cost: 2) (หากโจมตีโดน King ศัตรู จะทำให้ King ติดสถานะ Frozen ชะงักแทนการโดนกิน)"
  },
  "10013": { // Tsurugi
    studentId: "10013",
    name: "Tsurugi",
    skillName: "Cleansing Bloodlust",
    displayName: "Cleansing Bloodlust (จิตสังหารชำระล้าง)",
    cost: 4,
    description: "สกิลพุ่งโจมตีประชิด (ย้ายตัวตาม): กระโดดพุ่งไปกำจัดหมากศัตรูในระยะ L-Shape ของม้า โดยตัว Tsurugi จะย้ายตำแหน่งไปทับช่องเป้าหมายที่ถูกกิน พร้อมกับได้รับบาเรียป้องกันตนเองการโดนกินเป็นเวลา 1 เทิร์นของศัตรู (หากโจมตีโดน King ศัตรู จะทำให้ King ติดสถานะ Frozen ชะงักแทนการโดนกิน)"
  }
};

// Available students pool per position (for changing characters)
export const ASSIGNABLE_STUDENTS_POOL = {
  KING: [
    { id: "arona", name: "Sensei (Arona)", school: "SCHALE", image: "/images/story_characters/icons/Arona.png" },
    { id: "plana", name: "Sensei (Plana)", school: "SCHALE", image: "/images/story_characters/icons/Plana.png" }
  ],
  QUEEN: [
    { id: "10059", name: "Mika", school: "Trinity", image: "/images/student/icon/10059.webp" },
    { id: "10004", name: "Hina", school: "Gehenna", image: "/images/student/icon/10004.webp" }
  ],
  ROOK: [
    { id: "13010", name: "Yuuka", school: "Millennium", image: "/images/student/icon/13010.webp" },
    { id: "10005", name: "Hoshino", school: "Abydos", image: "/images/student/icon/10005.webp" }
  ],
  BISHOP: [
    { id: "10006", name: "Iori", school: "Gehenna", image: "/images/student/icon/10006.webp" },
    { id: "26003", name: "Serina", school: "Trinity", image: "/images/student/icon/26003.webp" }
  ],
  KNIGHT: [
    { id: "10010", name: "Shiroko", school: "Abydos", image: "/images/student/icon/10010.webp" },
    { id: "10013", name: "Tsurugi", school: "Trinity", image: "/images/student/icon/10013.webp" }
  ]
};

// Default Student Mapping for White Side (SCHALE Team)
export const DEFAULT_WHITE_ASSIGNMENTS = {
  KING: { id: "arona", name: "Sensei (Arona)", image: "/images/story_characters/icons/Arona.png" },
  QUEEN: { id: "10059", name: "Mika", image: "/images/student/icon/10059.webp" },
  ROOK: { id: "13010", name: "Yuuka", image: "/images/student/icon/13010.webp" },
  BISHOP: { id: "26003", name: "Serina", image: "/images/student/icon/26003.webp" },
  KNIGHT: { id: "10010", name: "Shiroko", image: "/images/student/icon/10010.webp" },
  PAWN: { id: "kaiser_mob", name: "Mob (เบี้ยประกอบ)", image: "/images/story_characters/icons/Kaiser_PMC_General.png" }
};

// Default Student Mapping for Black Side (Kaiser / Rival Team)
export const DEFAULT_BLACK_ASSIGNMENTS = {
  KING: { id: "plana", name: "Sensei (Plana)", image: "/images/story_characters/icons/Plana.png" },
  QUEEN: { id: "10004", name: "Hina", image: "/images/student/icon/10004.webp" },
  ROOK: { id: "10005", name: "Hoshino", image: "/images/student/icon/10005.webp" },
  BISHOP: { id: "10006", name: "Iori", image: "/images/student/icon/10006.webp" },
  KNIGHT: { id: "10013", name: "Tsurugi", image: "/images/student/icon/10013.webp" },
  PAWN: { id: "kaiser_mob", name: "Mob (เบี้ยประกอบ)", image: "/images/story_characters/icons/Kaiser_PMC_General.png" }
};
