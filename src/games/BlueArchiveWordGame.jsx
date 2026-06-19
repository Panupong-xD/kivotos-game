import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { compareTwoStrings } from 'string-similarity';
import { 
  HelpCircle, 
  RotateCcw, 
  Send, 
  Sparkles, 
  Trophy, 
  Lightbulb, 
  Clipboard, 
  Check, 
  X,
  Compass,
  Eye,
  User,
  Users,
  AlertTriangle
} from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen.jsx';
import './BlueArchiveWordGame.css';

  // ตัวควบคุมสิทธิ์เรียกใช้ SWU AI API ผ่าน Environment Variables ของ Vite เท่านั้น
const swuToken = import.meta.env.VITE_SWU_API_KEY || '';
const swuUserId = import.meta.env.VITE_SWU_USER_ID || '';

// ตัวช่วยดึงเสียงเอฟเฟกต์เบื้องต้นโดยใช้ Web Audio API
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
      osc.stop(ctx.currentTime + 0.12);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);
      gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.12);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.24);

      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24);
      gain3.gain.setValueAtTime(0.10, ctx.currentTime + 0.24);
      osc3.start(ctx.currentTime + 0.24);
      osc3.stop(ctx.currentTime + 0.45);
    } else if (type === 'failure') {
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    console.warn('Audio play failed', e);
  }
};

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
};

/* ==========================================================================
   1. STATIC SECRET CHARACTERS LIST
   ========================================================================== */
// Club mapping helper to map internal club keys to official Thai name and synonyms
const getClubDetails = (clubKey, valTh) => {
  if (!clubKey) return { officialTh: '', synonyms: [] };
  const normalizedKey = clubKey.toLowerCase().replace(/\s+/g, '');
  
  // Custom overrides for Thai names if they are null, empty, or set to English IDs in database
  let officialTh = valTh || clubKey;
  if (officialTh === 'ParanormalAffairsDepartmentVeritas') {
    officialTh = 'ชมรมวิจัยสิ่งเหนือธรรมชาติเวริทัส';
  } else if (officialTh === 'TheSeminar') {
    officialTh = 'เซมิน่า';
  } else if (officialTh === 'C&C') {
    officialTh = 'ซีแอนด์ซี';
  } else if (officialTh === 'Anzenkyoku') {
    officialTh = 'แผนกความปลอดภัยสาธารณะ';
  } else if (officialTh === 'Koankyoku') {
    officialTh = 'แผนกความมั่นคงสาธารณะ';
  } else if (officialTh === 'SisterHood') {
    officialTh = 'ชมรมซิสเตอร์';
  }
  
  const synonymsSet = new Set();
  
  // Add original key and normalized key
  synonymsSet.add(clubKey.toLowerCase());
  synonymsSet.add(normalizedKey);
  
  // Add Thai official name
  synonymsSet.add(officialTh.toLowerCase());
  synonymsSet.add(officialTh.replace(/\s+/g, '').toLowerCase());
  
  // Map specific English names to synonyms
  const clubMapping = {
    foodservice: ['food service', 'school lunch club', 'lunch club', 'โภชนาการ', 'ชมรมโภชนาการ'],
    remedialclass: ['remedial class', 'makeup work club', 'เรียนเสริม', 'ชมรมชั้นเรียนเสริม', 'คลาสเรียนซ่อม'],
    gourmetclub: ['gourmet club', 'gourmet research society', 'gourmet research', 'ชิมอาหาร', 'ชมรมชิมอาหาร', 'วิจัยอาหาร'],
    paranormalaffairsdepartmentveritas: ['veritas', 'paranormal affairs department veritas', 'เวริทัส', 'ชมรมวิจัยสิ่งเหนือธรรมชาติ', 'ชมรมวิจัยสิ่งเหนือธรรมชาติเวริทัส'],
    cleannclearing: ['c&c', 'clean n clearing', 'clean and clearing', 'ซีแอนด์ซี', 'เมด', 'ชมรมเมด', 'แก๊งเมด'],
    gamedevelopment: ['game development department', 'game dev department', 'game dev', 'game development', 'พัฒนาเกม', 'ชมรมพัฒนาเกม'],
    justicerealization: ['justice realization committee', 'justice realization', 'jrc', 'ทวงความยุติธรรม', 'ชมรมทวงความยุติธรรม'],
    pandemoniumsociety: ['pandemonium society', 'pandemonium', 'แพนเดโมเนียม', 'สภามันฮัตตัน', 'สภาบริหารมันฮัตตัน'],
    prefectteam: ['prefect team', 'disciplinary committee', 'prefect', 'กรรมการวินัย', 'คณะกรรมการวินัย', 'สารวัตรนักเรียน'],
    sisterhood: ['sisterhood', 'sister', 'ซิสเตอร์', 'กลุ่มซิสเตอร์', 'ซิสเตอร์ฮูด', 'ชมรมซิสเตอร์'],
    librarycommittee: ['library committee', 'library club', 'อ่านหนังสือ', 'ชมรมอ่านหนังสือ', 'ห้องสมุด'],
    knighthospitaller: ['knight hospitaller', 'remedial knights', 'อัศวินบรรเทาทุกข์', 'ชมรมอัศวินบรรเทาทุกข์'],
    teaparty: ['tea party', 'ทีปาร์ตี้', 'สภาน้ำชา'],
    ariussquad: ['arius squad', 'arius', 'อาเรียส', 'สควอดของอาเรียส', 'อาเรียสสควอด'],
    rabbitsquad: ['rabbit squad', 'แร็บบิทสควอด', 'ทีมกระต่าย'],
    valkyriepolice: ['valkyrie police academy', 'valkyrie police', 'valkyrie', 'ตำรวจวาลคิรี', 'วาลคิรี'],
    redwintersecretary: ['red winter secretary', 'red winter office', 'เลขาธิการเรดวินเทอร์', 'สํานักงานเลขาธิการเรดวินเทอร์', 'เรดวินเทอร์'],
    innerdiscipline: ['inner discipline', 'ควบคุมวินัยลับ', 'คณะกรรมการควบคุมวินัยลับ'],
    engineering: ['engineering department', 'engineering club', 'วิศวกรรม', 'ชมรมวิศวกรรม'],
    theseminar: ['seminar', 'เซมิน่า', 'สภานักเรียนมิลเลเนียม'],
    trainingclub: ['athletics training club', 'training club', 'ฝึกร่างกาย', 'ชมรมฝึกซ้อมความแกร่ง'],
    ninjutsuresearch: ['ninjutsu research club', 'ninja research club', 'นินจา', 'ชมรมวิจัยศาสตร์นินจา', 'ชมรมวิจัยนินจา'],
    festivaloperations: ['festival operations department', 'festival organization committee', 'จัดงานเทศกาล', 'ชมรมจัดงานเทศกาล'],
    yinyangclub: ['yin yang club', 'yin-yang club', 'หยินหยาง', 'ชมรมหยินหยาง'],
    blacktortoisepromenade: ['black tortoise promenade', 'black tortoise', 'เทพเต่าดำ', 'ย่านการค้าเทพเต่าดำ', 'เก็นริวมอน'],
    genyaramen: ['genya ramen', 'ราเม็งเก็นยะ', 'ร้านราเม็งเก็นยะ'],
    hyakkyouran: ['hyakkyouran', 'เฮียกกะเรียวรัน', 'คณะไกล่เกลี่ยข้อพิพาท เฮียกกะเรียวรัน'],
    executivecommittee: ['executive committee', 'คณะกรรมการดำเนินการ'],
    publicworks: ['public works', 'หน่วยวิศวกรรมโยธา'],
    hotspringdevelopment: ['hot spring development department', 'hot spring development', 'พัฒนาบ่อน้ำร้อน', 'ชมรมพัฒนาบ่อน้ำร้อน'],
    emergencies: ['emergencies', 'emergencies department', 'แพทย์ฉุกเฉิน', 'หน่วยแพทย์ฉุกเฉิน'],
    sptf: ['super phenomenon task force', 'sptf', 'วิทยาศาสตร์พิเศษ', 'ชมรมวิทยาศาสตร์พิเศษ'],
    laborparty: ['labor party', 'พรรคแรงงาน'],
    knowledgeliberationfront: ['knowledge liberation front', 'แนวร่วมปลดปล่อยความรู้', 'ชมรมแนวร่วมปลดปล่อยความรู้'],
    broadcasting: ['broadcasting club', 'กระจายเสียง', 'ชมรมกระจายเสียง'],
    wildminds: ['wildminds', 'ชมรมป่าเถื่อน'],
    anzenkyoku: ['anzenkyoku', 'public safety bureau', 'community safety bureau', 'safety bureau', 'ฝ่ายรักษาความปลอดภัยสาธารณะ', 'แผนกความปลอดภัยสาธารณะ'],
    koankyoku: ['koankyoku', 'public security bureau', 'security bureau', 'ฝ่ายความมั่นคงสาธารณะ', 'แผนกความมั่นคงสาธารณะ', 'ความมั่นคงสาธารณะ']
  };

  const mappedSyns = clubMapping[normalizedKey];
  if (mappedSyns) {
    mappedSyns.forEach(s => {
      synonymsSet.add(s.toLowerCase());
      synonymsSet.add(s.replace(/\s+/g, '').toLowerCase());
    });
  }

  return {
    officialTh,
    synonyms: Array.from(synonymsSet)
  };
};

