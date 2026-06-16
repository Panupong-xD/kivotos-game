import React, { useState, useEffect, useRef } from 'react'
import Autocomplete from '../components/Autocomplete.jsx'
import LoadingScreen from '../components/LoadingScreen.jsx'
import { Timer, Trophy, Play, RotateCcw, AlertTriangle, ArrowRight, Eye, Volume2, VolumeX, Sparkles, HelpCircle, RefreshCw, LayoutGrid, Check, X, Edit2, Lock, Shield, Swords, Info, Settings, EyeOff, User, BookOpen } from 'lucide-react'
import SecureImage from '../components/SecureImage.jsx'
import { motion, AnimatePresence } from 'framer-motion'

// Game Cost Configurations (ปรับเปลี่ยนค่าใช้จ่าย Cost ต่างๆ ของเกมได้จากตรงนี้)
export const GAME_COSTS = {
  STARTING_COST: 20,     // ค่า Cost เริ่มต้นในแต่ละรอบ
  MAX_COST: 40,          // ค่า Cost สูงสุดที่สะสมได้
  ROUND_BONUS_COST: 15,  // ค่า Cost ที่ได้รับเพิ่มในแต่ละรอบใหม่
  SUBMIT_GUESS: 3,       // ค่า Cost ที่ใช้เมื่อผู้เล่นส่งทายชื่อ (รวมถึงหักเมื่อทายผิด)
  DECREASE_BLUR: 3,      // ค่า Cost ที่ใช้ในการปรับความเบลอภาพ
  RESTORE_COLOR: 15,      // ค่า Cost ที่ใช้ในการยกเลิกถมดำ Silhouette คืนสีผมตัวละคร
  REVEAL_HALO: 10,        // ค่า Cost ที่ใช้ในการวิเคราะห์รูปฮาโล
  REVEAL_WEAPON: 15,      // ค่า Cost ที่ใช้ในการตรวจสอบรูปปืน
  REVEAL_GEAR: 4,        // ค่า Cost ที่ใช้ในการใบ้ Unique Gear เฉพาะตัว
  REVEAL_COMBAT: 10,      // ค่า Cost ที่ใช้ในการปลดล็อคประวัติการรบ
  REVEAL_PERSONAL: 10     // ค่า Cost ที่ใช้ในการปลดล็อคข้อมูลประวัติส่วนตัว
};

// Student IDs that have actual gear icon images in /images/gear/icon/
const GEAR_ICON_IDS = new Set([
  10000, 10001, 10004, 10005, 10008, 10009, 10010, 10012, 10013, 10022,
  10025, 10028, 10033, 10034, 10036, 10038, 10039, 10041, 10047, 10065,
  10066, 13001, 13004, 13007, 13008, 13010, 16003, 16006, 20005, 20006,
  20009, 20015, 20021, 23003, 23004, 23007, 26005
]);

// Capitalization helper for English names
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
};

// Validated list of 183 halo image filenames (same as HaloGuesser)
const HALO_FILES = [
  "Airi_Halo.png", "Akane_Halo.png", "Akari_Halo.png", "Akemi_Halo.png", "Akira_Halo.png", "Ako_Halo.png",
  "Alice_Halo.png", "Aoi_Halo.png", "Arata_Halo.png", "Arona_Angered_Halo.png", "Arona_Halo.png",
  "Arona_Happy_Halo.png", "Arona_Motivated_Halo.png", "Arona_Sad_Halo.png", "Arona_Shocked_Halo.png",
  "Aru_Halo.png", "Asuna_Halo.png", "Atsuko_Halo.png", "Ayame_Halo.png", "Ayane_Halo.png", "Ayumu_Halo.png",
  "Azusa_Halo.png", "Binah_Halo.png", "Cherino_Halo.png", "Chesed_Halo.png", "Chihiro_Halo.png",
  "Chinatsu_Halo.png", "Chise_Halo.png", "Chokmah_Halo.png", "Da'at_Halo.png", "Decagrammaton_Halo.png",
  "Eimi_Halo.png", "Eri_Halo.png", "Erika_Halo.png", "Fubuki_Halo.png", "Fuuka_Halo.png", "Fuyu_Halo.png",
  "GSC_President_Halo.png", "Geburah_Halo.png", "Haine_Halo.png", "Hanae_Halo.png", "Hanako_Halo.png",
  "Hare_Halo.png", "Haruka_Halo.png", "Haruna_Halo.png", "Hasumi_Halo.png", "Hibiki_Halo.png", "Hifumi_Halo.png",
  "Hikari_Halo.png", "Himari_Halo.png", "Hina_Halo.png", "Hinata_Halo.png", "Hiromi_Halo.png", "Hiyori_Halo.png",
  "Hod_Halo.png", "Hoshino_Halo.png", "Ibuki_Halo.png", "Ichika_Halo.png", "Iori_Halo.png", "Iroha_Halo.png",
  "Izumi_Halo.png", "Izuna_Halo.png", "Junko_Halo.png", "Juri_Halo.png", "Kaede_Halo.png", "Kaguya_Halo.png",
  "Kaho_Halo.png", "Kai_Halo.png", "Kanna_Halo.png", "Kanoe_Halo.png", "Karin_Halo.png", "Kasumi_Halo.png",
  "Kaya_Halo.png", "Kayoko_Halo.png", "Kazusa_Halo.png", "Kei_Halo.png", "Kether_Halo.png", "Kirara_Halo.png",
  "Kirino_Halo.png", "Kisaki_Halo.png", "Koharu_Halo.png", "Kokona_Halo.png", "Kokuriko_Halo.png",
  "Konoka_Halo.png", "Kotama_Halo.png", "Kotori_Halo.png", "Koyuki_Halo.png", "Kurumi_Halo.png",
  "Kuzunoha_Halo.png", "Mai_Halo.png", "Maia_Halo.png", "Maki_Halo.png", "Makoto_Halo.png", "Malkuth_Halo.png",
  "Mari_Halo.png", "Marina_Halo.png", "Mashiro_Halo.png", "Megu_Halo.png", "Meru_Halo.png", "Michiru_Halo.png",
  "Midori_Halo.png", "Mika_Halo.png", "Miku_Halo.png", "Mimori_Halo.png", "Mina_Halo.png", "Mine_Halo.png",
  "Minori_Halo.png", "Mirai_Halo.png", "Misaka_Mikoto_Halo.png", "Misaki_Halo.png", "Misuzu_Halo.png",
  "Miyako_Halo.png", "Miyo_Halo.png", "Miyu_Halo.png", "Moe_Halo.png", "Momiji_Halo.png", "Momoi_Halo.png",
  "Momoka_Halo.png", "Mutsuki_Halo.png", "Nagisa_Halo.png", "Nagusa_Halo.png", "Natsu_Halo.png", "Neru_Halo.png",
  "Niko_Halo.png", "Niya_Halo.png", "Noa_Halo.png", "Nodoka_Halo.png", "Nonomi_Halo.png", "Nozomi_Halo.png",
  "Otogi_Halo.png", "Pina_Halo.png", "Plana_Halo.png", "Rabu_Halo.png", "Reijo_Halo.png", "Reisa_Halo.png",
  "Rena_Halo.png", "Rin_Halo.png", "Rio_Halo.png", "Ritsu_Halo.png", "Rumi_Halo.png", "Saki_Halo.png",
  "Sakurako_Halo.png", "Saori_Halo.png", "Saten_Ruiko_Halo.png", "Satsuki_Halo.png", "Saya_Halo.png",
  "Seia_Halo.png", "Sena_Halo.png", "Serika_Halo.png", "Serina_Halo.png", "Shigure_Halo.png", "Shimiko_Halo.png",
  "Shinon_Halo.png", "Shiroko_Halo.png", "Shiroko_Terror_Halo.png", "Shizuko_Halo.png", "Shokuhou_Misaki_Halo.png",
  "Shun_Halo.png", "Shuro_Halo.png", "Sora_Halo.png", "Subaru_Halo.png", "Sumire_Halo.png", "Sumomo_Halo.png",
  "Suzumi_Halo.png", "Takane_Halo.png", "Tiphareth_Halo.png", "Toki_Halo.png", "Tomoe_Halo.png",
  "Tsubaki_Halo.png", "Tsubasa_Halo.png", "Tsukuyo_Halo.png", "Tsumugi_Halo.png", "Tsurugi_Halo.png",
  "Ui_Halo.png", "Umika_Halo.png", "Utaha_Halo.png", "Wakamo_Halo.png", "Yakumo_Halo.png", "Yesod_Halo.png",
  "Yoshimi_Halo.png", "Yukino_Halo.png", "Yuuka_Halo.png", "Yuzu_Halo.png"
];

