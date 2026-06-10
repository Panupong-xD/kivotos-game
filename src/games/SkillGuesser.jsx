import React from 'react'
import { Sparkles, Gamepad2, Info, Lock } from 'lucide-react'

export default function SkillGuesser() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 max-w-lg mx-auto text-center glass-panel bg-slate-950/60 border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)] rounded-2xl">
      <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-6 shadow-[0_0_15px_rgba(6,182,212,0.2)] animate-pulse">
        <Lock className="w-8 h-8" />
      </div>

      <span className="bg-cyan-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-3 animate-bounce">
        Coming Soon
      </span>
      
      <h2 className="text-2xl font-extrabold text-white mb-2 font-outfit">
        เกมทายสกิลนักเรียน (Skill Guesser)
      </h2>
      
      <p className="text-slate-400 text-sm font-prompt leading-relaxed mb-6">
        เกมทายภาพไอคอนหรือข้อความอธิบายความสามารถพิเศษ (EX Skill) ของนักเรียนจากโรงเรียนต่างๆ ทั่วคิโวทอส! ปลดล็อกเร็วๆ นี้ในเวที Kivotos Arcade
      </p>

      <div className="w-full bg-slate-900/40 border border-slate-900 rounded-xl p-4 text-left flex gap-3 text-xs text-slate-400 font-prompt">
        <Info className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-slate-200 mb-1">กติกาเบื้องต้นในแผนพัฒนาถัดไป:</h4>
          <p className="leading-relaxed">
            ระบบจะแสดงไอคอน EX Skill ของนักเรียน 1 ตัวละครแบบสุ่ม ผู้เล่นต้องป้อนชื่อนักเรียนให้ถูกต้อง หรือใช้เบาะแส (เช่น พลังงานที่ใช้, ประเภทความเสียหาย, หรือโรงเรียน) เพื่อทายให้สำเร็จในโอกาสที่จำกัด!
          </p>
        </div>
      </div>
    </div>
  )
}