const SECRET_CHARACTERS_LIST = [
  { word: 'Mika', synonyms: ['mika', 'มิกะ', 'มิโซโนะ มิกะ', 'misono mika', 'มิโซโนะมิกะ', 'ยัยกอริลล่า'] },
  { word: 'Shiroko', synonyms: ['shiroko', 'ชิโรโกะ', 'สึนาโอะ ชิโรโกะ', 'sunao shiroko', 'คุโรโกะ', 'อนูบิส', 'anubis'] },
  { word: 'Hina', synonyms: ['hina', 'ฮินะ', 'โซราซากิ ฮินะ', 'sorasaki hina', 'หัวหน้ากรรมการวินัย'] },
  { word: 'Aru', synonyms: ['aru', 'อารุ', 'ริคุฮาจิมะ อารุ', 'rikuhajima aru', 'ท่านอารุ'] },
  { word: 'Yuuka', synonyms: ['yuuka', 'ยูคะ', 'ยูกะ', 'ฮายาเสะ ยูคะ', 'hayase yuuka', 'ฮายาเสะ ยูกะ', 'เครื่องคิดเลข'] },
  { word: 'Hoshino', synonyms: ['hoshino', 'โฮชิโนะ', 'ทากานาชิ โฮชิโนะ', 'takanashi hoshino', 'คุณลุง'] },
  { word: 'Arisu', synonyms: ['arisu', 'alice', 'อลิส', 'เทนโด อลิส', 'tendo alice', 'เท็นโด อลิส', 'ผู้กล้า'] },
  { word: 'Hifumi', synonyms: ['hifumi', 'ฮิฟุมิ', 'อายาเสะ ฮิฟุมิ', 'ayase hifumi', 'หน้ากากฟาอุสท์', 'เปโรโร่'] },
  { word: 'Azusa', synonyms: ['azusa', 'อาซึสะ', 'ชิราซึ อาซึสะ', 'shirasu azusa', 'อาสึสะ'] },
  { word: 'Koharu', synonyms: ['koharu', 'โคฮารุ', 'ชิโมเอะ โคฮารุ', 'shimoe koharu', 'ลามก'] },
  { word: 'Hanako', synonyms: ['hanako', 'ฮานาโกะ', 'อุราวะ ฮานาโกะ', 'urawa hanako'] },
  { word: 'Neru', synonyms: ['neru', 'เนรุ', 'มิคาโมะ เนรุ', 'mikamo neru', 'ยัยเตี้ย'] },
  { word: 'Asuna', synonyms: ['asuna', 'อาสึนะ', 'อิจิโนเสะ อาสึนะ', 'ichinose asuna', 'อาซึนะ'] },
  { word: 'Karin', synonyms: ['karin', 'คาริน', 'คากุอาสะ คาริน', 'kakuasa karin'] },
  { word: 'Akane', synonyms: ['akane', 'อากาเนะ', 'มุโรคาซะ อากาเนะ', 'murokasa akane'] },
  { word: 'Noa', synonyms: ['noa', 'โนอา', 'อุชิโอะ โนอา', 'ushio noa', 'เครื่องบันทึก'] }
];