// Helper to map a student to their halo file
const findHaloForStudent = (student) => {
  if (!student) return null;
  const pathName = (student.PathName || student.pathName || '').toLowerCase();
  const devName = (student.DevName || student.devName || '').toLowerCase();

  const baseParts = pathName.split('_');
  const baseName = baseParts[0];

  if (baseName === 'ako' || devName === 'ako') return 'Ako_Halo.png';
  if (baseName === 'aris' || devName === 'aris') return 'Alice_Halo.png';
  if (baseName === 'hatsune' || devName === 'hatsune_miku') return 'Miku_Halo.png';
  if (baseName === 'hifumi' || devName === 'hifumi') return 'Hifumi_Halo.png';
  if (pathName === 'misaka_mikoto' || devName === 'misaka_mikoto') return 'Misaka_Mikoto_Halo.png';
  if (pathName === 'shokuhou_misaki' || devName === 'shokuhou_misaki') return 'Shokuhou_Misaki_Halo.png';
  if (pathName === 'saten_ruiko' || devName === 'saten_ruiko') return 'Saten_Ruiko_Halo.png';
  if (pathName === 'shiroko_terror' || devName === 'shiroko_terror') return 'Shiroko_Terror_Halo.png';
  if (pathName === 'arona' || devName === 'arona') return 'Arona_Halo.png';
  if (pathName === 'plana' || devName === 'plana') return 'Plana_Halo.png';

  for (const file of HALO_FILES) {
    const fNormalized = file
      .replace('_Halo.png', '')
      .replace('_Angered', '')
      .replace('_Happy', '')
      .replace('_Motivated', '')
      .replace('_Sad', '')
      .replace('_Shocked', '')
      .toLowerCase();

    if (fNormalized === baseName || fNormalized === devName || fNormalized === pathName) {
      return file;
    }
  }
  return null;
};

// Reusable translations
const CLUB_TRANSLATIONS = {
  'Kohshinjo68': 'Problem Solver 68 (สารพัดรับจ้าง 68)',
  'Veritas': 'Veritas (เวริทัส)',
  'Countermeasures': 'Foreclosure Task Force (คณะกรรมการแผนงาน)',
  'CleanAndClearing': 'C&C (คลีน แอนด์ เคลียริ่ง)',
  'TrainingClub': 'Athletics Training Club (ชมรมฝึกร่างกาย)',
  'PublicSafety': 'Public Safety Bureau (สำนักงานความปลอดภัยสาธารณะ)',
  'GameDevelopment': 'Game Development Department (ชมรมพัฒนาเกม)',
  'Heiri': 'Library Committee (ชมรมห้องสมุด)',
  'TrinityVigilance': 'Justice Task Force (คณะกรรมการรักษาระเบียบวินัย)',
  'Sisterhood': 'Sisterhood (สมาคมซิสเตอร์)',
  'TeaParty': 'Tea Party (ทีปาร์ตี้)',
  'RemedialClass': 'Remedial Class Club (ชมรมชั้นเรียนเสริม)',
  'GourmetClub': 'Gourmet Research Society (สมาคมวิจัยอาหารเลิศรส)',
  'EmergencyMedicine': 'Remedial Knights (อัศวินบรรเทาสาธารณภัย)',
  'SchoolLunch': 'School Lunch Club (ชมรมจัดเตรียมอาหาร)',
  'PrefectTeam': 'Prefect Team (คณะกรรมการวินัย)',
  'MatsuriManagement': 'Festival Operations Committee (คณะกรรมการจัดงานเทศกาล)',
  'InnerDiscipline': 'Inner Discipline Club (ชมรมฝึกฝนตนเอง)',
  'Hyakkyodeng': 'Hyakkyodeng (เฮียคคะเรียวรัน)',
  'NinjustuResearch': 'Ninjutsu Research Club (ชมรมวิจัยนินจูตสึ)',
  'RedWinterSecretariat': 'Red Winter Secretariat (สำนักงานเลขาธิการ)',
  'ValkyriePolice': 'Public Safety Bureau (กองรักษาความปลอดภัยแผนกครองตน)',
  'RabbitSquad': 'RABBIT Squad (หน่วยกระต่าย)',
  'LaborParty': 'Labor Party (พรรคแรงงาน)',
  'KnowledgeLiberation': 'Knowledge Liberation Front (แนวร่วมปลดแอกความรู้)',
  'Highlander': 'Highlander (รถไฟไฮแลนเดอร์)',
  'WildHunt': 'Wild Hunt (สถาบันไวลด์ฮันต์)',
  'Onmyodo': 'Yin-Yang Club (ชมรมองเมียวโด)',
  'SPTF': 'SPTF (กองบัญชาการรับมือสิ่งลี้ลับ)',
  'Executive': 'Student Council (สภานักเรียน)',
};

