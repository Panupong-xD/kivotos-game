import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  RotateCcw, 
  Sparkles, 
  Lightbulb, 
  Eye, 
  Check, 
  X, 
  AlertCircle
} from 'lucide-react';
import Autocomplete from '../components/Autocomplete.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';
import './BlueArchiveEmojiGame.css';

const swuToken = import.meta.env.VITE_SWU_API_KEY || '';
const swuUserId = import.meta.env.VITE_SWU_USER_ID || '';

// Sound effects using Web Audio API
const playSound = (type, soundEnabled) => {
  if (!soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'victory') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
      gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.08);
      osc2.start(ctx.currentTime + 0.08);
      osc2.stop(ctx.currentTime + 0.16);

      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
      gain3.gain.setValueAtTime(0.10, ctx.currentTime + 0.16);
      osc3.start(ctx.currentTime + 0.16);
      osc3.stop(ctx.currentTime + 0.35);
    } else if (type === 'failure') {
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    console.warn('Audio play failed', e);
  }
};

// Offline database with 13 high-quality emoji/symbol puzzles
const fallbackPuzzles = [
  {
    targetName: "Aikiyo Fuuka",
    puzzle: "✦ + 🏫 + 😈 + 🎒 + 🛞 + 🍳 ➔ 🍱",
    hint_1: "นักเรียนสถาบันเกเฮนน่า สมาชิกชมรมโภชนาการ (School Lunch Club) ผู้มีฝีมือทำอาหารระดับสุดยอดแต่ต้องรับภาระดูแลสมาชิกร่วมสถาบันตลอดเวลา",
    hint_2: "มักจะตกเป็นเหยื่อของการโดนอุ้มลักพาตัวโดยสมาชิกชมรมวิจัยของหวาน เพื่อพาตัวไปทำอาหารกลางวันให้พวกเธออยู่เสมอ",
    explanation: "ปีศาจ 😈 และ 🏫 สื่อถึงสถาบันเกเฮนน่า, 🍳 และ 🍱 สื่อถึงบทบาทในชมรมโภชนาการที่ทำอาหารกลางวัน, 🛞 สื่อถึงล้อรถยนต์ที่สื่อถึงรถทำอาหารของเธอที่มักโดนแฮกหรือโดนอุ้มลักพาตัวไป"
  },
  {
    targetName: "Sunaookami Shiroko",
    puzzle: "❖ + 🏫 + 🎒 + 🥷 + 🏦 ➔ 🔫",
    hint_1: "นักเรียนผมเทาหูสัตว์ผู้เงียบขรึมและใจเย็นแห่งสถาบันอบีดอส ชื่นชอบการออกกำลังกายและทำกิจกรรมกลางแจ้ง",
    hint_2: "เมื่อเผชิญหน้ากับวิกฤตการเงินของสถาบัน เธอมักเสนอวิธีแก้ปัญหาแบบสุดโต่ง เช่น 'การปล้นธนาคาร' มีวลีติดปากคือ 'อืมมม...'",
    explanation: "หน้ากากไหมพรม 🥷 และ ธนาคาร 🏦 สื่อถึงแผนการปล้นธนาคารของเธอ, ปืน 🔫 สื่อถึงอาวุธประจำตัว, 🎒 สื่อถึงกระเป๋าเป้ที่เป็นเอกลักษณ์ และ 🏫 สื่อถึงโรงเรียนอบีดอส"
  },
  {
    targetName: "Misono Mika",
    puzzle: "✦ + 👑 + 🦍 + 🍰 + 🪶 ➔ 🥐",
    hint_1: "หนึ่งในสมาชิกสภาน้ำชาแห่งทรีนิตี้ มีปีกสีขาวและมีรสนิยมชื่นชอบสิ่งของดีไซน์น่ารักแฝงลวดลายดวงดาว",
    hint_2: "ผู้มีสมญานามจากแฟนๆ ว่า 'กอริลล่า' เนื่องจากพลังโจมตีที่รุนแรง เคยโดนทำโทษโดยการถูกยัดโรลเค้กเข้าปาก",
    explanation: "มงกุฎ 👑 สื่อถึงฐานะสภาน้ำชา, ปีก/ขนนก 🪶 สื่อถึงปีกของเธอ, 🍰 สื่อถึงโรลเค้ก และ 🦍 สื่อถึงฉายาพละกำลังกอริลล่าของเธอ"
  },
  {
    targetName: "Sorasaki Hina",
    puzzle: "✦ + 😈 + 💜 + 🛏️ + ✍️ ➔ 🏢",
    hint_1: "หัวหน้าคณะกรรมการวินัยแห่งเกเฮนน่าผู้ทำงานหนัก เป็นที่พึ่งพาและเคารพรักของสมาชิกในคณะกรรมการวินัยทุกคน",
    hint_2: "มักจะตรากตรำสะสางงานเอกสารของคณะกรรมการวินัยจนเหนื่อยล้าแทบไม่ได้นอน และแอบแสดงมุมออดอ้อนเฉพาะกับเซนเซ",
    explanation: "ปีศาจ 😈 และ 💜 สื่อถึงเกเฮนน่าและลักษณะเดวิลของสถาบัน, 🛏️ สื่อถึงการขาดนอนเพราะภาระหน้าที่, ✍️ สื่อถึงงานเอกสารวินัย"
  },
  {
    targetName: "Takanashi Hoshino",
    puzzle: "❖ + 🏫 + 🛡️ + 😴 + 🐳 ➔ 💤",
    hint_1: "นักเรียนรุ่นพี่สถาบันอบีดอสผู้มีท่าทางขี้เกียจ เฉื่อยชา และชอบหาที่นอนงีบผ่อนคลายตลอดทั้งวัน",
    hint_2: "ชอบเรียกแทนตัวเองว่า 'คุณลุง' รักสัตว์ทะเลและปลาวาฬมาก แต่เบื้องหลังมีความทรงจำอันขมขื่นในอดีตที่เก็บซ่อนไว้",
    explanation: "โล่ 🛡️ สื่อถึงปืนลูกซองพร้อมโล่กำบังเหล็ก, 😴/💤 สื่อถึงความชอบนอนงีบ, 🐳 สื่อถึงพิพิธภัณฑ์สัตว์น้ำและสัตว์ทะเลที่เธอชอบ"
  },
  {
    targetName: "Rikuhachima Aru",
    puzzle: "🧥 + 💸 + 💢 + 📯 + 🦉 ➔ 😈",
    hint_1: "ประธานหน่วยรับจ้างสารพัด (Problem Solver 68) แห่งเกเฮนน่า ผู้ตั้งเป้าหมายอยากเป็น 'วายร้ายที่ไร้ปรานี'",
    hint_2: "ถึงจะพยายามทำตัวเท่และเยือกเย็นแค่ไหน แต่สุดท้ายก็มักจะเด๋อด๋าโดนหลอกจนเสียเงิน และชอบโชว์หน้าเหวอที่เป็นมีมโด่งดัง",
    explanation: "เสื้อโค้ต 🧥 สื่อถึงมาดหัวหน้างาน, 💸 สื่อถึงการใช้เงินผิดพลาดจนกระเป๋าแบน, 💢 สื่อถึงการเป็นตัวร้ายจอมเปิ่นที่แผนล้มเหลวเสมอ"
  },
  {
    targetName: "Hayase Yuuka",
    puzzle: "✦ + 💻 + 📊 + 🧮 + 🦵 ➔ 📈",
    hint_1: "เหรัญญิกของสภานักเรียนเซมินาร์ (Seminar) แห่งสถาบันมิลเลเนียม คอยบ่นเรื่องการจัดสรรงบประมาณอย่างเข้มงวด",
    hint_2: "ได้รับสมญานามว่า 'เครื่องคิดเลขเดินได้' มักโดนแฟนเกมล้อเลียนเรื่องต้นขาที่ดูหนาหนั่น และชอบแอบวัดน้ำหนักตัวอย่างสม่ำเสมอ",
    explanation: "แล็ปท็อป 💻 และเครื่องคิดเลข 🧮 สื่อถึงการคำนวณเงิน, 📊 สื่อถึงงบประมาณของสโมสรนักเรียน, 🦵 สื่อถึงมีมต้นขาหนาอันเป็นเอกลักษณ์ของเธอ"
  },
  {
    targetName: "Tendou Aris",
    puzzle: "✦ + 🎮 + 🤖 + ⚔️ + ☄️ ➔ 👾",
    hint_1: "เด็กสาวลึกลับที่ถูกพบในซากปรักหักพัง ได้รับความช่วยเหลือและกลายมาเป็นสมาชิกชมรมพัฒนาเกมแห่งมิลเลเนียม",
    hint_2: "คลั่งไคล้เกมแนวสวมบทบาท (RPG) มากจนนำคำศัพท์ในเกมมาใช้ในบทสนทนาประจำวัน ถือปืนใหญ่รางแม่เหล็กขนาดมหึมาเป็นอาวุธ",
    explanation: "เครื่องเกม 🎮 และเอเลี่ยน 👾 สื่อถึงชมรมพัฒนาเกม, 🤖 สื่อถึงการเป็นแอนดรอยด์ AL-1S, ☄️/⚔️ สื่อถึงการแปลงปืนใหญ่เรลกันเป็นดาบยักษ์แบบผู้กล้า"
  },
  {
    targetName: "Ajitani Hifumi",
    puzzle: "✦ + 🏫 + 🎒 + 🪶 + 🐥 ➔ 👑",
    hint_1: "นักเรียนสถาบันทรีนิตี้ผู้มีบุคลิกอ่อนโยนและรักความสงบสุข เป็นหนึ่งในสมาชิกชมรมฝึกฝนเสริมสร้างทักษะ (Supplementary Lessons Department)",
    hint_2: "เป็นแฟนตัวยงของมาสคอตเปโรโร่ (Peroro) และมีอีกตัวตนลับๆ คือ 'หน้ากากฟาอุสท์' หัวหน้าแก๊งสวมหน้ากากปล้นธนาคารที่สวมถุงกระดาษ",
    explanation: "ลูกเจี๊ยบ 🐥 สื่อถึงความคลั่งไคล้เปโรโร่, 🎒 สื่อถึงกระเป๋านักเรียน, 👑 สื่อถึงการเป็นผู้นำแก๊งปล้นธนาคารสวมหน้ากากกระดาษ (Faust)"
  },
  {
    targetName: "Mikamo Neru",
    puzzle: "✦ + 🧥 + 💢 + 😡 + 🍭 ➔ 🥊",
    hint_1: "หัวหน้ากลุ่มสายลับเมด C&C แห่งมิลเลเนียม ที่มักสวมเสื้อแจ็กเก็ตคลุมไหล่ทับชุดเมดดูน่าเกรงขาม",
    hint_2: "มีนิสัยใจร้อน ขี้โมโห อารมณ์ฉุนเฉียวง่าย แต่จริงๆ แล้วเป็นคนอ่อนโยนต่อคนรอบข้าง และชอบอมอมยิ้มตลอดเวลา",
    explanation: "เสื้อคลุมเมด 🧥 สื่อถึง C&C, 💢/😡 สื่อถึงความขี้โมโหใจร้อน, 🍭 สื่อถึงอมยิ้มที่พกติดตัวเป็นนิสัย"
  },
  {
    targetName: "Ichinose Asuna",
    puzzle: "✦ + 🧹 + 👗 + 🐶 + 🎰 ➔ 🌟",
    hint_1: "สมาชิกหน่วยเมดสายลับ C&C แห่งมิลเลเนียมผู้มีผมสีทองยาวสลวยและมีสไตล์การทำงานที่สนุกสนานตามสัญชาตญาณ",
    hint_2: "เป็นผู้ครอบครอง 'โชคชะตาเหนือธรรมชาติ' มักจะเดาทางตู้เกมหรือการเสี่ยงดวงถูกเสมอ มีบุคลิกคล้ายสุนัขโกลเด้นที่ร่าเริงกระโดดโลดเต้น",
    explanation: "อุปกรณ์เมด 🧹/👗 สื่อถึง C&C, 🎰/🌟 สื่อถึงดวงเสี่ยงโชคระดับเทพเจ้า, 🐶 สื่อถึงบุคลิกไฮเปอร์น่ารักคล้ายสุนัขโกลเด้น"
  },
  {
    targetName: "Shimoe Koharu",
    puzzle: "✦ + ✟ + 👼 + 👙 + 🔞 ➔ 💢",
    hint_1: "นักเรียนสถาบันทรีนิตี้ผู้มีนิสัยปากไม่ตรงกับใจ (ซึนเดเระ) มักแสดงท่าทีขัดเขินเมื่อพูดถึงเรื่องโรแมนติกหรือลามก",
    hint_2: "แอบเก็บหนังสือลามกและนิตยสารติดเรตไว้ใต้เตียงอย่างลับๆ มักตะโกนใส่คนอื่นว่า 'ประหาร!' หรือ 'คนลามก!' เมื่อทำตัวไม่ถูก",
    explanation: "สัญลักษณ์นางฟ้า 👼 และกางเขน ✟ สื่อถึงสถาบันทรีนิตี้, ชุดว่ายน้ำ/ติดเรท 👙/🔞 สื่อถึงความสนใจลับๆ ของเธอที่มักคิดลึกปะปนกับความขัดเขิน 💢"
  },
  {
    targetName: "Kuda Izuna",
    puzzle: "✦ + 🦊 + 🥷 + 📜 + 🪵 ➔ 💨",
    hint_1: "นักเรียนแห่งสถาบันเฮียคคิยาโคผู้มุ่งมั่นศึกษาเล่าเรียนวิชานินจาอย่างสุดความสามารถในชมรมวิจัยศิลปะนินจา",
    hint_2: "เรียกเซนเซว่า 'นายท่าน' (Lord) ด้วยความเคารพรักอย่างสูง มีความฝันอยากเป็นนินจาอันดับหนึ่ง และมีหูจิ้งจอกที่แสดงอารมณ์ได้ชัดเจน",
    explanation: "จิ้งจอก 🦊 สื่อถึงหูและหางของเธอ, 🥷/📜 สื่อถึงวิชานินจาคาถา, 🪵/💨 สื่อถึงคาถาสลับตัวด้วยท่อนไม้ของนินจา"
  }
];