const STATIC_LORE_VOCAB_LIST = [
  // Concepts & Events
  { word: 'สนธิสัญญาเอเดน', synonyms: ['eden treaty', 'สนธิสัญญามิตรภาพเอเดน', 'สนธิสัญญาเอเดน'], category: 'เนื้อเรื่อง/เหตุการณ์', loreContext: 'The Eden Treaty is a friendship and non-aggression pact proposed between Trinity and Gehenna, which was attacked and disrupted by Arius and Gematria in Volume 3.' },
  { word: 'สงครามกลางเมือง', synonyms: ['civil war', 'สงครามกลางเมือง', 'สงครามเอเดน'], category: 'เนื้อเรื่อง/เหตุการณ์', loreContext: 'Civil War refers to the internal conflicts in Kivotos academies, notably the war between the GSC and rebels, or the Trinity/Gehenna disputes, or the Arius internal war.' },
  { word: 'วัตถุโบราณ', synonyms: ['relics', 'relic', 'วัตถุโบราณ', 'โบราณวัตถุ', 'เทคโนโลยีโบราณ'], category: 'แนวคิดสำคัญ', loreContext: 'Relics (Ancient Relics) are mysterious artifacts and structures from the ancient era of Kivotos, possessing high technology and magical powers studied by Gematria and Schale.' },
  
  // Other static terms
  { word: 'การ์ดผู้ใหญ่', synonyms: ['adult card', 'การ์ดผู้ใหญ่', 'บัตรผู้ใหญ่'], category: 'ไอเทมสำคัญ', loreContext: 'The Adult Card is Sensei\'s trump card, which consumes his life force/credit to perform miracles or defeat bosses.' },
  { word: 'ไพรอคซีน', synonyms: ['pyroxene', 'เพชร', 'ไพรอคซีน', 'เพชรกาชา'], category: 'ไอเทมสำคัญ', loreContext: 'Pyroxenes are the primary currency in Kivotos used for recruitment (Gacha) and purchasing stamina/resources.' },
  { word: 'กล่องซิสติม', synonyms: ['shittim chest', 'กล่องซิสติม', 'กล่องชิตติม', 'แท็บเล็ต'], category: 'ไอเทมสำคัญ', loreContext: 'The Shittim Chest is an ancient, mysterious tablet device housing Arona and Plana and acting as the interface for Schale systems.' },
  { word: 'Sensei', synonyms: ['sensei', 'เซนเซ', 'เซ็นเซ', 'ครู', 'อาจารย์'], category: 'ตัวละครสำคัญ', loreContext: 'Sensei is the protagonist/player character in Blue Archive. He is the advisor of Schale, uses the adult card (Adult Card), and guides the students of Kivotos.' },
  { word: 'ประธานองค์การนักเรียน', synonyms: ['gsc president', 'ประธานองค์การนักเรียน', 'general student council president'], category: 'ตัวละครสำคัญ', loreContext: 'The General Student Council President (GSC President) who suddenly disappeared, leaving Kivotos in chaos.' },
  { word: 'Arona', synonyms: ['arona', 'อารอน่า', 'อารนา', 'อารอนา'], category: 'ตัวละครสำคัญ', loreContext: 'Arona is the AI guide residing in the Shittim Chest. She protects Sensei from gunfire/missiles and wears a blue school uniform. Loves strawberry milk.' },
  { word: 'Plana', synonyms: ['plana', 'พลาน่า', 'พลานา', 'พลาหน้า'], category: 'ตัวละครสำคัญ', loreContext: 'Plana is the second AI inside the Shittim Chest, originally A.R.O.N.A from Phrenapates alternate timeline.' },
  { word: 'Phrenapates', synonyms: ['phrenapates', 'เฟรนาปาเตส', 'พรีนาพาเทส'], category: 'ศัตรู/บอส', loreContext: 'Phrenapates is Sensei from an alternate timeline who sacrificed himself and was corrupted by the Chroma.' },
  { word: 'โครม่า', synonyms: ['chroma', 'โครม่า', 'โครมา'], category: 'ศัตรู/ภัยพิบัติ', loreContext: 'The Chroma is an otherworldly cataclysmic force that corrupts living beings and objects in Kivotos, creating Terror forms (like Shiroko Terror).' },
  { word: 'เกมาเตรีย', synonyms: ['gematria', 'เกมาเตรีย', 'พวกเกมาเตรีย'], category: 'ศัตรู/องค์กร', loreContext: 'Gematria is a mysterious council of malevolent adult researchers seeking to exploit the mysteries and halos of Kivotos.' },
  { word: 'Black Suit', synonyms: ['black suit', 'แบล็กสูท', 'แบล็คสูท'], category: 'วายร้าย/เกมาเตรีย', loreContext: 'Black Suit is a gentleman-like member of Gematria who wears a black suit, conducts experiments on halos.' },
  { word: 'Beatrice', synonyms: ['beatrice', 'เบียทริซ', 'คุณนายเบียทริซ'], category: 'วายร้าย/เกมาเตรีย', loreContext: 'Beatrice is the only female member of Gematria who ruled Arius with fear, attempted to destroy the Eden Treaty.' },
  { word: 'Maestro', synonyms: ['maestro', 'มาเอสโทร', 'มาเอสโตร'], category: 'วายร้าย/เกมาเตรีย', loreContext: 'Maestro is a member of Gematria obsessed with art, music, and relics, who created Hieronimus.' },
  { word: 'Golconde', synonyms: ['golconde', 'โกลคอนด์', 'เดคัลโคมานี'], category: 'วายร้าย/เกมาเตรีย', loreContext: 'Golconde & Decalcomanie is a member of Gematria presenting himself as a talking picture frame and carrying a mannequin body.' },
  { word: 'เดคากรามาตอน', synonyms: ['decagrammaton', 'เดคากรามาตอน'], category: 'ศัตรู/ระบบ', loreContext: 'Decagrammaton is an ancient supercomputer/AI that awoke to find God, creating ten prophets.' },
  { word: 'ไกเซอร์ คอร์ปอเรชัน', synonyms: ['kaiser', 'ไกเซอร์', 'ไกเซอร์ คอร์ปอเรชัน', 'kaiser corporation'], category: 'ศัตรู/องค์กร', loreContext: 'Kaiser Corporation is a massive, corrupt conglomerate in Kivotos.' },
  { word: 'โมโมทอล์ก', synonyms: ['momo talk', 'โมโมทอล์ก', 'โมโมทอล์ค', 'แชทโมโมะ'], category: 'ไอเทมสำคัญ', loreContext: 'Momo Talk is the messenger application used by Sensei and students in Kivotos.' },
  { word: 'นมสตรอเบอร์รี่', synonyms: ['strawberry milk', 'นมสตรอเบอร์รี่', 'นมสตรอเบอรี'], category: 'ของหวาน/มีม', loreContext: 'Strawberry Milk is Arona\'s favorite drink inside the Shittim Chest.' },

  // Raid Bosses
  { word: 'บีนาห์', synonyms: ['binah', 'บีนาห์', 'บีนา', 'งูเหล็ก'], category: 'บอสเรด', loreContext: 'Binah is a giant mechanical sand serpent raid boss roaming the desert.' },
  { word: 'เคเซด', synonyms: ['chesed', 'เคเซด', 'เชเซด', 'บอสลูกบอล'], category: 'บอสเรด', loreContext: 'Chesed is a massive mechanical sphere/factory raid boss created by Decagrammaton.' },
  { word: 'ชิโระคุโระ', synonyms: ['shirokuro', 'ชิโระคุโระ', 'ชิโร่คุโร่'], category: 'บอสเรด', loreContext: 'Shiro & Kuro are circus mascot raid bosses at an abandoned amusement park.' },
  { word: 'ฮิเอโรนิมัส', synonyms: ['hieronimus', 'ฮิเอโรนิมัส', 'บอสพระ'], category: 'บอสเรด', loreContext: 'Hieronimus is an relics-based raid boss created by Gematria (Maestro).' },
  { word: 'เปโรโร่จิลล่า', synonyms: ['perorodzilla', 'เปโรโร่จิลล่า', 'เปโรโร่ก๊อตซิลล่า'], category: 'บอสเรด', loreContext: 'Perorodzilla is a giant, mutated kaiju Peroro raid boss.' },
  { word: 'กอซ', synonyms: ['goz', 'กอซ', 'บอสมายากล'], category: 'บอสเรด', loreContext: 'Goz is a theatrical magician-like raid boss themed after illusions.' },
  { word: 'ฮอด', synonyms: ['hod', 'ฮอด', 'บอสเสา'], category: 'บอสเรด', loreContext: 'Hod is an AI raid boss created by Decagrammaton controlling Millennium towers.' },
  { word: 'ไคเทนเจอร์', synonyms: ['kaitenger', 'ไคเทนเจอร์', 'แก๊งซูชิเรนเจอร์'], category: 'บอสเรด/ศัตรู', loreContext: 'Kaitenger is a super sentai parody group of sushi criminals riding a giant robot.' },
  { word: 'เกรเกอริอุส', synonyms: ['gregorius', 'เกรเกอริอุส', 'บอสคอนเสิร์ต'], category: 'บอสเรด', loreContext: 'Gregorius is a grand pipe organ-themed raid boss created by Gematria.' },
  { word: 'โฮเวอร์คราฟต์', synonyms: ['hovercraft', 'โฮเวอร์คราฟต์', 'บอสเรือเหาะ'], category: 'บอสเรด', loreContext: 'Hovercraft (Wakka Oyashiro & Kaiser Hovercraft) is a military vehicle raid boss.' }
];

/* ==========================================================================
   2. CUSTOM REACT HOOK: useContextoGame
   ========================================================================== */