const getTacticRoleLabel = (role) => {
  if (role === 'DamageDealer') return 'Attacker (ตัวทำดาเมจ)'
  if (role === 'Tanker') return 'Tanker (แทงก์)'
  if (role === 'Healer') return 'Healer (ตัวฮีล)'
  if (role === 'Supporter') return 'Support (ซัพพอร์ต)'
  if (role === 'Vehicle') return 'T.S. (พาหนะทางยุทธวิธี)'
  return role || 'N/A'
};

const getBulletLabel = (type) => {
  if (type === 'Explosion') return 'Explosion (ระเบิด)'
  if (type === 'Pierce') return 'Pierce (ทะลวง)'
  if (type === 'Mystic') return 'Mystic (ลึกลับ)'
  if (type === 'Sonic') return 'Sonic (สั่นสะเทือน)'
  return 'Normal (ปกติ)'
};

const getArmorLabel = (type) => {
  if (type === 'LightArmor') return 'Light (เบา)'
  if (type === 'HeavyArmor') return 'Heavy (หนัก)'
  if (type === 'Unarmed') return 'Special (พิเศษ)'
  if (type === 'ElasticArmor') return 'Elastic (ยืดหยุ่น)'
  return 'Normal (ปกติ)'
};



const formatAge = (age) => {
  if (!age) return 'N/A';
  const clean = age.replace(/[^0-9]/g, '');
  if (clean) return `${clean} ปี (Years)`;
  return age;
};

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

const formatBirthday = (birthDayStr) => {
  if (!birthDayStr) return 'N/A';
  const parts = birthDayStr.split('/');
  if (parts.length === 2) {
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    if (month >= 1 && month <= 12 && !isNaN(day)) {
      return `${day} ${MONTHS_EN[month - 1]} (${day} ${MONTHS_TH[month - 1]})`;
    }
  }
  return birthDayStr;
};

const getPositionLabel = (pos) => {
  if (pos === 'Front') return 'Front (หน้า)';
  if (pos === 'Middle') return 'Middle (กลาง)';
  if (pos === 'Back') return 'Back (หลัง)';
  return pos || 'N/A';
};

const getWeaponTypeLabel = (wep) => {
  if (!wep) return 'N/A';
  const wepMap = {
    'HG': 'HG (Handgun / ปืนพก)',
    'SMG': 'SMG (Submachine Gun / ปืนกลมือ)',
    'AR': 'AR (Assault Rifle / ปืนเล็กยาวจู่โจม)',
    'SR': 'SR (Sniper Rifle / ปืนไรเฟิลซุ่มยิง)',
    'RG': 'RG (Railgun / ปืนเรลกัน)',
    'MG': 'MG (Machine Gun / ปืนกลเบา)',
    'SG': 'SG (Shotgun / ปืนลูกซอง)',
    'GL': 'GL (Grenade Launcher / เครื่องยิงลูกระเบิด)',
    'RL': 'RL (Rocket Launcher / เครื่องยิงจรวด)',
    'FT': 'FT (Flamethrower / เครื่องพ่นไฟ)',
    'MT': 'MT (Mortar / ปืน ค.)'
  };
  return wepMap[wep] || wep;
};