export default function BlueArchiveEmojiGame({ soundEnabled = true, onBack }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetStudent, setTargetStudent] = useState(null);
  const [puzzleData, setPuzzleData] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [gameStatus, setGameStatus] = useState('idle'); // 'idle', 'loading', 'playing', 'won', 'revealed'
  const [revealedHints, setRevealedHints] = useState([]); // ['hint_1', 'hint_2']
  const [isGenerating, setIsGenerating] = useState(false);
  const [playedIds, setPlayedIds] = useState([]);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', text: '' }
  const [isMute, setIsMute] = useState(!soundEnabled);
  const [isAiMode, setIsAiMode] = useState(false);

  const autocompleteRef = useRef(null);

  // Load student databases
  useEffect(() => {
    async function loadData() {
      try {
        const [studentsRes, storyRes] = await Promise.all([
          fetch('/jp_data/students.min.json').then(r => r.ok ? r.json() : {}).catch(() => ({})),
          fetch('/jp_data/story_characters_info.json').then(r => r.ok ? r.json() : {}).catch(() => ({}))
        ]);

        const studentsData = studentsRes || {};
        const storyData = storyRes || {};
        
        const studentsEntries = Object.values(studentsData);
        const list = [];

        for (const charName in storyData) {
          const char = storyData[charName];

          // Match with playable student data
          let studentMatch = studentsEntries.find(s => s.Name === char.NameJp || s.Name === char.Name);
          if (!studentMatch && char.NameEn) {
            const storyEn = char.NameEn.toLowerCase();
            const storyWords = storyEn.split(/\s+/).map(w => w.replace(/[^a-z0-9]/g, ''));
            
            // Filter all potential matches
            const potentialMatches = studentsEntries.filter(s => {
              const sPath = s.PathName ? s.PathName.toLowerCase() : '';
              const sDev = s.DevName ? s.DevName.toLowerCase() : '';
              
              // Handle Hifumi/Hihumi spelling mismatch specifically
              if (storyWords.includes('hifumi') && (sPath === 'hifumi' || sDev === 'hihumi')) {
                return true;
              }
              
              // Exact word match
              if (sPath && storyWords.includes(sPath)) return true;
              if (sDev && storyWords.includes(sDev)) return true;
              
              // Full name match (normalized)
              const normStory = storyEn.replace(/[^a-z0-9]/g, '');
              const normPath = sPath.replace(/[^a-z0-9]/g, '');
              const normDev = sDev.replace(/[^a-z0-9]/g, '');
              if (normStory === normPath || normStory === normDev) return true;
              
              return false;
            });
            
            if (potentialMatches.length > 0) {
              potentialMatches.sort((a, b) => {
                const aLen = a.PathName ? a.PathName.length : 999;
                const bLen = b.PathName ? b.PathName.length : 999;
                return aLen - bLen;
              });
              studentMatch = potentialMatches[0];
            }
          }

          let iconPath = char.IconLocalPath || '';
          if (iconPath.startsWith('.')) {
            iconPath = iconPath.substring(1);
          }

          list.push({
            id: charName, // Use the unique story character key as ID to guarantee no key collisions
            studentId: studentMatch?.Id || null,
            name: char.NameJp || char.Name || charName,
            devName: char.NameEn || charName,
            englishName: char.NameEn || charName,
            school: char.School || 'ETC',
            club: char.Club || '',
            schoolTh: char.SchoolTh || 'คิโวทอส',
            clubTh: char.ClubTh || char.Club || '',
            age: char.Age || '',
            birthday: char.Birthday || '',
            height: char.Height || '',
            voiceActor: char.VoiceActor || '',
            description: char.DescriptionEn || char.Description || '',
            icon: iconPath,
            defaultOrder: studentMatch?.DefaultOrder !== undefined ? studentMatch.DefaultOrder : 9999
          });
        }

        // Sort students
        list.sort((a, b) => {
          if (a.defaultOrder !== b.defaultOrder) {
            return a.defaultOrder - b.defaultOrder;
          }
          return a.englishName.localeCompare(b.englishName);
        });

        setStudents(list);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load character databases for Emoji Game:', err);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // We do not initialize a round automatically anymore on mount to allow landing screen to show first

  const startNewRound = async () => {
    if (students.length === 0) return;
    
    setGameStatus('loading');
    setIsGenerating(true);
    setGuesses([]);
    setRevealedHints([]);
    setFeedback(null);

    // Pick an unplayed student
    const unplayed = students.filter(s => !playedIds.includes(s.id));
    const pool = unplayed.length > 0 ? unplayed : students;
    const selected = pool[Math.floor(Math.random() * pool.length)];

    // Add to played list
    setPlayedIds(prev => {
      const next = [...prev, selected.id];
      if (next.length >= students.length) return [selected.id]; // reset if all played
      return next;
    });

    setTargetStudent(selected);

    // Check if SWU AI details exist
    const hasAiCredentials = swuToken && swuUserId;

    if (hasAiCredentials) {
      try {
        const response = await fetch('https://swuai.swu.ac.th/swu/api/service/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${swuToken}`
          },
          body: JSON.stringify({
            user_id: swuUserId,
            model: 'google/gemini-2.5-flash',
            tools: [{ google_search: {} }],
            content: `
You are an expert game designer and a hardcore fan (Sensei) of the mobile game "Blue Archive". Your task is to generate a character guessing puzzle called "Blue Archive Emoji & Symbol Quiz".

We have selected a specific student for this round from our local database:
- Name: "${selected.englishName}"
- School: "${selected.school}" (Thai: "${selected.schoolTh}")
- Club: "${selected.club}" (Thai: "${selected.clubTh}")
- Biography/Lore: "${selected.description}"

For this student, you must generate a puzzle that represents them using a clever combination of:
1. Standard Unicode Emojis (e.g., 😭, 🎒, 🔫, 👑, 🦍)
2. Keyboard Symbols, Punctuation, and Special Characters (e.g., ✦, ✟, 🜏, 💢, ❖, ➔, +, 🧪) to mimic the character's unique Halo shape, club traits, weapon types, or story memes.

CRITICAL RULES:
- Do NOT use plain text alphabet letters to spell out the student's name or hints in the puzzle (do NOT use letters like A, B, C, or words). The puzzle should consist ONLY of emojis, math/special symbols, and operators (like +, ➔).
- The combination must accurately reflect the student's characteristics based on the provided lore.
- Provide a progressive hint system:
  - hint_1: A subtle hint in Thai describing their personality, clubs they belong to, general quirks, or how they act in the stories.
    * CRITICAL CONSTRAINT: You MUST NOT include any personal details (such as age, birthday, height, voice actor) or gameplay-specific parameters (such as roles: striker, special, dealer, support, defender, healer, positions, combat types, bullet types, armor types). Focus strictly on story, personality, and lore relationships.
  - hint_2: A dead-giveaway meme, signature quote, or highly specific storyline relationship/event they are famous for in the community.
    * CRITICAL CONSTRAINT: You MUST NOT include any personal details (age, height, birthday) or gameplay-specific parameters (role, class, stats). Focus strictly on story, memes, and lore.
- Provide an explanation in Thai of why these symbols were chosen.
  * CRITICAL GROUNDING RULE FOR EXPLANATIONS: Do NOT hallucinate or make up false facts about school logos, emblems, or student traits. For example, Gehenna Academy does NOT have a gear in its logo (Millennium is the technology school associated with calculations/gears/science). Ensure your symbol choices and explanations are 100% accurate to the official Blue Archive lore, their specific weapons, clubs, and real community memes.

Response MUST be a valid JSON object with this exact schema:
{
  "puzzle": "string", // the emoji & symbol puzzle, e.g. "❖ + 🏫 + 🎒 + 🥷 + 🏦 ➔ 🔫"
  "hint_1": "string", // subtle hint in Thai
  "hint_2": "string", // dead-giveaway meme/lore hint in Thai
  "explanation": "string" // explanation in Thai of why these symbols were chosen
}
`
          })
        });

        if (!response.ok) throw new Error('SWU AI API response error');
        const data = await response.json();
        
        const rawText = data.content || data.response || data.reply || data.result || data.choices?.[0]?.message?.content || data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) throw new Error('Empty AI response');

        const cleanJsonText = rawText.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanJsonText);

        if (parsed.puzzle && parsed.hint_1 && parsed.hint_2 && parsed.explanation) {
          // Verify no plain alphabetical text in puzzle to prevent easy giveaways
          const puzzleText = parsed.puzzle.replace(/[\s\+\-➔=]/g, '');
          const hasAlphabet = /[a-zA-Z]{2,}/.test(puzzleText);
          
          if (!hasAlphabet) {
            setPuzzleData(parsed);
            setIsAiMode(true);
            setGameStatus('playing');
            setIsGenerating(false);
            return;
          }
        }
        throw new Error('AI response validation failed or contained plain text names');
      } catch (err) {
        console.warn('AI puzzle generation failed or timed out. Falling back to local offline puzzles database.', err);
      }
    }

    // Offline database fallback
    // Find if the target has a pre-baked puzzle
    let fallback = fallbackPuzzles.find(f => f.targetName.toLowerCase() === selected.englishName.toLowerCase());
    
    // If not, pick a completely random fallback puzzle and sync the target student
    if (!fallback) {
      fallback = fallbackPuzzles[Math.floor(Math.random() * fallbackPuzzles.length)];
      const matchedStudent = students.find(s => s.englishName.toLowerCase() === fallback.targetName.toLowerCase());
      if (matchedStudent) {
        setTargetStudent(matchedStudent);
      }
    }

    setPuzzleData({
      puzzle: fallback.puzzle,
      hint_1: fallback.hint_1,
      hint_2: fallback.hint_2,
      explanation: fallback.explanation
    });
    setIsAiMode(false);
    setGameStatus('playing');
    setIsGenerating(false);
  };

  const handleGuess = (guessedStudent) => {
    if (gameStatus !== 'playing' || !targetStudent) return;

    // Prevent duplicate guesses
    if (guesses.some(g => g.id === guessedStudent.id)) {
      setFeedback({ type: 'error', text: 'คุณเคยทายนักเรียนคนนี้ไปแล้ว!' });
      return;
    }

    const nameMatch = guessedStudent.englishName.toLowerCase() === targetStudent.englishName.toLowerCase() ||
                      guessedStudent.name.toLowerCase() === targetStudent.name.toLowerCase();
    const isCorrect = guessedStudent.id === targetStudent.id || nameMatch;

    const newGuess = {
      id: guessedStudent.id,
      name: guessedStudent.name,
      englishName: guessedStudent.englishName,
      school: guessedStudent.school,
      icon: guessedStudent.icon,
      studentId: guessedStudent.studentId,
      isCorrect
    };

    const updatedGuesses = [newGuess, ...guesses];
    setGuesses(updatedGuesses);

    if (isCorrect) {
      setGameStatus('won');
      setRevealedHints(['hint_1', 'hint_2']); // unlock all hints on win
      setFeedback({ type: 'success', text: `ถูกต้อง! คำตอบคือ ${targetStudent.englishName}` });
      playSound('victory', !isMute);
    } else {
      setFeedback({ type: 'error', text: 'ยังไม่ใช่! ลองพิจารณาสัญลักษณ์อีกครั้งนะ' });
      playSound('failure', !isMute);
    }
  };

  const revealHint = (hintKey) => {
    if (revealedHints.includes(hintKey)) return;
    setRevealedHints(prev => [...prev, hintKey]);
    playSound('success', !isMute);
  };

  const handleRevealAnswer = () => {
    if (gameStatus !== 'playing') return;
    setGameStatus('revealed');
    setRevealedHints(['hint_1', 'hint_2']);
    playSound('failure', !isMute);
    setFeedback({ type: 'error', text: `เฉลยคำตอบหลัก: ${targetStudent.englishName}` });
  };

  const toggleMute = () => {
    setIsMute(!isMute);
  };

  const renderHeader = () => {
    return (
      <header className="emoji-game-header">
        <div className="emoji-game-navbar">
          <button onClick={onBack} className="emoji-game-btn-back" title="กลับไปที่หน้าแรก">
            <ArrowLeft className="w-4 h-4" />
            <span>ย้อนกลับ</span>
          </button>
          
          <div className="emoji-game-navbar-actions">
            <button onClick={toggleMute} className="emoji-game-btn-nav-icon" title={isMute ? "เปิดเสียง" : "ปิดเสียง"}>
              {isMute ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            {gameStatus !== 'idle' && (
              <button onClick={startNewRound} className="emoji-game-btn-nav-icon" title="สุ่มคำใหม่">
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="emoji-game-hero">
          <span className="emoji-game-tag">KIVOTOS ARCADE</span>
          <h2>Blue Archive Emoji & Symbol Quiz</h2>
          <p>ถอดรหัสความหมายจากสัญลักษณ์และอีโมจิประจำตัวของเหล่านักเรียน</p>
        </div>

        {gameStatus !== 'idle' && (
          <div className="emoji-game-stats-row">
            <span className="emoji-game-stat-pill">
              เดาแล้ว: <strong>{guesses.length}</strong> ครั้ง
            </span>
            <span className="emoji-game-stat-pill">
              คำใบ้ที่เปิด: <strong>{revealedHints.length} / 2</strong>
            </span>
            <span className={`emoji-game-stat-pill ${isAiMode ? 'cyan' : ''}`}>
              {isAiMode ? '🤖 AI Mode' : '💾 Offline Mode'}
            </span>
          </div>
        )}
      </header>
    );
  };

  if (loading) {
    return <LoadingScreen message="กำลังโหลดฐานข้อมูลนินจาและชมรม..." />;
  }

  if (gameStatus === 'idle') {
    return (
      <div className="emoji-game-container">
        {renderHeader()}
        <div className="emoji-game-puzzle-card landing">
          <div className="emoji-game-landing-icon-wrapper">
            <Sparkles className="emoji-game-landing-icon" />
          </div>
          <h3>ห้องปริศนาสัญลักษณ์ Kivotos</h3>
          <p>
            วิเคราะห์และทายชื่อนักเรียนจากสัญลักษณ์ประจำตัวและประวัติตามเนื้อเรื่องผ่านคำใบ้จาก AI
          </p>
          <div className="emoji-game-landing-actions">
            <button onClick={startNewRound} className="emoji-game-btn-primary">
              <Sparkles className="w-4 h-4" />
              เริ่มสุ่มคำใบ้และเล่นเกม
            </button>
            <button onClick={onBack} className="emoji-game-btn-secondary">
              กลับไปหน้าล็อบบี้
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="emoji-game-container">
      {renderHeader()}

      {/* Main Board */}
      {isGenerating ? (
        <div className="emoji-game-puzzle-card loading">
          <div className="apple-spinner-wrapper">
            <div className="apple-spinner"></div>
          </div>
          <p className="emoji-game-loading-text">
            กำลังวิเคราะห์ประวัติและจัดเตรียมชุดอีโมจิโดย AI...
          </p>
        </div>
      ) : (
        <div className={`emoji-game-puzzle-card ${gameStatus === 'won' ? 'won' : ''}`}>
          <div className="emoji-game-puzzle-display">
            {puzzleData?.puzzle}
          </div>
          <span className="emoji-game-puzzle-subtitle">
            ถอดรหัสคอมโบสัญลักษณ์เพื่อทายชื่อตัวละคร
          </span>
        </div>
      )}

      {/* Inputs Section */}
      {!isGenerating && gameStatus === 'playing' && (
        <div className="emoji-game-input-section">
          <div className="emoji-game-form">
            <div className="emoji-game-input-wrapper">
              <Autocomplete
                ref={autocompleteRef}
                suggestions={students}
                onSelect={handleGuess}
                guessedIds={guesses.map(g => g.id)}
                placeholder="พิมพ์ค้นหาชื่อนักเรียนเพื่อเดา..."
              />
            </div>
            
            <button 
              onClick={handleRevealAnswer}
              className="emoji-game-btn-secondary reveal-btn"
            >
              <Eye className="w-4 h-4" />
              ยอมแพ้
            </button>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`emoji-game-feedback ${feedback.type}`}
        >
          {feedback.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          <span>{feedback.text}</span>
        </motion.div>
      )}

      {/* Victory / Revealed Details */}
      {(gameStatus === 'won' || gameStatus === 'revealed') && targetStudent && puzzleData && (
        <div className={`emoji-game-victory-box ${gameStatus === 'won' ? 'won' : 'revealed'}`}>
          <h3 className="emoji-game-victory-title">
            {gameStatus === 'won' ? '🎉 ยินดีด้วยคุณตอบถูกแล้ว!' : '🔍 เฉลยปริศนา'}
          </h3>
          
          <div className="emoji-game-character-card">
            <img 
              src={targetStudent.icon || (targetStudent.studentId ? `/images/student/icon/${targetStudent.studentId}.webp` : '')}
              alt={targetStudent.englishName} 
              className="emoji-game-char-portrait"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/schoolicon/ETC.png';
              }}
            />
            <div className="emoji-game-char-details">
              <span className="emoji-game-char-name">{targetStudent.englishName}</span>
              <span className="emoji-game-char-katakana">{targetStudent.name}</span>
              <span className="emoji-game-char-school">{targetStudent.school} / {targetStudent.clubTh || targetStudent.club}</span>
              <p className="emoji-game-char-desc">{targetStudent.description}</p>
            </div>
          </div>

          <div className="emoji-game-explanation-section">
            <span className="emoji-game-explanation-title">
              💡 คำอธิบายความหมายสัญลักษณ์:
            </span>
            <p className="emoji-game-explanation-text">
              {puzzleData.explanation}
            </p>
          </div>

          <div className="emoji-game-victory-actions">
            <button onClick={startNewRound} className="emoji-game-btn-primary">
              <RotateCcw className="w-4 h-4" />
              เล่นรอบถัดไป
            </button>
          </div>
        </div>
      )}

      {/* Hints System */}
      {!isGenerating && (
        <div className="emoji-game-hints-container">
          <div className="emoji-game-hints-header-row">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="emoji-game-section-title">ระบบคำใบ้ตามลำดับ</span>
          </div>

          {/* Hint 1 */}
          <div className="emoji-game-hint-box">
            <div className="emoji-game-hint-header">
              <span className="emoji-game-hint-badge">คำใบ้ที่ 1 • ข้อมูลทั่วไป</span>
              {!revealedHints.includes('hint_1') && gameStatus === 'playing' && (
                <button onClick={() => revealHint('hint_1')} className="emoji-game-hint-btn">
                  แสดงคำใบ้
                </button>
              )}
            </div>
            {revealedHints.includes('hint_1') ? (
              <p className="emoji-game-hint-text">{puzzleData?.hint_1}</p>
            ) : (
              <p className="emoji-game-hint-placeholder">
                โรงเรียน, ชมรม, ชั้นปี หรือข้อมูลทั่วไปเบื้องต้น
              </p>
            )}
          </div>

          {/* Hint 2 */}
          <div className="emoji-game-hint-box">
            <div className="emoji-game-hint-header">
              <span className="emoji-game-hint-badge">คำใบ้ที่ 2 • วลีเด็ด / มีมเด่น</span>
              {!revealedHints.includes('hint_2') && gameStatus === 'playing' && (
                <button onClick={() => revealHint('hint_2')} className="emoji-game-hint-btn">
                  แสดงคำใบ้
                </button>
              )}
            </div>
            {revealedHints.includes('hint_2') ? (
              <p className="emoji-game-hint-text">{puzzleData?.hint_2}</p>
            ) : (
              <p className="emoji-game-hint-placeholder">
                มุกตลกประจำเป็นของคาแรกเตอร์, คำพูดติดปาก หรือเรื่องเด่นในกลุ่มชุมชนผู้เล่น
              </p>
            )}
          </div>
        </div>
      )}

      {/* History List */}
      {!isGenerating && guesses.length > 0 && (
        <div className="emoji-game-history">
          <span className="emoji-game-history-title">ประวัติการทายในรอบนี้ ({guesses.length})</span>
          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
            {guesses.map((guess, idx) => (
              <div key={idx} className="emoji-game-history-card">
                <img 
                  src={guess.icon || (guess.studentId ? `/images/student/icon/${guess.studentId}.webp` : '')}
                  alt={guess.englishName} 
                  style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/schoolicon/ETC.png';
                  }}
                />
                <span style={{ fontWeight: 600, flex: 1 }}>{guess.englishName} ({guess.name})</span>
                <span style={{ fontSize: '0.72rem', color: '#8e8e93', marginRight: '8px' }}>{guess.school}</span>
                {guess.isCorrect ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <X className="w-4 h-4 text-rose-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