export function useContextoGame(secretWordObj) {
  
  const normalizeText = (text, stripThaiTones = false) => {
    if (!text) return '';
    let normalized = text.trim().toLowerCase();
    normalized = normalized.replace(/\s+/g, ' ');
    normalized = normalized.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "");

    if (stripThaiTones) {
      normalized = normalized.replace(/[\u0e47\u0e48\u0e49\u0e4a\u0e4b\u0e4c\u0e4d]/g, '');
    }
    return normalized;
  };

  const calculateScore = async (userInput) => {
    if (!secretWordObj || !userInput) {
      return { score: 0, matchedTag: '', reason: 'ไม่พบข้อมูลคำเฉลยหรือคำทาย' };
    }

    const normInput = normalizeText(userInput, false);
    const normInputStripped = normalizeText(userInput, true);

    const normSecret = normalizeText(secretWordObj.word, false);
    const normSecretStripped = normalizeText(secretWordObj.word, true);

    const normSynonyms = secretWordObj.synonyms.map(s => normalizeText(s, false));
    const normSynonymsStripped = secretWordObj.synonyms.map(s => normalizeText(s, true));

    // ด่านที่ 1 (Exact Match): ตรวจสอบที่หน้า Client ทันที
    const isExactMatch = normInput === normSecret || 
                         normInputStripped === normSecretStripped || 
                         normSynonyms.includes(normInput) || 
                         normSynonymsStripped.includes(normInputStripped);

    if (isExactMatch) {
      return {
        score: 100,
        matchedTag: secretWordObj.word,
        reason: 'ถูกต้อง!'
      };
    }

    if (!swuToken || !swuUserId) {
      return { score: 0, matchedTag: '', reason: 'ไม่พบตัวแปรสภาพแวดล้อมระบบ มศว (.env)' };
    }

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
You are the scoring engine for a Blue Archive Word Association game (Contexto style).
The secret word/concept is "${secretWordObj.word}" (synonyms: ${secretWordObj.synonyms.join(', ')}).
${secretWordObj.loreContext || ''}

Guiding Instruction: You have access to Google Search grounding. If the provided local context is basic, or you are unsure about the connection between the user's guess "${userInput}" and "${secretWordObj.word}", PLEASE search Google to verify. Look up their relationship, memes, attributes, associations, or storyline interactions in Blue Archive.

The user's guess is "${userInput}".

Your task is to analyze the relationship between the guess and the secret word/concept, returning a score strictly based on the following hierarchy to prevent score flattening:

SCORING HIERARCHY RULES:
1. Exact Match (100 points):
   - If the guess is the secret word/concept itself (transliterated, partial, or full name, in Thai, English, or Japanese, e.g., "คิโวทอส", "Kivotos", "ชิโรโกะ", "Shiroko").

2. Unique Core Tags (90 - 99 points):
   - Reserved ONLY for the absolute unique core elements of the secret target.
   - For characters: Their own specific club, their unique signature item, their highly specific personal traits, or legendary memes unique to them (e.g., "roll cake" or "gorilla" for Mika; "calculator" or "thighs" for Yuuka; "bank robbery" for Shiroko; "dork outlaw" for Aru).

3. Sub-factions, Clubs & Direct Squads (65 - 75 points):
   - The name of their club or direct sub-faction (e.g., "Tea Party", "คณะกรรมการวินัย" / "Disciplinary Committee", "Supplementary Lessons Department", "C&C").

4. School & Academy Level (55 - 65 points):
   - The name of their school or academy (e.g., "Trinity", "Gehenna", "Millennium", "Hyakkiyako", "Red Winter", etc.).

5. Related Characters / Friends / Rivals (55 - 85 points with Offsetting):
   - Do NOT give related characters a flat score. Dynamically offset/differentiate their score based on their closeness in the storyline or relationship lore:
     * Best friend / partner / direct helper (e.g., Ako for Hina; Momoi/Midori for each other; Nagisa for Mika) -> 80 - 85 points.
     * Close club mates / main story allies -> 70 - 79 points.
     * Loose acquaintances, rivals, or other students at the same school with minor interaction -> 55 - 69 points.

6. Broad Terms (25 - 40 points):
   - Very broad terms of the world of Kivotos (e.g., "นักเรียน" (student), "ปืน" (gun), "ผู้หญิง" (girl), "อาวุธ" (weapon), "กระสุน" (bullet), "Halo").

7. Tangential Connections (10 - 49 points):
   - Words that are only indirectly connected to the character or concept in general lore.

8. Completely Unrelated (1 - 8 points):
   - No logical or lore connection. Return a random score between 1 and 8.

Response MUST be a valid JSON object with this exact schema:
{
  "score": number, // integer 1-100 following the rules above
  "matchedTag": "string", // keyword matched (or empty)
  "reason": "string" // brief explanation in Thai of the score relationship
}
`
        })
      });

      if (!response.ok) throw new Error('SWU AI API error');

      const data = await response.json();
      const rawText = data.content || data.response || data.reply || data.result || data.choices?.[0]?.message?.content || data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!rawText) throw new Error('Empty response');

      const cleanJsonText = rawText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJsonText);

      return {
        score: typeof parsed.score === 'number' ? parsed.score : 1,
        matchedTag: parsed.matchedTag || '',
        reason: parsed.reason || ''
      };
    } catch (e) {
      console.error(e);
      const fallbackScore = Math.floor(Math.random() * 8) + 1;
      return {
        score: fallbackScore,
        matchedTag: '',
        reason: ''
      };
    }
  };

  return {
    normalizeText,
    calculateScore
  };
}

// Map dev/internal club name to multiple recognizable English names/slangs
const getClubEnglishSynonyms = (clubName) => {
  const nameLower = clubName.toLowerCase();
  const synonyms = new Set();
  synonyms.add(nameLower);
  synonyms.add(nameLower.replace(/\s+/g, ''));
  
  const map = {
    'fuuki': ['disciplinary committee', 'disciplinary', 'prefect team', 'prefects', 'prefect'],
    'cleannclearing': ['c&c', 'c & c', 'clean and clearing', 'maid club', 'maids'],
    'theseminar': ['seminar', 'seminah'],
    'gamedev': ['game dev', 'game development department', 'game development club', 'game dev club', 'gamedev department'],
    'hotspringsdepartment': ['hot springs department', 'hot spring development department', 'onsen department', 'hot spring', 'onsen'],
    'abydosstudentcouncil': ['abydos student council', 'foreclosure task force', 'countermeasures'],
    'teaparty': ['tea party'],
    'foodservice': ['school lunch club', 'food service', 'food service club', 'lunch club'],
    'gourmetclub': ['gourmet research society', 'gourmet club', 'gourmet research', 'gourmets'],
    'justice': ['justice task force', 'justice committee', 'justice department', 'jtf'],
    'sisterhood': ['sisterhood', 'sisters', 'sister'],
    'veritas': ['veritas'],
    'ninpokenkyubu': ['ninjutsu research club', 'ninja club', 'ninjutsu research', 'ninjas'],
    'knightshospitaller': ['remedial knights', 'knights hospitaller', 'remedial knight', 'hospitallers'],
    'countermeasure': ['foreclosure task force', 'countermeasures committee', 'countermeasure', 'abydos countermeasures'],
    'redwinteroffice': ['red winter office', 'secretariat', 'red winter secretariat'],
    'remedialclass': ['makeup work club', 'remedial class', 'make-up work club'],
    'knowledgeliberationfront': ['knowledge liberation front', 'klf'],
    'matsurioffice': ['festival operations committee', 'festival office', 'matsuri office', 'festival committee'],
    'occultclub': ['occult research club', 'occult club', 'paranormal research'],
    'publicpeacebureau': ['public peace bureau', 'valkyrie police', 'police bureau', 'public peace'],
    'publishingdepartment': ['publishing department', 'kronos publishing', 'publishing'],
    'rabbitplatoon': ['rabbit platoon', 'rabbit squad', 'rabbits'],
    'anzenkyoku': ['schale', 'safety bureau', 'anzenkyoku'],
    'sptf': ['super phenomenon task force', 'sptf', 'supernatural phenomenon task force'],
    'freetradecartel': ['free trade cartel', 'cartel', 'black market'],
    'freightlogisticsdepartment': ['freight logistics department', 'freight logistics', 'logistics department'],
    'foxsquad': ['fox squad', 'fox platoon', 'foxes'],
    'genryumon': ['genryumon', 'black dragon group', 'black dragon'],
    'laborparty': ['labor party', 'labor'],
    'meihuayuan': ['plum garden', 'meihuayuan'],
    'shugyobu': ['inner discipline club', 'training club', 'shugyobu', 'discipline club'],
    'shinysparklesociety': ['shiny sparkle society', 'sparkle society', 'shiny sparkle'],
    'trinityvigilance': ['vigilante crew', 'vigilantes', 'trinity vigilance', 'vigilante'],
    'trainingclub': ['athletics training club', 'training club', 'workout club']
  };

  const matched = map[nameLower];
  if (matched) {
    matched.forEach(s => {
      synonyms.add(s.toLowerCase());
      synonyms.add(s.replace(/\s+/g, '').toLowerCase());
    });
  }
  return Array.from(synonyms);
};

/* ==========================================================================
   3. MAIN COMPONENT
   ========================================================================== */
export default function BlueArchiveWordGame({ soundEnabled, onBack }) {
  const [loading, setLoading] = useState(true);

      {/* โมดอลกฎกติกาการเล่น */}
  const [showHelp, setShowHelp] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

// สถานะหลักของคำปริศนา
  const [secretWordObj, setSecretWordObj] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [guessHistory, setGuessHistory] = useState([]);
  const [isWin, setIsWin] = useState(false);
  const [isGivenUp, setIsGivenUp] = useState(false);
  const [sortMethod, setSortMethod] = useState('order');
  const [feedbackMsg, setFeedbackMsg] = useState(null);

// สถานะส่งข้อมูลของ API
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingHint, setIsFetchingHint] = useState(false);

  const [bestScore, setBestScore] = useState(0);

  // Load students data on mount
  const [allStudents, setAllStudents] = useState([]);
  const [vocabList, setVocabList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const startNewGame = (loadedStudentsList, loadedVocabList) => {
    const listToUse = loadedStudentsList && loadedStudentsList.length > 0 ? loadedStudentsList : allStudents;
    const vocabListToUse = loadedVocabList && loadedVocabList.length > 0 ? loadedVocabList : vocabList;
    
    if (vocabListToUse.length === 0) return;
    const randomIndex = Math.floor(Math.random() * vocabListToUse.length);
    const vocab = vocabListToUse[randomIndex];
    
    // Check if the vocab word matches a story character name to get their icon
    const charMatch = listToUse.find(
      s => s.englishName.toLowerCase() === vocab.word.toLowerCase() ||
           s.name.toLowerCase() === vocab.word.toLowerCase()
    );
    
    setSecretWordObj({
      word: vocab.word,
      synonyms: vocab.synonyms,
      category: vocab.category,
      iconPath: charMatch ? charMatch.iconPath : '/images/schoolicon/ETC.png',
      loreContext: vocab.loreContext
    });
    
    setIsWin(false);
    setIsGivenUp(false);
    setUserInput('');
    setGuessHistory([]);
    setFeedbackMsg(null);
    setBestScore(0);
  };

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
        
        const schoolsMap = new Map(); // English -> { thLong, thShort }
        const clubsMap = new Map(); // English -> { th }

        for (const charName in storyData) {
          const char = storyData[charName];
          
          if (char.School) {
            schoolsMap.set(char.School.trim(), {
              thLong: char.SchoolThLong || '',
              thShort: char.SchoolTh || ''
            });
          }
          if (char.Club) {
            clubsMap.set(char.Club.trim(), {
              th: char.ClubTh || ''
            });
          }

          // Find matching playable student in studentsData if available, to get additional info
          let studentMatch = studentsEntries.find(s => s.Name === char.NameJp || s.Name === char.Name);
          if (!studentMatch && char.NameEn) {
            const engNameClean = char.NameEn.toLowerCase().replace(/[^a-z]/g, '');
            studentMatch = studentsEntries.find(s => {
              const sEngClean = s.DevName ? s.DevName.toLowerCase().replace(/[^a-z]/g, '') : '';
              return sEngClean.includes(engNameClean) || engNameClean.includes(sEngClean);
            });
          }

          let iconPath = char.IconLocalPath || '';
          if (iconPath.startsWith('.')) {
            iconPath = iconPath.substring(1); // Converts "./images/..." to "/images/..."
          }

          list.push({
            id: studentMatch?.Id || `story_${charName.replace(/\s+/g, '_')}`,
            name: char.NameJp || char.Name || charName,
            devName: char.NameEn || charName,
            pathName: char.NameEn || charName,
            englishName: char.NameEn || charName,
            school: char.School || 'ETC',
            club: char.Club || '',
            schoolYear: studentMatch?.SchoolYear || '',
            weaponName: studentMatch?.Weapon?.Name || '',
            weaponDesc: studentMatch?.Weapon?.Desc || '',
            characterSSRNew: studentMatch?.CharacterSSRNew || '',
            defaultOrder: studentMatch?.DefaultOrder !== undefined ? studentMatch.DefaultOrder : 9999,
            
            // Story Details from story_characters_lore.json
            storyDescription: char.DescriptionEnRich || char.Description || '',
          schoolTh: 'คิโวทอส',
            clubTh: char.ClubTh || '',
            age: char.Age || '',
            birthday: char.Birthday || '',
            height: char.Height || '',
            voiceActor: char.VoiceActor || '',
            iconPath: iconPath
          });
        }
        
        // Sort by defaultOrder first, then alphabetically by English name
        list.sort((a, b) => {
          if (a.defaultOrder !== b.defaultOrder) {
            return a.defaultOrder - b.defaultOrder;
          }
          return a.englishName.localeCompare(b.englishName);
        });

        // 1. Generate School Vocabs
        const schoolVocabs = [];
        schoolsMap.forEach((val, key) => {
          if (!key || key.toLowerCase() === 'etc') return;
          const synonyms = [key.toLowerCase(), key.replace(/\s+/g, '').toLowerCase()];
          if (val.thShort) synonyms.push(val.thShort.toLowerCase());
          if (val.thLong) synonyms.push(val.thLong.toLowerCase());
          
          schoolVocabs.push({
            word: key,
            synonyms: synonyms,
            category: 'โรงเรียน',
            loreContext: `--- BLUE ARCHIVE SCHOOL INFO ---
School Name: ${key} (${val.thLong || val.thShort || ''})
This is one of the academies/schools in the city of Kivotos.
---------------------------------`
          });
        });

        // 2. Generate Club Vocabs
        const clubVocabs = [];
        clubsMap.forEach((val, key) => {
          if (!key) return;
          const { officialTh, synonyms } = getClubDetails(key, val.th);
          
          clubVocabs.push({
            word: officialTh, // Thai official name!
            synonyms: synonyms,
            category: 'ชมรม/กลุ่ม',
            loreContext: `--- BLUE ARCHIVE CLUB INFO ---
Club/Group Name: ${officialTh} (${key})
This is a student club, squad, or organization in Kivotos.
---------------------------------`
          });
        });

        // 3. Generate Character Vocabs (for all 211 characters)
        const characterVocabs = list.map(s => ({
          word: s.englishName,
          synonyms: Array.from(generateSynonyms(s)),
          category: 'ตัวละคร',
          loreContext: getStudentContext(s)
        }));

        // 4. Combined dynamic + static list
        const combinedVocabs = [
          ...STATIC_LORE_VOCAB_LIST,
          ...characterVocabs,
          ...schoolVocabs,
          ...clubVocabs
        ];

        setVocabList(combinedVocabs);
        setAllStudents(list);
        startNewGame(list, combinedVocabs);
      } catch (err) {
        console.error('Failed to load students or story data', err);
        // Fallback to static list structure converted to student shape
        const fallbackList = SECRET_CHARACTERS_LIST.map((c, idx) => ({
          id: 10000 + idx,
          name: c.word,
          devName: c.synonyms[0],
          pathName: c.synonyms[0],
          englishName: c.synonyms[0],
          school: 'Kivotos',
          storyDescription: '',
          schoolTh: 'คิโวทอส',
          clubTh: '',
          iconPath: '/images/schoolicon/ETC.png'
        }));
        setAllStudents(fallbackList);

        const fallbackVocabs = [
          ...STATIC_LORE_VOCAB_LIST,
          ...fallbackList.map(s => ({
            word: s.englishName,
            synonyms: [s.englishName.toLowerCase()],
          category: 'ตัวละคร',
            loreContext: `Character name: ${s.englishName}`
          }))
        ];
        setVocabList(fallbackVocabs);
        startNewGame(fallbackList, fallbackVocabs);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const generateSynonyms = (student) => {
    const synonyms = new Set();
    const name = student.englishName;
    if (!name) return synonyms;
    
    synonyms.add(name.toLowerCase());
    synonyms.add(name.replace(/\s+/g, '').toLowerCase());
    
    // Add individual parts (e.g. given name "Fuuka", family name "Aikiyo")
    const parts = name.split(/\s+/);
    parts.forEach(p => {
      synonyms.add(p.toLowerCase());
    });
    
    if (student.name) {
      synonyms.add(student.name.toLowerCase());
      synonyms.add(student.name.replace(/\s+/g, '').toLowerCase());
      
      const katakanaMatch = student.name.match(/[\u30a0-\u30ff]+/);
      if (katakanaMatch) {
        synonyms.add(katakanaMatch[0].toLowerCase());
      }
    }
    
    // Merge custom slang synonyms from static list
    const staticMatch = SECRET_CHARACTERS_LIST.find(
      c => c.word.toLowerCase() === name.toLowerCase() || 
           name.toLowerCase().includes(c.word.toLowerCase()) ||
           c.synonyms.some(s => name.toLowerCase().includes(s.toLowerCase()))
    );
    if (staticMatch) {
      staticMatch.synonyms.forEach(syn => synonyms.add(syn.toLowerCase()));
      synonyms.add(staticMatch.word.toLowerCase());
    }
    
    return synonyms;
  };

  // เรียกใช้ Hook ประมวลผลคำทาย
  const { calculateScore } = useContextoGame(secretWordObj);

  const getProximityClass = (score) => {
    if (score === 100) return 'exact';
    if (score >= 80) return 'hot';
    if (score >= 50) return 'warm';
    if (score >= 9) return 'cool';
    return 'cold';
  };

  const getProximityLabel = (score) => {
    if (score === 100) return 'ถูกต้อง!';
    if (score >= 80) return 'ร้อนแรง (Hot)';
    if (score >= 50) return 'อบอุ่น (Warm)';
    if (score >= 9) return 'ห่างไกล (Cool)';
    return 'ไม่เกี่ยวข้องเลย (Cold)';
  };

  // สร้างบริบทของตัวละครเชิงเนื้อเรื่อง (Story Lore Context) เพื่อส่งป้อนให้กับ Gemini AI
  const getStudentContext = (student) => {
    if (!student) return '';
    
    let context = `--- CHARACTER STORY LORE CONTEXT FOR GEMINI ---
Name: ${student.englishName}
Japanese/Katakana Name: ${student.name}
School: ${student.school} ${student.schoolTh ? `(${student.schoolTh})` : ''}
Club: ${student.club} ${student.clubTh ? `(${student.clubTh})` : ''}
Age: ${student.age || 'Unknown'}
Birthday: ${student.birthday || 'Unknown'}
Height: ${student.height || 'Unknown'} cm
Voice Actor: ${student.voiceActor || 'Unknown'}

Biography & Story Details:
${student.storyDescription || 'No detailed biography available.'}

Lobby Greeting: "${student.characterSSRNew || ''}"
-----------------------------------------`;
    return context;
  };

  // เริ่มต้นกระดานคำตอบเมื่อเลือกตัวละครเฉลยได้แล้ว
  const handleSelectSecretWord = (targetObj) => {
    setSecretWordObj(targetObj);
    setIsWin(false);
    setIsGivenUp(false);
    setUserInput('');
    setGuessHistory([]);
    setFeedbackMsg(null);
    setBestScore(0);
  };

  // การส่งคำทายหลักไปยังระบบประมวลผล
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isWin || isSubmitting) return;

    const trimmedInput = userInput.trim();
    
    // ตรวจสอบการทายซ้ำเพื่อเซฟโควตา API
    const alreadyGuessed = guessHistory.some(
      g => g.guess.toLowerCase() === trimmedInput.toLowerCase()
    );
    if (alreadyGuessed) {
      setFeedbackMsg({ type: 'warning', text: `คุณเดาคำว่า "${trimmedInput}" ไปแล้ว!` });
      playSound('failure', soundEnabled);
      return;
    }

    setFeedbackMsg(null);
    setIsSubmitting(true);

    const result = await calculateScore(trimmedInput);

    const newGuess = {
      guess: trimmedInput,
      score: result.score,
      rank: guessHistory.length + 1,
      timestamp: Date.now()
    };

    const updatedHistory = [newGuess, ...guessHistory];
    setGuessHistory(updatedHistory);
    setUserInput('');
    setIsSubmitting(false);

    if (result.score > bestScore) {
      setBestScore(result.score);
    }

    if (result.score === 100) {
      setIsWin(true);
      playSound('victory', soundEnabled);
    } else {
      if (result.score >= 50) {
        playSound('success', soundEnabled);
      } else {
        playSound('failure', soundEnabled);
      }
    }
  };

  // ขอคำใบ้เชิงความหมายจาก SWU AI API แล้วส่งยัดเข้าประมวลผลในประวัติเดาเลย
  const handleRequestHint = async () => {
    if (!secretWordObj || isWin || isFetchingHint || !swuToken || !swuUserId) return;

    setIsFetchingHint(true);
    setFeedbackMsg(null);

    const guessedWords = guessHistory.map(g => g.guess);

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
You are the hint generator for a Blue Archive Word Association game.
The secret word/concept is "${secretWordObj.word}".
${secretWordObj.loreContext || ''}

Guiding Instruction: You have access to Google Search grounding. Search the web to find lore, organizations, characters, locations, items, memes, or associations for "${secretWordObj.word}" in Blue Archive.

The player has already guessed these words: [${guessedWords.join(', ')}].

Generate one highly relevant keyword or hint (in Thai, 1-2 words only, no explanation) related to this word's lore, category, or details mentioned in the context or found via Google Search. The hint must NOT be in the guessed list.
Response MUST be a valid JSON object with this exact schema:
{
  "tag": "string" // the keyword in Thai
}
`
        })
      });

      if (!response.ok) throw new Error('Hint API error');

      const data = await response.json();
      const rawText = data.content || data.response || data.reply || data.result || data.choices?.[0]?.message?.content || data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      const cleanJsonText = rawText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJsonText);
      const hintWord = parsed.tag;

      if (!hintWord) throw new Error('No tag returned');

    // นำคำใบ้ที่ได้ยัดเข้าฟังก์ชันคำนวณคะแนนแล้วยัดใส่ลงใน list ทันที
      const result = await calculateScore(hintWord);
      
    // ป้องกันการได้คำใบ้ที่สร้างมีคะแนนต่ำ (หาก AI ประเมินผิดพลาด ให้ล็อกค่าระดับปานกลาง-สูง 70-85 คะแนน เพื่อเป็นเบาะแสที่เป็นประโยชน์)
      const finalHintScore = result.score === 100 ? 100 : Math.max(result.score, Math.floor(Math.random() * 16) + 70);

      const newHintGuess = {
      guess: `💡 ${hintWord}`, // ใส่เครื่องหมายนำหน้าเพื่อให้รู้ว่าเป็นคำใบ้
        score: finalHintScore,
        rank: guessHistory.length + 1,
        timestamp: Date.now()
      };

      setGuessHistory(prev => [newHintGuess, ...prev]);
      playSound('success', soundEnabled);
    } catch (e) {
      console.error(e);
      setFeedbackMsg({ type: 'error', text: 'ไม่สามารถส่งสัญญาณคำใบ้ผ่านระบบ SWU AI ได้' });
    } finally {
      setIsFetchingHint(false);
    }
  };

  const handleRevealAnswer = () => {
    if (!secretWordObj || isWin) return;
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการยอมแพ้และเฉลยคำตอบ?')) return;

    setIsGivenUp(true);
    setIsWin(true);
    playSound('failure', soundEnabled);
  };

  const handleShareResults = () => {
    if (!secretWordObj) return;

    const guessCount = guessHistory.length;
    let textToCopy = `🎮 Kivotos Arcade: เดาคำความเกี่ยวข้อง (SWU AI)\n`;
    textToCopy += `🎯 คำตอบเฉลย: ${secretWordObj.word}\n`;
    textToCopy += `🔢 จำนวนทาย: ${guessCount} ครั้ง\n`;
    textToCopy += `เล่นได้ที่ Kivotos Arcade! 🌸`;

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2000);
      })
      .catch(err => {
        console.error('Copy failed', err);
      });
  };

  const sortedGuesses = [...guessHistory].sort((a, b) => {
    if (sortMethod === 'score') {
      return b.score - a.score || b.timestamp - a.timestamp;
    }
    return b.timestamp - a.timestamp;
  });

  if (loading) {
    return <LoadingScreen fadeLoading={false} text="กำลังเริ่มต้นการเชื่อมต่อหน้าทดสอบบอร์ด..." />;
  }

  // ด่านแสดงผลการแจ้งเตือนกรณีลืมเซฟค่าตัวแปรสภาพแวดล้อม
  if (!swuToken || !swuUserId) {
    return (
      <div className="word-game-container">
        <div className="word-game-header bg-rose-950/20 border-rose-900/40 p-6 flex flex-col items-center text-center gap-4">
          <AlertTriangle className="w-12 h-12 text-rose-400" />
          <h2 className="text-rose-300 font-extrabold">ไม่พบการกำหนดคีย์เชื่อมต่อระบบ</h2>
          <p className="text-sm text-rose-300/80 leading-relaxed max-w-sm">
            กรุณาทำการคัดลอกไฟล์ <code>.env.example</code> ไปสร้างเป็นไฟล์ <code>.env</code>
            และป้อนข้อมูล <code>VITE_SWU_API_KEY</code> และ <code>VITE_SWU_USER_ID</code> ของคุณเพื่อใช้งานระบบ AI
          </p>
          <button onClick={onBack} className="word-game-btn-secondary mt-2 px-6 py-2">
          <button onClick={onBack} className="word-game-btn-secondary mt-2 px-6 py-2">
            กลับหน้าหลัก
          </button>
          </button>
        </div>
      </div>
    );
  }

  if (!secretWordObj) {
    return null;
  }

  return (
    <div className="word-game-container">
      {/* ส่วนหัวของเกมพร้อมปุ่มเปลี่ยน Credentials */}
      <div className="word-game-header">
        <div className="word-game-title-row">
          <div className="word-game-title-area">
            <h2>
              <Compass className="w-6 h-6 text-cyan-400" />
              เกมเดาคำเกี่ยวข้อง 
            </h2>
            <p>ถอดรหัสความเชื่อมโยงของคำศัพท์ปริศนา</p>
          </div>
          <div className="word-game-header-actions">
            <button 
              className="word-game-shuffle-btn"
              onClick={() => startNewGame()}
              title="สุ่มคำเฉลยปริศนาคำใหม่"
            >
              <RotateCcw className="w-4 h-4" />
              สุ่มคำใหม่
            </button>
            <button 
              className="word-game-icon-btn" 
              onClick={() => setShowHelp(true)}
              title="วิธีการเล่น"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* แผงแสดงสถิติ */}
        <div className="word-game-stats-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div className="word-game-stat-card">
            <div className="word-game-stat-label">ทายไปแล้ว</div>
            <div className="word-game-stat-value">{guessHistory.length} ครั้ง</div>
          </div>
          <div className="word-game-stat-card">
            <div className="word-game-stat-label">คะแนนสูงสุด</div>
            <div className="word-game-stat-value">{bestScore}/100</div>
          </div>
        </div>
      </div>

      {/* ช่องอินพุตคำเดา */}
      <div className="word-game-input-section">
        <form onSubmit={handleSubmit} className="word-game-form">
          <div className="word-game-input-wrapper">
            <input
              type="text"
              placeholder={isWin ? "วิเคราะห์คลื่นเสียงสำเร็จแล้ว! 🎉" : "ป้อนเบาะแส เช่น เกเฮนน่า, ปล้นธนาคาร, โรลเค้ก, ปี 3..."}
              className="word-game-input"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={isWin || isSubmitting || isFetchingHint}
              maxLength={40}
            />
          </div>
          <button 
            type="submit" 
            className="word-game-submit-btn"
            disabled={!userInput.trim() || isWin || isSubmitting || isFetchingHint}
            style={{ minWidth: '120px' }}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ประมวลผล...
              </span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>เดาคำ</span>
              </>
            )}
          </button>
        </form>

        {feedbackMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-sm px-3 py-2 rounded-lg ${
              feedbackMsg.type === 'warning' ? 'bg-amber-950/40 text-amber-300 border border-amber-800/40' : 'bg-rose-950/40 text-rose-300 border border-rose-800/40'
            }`}
          >
            {feedbackMsg.text}
          </motion.div>
        )}
      </div>

      {/* แผงคำใบ้เชิงวิเคราะห์ */}
      {!isWin && (
        <div className="word-game-action-bar">
          <div className="word-game-action-bar-label">
            💡 ต้องการเบาะแสหรือถอดรหัสข้อมูล?
          </div>
          <div className="word-game-action-buttons">
            <button 
              onClick={handleRequestHint}
              disabled={isSubmitting || isFetchingHint || isWin}
              className="word-game-hint-action-btn"
            >
              {isFetchingHint ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                  <span>กำลังถอดรหัส...</span>
                </>
              ) : (
                <>
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  <span>ขอคำใบ้</span>
                </>
              )}
            </button>
            <button 
              onClick={handleRevealAnswer}
              disabled={isSubmitting || isFetchingHint || isWin}
              className="word-game-reveal-action-btn"
            >
              <Eye className="w-4 h-4" />
                  <span>ยอมแพ้/เฉลย</span>
            </button>
          </div>
        </div>
      )}

      {/* กล่องแสดงความยินดีเมื่อชนะ หรือยอมแพ้ */}
      {isWin && secretWordObj && (
        <div className={`word-game-victory-box ${isGivenUp ? 'border-rose-950/40 bg-rose-950/10' : ''}`} style={isGivenUp ? { borderColor: 'rgba(239, 68, 68, 0.25)', boxShadow: '0 10px 40px rgba(239, 68, 68, 0.1)' } : {}}>
          {secretWordObj.iconPath && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <img 
                src={secretWordObj.iconPath} 
                alt={secretWordObj.word} 
                style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid var(--accent-cyan)' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/schoolicon/ETC.png';
                }}
              />
            </div>
          )}
          <div className="word-game-victory-logo" style={isGivenUp ? { color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)' } : {}}>
            {isGivenUp ? <X className="w-10 h-10" /> : <Trophy className="w-10 h-10" />}
          </div>
          <div className="word-game-victory-title" style={isGivenUp ? { color: '#f87171' } : {}}>
            {isGivenUp ? "ยอมแพ้ภารกิจ!" : "เสร็จสิ้นภารกิจ!"}
          </div>
          <div className="word-game-victory-subtitle">
            {isGivenUp ? (
              <>คุณเลือกยอมแพ้ในการถอดรหัสคลื่นคำลับ คำตอบเฉลยคือ <strong className="text-rose-300">"{secretWordObj.word}"</strong></>
            ) : (
              <>คุณสามารถถอดรหัสคำศัพท์ปริศนาคือ <strong className="text-cyan-300">"{secretWordObj.word}"</strong> ได้ถูกต้อง โดยใช้การทาย <strong>{guessHistory.length}</strong> ครั้ง!</>
            )}
          </div>
          <div className="word-game-victory-actions">
            {!isGivenUp && (
              <button className="word-game-btn-primary" onClick={handleShareResults}>
                <Clipboard className="w-4 h-4" />
                แชร์ผลสถิติ
              </button>
            )}
            <button className="word-game-shuffle-btn" onClick={() => startNewGame()}>
              <RotateCcw className="w-4 h-4" />
              สุ่มคำใหม่
            </button>
          </div>
        </div>
      )}

      {/* ส่วนควบคุมประวัติการเดาคำ */}
      <div className="word-game-list-controls">
        <div className="word-game-list-count">
          ระเบียนคำทายที่ตรวจสอบแล้ว ({guessHistory.length} คำ)
        </div>
        {guessHistory.length > 1 && (
          <div className="word-game-sort-btn-group">
            <button
              className={`word-game-sort-btn ${sortMethod === 'order' ? 'active' : ''}`}
              onClick={() => setSortMethod('order')}
            >
              ล่าสุด
            </button>
            <button
              className={`word-game-sort-btn ${sortMethod === 'score' ? 'active' : ''}`}
              onClick={() => setSortMethod('score')}
            >
              คะแนนสูงสุด
            </button>
          </div>
        )}
      </div>

      {/* รายการแสดงประวัติ */}
      <div className="word-game-guesses-list">
        {sortedGuesses.length === 0 ? (
          <div className="word-game-empty-state">
            <Compass className="word-game-empty-icon" />
            <p>เริ่มต้นป้อนคำทายเพื่อตรวจสอบระดับคลื่นสัญญาณเชิงความหมายของนักเรียน!</p>
          </div>
        ) : (
          sortedGuesses.map((g) => {
            const proxClass = getProximityClass(g.score);
            return (
              <div key={g.rank} className="word-game-guess-card">
                {/* Full-width elegant card fill overlay */}
                <div 
                  className={`word-game-card-bg-fill ${proxClass}`} 
                  style={{ width: `${g.score}%` }} 
                />
                <div className={`word-game-card-indicator ${proxClass}`} />
                
                <div className="word-game-guess-word-box">
                  <span className="word-game-guess-index">#{g.rank}</span>
                  <span className="word-game-guess-word" title={g.guess}>{g.guess}</span>
                </div>

                <div className="word-game-guess-score-box">
                  <span className="word-game-guess-label" style={{ fontSize: '0.72rem' }}>
                    {getProximityLabel(g.score)}
                  </span>
                  <span className="word-game-guess-score">
                    {g.score}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* โมดอลกฎกติกาการเล่น */}
      {showHelp && (
        <div className="word-game-modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="word-game-modal" onClick={(e) => e.stopPropagation()}>
            <div className="word-game-modal-header">
              <h3>🌸 วิธีเล่นกติกาเดาคำ</h3>
              <button className="word-game-icon-btn" onClick={() => setShowHelp(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="word-game-modal-body">
              <p>ระบบวิเคราะห์เชิงความหมายของเกมในรุ่นนี้ ขับเคลื่อนโดยโมเดล **google/gemini-2.5-flash** ผ่านโครงสร้างเครือข่าย of **SWU AI Services**</p>
              
              <h4>💡 กฎการประเมินคะแนนเชิงปริมาณ:</h4>
              <ul>
                <li><strong>100 คะแนน (Exact Match)</strong>: ตรวจสอบความถูกต้องของคำทายกับเฉลยโดยตรงทันทีที่หน้าไคลเอนต์</li>
                <li><strong>50 - 99 คะแนน (Related Matches)</strong>: คีย์เวิร์ดมีความเชื่อมโยงเชิงความรู้สึกกับข้อมูลแฟ้ม เช่น สังกัด, โรงเรียน, อาวุธ, เมมบอร์ด หรือคู่หูของนักเรียนเฉลย</li>
                <li><strong>10 - 49 คะแนน (Tangential Matches)</strong>: คำศัพท์ที่มีลักษณะความเกี่ยวข้องทางอ้อมอย่างบางเบา</li>
                <li><strong>1 - 8 คะแนน (Cold Fallback)</strong>: ป้อนคำที่ไม่พบความสอดคล้องใดๆ เลย ระบบจะปัดเป็นค่าคลื่นความถี่ต่ำเพื่อแนะแนวทาง</li>
              </ul>

              <h4>🎨 คำอธิบายแถบสีสัญญาณ:</h4>
              <div className="word-game-color-guide">
                <div className="word-game-guide-item">
                  <div className="word-game-guide-dot bg-cyan-400" />
                  <span><strong>100 คะแนน</strong> (คำเฉลยตัวละคร!)</span>
                </div>
                <div className="word-game-guide-item">
                  <div className="word-game-guide-dot bg-red-500" />
                  <span><strong>80-99 คะแนน</strong> (ร้อนแรง มีความสอดคล้องสูงมาก!)</span>
                </div>
                <div className="word-game-guide-item">
                  <div className="word-game-guide-dot bg-amber-500" />
                  <span><strong>50-79 คะแนน</strong> (อบอุ่น คีย์เวิร์ดมีความสัมพันธ์ในระดับดี)</span>
                </div>
                <div className="word-game-guide-item">
                  <div className="word-game-guide-dot bg-blue-500" />
                  <span><strong>9-49 คะแนน</strong> (มีความเชื่อมโยงเล็กน้อยแต่อยู่ห่างไกล)</span>
                </div>
                <div className="word-game-guide-item">
                  <div className="word-game-guide-dot bg-gray-500" />
                  <span><strong>1-8 คะแนน</strong> (ไม่มีความเกี่ยวข้องใดๆ เลย)</span>
                </div>
              </div>

              <button className="word-game-btn-primary w-full mt-4" onClick={() => setShowHelp(false)}>
                เริ่มถอดรหัสเบาะแส!
              </button>
            </div>
          </div>
        </div>
      )}

      {copiedToast && (
        <div className="word-game-copy-toast">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>คัดลอกผลลัพธ์ไปยังคลิปบอร์ดเสร็จสิ้น!</span>
        </div>
      )}
    </div>
  );
}