export default function SkillGuesser({ soundEnabled = true, onBack }) {
  // Database & Load States
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [fadeLoading, setFadeLoading] = useState(true)

  // Game Mode States: 'practice'
  const [mode, setMode] = useState('practice')

  // Gameplay Target & Variables
  const [currentTarget, setCurrentTarget] = useState(null) // { student, haloFile, gear, combat, personal }
  const [previousTargets, setPreviousTargets] = useState([])
  const [guesses, setGuesses] = useState([])
  const [solved, setSolved] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [defeat, setDefeat] = useState(false)
  
  // Cost & Clue States
  const [cost, setCost] = useState(GAME_COSTS.STARTING_COST)
  const [blurLevel, setBlurLevel] = useState(4) // 4 (25px), 3 (15px), 2 (8px), 1 (3px), 0 (0px)
  const [isSilhouette, setIsSilhouette] = useState(true)
  const [unlockedClues, setUnlockedClues] = useState({
    halo: false,
    weapon: false,
    gear: false,
    combat: false,
    personal: false
  })

  // UI styling state
  const [bgStyle, setBgStyle] = useState('slate')

  // Autocomplete focus ref
  const autocompleteRef = useRef(null)
  const nextRoundTimeoutRef = useRef(null)



  // Play Sound Synth Beeps
  const playBeep = (type) => {
    if (!soundEnabled) return
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
        gain.gain.setValueAtTime(0.08, ctx.currentTime)
        osc.start()
        osc.stop(ctx.currentTime + 0.08)
        
        setTimeout(() => {
          const osc2 = ctx.createOscillator()
          const gain2 = ctx.createGain()
          osc2.connect(gain2)
          gain2.connect(ctx.destination)
          osc2.frequency.setValueAtTime(659.25, ctx.currentTime) // E5
          gain2.gain.setValueAtTime(0.08, ctx.currentTime)
          osc2.start()
          osc2.stop(ctx.currentTime + 0.12)
        }, 80)
      } else if (type === 'failure') {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(150, ctx.currentTime)
        gain.gain.setValueAtTime(0.08, ctx.currentTime)
        osc.start()
        osc.stop(ctx.currentTime + 0.25)
      } else if (type === 'action') {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(600, ctx.currentTime)
        gain.gain.setValueAtTime(0.03, ctx.currentTime)
        osc.start()
        osc.stop(ctx.currentTime + 0.05)
      } else if (type === 'victory') {
        const notes = [261.63, 329.63, 392.00, 523.25]
        notes.forEach((freq, idx) => {
          setTimeout(() => {
            const oscV = ctx.createOscillator()
            const gainV = ctx.createGain()
            oscV.connect(gainV)
            gainV.connect(ctx.destination)
            oscV.frequency.value = freq
            gainV.gain.setValueAtTime(0.06, ctx.currentTime)
            gainV.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5)
            oscV.start()
            oscV.stop(ctx.currentTime + 0.5)
          }, idx * 100)
        })
      } else if (type === 'gameover') {
        const notes = [392, 349.23, 311.13, 261.63]
        notes.forEach((f, i) => {
          setTimeout(() => {
            const oscG = ctx.createOscillator()
            const gainG = ctx.createGain()
            oscG.connect(gainG)
            gainG.connect(ctx.destination)
            oscG.frequency.value = f
            gainG.gain.setValueAtTime(0.06, ctx.currentTime)
            oscG.start()
            oscG.stop(ctx.currentTime + 0.3)
          }, i * 150)
        })
      }
    } catch (e) {
      console.warn("Audio Context error:", e)
    }
  }

  // Load students data on mount
  useEffect(() => {
    async function loadData() {
      const startTime = Date.now()
      try {
        // Fetch students minified
        const resStudents = await fetch('/jp_data/students.min.json')
        const dataStudents = await resStudents.json()

        const list = []
        for (const id in dataStudents) {
          const s = dataStudents[id]
          if (s.IsReleased && s.IsReleased[0]) {
            const haloFile = findHaloForStudent(s)
            if (haloFile && s.WeaponImg) {
              list.push({
                id: s.Id,
                name: s.Name,
                devName: s.DevName,
                pathName: s.PathName,
                englishName: getEnglishName(s.PathName, s.DevName),
                school: s.School,
                club: s.Club || '',
                squadType: s.SquadType,
                bulletType: s.BulletType,
                armorType: s.ArmorType,
                tacticRole: s.TacticRole,
                starGrade: s.StarGrade,
                schoolYear: s.SchoolYear || '',
                characterAge: s.CharacterAge || '',
                charHeightMetric: s.CharHeightMetric || '',
                birthday: s.Birthday || '',
                birthdaySlash: s.BirthDay || '',
                weaponType: s.WeaponType || '',
                position: s.Position || '',
                hobby: s.Hobby || '',
                characterVoice: s.CharacterVoice || '',
                illustrator: s.Illustrator || '',
                weaponImg: s.WeaponImg || '',
                gear: s.Gear || null
              })
            }
          }
        }
        setStudents(list)
        selectNextTarget(list, null, [])

        const elapsed = Date.now() - startTime
        const delay = Math.max(0, 300 - elapsed)
        setTimeout(() => {
          setFadeLoading(false)
          setTimeout(() => {
            setLoading(false)
          }, 300)
        }, delay)
      } catch (err) {
        console.error("Failed to load Hint Guesser data:", err)
        setFadeLoading(false)
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Cleanup back action on unmount
  useEffect(() => {
    return () => {
      if (nextRoundTimeoutRef.current) clearTimeout(nextRoundTimeoutRef.current)
    }
  }, [])

  // Select next random target
  const selectNextTarget = (studentsPool = students, itemsPool = null, currentUsed = previousTargets, nextCost = GAME_COSTS.STARTING_COST) => {
    if (nextRoundTimeoutRef.current) clearTimeout(nextRoundTimeoutRef.current)
    if (studentsPool.length === 0) return

    let available = studentsPool.filter(s => !currentUsed.includes(s.id))
    if (available.length === 0) {
      available = studentsPool
      setPreviousTargets([])
    }

    const randomStudent = available[Math.floor(Math.random() * available.length)]
    const haloFile = findHaloForStudent(randomStudent)

    // Check if student has Unique Gear AND a matching gear icon image
    const studentGear = randomStudent.gear
    const hasGear = studentGear && studentGear.Released && studentGear.Released.some(r => r === true)
    const hasGearIcon = GEAR_ICON_IDS.has(randomStudent.id)
    const gearData = (hasGear && hasGearIcon) ? {
      name: studentGear.Name || 'Unknown Gear',
      hasImage: true
    } : null

    setCurrentTarget({
      student: randomStudent,
      haloFile,
      gear: gearData,
      combat: [
        { label: 'โรงเรียน (School)', value: randomStudent.school },
        { label: 'ชมรม (Club)', value: CLUB_TRANSLATIONS[randomStudent.club] || randomStudent.club || 'ไม่มี' },
        { label: 'ประเภทหน่วย (Squad)', value: randomStudent.squadType === 'Main' ? 'STRIKER' : 'SPECIAL' },
        { label: 'บทบาทรบ (Role)', value: getTacticRoleLabel(randomStudent.tacticRole) },
        { label: 'ประเภทโจมตี (Bullet)', value: getBulletLabel(randomStudent.bulletType) },
        { label: 'ประเภทป้องกัน (Armor)', value: getArmorLabel(randomStudent.armorType) },
      ],
      personal: [
        { label: 'อายุ (Age)', value: formatAge(randomStudent.characterAge) },
        { label: 'ส่วนสูง (Height)', value: randomStudent.charHeightMetric || 'N/A' },
        { label: 'วันเกิด (Birthday)', value: formatBirthday(randomStudent.birthdaySlash) },
        { label: 'ตำแหน่งยืน (Position)', value: getPositionLabel(randomStudent.position) },
        { label: 'ประเภทปืน (Weapon Type)', value: getWeaponTypeLabel(randomStudent.weaponType) },
        { label: 'ผู้วาด (Illustrator)', value: randomStudent.illustrator || 'N/A' },
      ]
    })

    setGuesses([])
    setSolved(false)
    setIsRevealed(false)
    setDefeat(false)
    setCost(nextCost)
    setBlurLevel(4)
    setIsSilhouette(true)
    setUnlockedClues({
      halo: false,
      weapon: false,
      gear: false,
      combat: false,
      personal: false
    })

    setTimeout(() => {
      if (autocompleteRef.current) {
        autocompleteRef.current.focus()
      }
    }, 50)
  }
  // Spend Cost Helper
  const spendCost = (amount, skipDefeatCheck = false) => {
    const nextCost = Math.max(0, cost - amount)
    setCost(nextCost)
    
    // Play Click Sound
    playBeep('action')

    // If cost falls below minimum guess cost and not solved, it's a defeat
    if (!skipDefeatCheck && nextCost < GAME_COSTS.SUBMIT_GUESS && !solved) {
      setDefeat(true)
      playBeep('gameover')
    }
    return nextCost
  }

  // Clue Buy Operations
  const handleDecreaseBlur = () => {
    if (solved || defeat || blurLevel === 0) return
    if (cost < GAME_COSTS.DECREASE_BLUR) return
    
    spendCost(GAME_COSTS.DECREASE_BLUR)
    setBlurLevel(prev => prev - 1)
  }

  const handleRestoreColor = () => {
    if (solved || defeat || !isSilhouette) return
    if (cost < GAME_COSTS.RESTORE_COLOR) return

    spendCost(GAME_COSTS.RESTORE_COLOR)
    setIsSilhouette(false)
  }

  const handleRevealClue = (type, requiredCost) => {
    if (solved || defeat || unlockedClues[type]) return
    if (cost < requiredCost) return

    spendCost(requiredCost)
    setUnlockedClues(prev => ({
      ...prev,
      [type]: true
    }))
  }

  // Guess Selection
  const handleGuess = (guessedStudent) => {
    if (solved || defeat || !currentTarget) return
    if (cost < GAME_COSTS.SUBMIT_GUESS) return

    const isCorrect = guessedStudent.id === currentTarget.student.id

    // Deduct Cost immediately upon any guess submission via spendCost helper
    // Use skipDefeatCheck=true so we can handle defeat ourselves (only on incorrect guesses)
    const nextCost = spendCost(GAME_COSTS.SUBMIT_GUESS, true)

    if (isCorrect) {
      // CORRECT GUESS!
      setSolved(true)
      playBeep('victory')
      nextRoundTimeoutRef.current = setTimeout(() => {
        handleNextPractice()
      }, 1500)
    } else {
      // INCORRECT GUESS
      playBeep('failure')
      
      const updatedGuesses = [...guesses, guessedStudent]
      setGuesses(updatedGuesses)

      // Check defeat after incorrect guess — if cost too low to make another guess
      if (nextCost < GAME_COSTS.SUBMIT_GUESS) {
        setDefeat(true)
        playBeep('gameover')
      }
    }
  }

  // Practice Mode next target
  const handleNextPractice = () => {
    setIsTransitioning(true)
    const newUsed = [...previousTargets, currentTarget.student.id]
    setPreviousTargets(newUsed)
    selectNextTarget(students, null, newUsed, Math.min(GAME_COSTS.MAX_COST, cost + GAME_COSTS.ROUND_BONUS_COST))
  }

  // Practice Mode skip target
  const handleSkipPractice = () => {
    setIsTransitioning(true)
    selectNextTarget(students, null, previousTargets)
  }

  const handleImageLoad = () => {
    setIsTransitioning(false)
  }

  // Give Up / Reveal target (Practice only)
  const handleRevealAnswer = () => {
    if (mode !== 'practice' || solved || defeat) return
    setSolved(true)
    setIsRevealed(true)
    playBeep('failure')
  }

  // Map blurLevel value to px
  const getBlurPx = () => {
    if (blurLevel === 4) return '25px'
    if (blurLevel === 3) return '15px'
    if (blurLevel === 2) return '8px'
    if (blurLevel === 1) return '3px'
    return '0px'
  }

  if (loading) {
    return <LoadingScreen fadeLoading={fadeLoading} />
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="halo-guesser-container font-prompt"
    >
      
      {currentTarget && (
        <div className="halo-gameplay-layout animate-fadeInUp">
          
          {/* HUD Header */}
          <div className="halo-gameplay-header" style={{ marginBottom: '16px' }}>
            <div className="gameplay-title-area">
              <span 
                className="gameplay-badge practice-mode" 
                style={{ backgroundColor: 'rgba(76, 154, 224, 0.1)', color: 'var(--color-accent)', borderColor: 'rgba(76, 154, 224, 0.2)', borderWidth: '1px' }}
              >
                PRACTICE MODE (เล่นชิลๆ)
              </span>
              <button onClick={onBack} className="gameplay-exit-btn">
                กลับหน้าหลัก
              </button>
            </div>
          </div>

          {/* EX Cost segments bar (Cyan neon style) */}
          <div className="glass-panel" style={{ padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', background: 'rgba(13, 14, 18, 0.8)', borderColor: 'rgba(76, 154, 224, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="profile-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-accent)' }}>
                <Sparkles className="w-3.5 h-3.5" /> TACTICAL EX COST BUFFER
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--color-accent)', letterSpacing: '0.05em' }}>{cost}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ 10 COST</span>
              </div>
            </div>
            
            {/* Horizontal cost rectangles */}
            <div style={{ display: 'flex', gap: '6px', width: '100%', height: '20px' }}>
              {Array.from({ length: GAME_COSTS.MAX_COST }).map((_, idx) => {
                const isActive = idx < cost
                let segmentColor = 'rgba(255, 255, 255, 0.05)'
                let segmentBorder = 'rgba(255, 255, 255, 0.08)'
                
                if (isActive) {
                  segmentColor = cost >= 3 ? 'var(--color-accent)' : '#ef4444'
                  segmentBorder = cost >= 3 ? 'var(--color-accent)' : '#f87171'
                }

                return (
                  <div 
                    key={idx}
                    style={{
                      flex: 1,
                      backgroundColor: segmentColor,
                      border: `1px solid ${segmentBorder}`,
                      borderRadius: '4px',
                      transition: 'all 0.3s ease',
                      boxShadow: isActive ? `0 0 8px ${segmentColor}` : 'none'
                    }}
                  />
                )
              })}
            </div>
            {cost < GAME_COSTS.SUBMIT_GUESS && !solved && (
              <span className="text-xs text-rose-500 font-bold" style={{ textAlign: 'center', marginTop: '4px' }}>
                ⚠️ Cost เหลือไม่พอสำหรับทายชื่อนักเรียนแล้ว! (ต้องการ {GAME_COSTS.SUBMIT_GUESS} Cost)
              </span>
            )}
          </div>

          {/* Gameplay columns */}
          <div className="halo-gameplay-workspace">
            
            {/* Left column - Avatar Display */}
            <div className="halo-card-wrapper" style={{ borderColor: 'rgba(76, 154, 224, 0.3)' }}>
              <div className="halo-contrast-controls">
                <button 
                  onClick={() => setBgStyle('slate')} 
                  className={`contrast-btn ${bgStyle === 'slate' ? 'active' : ''}`}
                  style={bgStyle === 'slate' ? { backgroundColor: 'var(--color-accent)' } : {}}
                >
                  Slate
                </button>
                <button 
                  onClick={() => setBgStyle('chess')} 
                  className={`contrast-btn ${bgStyle === 'chess' ? 'active' : ''}`}
                  style={bgStyle === 'chess' ? { backgroundColor: 'var(--color-accent)' } : {}}
                >
                  Grid
                </button>
                <button 
                  onClick={() => setBgStyle('light')} 
                  className={`contrast-btn ${bgStyle === 'light' ? 'active' : ''}`}
                  style={bgStyle === 'light' ? { backgroundColor: 'var(--color-accent)' } : {}}
                >
                  Light
                </button>
              </div>

              <div className={`halo-graphic-viewport bg-style-${bgStyle}`} style={{ height: '300px' }}>
                <SecureImage
                  src={`/images/student/icon/${currentTarget.student.id}.webp`}
                  alt="Target Student Silhouette"
                  className="mystery-halo-image"
                  onLoad={handleImageLoad}
                  isSilhouette={!solved && !defeat && isSilhouette}
                  blurPx={(!solved && !defeat) ? getBlurPx() : '0px'}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                  style={{
                    width: '260px',
                    height: '260px',
                    borderRadius: '24px',
                    objectFit: 'cover',
                    filter: `brightness(${(!solved && !defeat && isSilhouette) ? 0 : 1}) blur(${(!solved && !defeat) ? getBlurPx() : '0px'})`,
                    opacity: isTransitioning ? 0 : 1,
                    transition: isTransitioning ? 'none' : 'filter 0.4s ease, opacity 0.25s ease',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    WebkitUserDrag: 'none'
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/schoolicon/ETC.png';
                    setIsTransitioning(false);
                  }}
                />

                {/* Animated Scanner Scanline */}
                {(blurLevel > 0 || isSilhouette) && !solved && (
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '4px',
                    background: 'linear-gradient(to right, transparent, #00e5ff, transparent)',
                    boxShadow: '0 0 8px #00e5ff',
                    animation: 'scanline-anim 2s linear infinite',
                    top: 0
                  }} />
                )}

                {/* Style tag for scanline animation keyframe */}
                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes scanline-anim {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                  }
                `}} />

                {/* Solved Overlay banner */}
                <AnimatePresence>
                  {solved && !isTransitioning && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="halo-viewport-solved-overlay"
                      style={isRevealed ? { background: 'rgba(28, 28, 30, 0.85)', borderColor: 'rgba(255, 255, 255, 0.15)' } : {}}
                    >
                      <Sparkles className="solved-sparkle-icon" style={isRevealed ? { color: '#8e8e93' } : { color: 'var(--color-accent)' }} />
                      <span>{isRevealed ? 'REVEALED!' : 'IDENTIFIED!'}</span>
                      
                      <motion.div 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="solved-target-profile-card"
                        style={{ borderLeftColor: isRevealed ? '#8e8e93' : 'var(--color-accent)' }}
                      >
                        <img
                          src={`/images/student/icon/${currentTarget.student.id}.webp`}
                          alt={currentTarget.student.englishName}
                          className="solved-profile-avatar"
                        />
                        <div className="solved-profile-details">
                          <h3>{currentTarget.student.englishName}</h3>
                          <p>โรงเรียน (School): {currentTarget.student.school}</p>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Defeat Overlay banner */}
                <AnimatePresence>
                  {defeat && !solved && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="halo-viewport-solved-overlay" 
                      style={{ backgroundColor: 'rgba(28, 10, 10, 0.8)' }}
                    >
                      <AlertTriangle className="solved-sparkle-icon text-rose-500" />
                      <span className="text-rose-500">TACTICAL DEFEAT</span>
                      <p className="text-slate-300 text-xs mt-1">Cost พลังงานหมดลงก่อนค้นพบคำตอบ</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Unlocked Visual Clues (Halo, Weapon, Gear) directly under image viewport */}
              <AnimatePresence>
                {(unlockedClues.halo || unlockedClues.weapon || unlockedClues.gear) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    style={{ display: 'flex', justifyContent: 'center', gap: '12px', padding: '10px', background: 'rgba(0,0,0,0.25)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', marginTop: '4px' }}
                  >
                    {unlockedClues.halo && currentTarget.haloFile && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }} title="ฮาโลนักเรียน">
                        <span style={{ fontSize: '0.55rem', fontWeight: '700', color: '#00e5ff' }}>HALO</span>
                        <div style={{ width: '54px', height: '54px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                          <SecureImage 
                            src={`/images/halos/${currentTarget.haloFile}`} 
                            alt="Halo clue" 
                            draggable={false}
                            onDragStart={(e) => e.preventDefault()}
                            onContextMenu={(e) => e.preventDefault()}
                            style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none', WebkitUserDrag: 'none' }}
                          />
                        </div>
                      </div>
                    )}
                    {unlockedClues.weapon && currentTarget.student.weaponImg && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }} title="อาวุธ">
                        <span style={{ fontSize: '0.55rem', fontWeight: '700', color: '#00e5ff' }}>WEAPON</span>
                        <div style={{ width: '54px', height: '54px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                          <SecureImage 
                            src={`/images/weapon/${currentTarget.student.weaponImg}.webp`} 
                            alt="Weapon clue" 
                            draggable={false}
                            onDragStart={(e) => e.preventDefault()}
                            onContextMenu={(e) => e.preventDefault()}
                            style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none', WebkitUserDrag: 'none' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/images/schoolicon/ETC.png';
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {unlockedClues.gear && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }} title={currentTarget.gear ? currentTarget.gear.name : 'ไม่มี Unique Gear'}>
                        <span style={{ fontSize: '0.55rem', fontWeight: '700', color: '#00e5ff' }}>GEAR</span>
                        <div style={{ width: '54px', height: '54px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                          {currentTarget.gear ? (
                            <SecureImage 
                              src={`/images/gear/icon/${currentTarget.student.id}.webp`} 
                              alt="Gear clue" 
                              draggable={false}
                              onDragStart={(e) => e.preventDefault()}
                              onContextMenu={(e) => e.preventDefault()}
                              style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none', WebkitUserDrag: 'none' }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/images/schoolicon/ETC.png';
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: '0.55rem', color: '#94a3b8', textAlign: 'center' }}>ไม่มี</span>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status information tags */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>ความเบลอภาพ: <strong style={{ color: blurLevel === 0 ? '#10b981' : '#f59e0b' }}>Lv. {blurLevel} ({getBlurPx()})</strong></span>
                <span>โหมด Silhouette: <strong style={{ color: isSilhouette ? '#f43f5e' : '#10b981' }}>{isSilhouette ? 'ถมดำ 🕶️' : 'เปิดสี 🎨'}</strong></span>
              </div>
            </div>

            {/* Right column - Tactical Clues & Autocomplete Input */}
            <div className="halo-guesser-section">
              
              {/* Clue Shop Grid */}
              <div className="glass-panel" style={{ padding: '16px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span className="profile-label" style={{ color: 'var(--text-secondary)' }}>TACTICAL SUPPORT (ตัวช่วยสุ่มปลดล็อคเบาะแส)</span>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  
                  {/* Action 1: Decrease blur */}
                  <button 
                    disabled={solved || defeat || blurLevel === 0 || cost < GAME_COSTS.DECREASE_BLUR}
                    onClick={handleDecreaseBlur}
                    className="contrast-btn"
                    style={{
                      height: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 12px',
                      borderColor: blurLevel === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(6, 182, 212, 0.2)'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Eye className="w-4 h-4 text-cyan-400" /> ลดความเบลอ
                    </span>
                    <span style={{ padding: '2px 6px', background: 'rgba(6, 182, 212, 0.15)', borderRadius: '99px', fontSize: '0.65rem', color: '#00e5ff', fontWeight: '800' }}>
                      -{GAME_COSTS.DECREASE_BLUR} COST
                    </span>
                  </button>

                  {/* Action 2: Silhouette */}
                  <button 
                    disabled={solved || defeat || !isSilhouette || cost < GAME_COSTS.RESTORE_COLOR}
                    onClick={handleRestoreColor}
                    className="contrast-btn"
                    style={{
                      height: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 12px',
                      borderColor: !isSilhouette ? 'rgba(255,255,255,0.05)' : 'rgba(6, 182, 212, 0.2)'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <EyeOff className="w-4 h-4 text-cyan-400" /> ยกเลิกเงาดำ
                    </span>
                    <span style={{ padding: '2px 6px', background: 'rgba(6, 182, 212, 0.15)', borderRadius: '99px', fontSize: '0.65rem', color: '#00e5ff', fontWeight: '800' }}>
                      -{GAME_COSTS.RESTORE_COLOR} COST
                    </span>
                  </button>

                  {/* Action 3: Reveal Halo */}
                  <button 
                    disabled={solved || defeat || unlockedClues.halo || cost < GAME_COSTS.REVEAL_HALO}
                    onClick={() => handleRevealClue('halo', GAME_COSTS.REVEAL_HALO)}
                    className="contrast-btn"
                    style={{
                      height: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 12px',
                      borderColor: unlockedClues.halo ? 'rgba(255,255,255,0.05)' : 'rgba(6, 182, 212, 0.2)'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles className="w-4 h-4 text-cyan-400" /> วิเคราะห์ฮาโล
                    </span>
                    <span style={{ padding: '2px 6px', background: 'rgba(6, 182, 212, 0.15)', borderRadius: '99px', fontSize: '0.65rem', color: '#00e5ff', fontWeight: '800' }}>
                      -{GAME_COSTS.REVEAL_HALO} COST
                    </span>
                  </button>

                  {/* Action 4: Reveal Weapon */}
                  <button 
                    disabled={solved || defeat || unlockedClues.weapon || cost < GAME_COSTS.REVEAL_WEAPON}
                    onClick={() => handleRevealClue('weapon', GAME_COSTS.REVEAL_WEAPON)}
                    className="contrast-btn"
                    style={{
                      height: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 12px',
                      borderColor: unlockedClues.weapon ? 'rgba(255,255,255,0.05)' : 'rgba(6, 182, 212, 0.2)'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Swords className="w-4 h-4 text-cyan-400" /> ตรวจสอบอาวุธ
                    </span>
                    <span style={{ padding: '2px 6px', background: 'rgba(6, 182, 212, 0.15)', borderRadius: '99px', fontSize: '0.65rem', color: '#00e5ff', fontWeight: '800' }}>
                      -{GAME_COSTS.REVEAL_WEAPON} COST
                    </span>
                  </button>

                  {/* Action 5: Reveal Unique Gear */}
                  <button 
                    disabled={solved || defeat || unlockedClues.gear || cost < GAME_COSTS.REVEAL_GEAR}
                    onClick={() => handleRevealClue('gear', GAME_COSTS.REVEAL_GEAR)}
                    className="contrast-btn"
                    style={{
                      height: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 12px',
                      borderColor: unlockedClues.gear ? 'rgba(255,255,255,0.05)' : 'rgba(6, 182, 212, 0.2)'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Settings className="w-4 h-4 text-cyan-400" /> ของรัก
                    </span>
                    <span style={{ padding: '2px 6px', background: 'rgba(6, 182, 212, 0.15)', borderRadius: '99px', fontSize: '0.65rem', color: '#00e5ff', fontWeight: '800' }}>
                      -{GAME_COSTS.REVEAL_GEAR} COST
                    </span>
                  </button>

                  {/* Action 6: Combat profile */}
                  <button 
                    disabled={solved || defeat || unlockedClues.combat || cost < GAME_COSTS.REVEAL_COMBAT}
                    onClick={() => handleRevealClue('combat', GAME_COSTS.REVEAL_COMBAT)}
                    className="contrast-btn"
                    style={{
                      height: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 12px',
                      borderColor: unlockedClues.combat ? 'rgba(255,255,255,0.05)' : 'rgba(6, 182, 212, 0.2)'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Shield className="w-4 h-4 text-cyan-400" /> ข้อมูลประวัติรบ
                    </span>
                    <span style={{ padding: '2px 6px', background: 'rgba(6, 182, 212, 0.15)', borderRadius: '99px', fontSize: '0.65rem', color: '#00e5ff', fontWeight: '800' }}>
                      -{GAME_COSTS.REVEAL_COMBAT} COST
                    </span>
                  </button>

                  {/* Action 7: Personal profile */}
                  <button 
                    disabled={solved || defeat || unlockedClues.personal || cost < GAME_COSTS.REVEAL_PERSONAL}
                    onClick={() => handleRevealClue('personal', GAME_COSTS.REVEAL_PERSONAL)}
                    className="contrast-btn"
                    style={{
                      height: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 12px',
                      borderColor: unlockedClues.personal ? 'rgba(255,255,255,0.05)' : 'rgba(76, 154, 224, 0.2)',
                      gridColumn: 'span 2'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User className="w-4 h-4" style={{ color: 'var(--color-accent)' }} /> ข้อมูลประวัติส่วนตัว (วันเกิด/ตำแหน่ง/ปืน/Illustrator)
                    </span>
                    <span style={{ padding: '2px 6px', background: 'rgba(76, 154, 224, 0.15)', borderRadius: '99px', fontSize: '0.65rem', color: 'var(--color-accent)', fontWeight: '800' }}>
                      -{GAME_COSTS.REVEAL_PERSONAL} COST
                    </span>
                  </button>

                </div>
              </div>

              {/* Autocomplete Input Card */}
              <div className="halo-input-container">
                <AnimatePresence mode="wait">
                  {solved || defeat ? (
                    /* Victory or Defeat message */
                    <motion.div 
                      key="status-banner"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}
                    >
                      {solved ? (
                        isRevealed ? (
                          <div className="solved-banner" style={{ margin: 0, width: '100%', boxSizing: 'border-box', background: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                            <div className="solved-banner-text">
                              <span className="solved-banner-tag revealed" style={{ background: '#f59e0b', color: '#0c0c0e' }}>REVEALED</span>
                              <h3>เฉลยคำตอบ: <strong style={{ color: '#f59e0b' }}>{currentTarget.student.englishName}</strong></h3>
                            </div>
                          </div>
                        ) : (
                          <div className="solved-banner" style={{ margin: 0, width: '100%', boxSizing: 'border-box', borderColor: 'var(--color-accent)', background: 'rgba(76, 154, 224, 0.08)' }}>
                            <div className="solved-banner-text">
                              <span className="solved-banner-tag won" style={{ background: 'var(--color-accent)' }}>IDENTIFIED</span>
                              <h3>ทายถูกต้อง! คำตอบคือ: <strong style={{ color: 'var(--color-accent)' }}>{currentTarget.student.englishName}</strong></h3>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="solved-banner" style={{ margin: 0, width: '100%', boxSizing: 'border-box', background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                          <div className="solved-banner-text">
                            <span className="solved-banner-tag revealed" style={{ background: '#ef4444' }}>FAILED</span>
                            <h3>ตัวละครเป้าหมายคือ: <strong style={{ color: '#ef4444' }}>{currentTarget.student.englishName}</strong></h3>
                          </div>
                        </div>
                      )}
                      
                      {mode === 'practice' && (
                        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                          <button onClick={handleNextPractice} className="practice-next-btn" style={{ flex: 1, height: '42px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--color-accent)' }}>
                            เล่นรอบถัดไป <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    /* Active Input box */
                    <motion.div 
                      key="active-input"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
                    >
                      <span className="guesser-input-title" style={{ color: 'var(--color-accent)' }}>ระบุชื่อนักเรียนที่ต้องสงสัย (การส่งทายจะหัก 4 Cost)</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <Autocomplete
                            ref={autocompleteRef}
                            suggestions={students}
                            onSelect={handleGuess}
                            guessedIds={guesses.map(g => g.id)}
                            placeholder="ค้นหาชื่อ เช่น Aru, Shiroko, Hina..."
                          />
                        </div>
                        
                        {mode === 'practice' && (
                          <>
                            <button onClick={handleRevealAnswer} className="gameplay-reveal-btn" style={{ height: '45px', backgroundColor: 'var(--color-accent)', color: '#fff' }}>
                              เฉลย
                            </button>
                            <button onClick={handleSkipPractice} className="gameplay-skip-btn" style={{ height: '45px', borderColor: 'rgba(76, 154, 224, 0.4)' }} title="เปลี่ยนโจทย์">
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>

          {/* Unlocked Clues Display Panel */}
          <AnimatePresence>
            {(unlockedClues.halo || unlockedClues.weapon || unlockedClues.gear || unlockedClues.combat || unlockedClues.personal) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="glass-panel" 
                style={{ padding: '18px', borderRadius: '20px', marginTop: '20px', background: 'rgba(13, 14, 18, 0.75)' }}
              >
                <h4 className="logs-header-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00e5ff' }}>
                  <BookOpen className="w-4 h-4" /> DECLASSIFIED TACTICAL DOSSIER (แฟ้มประวัติเบาะแสที่ปลดล็อคแล้ว)
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                  
                  {/* Visual Clues Row */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                    {/* Halo Clue */}
                    {unlockedClues.halo && currentTarget.haloFile && (
                      <div className="glass-panel" style={{ padding: '10px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.02)' }}>
                        <span className="profile-label">😇 HALO</span>
                        <SecureImage 
                          src={`/images/halos/${currentTarget.haloFile}`} 
                          alt="Halo clue" 
                          draggable={false}
                          onDragStart={(e) => e.preventDefault()}
                          onContextMenu={(e) => e.preventDefault()}
                          style={{ width: '42px', height: '42px', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none', WebkitUserDrag: 'none' }}
                        />
                      </div>
                    )}

                    {/* Weapon Clue */}
                    {unlockedClues.weapon && currentTarget.student.weaponImg && (
                      <div className="glass-panel" style={{ padding: '10px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.02)' }}>
                        <span className="profile-label">🔫 WEAPON</span>
                        <SecureImage 
                          src={`/images/weapon/${currentTarget.student.weaponImg}.webp`} 
                          alt="Weapon clue" 
                          draggable={false}
                          onDragStart={(e) => e.preventDefault()}
                          onContextMenu={(e) => e.preventDefault()}
                          style={{ width: '42px', height: '42px', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none', WebkitUserDrag: 'none' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/schoolicon/ETC.png';
                          }}
                        />
                        <span className="text-xs font-bold text-slate-300">
                          {currentTarget.student.weaponType}
                        </span>
                      </div>
                    )}

                    {/* Gear Clue */}
                    {unlockedClues.gear && (
                      <div className="glass-panel" style={{ padding: '10px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.02)' }}>
                        <span className="profile-label">
                          ⚙️ UNIQUE GEAR
                        </span>
                        {currentTarget.gear ? (
                          <>
                            <SecureImage 
                              src={`/images/gear/icon/${currentTarget.student.id}.webp`} 
                              alt="Gear Icon clue" 
                              draggable={false}
                              onDragStart={(e) => e.preventDefault()}
                              onContextMenu={(e) => e.preventDefault()}
                              style={{ width: '42px', height: '42px', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none', WebkitUserDrag: 'none' }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/images/schoolicon/ETC.png';
                              }}
                            />
                            <span className="text-xs text-slate-300 font-bold">
                              {currentTarget.gear.name}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 font-bold">
                            ไม่มี Unique Gear สำหรับนักเรียนคนนี้
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Info Profiles Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    
                    {/* Combat Stats clue */}
                    {unlockedClues.combat && (
                      <div className="glass-panel" style={{ padding: '12px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.02)', borderColor: 'rgba(6, 182, 212, 0.1)' }}>
                        <span className="profile-label" style={{ color: '#06b6d4', marginBottom: '8px', display: 'block' }}>🛡️ COMBAT RECORD (ประวัติฝึกซ้อมรบ)</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {currentTarget.combat.map((item, index) => (
                            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '3px' }}>
                              <span className="text-slate-400">{item.label}</span>
                              <span className="text-slate-200 font-bold">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Personal details clue */}
                    {unlockedClues.personal && (
                      <div className="glass-panel" style={{ padding: '12px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.02)', borderColor: 'rgba(6, 182, 212, 0.1)' }}>
                        <span className="profile-label" style={{ color: '#06b6d4', marginBottom: '8px', display: 'block' }}>📝 STUDENT BIO (ข้อมูลส่วนบุคคล)</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {currentTarget.personal.map((item, index) => (
                            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '3px' }}>
                              <span className="text-slate-400">{item.label}</span>
                              <span className="text-slate-200 font-bold" style={{ maxWidth: '180px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', textAlign: 'right' }} title={item.value}>
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Incorrect Guesses History Log */}
          <AnimatePresence>
            {guesses.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="halo-guess-logs-container" 
                style={{ marginTop: '20px', minHeight: 'auto' }}
              >
                <h4 className="logs-header-title">HISTORY OF UNSUCCESSFUL TARGET ESTIMATES (ประวัติทายผิดพลาด)</h4>
                
                <div className="logs-scroll-area" style={{ maxHeight: '150px' }}>
                  <AnimatePresence initial={false}>
                    {guesses.map((g, idx) => (
                      <motion.div 
                        key={`${g.id}-${idx}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className="guess-log-row incorrect" 
                        style={{ padding: '6px 12px' }}
                      >
                        <div className="log-student-info">
                          <img
                            src={`/images/student/icon/${g.id}.webp`}
                            alt={g.englishName}
                            className="log-student-avatar"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/images/schoolicon/ETC.png';
                            }}
                          />
                          <span className="log-student-name">{g.englishName}</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {g.school}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      )}

    </motion.div>
  )
}

