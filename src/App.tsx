

import React, { useState, useEffect, useCallback } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  LayoutDashboard, Users, BookOpen, GraduationCap, Settings, Search, Plus,
  Filter, FileText, ChevronRight, MoreVertical, Upload, Lock, Mail, EyeOff,
  Trash2, Star, Trophy, Zap, Home, BarChart2, Edit3, LogOut, ChevronLeft,
  CheckCircle, XCircle, HelpCircle, ShoppingBag, Target, TrendingUp,
  ArrowRight, Menu, X, Play, Award, Globe, BookMarked, Gamepad2, ClipboardList,
  User, BarChart, ChevronDown, RefreshCw, Clock, Flame, Heart, Volume2,
  Lightbulb, ImagePlus, AlignLeft, Hash, ToggleLeft,
} from 'lucide-react';

// ─── i18n ─────────────────────────────────────────────────────────────────────
type Lang = 'en' | 'si' | 'ta';

const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  en: {
    appName: 'EduLanka',
    tagline: 'Free Learning for Every Sri Lankan Child',
    startLearning: 'Start Learning',
    exploreResources: 'Explore Resources',
    home: 'Home',
    subjects: 'Subjects',
    games: 'Games',
    quizzes: 'Quizzes',
    about: 'About',
    login: 'Login',
    register: 'Register',
    mathematics: 'Mathematics',
    sinhalaLetters: 'Sinhala Letters',
    englishAlphabet: 'English Alphabet',
    generalKnowledge: 'General Knowledge',
    welcomeBack: 'Welcome back',
    dashboard: 'Dashboard',
    progress: 'Progress',
    profile: 'Profile',
    logout: 'Logout',
    continuelearning: 'Continue Learning',
    achievements: 'Achievements',
    recentActivity: 'Recent Activity',
  },
  si: {
    appName: 'එඩු ලංකා',
    tagline: 'සෑම ශ්‍රී ලාංකික දරුවෙකු සඳහාම නොමිලේ ඉගෙනීම',
    startLearning: 'ඉගෙනීම ආරම්භ කරන්න',
    exploreResources: 'සම්පත් ගවේෂණය කරන්න',
    home: 'මුල් පිටුව',
    subjects: 'විෂයයන්',
    games: 'ක්‍රීඩා',
    quizzes: 'ප්‍රශ්නාවලී',
    about: 'ගැන',
    login: 'පිවිසෙන්න',
    register: 'ලියාපදිංචි වන්න',
    mathematics: 'ගණිතය',
    sinhalaLetters: 'සිංහල අකුරු',
    englishAlphabet: 'ඉංග්‍රීසි හෝඩිය',
    generalKnowledge: 'සාමාන්‍ය දැනුම',
    welcomeBack: 'නැවත සාදරයෙන් පිළිගනිමු',
    dashboard: 'උපකරණ පුවරුව',
    progress: 'ප්‍රගතිය',
    profile: 'පැතිකඩ',
    logout: 'පිටවෙන්න',
    continuelearning: 'ඉගෙනීම දිගටම කරන්න',
    achievements: 'ජය ගැනීම්',
    recentActivity: 'මෑත කාලීන ක්‍රියාකාරකම්',
  },
  ta: {
    appName: 'எடு லங்கா',
    tagline: 'ஒவ்வொரு இலங்கை குழந்தைக்கும் இலவச கல்வி',
    startLearning: 'கற்கத் தொடங்கு',
    exploreResources: 'வளங்களை ஆராய்க',
    home: 'முகப்பு',
    subjects: 'பாடங்கள்',
    games: 'விளையாட்டுகள்',
    quizzes: 'வினாடி வினா',
    about: 'பற்றி',
    login: 'உள்நுழை',
    register: 'பதிவு செய்க',
    mathematics: 'கணிதம்',
    sinhalaLetters: 'சிங்கள எழுத்துகள்',
    englishAlphabet: 'ஆங்கில அகரவரிசை',
    generalKnowledge: 'பொது அறிவு',
    welcomeBack: 'மீண்டும் வரவேற்கிறோம்',
    dashboard: 'டாஷ்போர்டு',
    progress: 'முன்னேற்றம்',
    profile: 'சுயவிவரம்',
    logout: 'வெளியேறு',
    continuelearning: 'கற்கத் தொடர்க',
    achievements: 'சாதனைகள்',
    recentActivity: 'சமீபத்திய செயல்பாடு',
  },
};

function useT(lang: Lang) {
  return useCallback((key: string) => TRANSLATIONS[lang][key] ?? TRANSLATIONS.en[key] ?? key, [lang]);
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen =
  | 'landing'
  | 'student_login' | 'student_register' | 'student_forgot'
  | 'student_dashboard' | 'student_subjects' | 'student_grade'
  | 'student_lesson_list' | 'student_lesson'
  | 'student_games' | 'student_game_play'
  | 'student_quiz_select' | 'student_quiz' | 'student_quiz_result'
  | 'student_progress' | 'student_profile'
  | 'parent_login' | 'parent_dashboard' | 'parent_student'
  | 'admin_login' | 'admin_dashboard' | 'admin_users'
  | 'admin_content' | 'admin_add_question';

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [lang, setLang] = useState<Lang>('en');
  const t = useT(lang);
  const nav = (s: Screen) => setScreen(s);

  // Student shell wrapper
  if (screen.startsWith('student_') && screen !== 'student_login' && screen !== 'student_register' && screen !== 'student_forgot') {
    return <StudentShell screen={screen} nav={nav} lang={lang} setLang={setLang} t={t} />;
  }
  // Admin shell
  if (screen.startsWith('admin_') && screen !== 'admin_login') {
    return <AdminShell screen={screen} nav={nav} />;
  }
  // Parent shell
  if (screen.startsWith('parent_') && screen !== 'parent_login') {
    return <ParentShell screen={screen} nav={nav} />;
  }

  return (
    <div className="min-h-screen bg-[#FDFDF8] font-sans">
      {screen === 'landing' && <LandingPage nav={nav} lang={lang} setLang={setLang} t={t} />}
      {screen === 'student_login' && <StudentLogin nav={nav} t={t} />}
      {screen === 'student_register' && <StudentRegister nav={nav} t={t} />}
      {screen === 'student_forgot' && <ForgotPassword nav={nav} />}
      {screen === 'parent_login' && <ParentLogin nav={nav} />}
      {screen === 'admin_login' && <AdminLogin nav={nav} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LANDING PAGE
// ─────────────────────────────────────────────────────────────────────────────
function LandingPage({ nav, lang, setLang, t }: { nav: (s: Screen) => void; lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FDFDF8]">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mr-4 shrink-0">
            <ElephantMascot size={34} />
            <span className="font-extrabold text-xl text-blue-900">{t('appName')}</span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {(['home', 'subjects', 'games', 'quizzes', 'about'] as const).map(k => (
              <button key={k} className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors capitalize">
                {t(k)}
              </button>
            ))}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-3">
            {/* Language selector */}
            <div className="relative hidden md:block">
              <select
                value={lang}
                onChange={e => setLang(e.target.value as Lang)}
                className="appearance-none pl-8 pr-7 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white cursor-pointer focus:outline-none focus:border-blue-400"
              >
                <option value="en">English</option>
                <option value="si">සිංහල</option>
                <option value="ta">தமிழ்</option>
              </select>
              <Globe className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>

            <button onClick={() => nav('student_login')} className="hidden md:block px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              {t('login')}
            </button>
            <button onClick={() => nav('student_register')} className="hidden md:block px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition-colors shadow-sm">
              {t('register')}
            </button>
            <button onClick={() => setMenuOpen(v => !v)} className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
            {(['home', 'subjects', 'games', 'quizzes', 'about'] as const).map(k => (
              <button key={k} className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 capitalize">
                {t(k)}
              </button>
            ))}
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button onClick={() => nav('student_login')} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-center">{t('login')}</button>
              <button onClick={() => nav('student_register')} className="flex-1 py-2 rounded-xl bg-blue-600 text-sm font-semibold text-white text-center">{t('register')}</button>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 rounded-full px-4 py-1.5 text-xs font-bold mb-6 border border-yellow-200">
            🇱🇰 Free · For Every Child · No Login Required to Browse
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-[1.1] mb-6">
            {lang === 'en' && <>Learning made<br /><span className="text-blue-600">fun</span> & <span className="text-yellow-500">free</span> 🌟</>}
            {lang === 'si' && <>ඉගෙනීම <span className="text-blue-600">විනෝදජනක</span> හා <span className="text-yellow-500">නොමිලේ</span> 🌟</>}
            {lang === 'ta' && <>கற்றல் <span className="text-blue-600">மகிழ்ச்சியாக</span> & <span className="text-yellow-500">இலவசமாக</span> 🌟</>}
          </h1>
          <p className="text-slate-500 text-lg leading-relaxed mb-8 max-w-lg">{t('tagline')} — Maths, Sinhala, English &amp; more, with games and quizzes!</p>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => nav('student_register')} className="btn-chunky bg-yellow-400 shadow-[0_6px_0_#D97706] hover:bg-yellow-500 text-yellow-900 font-extrabold px-8 py-4 rounded-2xl text-base active:translate-y-1.5 active:shadow-none transition-all">
              🚀 {t('startLearning')}
            </button>
            <button className="px-8 py-4 rounded-2xl border-2 border-slate-200 font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700 transition-all text-base">
              {t('exploreResources')} →
            </button>
          </div>
          {/* Social proof */}
          <div className="flex items-center gap-4 mt-8">
            <div className="flex -space-x-2">
              {['🧒', '👧', '🧒🏽', '👦🏻', '👧🏾'].map((e, i) => (
                <span key={i} className="w-9 h-9 bg-white border-2 border-white rounded-full flex items-center justify-center text-base shadow-sm">{e}</span>
              ))}
            </div>
            <p className="text-sm text-slate-500 font-medium"><strong className="text-slate-800">12,000+</strong> students learning today</p>
          </div>
        </div>

        {/* Hero illustration */}
        <div className="flex-1 flex justify-center">
          <div className="relative">
            <div className="w-72 h-72 md:w-96 md:h-96 bg-gradient-to-br from-yellow-100 to-blue-100 rounded-[3rem] flex items-center justify-center shadow-xl">
              <ElephantMascot size={180} />
            </div>
            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 bg-white rounded-2xl p-3 shadow-lg border border-slate-100">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-extrabold text-slate-800 text-sm">4.9 / 5</span>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-3 shadow-lg border border-slate-100">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-orange-500" />
                <span className="font-extrabold text-slate-800 text-sm">Free Always</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Subjects Preview ── */}
      <section className="bg-white py-16 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">Explore {t('subjects')} 📚</h2>
            <p className="text-slate-500 text-lg">Colorful lessons covering every primary school subject</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {SUBJECTS_DATA.map(subj => (
              <div key={subj.id} onClick={() => nav('student_register')} className="cursor-pointer group bg-white rounded-[1.5rem] border-2 border-slate-100 p-6 hover:border-blue-200 hover:shadow-lg transition-all flex flex-col items-center gap-3 text-center">
                <div className={`w-16 h-16 ${subj.bgLight} rounded-2xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform`}>
                  {subj.emoji}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800">{t(subj.nameKey)}</h3>
                  <p className="text-slate-500 text-xs mt-1">{subj.lessonCount} lessons · {subj.quizCount} quizzes</p>
                </div>
                <span className={`text-xs font-bold ${subj.textColor} ${subj.bgLight} px-3 py-1 rounded-full`}>Start →</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Games Preview ── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">Fun {t('games')} 🎮</h2>
              <p className="text-slate-500">Play and learn at the same time</p>
            </div>
            <button className="hidden md:flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline">See all games <ArrowRight className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {GAMES_DATA.slice(0, 3).map(game => (
              <div key={game.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow group">
                <div className={`${game.heroBg} h-36 flex items-center justify-center text-6xl`}>{game.emoji}</div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-900">{game.title}</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${game.diffColor}`}>{game.difficulty}</span>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">{game.desc}</p>
                  <button onClick={() => nav('student_register')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                    <Play className="w-4 h-4 fill-white" /> Play Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3 text-center">Why EduLanka? ✨</h2>
          <p className="text-blue-200 text-center mb-12">Built specifically for Sri Lankan primary school children</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { emoji: '🆓', title: '100% Free', desc: 'No subscriptions. No hidden fees. Ever.' },
              { emoji: '🌐', title: '3 Languages', desc: 'English, Sinhala and Tamil support.' },
              { emoji: '🎮', title: 'Gamified', desc: 'Earn stars, badges and rewards for learning.' },
              { emoji: '📱', title: 'Works Everywhere', desc: 'Desktop, tablet, mobile — any device.' },
            ].map((b, i) => (
              <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-5 text-center">
                <span className="text-4xl mb-3 block">{b.emoji}</span>
                <h3 className="font-extrabold text-white mb-1">{b.title}</h3>
                <p className="text-blue-200 text-sm">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Portal CTA ── */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-10">Choose your portal</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { emoji: '🎒', title: 'I\'m a Student', desc: 'Start your learning journey today. It\'s free!', bg: 'bg-yellow-400', shadow: 'shadow-[0_6px_0_#D97706]', action: () => nav('student_register') },
              { emoji: '👩‍🏫', title: 'I\'m a Teacher', desc: 'Monitor your students\' progress and performance.', bg: 'bg-green-500', shadow: 'shadow-[0_6px_0_#16A34A]', action: () => nav('parent_login') },
              { emoji: '🛡️', title: 'I\'m an Admin', desc: 'Manage users, content, and system settings.', bg: 'bg-blue-600', shadow: 'shadow-[0_6px_0_#1D4ED8]', action: () => nav('admin_login') },
            ].map((p, i) => (
              <button key={i} onClick={p.action} className={`${p.bg} ${p.shadow} btn-chunky rounded-2xl p-7 flex flex-col items-center gap-3 text-center w-full hover:brightness-105 transition-all active:translate-y-1.5 active:shadow-none`}>
                <span className="text-5xl">{p.emoji}</span>
                <h3 className="text-xl font-extrabold text-white">{p.title}</h3>
                <p className="text-white/80 text-sm">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <ElephantMascot size={32} />
                <span className="font-extrabold text-lg">{t('appName')}</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">Free interactive learning for every Sri Lankan primary school child.</p>
            </div>
            {[
              { title: 'Learn', links: ['Mathematics', 'Sinhala Letters', 'English', 'General Knowledge'] },
              { title: 'Platform', links: ['Games', 'Quizzes', 'Progress Tracking', 'Achievements'] },
              { title: 'Portals', links: ['Student Login', 'Teacher Portal', 'Admin Console', 'Register Free'] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="font-bold text-slate-300 text-sm mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(l => <li key={l}><a href="#" className="text-slate-400 text-sm hover:text-white transition-colors">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-slate-500 text-sm">© 2026 EduLanka. Free for all Sri Lankan children. 🇱🇰</p>
            <div className="flex items-center gap-4 text-slate-500 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────
const SUBJECTS_DATA = [
  { id: 'math', emoji: '🧮', nameKey: 'mathematics', bgLight: 'bg-orange-100', textColor: 'text-orange-700', color: 'bg-orange-400', shadow: 'shadow-[0_6px_0_#EA580C]', hover: 'hover:bg-orange-500', progress: 72, lessonCount: 24, quizCount: 12 },
  { id: 'sinhala', emoji: '📝', nameKey: 'sinhalaLetters', bgLight: 'bg-purple-100', textColor: 'text-purple-700', color: 'bg-purple-400', shadow: 'shadow-[0_6px_0_#9333EA]', hover: 'hover:bg-purple-500', progress: 45, lessonCount: 30, quizCount: 15 },
  { id: 'english', emoji: '🔤', nameKey: 'englishAlphabet', bgLight: 'bg-cyan-100', textColor: 'text-cyan-700', color: 'bg-cyan-400', shadow: 'shadow-[0_6px_0_#0891B2]', hover: 'hover:bg-cyan-500', progress: 88, lessonCount: 26, quizCount: 13 },
  { id: 'gk', emoji: '🌍', nameKey: 'generalKnowledge', bgLight: 'bg-green-100', textColor: 'text-green-700', color: 'bg-green-400', shadow: 'shadow-[0_6px_0_#16A34A]', hover: 'hover:bg-green-500', progress: 55, lessonCount: 20, quizCount: 10 },
];

const GAMES_DATA = [
  { id: 'g1', title: 'Number Quest', desc: 'Solve fun maths puzzles!', emoji: '🧮', heroBg: 'bg-orange-100', difficulty: 'Easy', diffColor: 'bg-green-100 text-green-700' },
  { id: 'g2', title: 'Sinhala Letter Match', desc: 'Match Sinhala letters to pictures!', emoji: '📝', heroBg: 'bg-purple-100', difficulty: 'Medium', diffColor: 'bg-yellow-100 text-yellow-700' },
  { id: 'g3', title: 'Alphabet Adventure', desc: 'Journey through the English alphabet!', emoji: '🔤', heroBg: 'bg-cyan-100', difficulty: 'Easy', diffColor: 'bg-green-100 text-green-700' },
  { id: 'g4', title: 'Island Explorer', desc: 'Discover facts about Sri Lanka!', emoji: '🌍', heroBg: 'bg-green-100', difficulty: 'Hard', diffColor: 'bg-red-100 text-red-700' },
];

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT AUTH
// ─────────────────────────────────────────────────────────────────────────────
function StudentLogin({ nav, t }: { nav: (s: Screen) => void; t: (k: string) => string }) {
  const login = useFirebaseLogin(nav, 'student_dashboard');
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-sky-50 to-blue-100">
      {/* Left panel */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-yellow-400 to-orange-400 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 2px, transparent 2px)', backgroundSize: '30px 30px' }} />
        <div className="text-center relative z-10">
          <ElephantMascot size={140} />
          <h2 className="text-3xl font-extrabold text-white mt-6 mb-3">Welcome Back! 🌟</h2>
          <p className="text-white/80 text-lg font-medium">Ready to continue your learning adventure?</p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-xl max-w-md w-full border border-slate-100">
          <button onClick={() => nav('landing')} className="flex items-center gap-1 text-slate-400 hover:text-slate-700 text-sm font-semibold mb-6">
            <ChevronLeft className="w-4 h-4" /> Back to Home
          </button>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-1">{t('login')}</h2>
          <p className="text-slate-500 text-sm mb-8">Welcome back, student! 👋</p>

          <form onSubmit={login.handleSubmit}>
            <div className="space-y-4 mb-6">
              <FormField label="Email" type="email" placeholder="you@school.lk" icon={<Mail />} value={login.email} onChange={login.handleEmailChange} />
              <FormField label="Password" type="password" placeholder="••••••••" icon={<Lock />} value={login.password} onChange={login.handlePasswordChange} />
            </div>
          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer">
              <input type="checkbox" className="rounded" /> Remember me
            </label>
            <button onClick={() => nav('student_forgot')} className="text-sm font-semibold text-blue-600 hover:underline">Forgot password?</button>
          </div>

          {login.error && <p role="alert" className="mb-4 text-sm font-semibold text-red-600">{login.error}</p>}
          <button type="submit" disabled={login.isLoading} className="w-full btn-chunky bg-yellow-400 shadow-[0_5px_0_#D97706] hover:bg-yellow-500 disabled:opacity-60 text-yellow-900 font-extrabold py-4 rounded-2xl text-base active:translate-y-1 active:shadow-none transition-all mb-4">
            🚀 {t('startLearning')}
          </button>
          </form>

          <p className="text-center text-sm text-slate-500">Don't have an account? <button onClick={() => nav('student_register')} className="font-bold text-blue-600 hover:underline">{t('register')}</button></p>

          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col gap-2">
            <button onClick={() => nav('parent_login')} className="text-center text-xs text-slate-400 hover:text-slate-600 font-medium">Parent / Teacher? Sign in here →</button>
            <button onClick={() => nav('admin_login')} className="text-center text-xs text-slate-400 hover:text-slate-600 font-medium">Admin? Sign in here →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentRegister({ nav, t }: { nav: (s: Screen) => void; t: (k: string) => string }) {
  const [step, setStep] = useState(1);
  const [grade, setGrade] = useState('');
  const [language, setLanguage] = useState('en');
  const [profileError, setProfileError] = useState('');
  const register = useFirebaseRegister(() => setStep(2));

  const finishRegistration = async () => {
    if (!grade) {
      setProfileError('Please select your grade.');
      return;
    }
    if (!auth.currentUser) {
      setProfileError('Your account session expired. Please register again.');
      return;
    }

    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        email: auth.currentUser.email,
        displayName: register.name,
        role: 'student',
        grade,
        language,
        createdAt: new Date().toISOString(),
      });
      nav('student_dashboard');
    } catch (error) {
      console.error('Firestore profile error:', error);
      setProfileError('Your account was created, but the profile could not be saved. Please try again.');
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100 p-6">
      <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-xl max-w-md w-full border border-slate-100">
        <button onClick={() => nav('landing')} className="flex items-center gap-1 text-slate-400 hover:text-slate-700 text-sm font-semibold mb-4">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map(s => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{s}</div>
              {s < 2 && <div className={`flex-1 h-1 rounded-full ${step > s ? 'bg-blue-600' : 'bg-slate-100'}`} />}
            </React.Fragment>
          ))}
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 mb-1">{step === 1 ? 'Create Your Account 🎉' : 'Almost Done! 🌟'}</h2>
        <p className="text-slate-500 text-sm mb-6">{step === 1 ? 'Fill in your details to get started' : 'Choose your grade and language'}</p>

        {step === 1 ? (
          <form onSubmit={register.handleSubmit} className="space-y-4">
            <FormField label="Full Name" type="text" placeholder="e.g. Chamara Perera" icon={<User />} value={register.name} onChange={register.handleNameChange} required />
            <FormField label="Email" type="email" placeholder="you@school.lk" icon={<Mail />} value={register.email} onChange={register.handleEmailChange} />
            <FormField label="Password" type="password" placeholder="Create a strong password" icon={<Lock />} value={register.password} onChange={register.handlePasswordChange} />
            {register.error && <p role="alert" className="text-sm font-semibold text-red-600">{register.error}</p>}
            <button type="submit" disabled={register.isLoading} className="w-full btn-chunky bg-blue-600 shadow-[0_5px_0_#1D4ED8] hover:bg-blue-700 disabled:opacity-60 text-white font-extrabold py-4 rounded-2xl text-base active:translate-y-1 active:shadow-none transition-all">
              Next Step →
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Grade</label>
              <div className="grid grid-cols-5 gap-2">
                {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'].map(option => (
                  <button type="button" key={option} onClick={() => { setGrade(option); setProfileError(''); }} className={`py-3 rounded-xl border-2 font-extrabold transition-all ${grade === option ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50'}`}>
                    {option.replace('Grade ', '')}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Preferred Language</label>
              <div className="flex gap-2">
                {[{ code: 'en', label: 'English' }, { code: 'si', label: 'සිංහල' }, { code: 'ta', label: 'தமிழ்' }].map(l => (
                  <button type="button" key={l.code} onClick={() => setLanguage(l.code)} className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${language === l.code ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-blue-400'}`}>{l.label}</button>
                ))}
              </div>
            </div>
            {profileError && <p role="alert" className="text-sm font-semibold text-red-600">{profileError}</p>}
            <button onClick={finishRegistration} className="w-full btn-chunky bg-yellow-400 shadow-[0_5px_0_#D97706] hover:bg-yellow-500 text-yellow-900 font-extrabold py-4 rounded-2xl text-base active:translate-y-1 active:shadow-none transition-all">
              🚀 Start Learning Free!
            </button>
          </div>
        )}
        <p className="text-center text-sm text-slate-500 mt-4">Already have an account? <button onClick={() => nav('student_login')} className="font-bold text-blue-600 hover:underline">{t('login')}</button></p>
      </div>
    </div>
  );
}

function ForgotPassword({ nav }: { nav: (s: Screen) => void }) {
  const [sent, setSent] = useState(false);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100 p-6">
      <div className="bg-white rounded-[2rem] p-10 shadow-xl max-w-md w-full">
        <button onClick={() => nav('student_login')} className="flex items-center gap-1 text-slate-400 hover:text-slate-700 text-sm font-semibold mb-6">
          <ChevronLeft className="w-4 h-4" /> Back to Login
        </button>
        {sent ? (
          <div className="text-center py-6">
            <span className="text-6xl mb-4 block">📧</span>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Check your email!</h2>
            <p className="text-slate-500">We sent a password reset link to your email address.</p>
            <button onClick={() => nav('student_login')} className="mt-6 w-full bg-blue-600 text-white font-bold py-3 rounded-xl">Back to Login</button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Forgot Password?</h2>
            <p className="text-slate-500 text-sm mb-6">Enter your email and we'll send you a reset link.</p>
            <FormField label="Email" type="email" placeholder="you@school.lk" icon={<Mail />} />
            <button onClick={() => setSent(true)} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors">Send Reset Link</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT SHELL
// ─────────────────────────────────────────────────────────────────────────────
function StudentShell({ screen, nav, lang, setLang, t }: { screen: Screen; nav: (s: Screen) => void; lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const studentNavItems: { id: Screen; icon: React.ReactNode; label: string }[] = [
    { id: 'student_dashboard', icon: <Home />, label: t('home') },
    { id: 'student_subjects', icon: <BookOpen />, label: t('subjects') },
    { id: 'student_games', icon: <Gamepad2 />, label: t('games') },
    { id: 'student_quiz_select', icon: <ClipboardList />, label: t('quizzes') },
    { id: 'student_progress', icon: <BarChart2 />, label: t('progress') },
    { id: 'student_profile', icon: <User />, label: t('profile') },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDF8] font-sans flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-50 bg-white border-b-2 border-amber-100 px-4 md:px-6 h-14 flex items-center gap-3">
        <button className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100" onClick={() => setSidebarOpen(v => !v)}>
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <ElephantMascot size={30} />
          <span className="font-extrabold text-blue-900 text-base">{t('appName')}</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {studentNavItems.map(item => (
            <button key={item.id} onClick={() => nav(item.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${screen === item.id ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              {React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: 'w-4 h-4' })}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {/* Language selector */}
          <select value={lang} onChange={e => setLang(e.target.value as Lang)} className="appearance-none pl-2 pr-6 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white cursor-pointer focus:outline-none hidden md:block">
            <option value="en">EN</option>
            <option value="si">සි</option>
            <option value="ta">த</option>
          </select>
          {/* Stats */}
          <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-full px-2.5 py-1">
            <span className="text-sm">🪙</span>
            <span className="font-extrabold text-yellow-800 text-xs">340</span>
          </div>
          <div className="flex items-center gap-1 bg-orange-50 border border-orange-200 rounded-full px-2.5 py-1">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span className="font-extrabold text-orange-800 text-xs">7d</span>
          </div>
          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-extrabold text-amber-800 text-xs">11</span>
          </div>
          <button onClick={() => nav('student_login')} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <div className="relative bg-white w-64 h-full p-5 flex flex-col z-50 shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <ElephantMascot size={30} />
              <span className="font-extrabold text-blue-900">{t('appName')}</span>
            </div>
            <nav className="flex flex-col gap-1">
              {studentNavItems.map(item => (
                <button key={item.id} onClick={() => { nav(item.id); setSidebarOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${screen === item.id ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                  {React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5' })}
                  {item.label}
                </button>
              ))}
            </nav>
            <button onClick={() => nav('student_login')} className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 font-semibold text-sm">
              <LogOut className="w-5 h-5" /> {t('logout')}
            </button>
          </div>
        </div>
      )}

      {/* Bottom mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex">
        {studentNavItems.slice(0, 5).map(item => (
          <button key={item.id} onClick={() => nav(item.id)} className={`flex-1 flex flex-col items-center py-2 text-[10px] font-bold gap-1 transition-colors ${screen === item.id ? 'text-amber-600' : 'text-slate-400'}`}>
            {React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: `w-5 h-5 ${screen === item.id ? 'text-amber-500' : 'text-slate-400'}` })}
            {item.label}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {screen === 'student_dashboard' && <StudentDashboard nav={nav} t={t} />}
        {screen === 'student_subjects' && <SubjectsPage nav={nav} t={t} />}
        {screen === 'student_grade' && <GradeSelection nav={nav} />}
        {screen === 'student_lesson_list' && <LessonList nav={nav} />}
        {screen === 'student_lesson' && <LessonView nav={nav} />}
        {screen === 'student_games' && <GamesPage nav={nav} t={t} />}
        {screen === 'student_game_play' && <GamePlay nav={nav} />}
        {screen === 'student_quiz_select' && <QuizSelect nav={nav} t={t} />}
        {screen === 'student_quiz' && <QuizPlay nav={nav} />}
        {screen === 'student_quiz_result' && <QuizResult nav={nav} />}
        {screen === 'student_progress' && <ProgressPage nav={nav} t={t} />}
        {screen === 'student_profile' && <StudentProfile nav={nav} t={t} />}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT SCREENS
// ─────────────────────────────────────────────────────────────────────────────
function StudentDashboard({ nav, t }: { nav: (s: Screen) => void; t: (k: string) => string }) {
  const { userName } = useCurrentUserProfile();

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
      {/* Greeting hero */}
      <div className="bg-gradient-to-r from-yellow-400 to-amber-400 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-4 mb-8 shadow-[0_6px_0_#D97706]">
        <ElephantMascot size={80} className="shrink-0" />
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-extrabold text-amber-900">{t('welcomeBack')}, {userName}! 👋</h2>
          <p className="text-amber-800 font-semibold mt-1">You have <strong>3 lessons</strong> to continue. Let's go!</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
            <Chip icon={<Trophy />} label="Level 4 Learner" color="bg-white/60 text-amber-900" />
            <Chip icon={<Flame />} label="7-day streak 🔥" color="bg-white/60 text-amber-900" />
            <Chip icon={<Star />} label="11 Stars ⭐" color="bg-white/60 text-amber-900" />
          </div>
        </div>
        <button onClick={() => nav('student_subjects')} className="ml-auto shrink-0 hidden md:flex items-center gap-2 bg-white/80 hover:bg-white text-amber-900 font-extrabold px-5 py-2.5 rounded-xl transition-colors">
          {t('continuelearning')} <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Continue learning */}
      <h3 className="text-xl font-extrabold text-slate-800 mb-4">Continue Learning 📖</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {[
          { subject: 'Mathematics', lesson: 'Addition & Subtraction', emoji: '🧮', progress: 65, color: 'bg-orange-400', shadow: 'shadow-[0_4px_0_#EA580C]' },
          { subject: 'English Alphabet', lesson: 'Vowels: A, E, I, O, U', emoji: '🔤', progress: 80, color: 'bg-cyan-400', shadow: 'shadow-[0_4px_0_#0891B2]' },
        ].map((l, i) => (
          <button key={i} onClick={() => nav('student_lesson')} className={`${l.color} ${l.shadow} btn-chunky rounded-2xl p-5 flex items-center gap-4 text-left hover:brightness-105 transition-all active:translate-y-1 active:shadow-none`}>
            <span className="text-4xl">{l.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-xs font-bold uppercase tracking-wide">{l.subject}</p>
              <h4 className="text-white font-extrabold truncate">{l.lesson}</h4>
              <div className="mt-2 w-full bg-black/20 rounded-full h-1.5">
                <div className="bg-white rounded-full h-1.5" style={{ width: `${l.progress}%` }} />
              </div>
              <p className="text-white/70 text-xs mt-1">{l.progress}% complete</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/80 shrink-0" />
          </button>
        ))}
      </div>

      {/* Subjects grid */}
      <h3 className="text-xl font-extrabold text-slate-800 mb-4">Your Subjects 📚</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {SUBJECTS_DATA.map(subj => (
          <button key={subj.id} onClick={() => nav('student_lesson_list')} className={`${subj.color} ${subj.shadow} ${subj.hover} btn-chunky rounded-[1.5rem] p-5 flex flex-col items-start gap-3 transition-all active:translate-y-1.5 active:shadow-none`}>
            <span className="text-4xl">{subj.emoji}</span>
            <div>
              <h4 className="font-extrabold text-white text-sm">{t(subj.nameKey)}</h4>
              <p className="text-white/70 text-xs">{subj.lessonCount} lessons</p>
            </div>
            <div className="w-full bg-black/20 rounded-full h-1.5">
              <div className="bg-white rounded-full h-1.5" style={{ width: `${subj.progress}%` }} />
            </div>
          </button>
        ))}
      </div>

      {/* Quick links row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Play Games', emoji: '🎮', action: () => nav('student_games'), color: 'bg-purple-50 border-purple-200 text-purple-700' },
          { label: 'Take a Quiz', emoji: '✅', action: () => nav('student_quiz_select'), color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { label: 'View Progress', emoji: '📊', action: () => nav('student_progress'), color: 'bg-green-50 border-green-200 text-green-700' },
          { label: 'Achievements', emoji: '🏆', action: () => nav('student_progress'), color: 'bg-amber-50 border-amber-200 text-amber-700' },
        ].map((q, i) => (
          <button key={i} onClick={q.action} className={`border-2 rounded-2xl p-4 flex items-center gap-3 font-bold text-sm transition-all hover:shadow-md ${q.color}`}>
            <span className="text-2xl">{q.emoji}</span> {q.label}
          </button>
        ))}
      </div>

      {/* Recent activity */}
      <h3 className="text-xl font-extrabold text-slate-800 mb-4">{t('recentActivity')}</h3>
      <div className="space-y-3">
        {[
          { emoji: '✅', text: 'Completed Maths Quiz — scored 9/10', time: '10 mins ago', color: 'bg-green-100' },
          { emoji: '📖', text: 'Started lesson: Sinhala Vowels', time: '1 hour ago', color: 'bg-purple-100' },
          { emoji: '🏆', text: 'Earned "Star Collector" badge', time: 'Yesterday', color: 'bg-yellow-100' },
        ].map((a, i) => (
          <div key={i} className="flex items-center gap-4 bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-sm transition-shadow">
            <div className={`w-10 h-10 ${a.color} rounded-full flex items-center justify-center text-xl shrink-0`}>{a.emoji}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-sm truncate">{a.text}</p>
              <p className="text-slate-400 text-xs">{a.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubjectsPage({ nav, t }: { nav: (s: Screen) => void; t: (k: string) => string }) {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{t('subjects')}</h1>
      <p className="text-slate-500 mb-8">Choose a subject to start or continue learning.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SUBJECTS_DATA.map(subj => (
          <div key={subj.id} className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden hover:shadow-lg transition-all group">
            <div className={`${subj.color} h-24 flex items-center gap-6 px-6`}>
              <span className="text-5xl">{subj.emoji}</span>
              <div>
                <h3 className="text-white font-extrabold text-xl">{t(subj.nameKey)}</h3>
                <p className="text-white/70 text-sm">{subj.lessonCount} lessons · {subj.quizCount} quizzes</p>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-600">Your Progress</span>
                <span className="text-sm font-extrabold text-slate-900">{subj.progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 mb-4">
                <div className={`h-2.5 rounded-full ${subj.color}`} style={{ width: `${subj.progress}%` }} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => nav('student_grade')} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm transition-colors">
                  Choose Grade
                </button>
                <button onClick={() => nav('student_lesson_list')} className={`flex-1 ${subj.color} ${subj.shadow} btn-chunky hover:brightness-105 text-white font-bold py-2.5 rounded-xl text-sm transition-all active:translate-y-1 active:shadow-none`}>
                  {t('continuelearning')} →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GradeSelection({ nav }: { nav: (s: Screen) => void }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <button onClick={() => nav('student_subjects')} className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-semibold text-sm mb-6">
        <ChevronLeft className="w-4 h-4" /> Back to Subjects
      </button>
      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Select Your Grade</h1>
      <p className="text-slate-500 mb-8">Choose the grade level for this subject.</p>
      <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(g => (
          <button key={g} onClick={() => nav('student_lesson_list')} className="bg-white border-2 border-slate-200 hover:border-blue-400 hover:shadow-lg rounded-2xl p-6 flex flex-col items-center gap-2 transition-all group">
            <span className="text-3xl font-extrabold text-slate-800 group-hover:text-blue-600">{g}</span>
            <span className="text-xs font-bold text-slate-400">Grade {g}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function LessonList({ nav }: { nav: (s: Screen) => void }) {
  const lessons = [
    { title: 'Introduction to Numbers', done: true, locked: false },
    { title: 'Counting 1 to 10', done: true, locked: false },
    { title: 'Addition — Part 1', done: false, locked: false },
    { title: 'Addition — Part 2', done: false, locked: true },
    { title: 'Subtraction Basics', done: false, locked: true },
  ];
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={() => nav('student_subjects')} className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-semibold text-sm mb-6">
        <ChevronLeft className="w-4 h-4" /> Back to Subjects
      </button>
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-3xl">🧮</div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Mathematics — Grade 3</h1>
          <p className="text-slate-500 text-sm mt-1">5 lessons · 3 quizzes · 2 completed</p>
        </div>
      </div>
      <div className="space-y-3">
        {lessons.map((l, i) => (
          <button
            key={i}
            onClick={() => !l.locked && nav('student_lesson')}
            disabled={l.locked}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
              l.done ? 'border-green-200 bg-green-50' :
              l.locked ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed' :
              'border-blue-200 bg-blue-50 hover:shadow-md'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm shrink-0 ${
              l.done ? 'bg-green-500 text-white' : l.locked ? 'bg-slate-200 text-slate-400' : 'bg-blue-500 text-white'
            }`}>
              {l.done ? '✓' : l.locked ? '🔒' : i + 1}
            </div>
            <div className="flex-1">
              <p className={`font-bold ${l.done ? 'text-green-800' : l.locked ? 'text-slate-400' : 'text-slate-800'}`}>{l.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{l.done ? 'Completed ✅' : l.locked ? 'Locked — complete previous lesson' : 'Ready to start'}</p>
            </div>
            {!l.locked && <ChevronRight className={`w-5 h-5 ${l.done ? 'text-green-400' : 'text-blue-400'} shrink-0`} />}
          </button>
        ))}
      </div>
    </div>
  );
}

function LessonView({ nav }: { nav: (s: Screen) => void }) {
  const [page, setPage] = useState(0);
  const pages = [
    { title: 'What is Addition?', content: 'Addition is the process of combining two or more numbers together to find their total, or "sum".', example: '3 + 4 = 7 🍎🍎🍎 + 🍎🍎🍎🍎 = 🍎🍎🍎🍎🍎🍎🍎', illustration: '➕' },
    { title: 'Let\'s Practice!', content: 'If you have 5 mangoes 🥭 and your friend gives you 3 more, how many mangoes do you have in total?', example: '5 + 3 = ?', illustration: '🥭' },
    { title: 'Well Done! 🎉', content: 'Great job learning addition! Now let\'s take a quick quiz to check what you\'ve learned.', example: '5 + 3 = 8', illustration: '🏆' },
  ];
  const current = pages[page];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => nav('student_lesson_list')} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
            <span>Lesson 3 · Addition Part 1</span>
            <span>{page + 1} / {pages.length}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div className="bg-orange-400 h-2.5 rounded-full transition-all" style={{ width: `${((page + 1) / pages.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-md border border-slate-100 mb-6 text-center">
        <div className="text-7xl mb-6">{current.illustration}</div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-4">{current.title}</h2>
        <p className="text-slate-600 text-lg leading-relaxed mb-6">{current.content}</p>
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4">
          <p className="text-orange-900 font-extrabold text-2xl">{current.example}</p>
        </div>
      </div>

      <div className="flex gap-3">
        {page > 0 && (
          <button onClick={() => setPage(p => p - 1)} className="flex items-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-colors">
            <ChevronLeft className="w-5 h-5" /> Previous
          </button>
        )}
        {page < pages.length - 1 ? (
          <button onClick={() => setPage(p => p + 1)} className="flex-1 btn-chunky bg-orange-400 shadow-[0_5px_0_#EA580C] hover:bg-orange-500 text-white font-extrabold py-3.5 rounded-2xl active:translate-y-1 active:shadow-none transition-all">
            Next →
          </button>
        ) : (
          <button onClick={() => nav('student_quiz')} className="flex-1 btn-chunky bg-green-500 shadow-[0_5px_0_#16A34A] hover:bg-green-600 text-white font-extrabold py-3.5 rounded-2xl active:translate-y-1 active:shadow-none transition-all">
            ✅ Complete Lesson!
          </button>
        )}
      </div>
    </div>
  );
}

function GamesPage({ nav, t }: { nav: (s: Screen) => void; t: (k: string) => string }) {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{t('games')} 🎮</h1>
      <p className="text-slate-500 mb-8">Play educational games and earn coins!</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {GAMES_DATA.map(game => (
          <div key={game.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow">
            <div className={`${game.heroBg} h-32 flex items-center justify-center text-7xl`}>{game.emoji}</div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-extrabold text-slate-900 text-lg">{game.title}</h3>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${game.diffColor}`}>{game.difficulty}</span>
              </div>
              <p className="text-slate-500 text-sm mb-4">{game.desc}</p>
              <button onClick={() => nav('student_game_play')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                <Play className="w-4 h-4 fill-white" /> Play Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GamePlay({ nav }: { nav: (s: Screen) => void }) {
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const options = [7, 8, 9, 10];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => nav('student_games')} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200">
          <X className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
            <span>Number Quest</span>
            <span className="text-amber-600">Score: {score}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 h-3 rounded-full" style={{ width: '40%' }} />
          </div>
        </div>
        <div className="flex items-center gap-1 bg-orange-50 rounded-full px-3 py-1.5 border border-orange-200">
          <Clock className="w-3.5 h-3.5 text-orange-500" />
          <span className="font-extrabold text-orange-700 text-sm">0:45</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-md border border-slate-100 text-center mb-6">
        <p className="text-slate-500 text-sm font-bold uppercase tracking-wide mb-4">What is the answer?</p>
        <p className="text-5xl font-extrabold text-slate-900">3 + 4 = ?</p>
        <div className="flex justify-center gap-4 mt-4">
          {['🍎🍎🍎', '🍎🍎🍎🍎'].map((s, i) => <span key={i} className="text-2xl">{s}</span>)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {options.map((opt, i) => {
          const colors = ['bg-orange-400 shadow-[0_5px_0_#EA580C]', 'bg-green-400 shadow-[0_5px_0_#16A34A]', 'bg-blue-400 shadow-[0_5px_0_#0369A1]', 'bg-purple-400 shadow-[0_5px_0_#9333EA]'];
          const isSelected = selected === i;
          return (
            <button
              key={i}
              onClick={() => { setSelected(i); if (opt === 7) setScore(s => s + 10); }}
              className={`${colors[i]} ${isSelected ? 'ring-4 ring-white/60' : ''} btn-chunky rounded-2xl p-6 text-3xl font-extrabold text-white hover:brightness-105 transition-all active:translate-y-1 active:shadow-none`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className={`mt-4 p-4 rounded-2xl text-center font-extrabold text-lg ${options[selected] === 7 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {options[selected] === 7 ? '🎉 Correct! +10 points' : '❌ Try again! The answer is 7'}
        </div>
      )}
    </div>
  );
}

function QuizSelect({ nav, t }: { nav: (s: Screen) => void; t: (k: string) => string }) {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{t('quizzes')} ✅</h1>
      <p className="text-slate-500 mb-8">Test your knowledge and earn stars!</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[
          { title: 'Maths Week 3 Quiz', subject: 'Mathematics', emoji: '🧮', questions: 10, time: '10 min', stars: 3, color: 'border-orange-200 bg-orange-50' },
          { title: 'English Phonics Quiz', subject: 'English', emoji: '🔤', questions: 8, time: '8 min', stars: 2, color: 'border-cyan-200 bg-cyan-50' },
          { title: 'Sinhala Vowels Quiz', subject: 'Sinhala', emoji: '📝', questions: 12, time: '12 min', stars: 0, color: 'border-purple-200 bg-purple-50' },
          { title: 'Sri Lanka General Knowledge', subject: 'Gen. Knowledge', emoji: '🌍', questions: 15, time: '15 min', stars: 0, color: 'border-green-200 bg-green-50' },
        ].map((q, i) => (
          <div key={i} className={`rounded-2xl border-2 p-5 ${q.color}`}>
            <div className="flex items-start gap-4 mb-4">
              <span className="text-4xl">{q.emoji}</span>
              <div className="flex-1">
                <h3 className="font-extrabold text-slate-900">{q.title}</h3>
                <p className="text-slate-500 text-sm">{q.subject}</p>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3].map(s => <Star key={s} className={`w-4 h-4 ${s <= q.stars ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />)}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-500 mb-4">
              <span>📋 {q.questions} questions</span>
              <span>⏱ {q.time}</span>
              {q.stars > 0 && <span className="text-green-600">✅ Attempted</span>}
            </div>
            <button onClick={() => nav('student_quiz')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl transition-colors">
              {q.stars > 0 ? 'Retake Quiz' : 'Start Quiz'} →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const QUIZ_QS = [
  { q: 'What is 5 + 3?', options: ['6', '7', '8', '9'], correct: 2, hint: 'Count on your fingers! 5 fingers, then 3 more.' },
  { q: 'Which number comes after 9?', options: ['8', '10', '11', '7'], correct: 1, hint: 'Think of the number line! 1, 2, 3... 🔢' },
  { q: 'What is 10 - 4?', options: ['5', '6', '7', '8'], correct: 1, hint: 'Start at 10, count back 4 steps. 🤚' },
];

function QuizPlay({ nav }: { nav: (s: Screen) => void }) {
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const q = QUIZ_QS[qIdx];
  const COLORS = ['bg-orange-400 shadow-[0_5px_0_#EA580C]', 'bg-green-400 shadow-[0_5px_0_#16A34A]', 'bg-blue-400 shadow-[0_5px_0_#0369A1]', 'bg-purple-400 shadow-[0_5px_0_#9333EA]'];

  const handleNext = () => {
    if (qIdx < QUIZ_QS.length - 1) {
      setQIdx(i => i + 1);
      setSelected(null);
      setSubmitted(false);
      setShowHint(false);
    } else {
      nav('student_quiz_result');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col min-h-[calc(100vh-56px)]">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => nav('student_quiz_select')} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200">
          <X className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5">
            <span>Question {qIdx + 1} of {QUIZ_QS.length}</span>
            <span className="text-amber-600">🪙 +{score * 10} coins</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div className="bg-gradient-to-r from-amber-400 to-orange-400 h-3 rounded-full transition-all" style={{ width: `${((qIdx) / QUIZ_QS.length) * 100}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-1 bg-orange-50 border border-orange-200 rounded-full px-3 py-1.5">
          <Clock className="w-3.5 h-3.5 text-orange-500" />
          <span className="font-extrabold text-orange-700 text-sm">0:30</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 mb-4 flex-shrink-0">
        <p className="text-xl font-extrabold text-slate-900 leading-snug">{q.q}</p>
      </div>

      {showHint && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
          <ElephantMascot size={36} className="shrink-0" />
          <p className="text-blue-800 font-semibold text-sm">{q.hint}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6 flex-1">
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = submitted && i === q.correct;
          const isWrong = submitted && isSelected && i !== q.correct;
          let cls = `${COLORS[i]} btn-chunky rounded-2xl p-5 flex items-center justify-center gap-2 text-white font-extrabold text-lg transition-all active:translate-y-1 active:shadow-none`;
          if (isCorrect) cls = 'bg-green-500 rounded-2xl p-5 flex items-center justify-center gap-2 text-white font-extrabold text-lg ring-4 ring-green-300';
          else if (isWrong) cls = 'bg-red-400 rounded-2xl p-5 flex items-center justify-center gap-2 text-white font-extrabold text-lg';
          else if (isSelected && !submitted) cls += ' ring-4 ring-white/50';

          return (
            <button key={i} onClick={() => !submitted && setSelected(i)} className={cls}>
              <span className="w-7 h-7 bg-white/30 rounded-lg flex items-center justify-center font-extrabold text-sm shrink-0">{['A','B','C','D'][i]}</span>
              {opt}
              {isCorrect && <CheckCircle className="w-5 h-5 ml-auto shrink-0" />}
              {isWrong && <XCircle className="w-5 h-5 ml-auto shrink-0" />}
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button onClick={() => setShowHint(v => !v)} className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl px-5 py-3.5 font-bold text-blue-700 text-sm">
          <HelpCircle className="w-5 h-5" /> Hint
        </button>
        <button
          onClick={() => { if (!submitted) { setSubmitted(true); if (selected === q.correct) setScore(s => s + 1); } else { handleNext(); } }}
          disabled={selected === null}
          className={`flex-1 py-4 rounded-2xl font-extrabold text-base transition-all shadow-[0_5px_0_#D97706] btn-chunky active:translate-y-1 active:shadow-none ${
            selected === null ? 'bg-slate-200 text-slate-400 shadow-[0_5px_0_#CBD5E1] cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900'
          }`}
        >
          {submitted ? (qIdx < QUIZ_QS.length - 1 ? 'Next Question →' : '🏁 See Results') : '✅ Submit'}
        </button>
      </div>
    </div>
  );
}

function QuizResult({ nav }: { nav: (s: Screen) => void }) {
  const score = 8; const total = 10;
  const pct = Math.round((score / total) * 100);
  const rating = pct >= 80 ? { label: 'Excellent!', emoji: '🏆', stars: 3 } : pct >= 60 ? { label: 'Good Job!', emoji: '🎉', stars: 2 } : { label: 'Keep Trying!', emoji: '💪', stars: 1 };

  return (
    <div className="max-w-lg mx-auto px-4 py-10 flex flex-col items-center text-center">
      <span className="text-6xl mb-3 block">{rating.emoji}</span>
      <h2 className="text-4xl font-extrabold text-slate-900 mb-1">{rating.label}</h2>
      <p className="text-slate-500 font-semibold mb-6">You scored {score} out of {total}</p>

      <div className="flex gap-3 mb-6">
        {[1, 2, 3].map(s => <Star key={s} className={`w-14 h-14 drop-shadow-lg ${s <= rating.stars ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200 fill-slate-200'}`} />)}
      </div>

      {/* Score circle */}
      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex flex-col items-center justify-center mb-8 shadow-xl">
        <span className="text-white font-extrabold text-4xl">{pct}%</span>
        <span className="text-blue-200 text-xs font-bold">Score</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 w-full mb-8">
        <StatBox value={score.toString()} label="Correct ✅" color="bg-green-50 border-green-200 text-green-800" />
        <StatBox value={(total - score).toString()} label="Wrong ❌" color="bg-red-50 border-red-200 text-red-800" />
        <StatBox value={`+${score * 10}`} label="Coins 🪙" color="bg-yellow-50 border-yellow-200 text-yellow-800" />
      </div>

      {/* Performance summary */}
      <div className="w-full bg-white border border-slate-100 rounded-2xl p-5 mb-6 text-left">
        <h4 className="font-extrabold text-slate-800 mb-3">Performance Summary</h4>
        {pct >= 80 ? (
          <p className="text-green-700 font-semibold text-sm">🌟 Outstanding! You have a strong understanding of addition. Keep it up!</p>
        ) : pct >= 60 ? (
          <p className="text-amber-700 font-semibold text-sm">👍 Good effort! Review questions 4 and 7 to improve your score.</p>
        ) : (
          <p className="text-red-700 font-semibold text-sm">💡 Don't give up! Review the lesson on addition before trying again.</p>
        )}
      </div>

      {/* Badge earned */}
      <div className="bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-300 rounded-2xl p-4 w-full mb-8 flex items-center gap-4">
        <span className="text-4xl">🥇</span>
        <div className="text-left">
          <p className="font-extrabold text-amber-900">Badge Earned!</p>
          <p className="text-amber-700 text-sm">"Maths Champion" — Complete 3 quizzes</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full">
        <button onClick={() => nav('student_quiz')} className="w-full btn-chunky bg-blue-600 shadow-[0_5px_0_#1D4ED8] hover:bg-blue-700 text-white font-extrabold py-4 rounded-2xl active:translate-y-1 active:shadow-none transition-all">
          <RefreshCw className="w-4 h-4 inline mr-2" /> Try Again
        </button>
        <button onClick={() => nav('student_dashboard')} className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold py-3.5 rounded-2xl transition-all">
          🏘️ Back to Dashboard
        </button>
      </div>
    </div>
  );
}

function ProgressPage({ nav, t }: { nav: (s: Screen) => void; t: (k: string) => string }) {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{t('progress')} 📊</h1>
      <p className="text-slate-500 mb-8">Track your learning journey and achievements.</p>

      {/* Overall progress */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 mb-8 text-white">
        <h3 className="font-extrabold text-blue-100 text-sm uppercase tracking-wide mb-4">Overall Progress</h3>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-28 h-28 rounded-full bg-white/20 flex flex-col items-center justify-center shrink-0">
            <span className="text-4xl font-extrabold">64%</span>
            <span className="text-blue-200 text-xs">Overall</span>
          </div>
          <div className="flex-1 w-full space-y-3">
            {SUBJECTS_DATA.map(s => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="text-xl w-7 shrink-0">{s.emoji}</span>
                <div className="flex-1 bg-white/20 rounded-full h-2.5">
                  <div className="bg-white rounded-full h-2.5 transition-all" style={{ width: `${s.progress}%` }} />
                </div>
                <span className="text-white font-bold text-sm w-10 text-right">{s.progress}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { emoji: '📖', label: 'Lessons Done', value: '18' },
          { emoji: '✅', label: 'Quizzes Taken', value: '12' },
          { emoji: '🎮', label: 'Games Played', value: '24' },
          { emoji: '⏱', label: 'Learning Time', value: '14h' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col items-center gap-2 text-center shadow-sm">
            <span className="text-3xl">{s.emoji}</span>
            <span className="text-2xl font-extrabold text-slate-900">{s.value}</span>
            <span className="text-slate-500 text-xs font-semibold">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <h3 className="text-xl font-extrabold text-slate-800 mb-4">{t('achievements')} 🏆</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { emoji: '⭐', label: 'Star Collector', sub: '10 stars', earned: true },
          { emoji: '🔥', label: 'On Fire!', sub: '7-day streak', earned: true },
          { emoji: '📚', label: 'Bookworm', sub: '20 lessons', earned: true },
          { emoji: '🥇', label: 'Top Score', sub: '100% Maths', earned: true },
          { emoji: '🎯', label: 'Quiz Master', sub: '10 quizzes', earned: false },
          { emoji: '🚀', label: 'Speed Learner', sub: 'Finish 5 fast', earned: false },
          { emoji: '🌈', label: 'All Subjects', sub: 'Try all 4', earned: false },
          { emoji: '👑', label: 'Champion', sub: 'Level 5', earned: false },
        ].map((a, i) => (
          <div key={i} className={`rounded-2xl p-4 flex flex-col items-center gap-2 text-center border-2 transition-all ${a.earned ? 'bg-yellow-50 border-yellow-200' : 'bg-slate-50 border-slate-200 opacity-50'}`}>
            <span className="text-3xl">{a.emoji}</span>
            <div>
              <p className="font-extrabold text-slate-800 text-xs">{a.label}</p>
              <p className="text-slate-400 text-[10px]">{a.sub}</p>
            </div>
            {a.earned && <span className="text-[10px] font-bold text-yellow-700 bg-yellow-200 px-2 py-0.5 rounded-full">Earned!</span>}
          </div>
        ))}
      </div>

      {/* Learning milestones */}
      <h3 className="text-xl font-extrabold text-slate-800 mb-4">Learning Milestones 🗺️</h3>
      <div className="space-y-3">
        {[
          { label: 'Started EduLanka', done: true, date: 'Sep 1, 2026' },
          { label: 'Completed first lesson', done: true, date: 'Sep 2, 2026' },
          { label: 'Reached Level 4', done: true, date: 'Sep 15, 2026' },
          { label: 'Complete 5 subjects', done: false, date: 'In progress' },
          { label: 'Reach Level 10', done: false, date: 'Not yet' },
        ].map((m, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.done ? 'bg-green-500' : 'bg-slate-200'}`}>
              {m.done ? <CheckCircle className="w-4 h-4 text-white" /> : <Hash className="w-4 h-4 text-slate-400" />}
            </div>
            <div className="flex-1">
              <p className={`font-semibold text-sm ${m.done ? 'text-slate-800' : 'text-slate-400'}`}>{m.label}</p>
            </div>
            <span className={`text-xs font-bold ${m.done ? 'text-green-600' : 'text-slate-400'}`}>{m.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentProfile({ nav, t }: { nav: (s: Screen) => void; t: (k: string) => string }) {
  const { userName, grade } = useCurrentUserProfile();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-8">{t('profile')}</h1>

      {/* Profile card */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl p-6 mb-8 flex items-center gap-6 text-white">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-4xl shrink-0 shadow-lg">🧒</div>
        <div>
          <h2 className="text-2xl font-extrabold">{userName}</h2>
          <p className="text-blue-200">{grade || 'Student'}</p>
          <div className="flex gap-2 mt-2">
            <Chip icon={<Zap />} label="Level 4" color="bg-white/20 text-white" />
            <Chip icon={<Star />} label="11 Stars" color="bg-white/20 text-white" />
          </div>
        </div>
        <button className="ml-auto bg-white/20 hover:bg-white/30 rounded-xl p-2.5 transition-colors">
          <Edit3 className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
        <h3 className="font-extrabold text-slate-800 px-6 py-4 border-b border-slate-100">Account Settings</h3>
        {[
          { label: 'Full Name', value: 'Chamara Perera', icon: <User /> },
          { label: 'Email', value: 'chamara@school.lk', icon: <Mail /> },
          { label: 'Grade', value: 'Grade 3', icon: <GraduationCap /> },
          { label: 'Language', value: 'English', icon: <Globe /> },
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
              {React.cloneElement(f.icon as React.ReactElement<{ className?: string }>, { className: 'w-4 h-4' })}
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-400">{f.label}</p>
              <p className="font-semibold text-slate-800">{f.value}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </div>
        ))}
      </div>

      <button onClick={() => nav('student_login')} className="w-full flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-600 font-bold py-3.5 rounded-2xl hover:bg-red-100 transition-colors">
        <LogOut className="w-4 h-4" /> {t('logout')}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PARENT / TEACHER PORTAL
// ─────────────────────────────────────────────────────────────────────────────
function ParentLogin({ nav }: { nav: (s: Screen) => void }) {
  const login = useFirebaseLogin(nav, 'parent_dashboard');
  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden">
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-green-700 to-teal-800 p-12 flex-col text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <GraduationCap className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-2xl">EduLanka</span>
        </div>
        <div className="mt-auto mb-auto">
          <p className="text-green-200 font-bold text-xs uppercase tracking-widest mb-4">Parent / Teacher Portal</p>
          <h1 className="text-5xl font-extrabold leading-tight mb-6">Monitor your child's learning journey</h1>
          <p className="text-green-100 text-lg leading-relaxed">Track progress, view quiz scores, and stay connected with your student's education on EduLanka.</p>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-2xl p-4 flex items-center gap-3">
          <Users className="w-5 h-5 text-green-300 shrink-0" />
          <p className="text-sm text-green-100">Trusted by 2,400+ teachers and parents across Sri Lanka</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white rounded-[2rem] p-10 shadow-xl max-w-md w-full border border-slate-100">
          <button onClick={() => nav('landing')} className="flex items-center gap-1 text-slate-400 hover:text-slate-700 text-sm font-semibold mb-6">
            <ChevronLeft className="w-4 h-4" /> Back to Home
          </button>
          <h2 className="text-3xl font-bold text-slate-900 mb-1">Parent / Teacher Login</h2>
          <p className="text-slate-500 text-sm mb-8">Access your student monitoring dashboard.</p>
          <form onSubmit={login.handleSubmit}>
          <div className="space-y-5 mb-6">
            <FormField label="Email" type="email" placeholder="teacher@school.lk" icon={<Mail />} value={login.email} onChange={login.handleEmailChange} />
            <FormField label="Password" type="password" placeholder="••••••••" icon={<Lock />} value={login.password} onChange={login.handlePasswordChange} />
          </div>
          {login.error && <p role="alert" className="mb-4 text-sm font-semibold text-red-600">{login.error}</p>}
          <button type="submit" disabled={login.isLoading} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-sm">
            Sign In to Dashboard
          </button>
          </form>
          <p className="text-center text-xs text-slate-400 mt-4">Don't have an account? <span className="text-green-600 font-semibold cursor-pointer hover:underline">Register here</span></p>
        </div>
      </div>
    </div>
  );
}

const PARENT_NAV: { id: Screen; icon: React.ReactNode; label: string }[] = [
  { id: 'parent_dashboard', icon: <LayoutDashboard />, label: 'Dashboard' },
  { id: 'parent_student', icon: <Users />, label: 'Students' },
];

function ParentShell({ screen, nav }: { screen: Screen; nav: (s: Screen) => void }) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="w-[240px] border-r border-slate-200 bg-white flex flex-col shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-green-900 leading-tight">EduLanka</h1>
              <p className="text-[10px] font-bold text-slate-400 tracking-wider">TEACHER PORTAL</p>
            </div>
          </div>
        </div>
        <div className="px-4 pb-4">
          <div className="bg-green-50 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-green-200 rounded-full flex items-center justify-center font-bold text-green-800 text-sm shrink-0">NK</div>
            <div><p className="text-sm font-bold text-slate-800">Nimal Kumara</p><p className="text-xs text-slate-500">Grade 3 Teacher</p></div>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {PARENT_NAV.map(item => (
            <button key={item.id} onClick={() => nav(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${screen === item.id ? 'bg-green-50 text-green-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
              <div className={screen === item.id ? 'text-green-600' : 'text-slate-400'}>
                {React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5' })}
              </div>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4">
          <button onClick={() => nav('parent_login')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 font-medium text-sm transition-colors">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        {screen === 'parent_dashboard' && <ParentDashboard nav={nav} />}
        {screen === 'parent_student' && <ParentStudentDetail nav={nav} />}
      </main>
    </div>
  );
}

const STUDENTS_LIST = [
  { name: 'Chamara Perera', grade: 3, math: 92, sinhala: 78, english: 88, gk: 74, streak: 7, lessons: 18, quizzes: 12, time: '14h' },
  { name: 'Dilani Silva', grade: 3, math: 65, sinhala: 90, english: 72, gk: 81, streak: 3, lessons: 14, quizzes: 8, time: '10h' },
  { name: 'Ravi Nandana', grade: 3, math: 78, sinhala: 56, english: 64, gk: 59, streak: 12, lessons: 20, quizzes: 15, time: '17h' },
  { name: 'Fatima Hussain', grade: 3, math: 41, sinhala: 33, english: 38, gk: 50, streak: 1, lessons: 6, quizzes: 3, time: '4h' },
  { name: 'Tharaka Wijesinghe', grade: 3, math: 85, sinhala: 82, english: 91, gk: 88, streak: 9, lessons: 22, quizzes: 14, time: '18h' },
];

function ParentDashboard({ nav }: { nav: (s: Screen) => void }) {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Good morning, Mr. Kumara 👋</h1>
        <p className="text-slate-500">Grade 3 class · {STUDENTS_LIST.length} students</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Students', value: '34', sub: 'Active today: 28', icon: <Users className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50' },
          { label: 'Avg. Score', value: '74%', sub: '+3% this week', icon: <TrendingUp className="w-5 h-5 text-green-600" />, bg: 'bg-green-50' },
          { label: 'Lessons Done', value: '18', sub: '6 remaining', icon: <BookOpen className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-50' },
          { label: 'Quizzes Set', value: '12', sub: '3 active now', icon: <Target className="w-5 h-5 text-orange-600" />, bg: 'bg-orange-50' },
        ].map((m, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <p className="text-slate-500 text-sm">{m.label}</p>
              <div className={`w-9 h-9 rounded-xl ${m.bg} flex items-center justify-center`}>{m.icon}</div>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-0.5">{m.value}</h2>
            <p className="text-xs font-semibold text-green-600">{m.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Student Overview</h3>
            <button onClick={() => nav('parent_student')} className="text-blue-600 text-sm font-semibold hover:underline">View all</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 text-slate-400 text-xs">
                <th className="px-5 py-3 font-bold text-left">STUDENT</th>
                <th className="px-4 py-3 font-bold text-center">MATHS</th>
                <th className="px-4 py-3 font-bold text-center">ENG</th>
                <th className="px-4 py-3 font-bold text-center">STREAK</th>
                <th className="px-4 py-3 font-bold text-center">AVG</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {STUDENTS_LIST.slice(0, 5).map(s => {
                  const avg = Math.round((s.math + s.sinhala + s.english + s.gk) / 4);
                  const sc = (v: number) => v >= 80 ? 'text-green-700 bg-green-50' : v >= 60 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50';
                  return (
                    <tr key={s.name} onClick={() => nav('parent_student')} className="hover:bg-slate-50 cursor-pointer">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">{s.name[0]}</div>
                          <span className="font-semibold text-slate-800 text-sm">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded-md text-xs font-bold ${sc(s.math)}`}>{s.math}%</span></td>
                      <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded-md text-xs font-bold ${sc(s.english)}`}>{s.english}%</span></td>
                      <td className="px-4 py-3 text-center"><span className="text-orange-600 font-bold text-xs">🔥 {s.streak}d</span></td>
                      <td className="px-4 py-3 text-center"><span className={`px-2.5 py-1 rounded-xl text-xs font-extrabold ${sc(avg)}`}>{avg}%</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-900 mb-4">Needs Attention 🚨</h3>
          <div className="space-y-3">
            {STUDENTS_LIST.filter(s => Math.round((s.math + s.sinhala + s.english + s.gk) / 4) < 60).map(s => (
              <div key={s.name} className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center font-bold text-red-700 text-xs">{s.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{s.name}</p>
                  <p className="text-slate-400 text-xs">Grade {s.grade}</p>
                </div>
                <span className="text-red-600 font-extrabold text-sm">{Math.round((s.math + s.sinhala + s.english + s.gk) / 4)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ParentStudentDetail({ nav }: { nav: (s: Screen) => void }) {
  const s = STUDENTS_LIST[0];
  const avg = Math.round((s.math + s.sinhala + s.english + s.gk) / 4);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button onClick={() => nav('parent_dashboard')} className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-semibold text-sm mb-6">
        <ChevronLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 mb-8 flex items-center gap-6 text-white">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-extrabold">{s.name[0]}</div>
        <div>
          <h2 className="text-2xl font-extrabold">{s.name}</h2>
          <p className="text-blue-200">Grade {s.grade} · Student ID: S001</p>
          <div className="flex gap-2 mt-2">
            <Chip icon={<Flame />} label={`${s.streak}-day streak`} color="bg-white/20 text-white" />
            <Chip icon={<Clock />} label={s.time + ' learning'} color="bg-white/20 text-white" />
          </div>
        </div>
        <div className="ml-auto text-center">
          <div className="w-20 h-20 rounded-full bg-white/20 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold">{avg}%</span>
            <span className="text-blue-200 text-xs">Average</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subject performance */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 mb-5">Subject Performance</h3>
          <div className="space-y-4">
            {[
              { emoji: '🧮', label: 'Mathematics', score: s.math },
              { emoji: '📝', label: 'Sinhala', score: s.sinhala },
              { emoji: '🔤', label: 'English', score: s.english },
              { emoji: '🌍', label: 'Gen. Knowledge', score: s.gk },
            ].map(sub => (
              <div key={sub.label} className="flex items-center gap-3">
                <span className="text-xl w-7">{sub.emoji}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-700">{sub.label}</span>
                    <span className={`text-sm font-bold ${sub.score >= 80 ? 'text-green-600' : sub.score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{sub.score}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${sub.score >= 80 ? 'bg-green-400' : sub.score >= 60 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${sub.score}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity stats */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 mb-5">Learning Activity</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { emoji: '📖', label: 'Lessons Completed', value: s.lessons },
              { emoji: '✅', label: 'Quizzes Taken', value: s.quizzes },
              { emoji: '⏱', label: 'Learning Time', value: s.time },
              { emoji: '🔥', label: 'Day Streak', value: `${s.streak}d` },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-4 text-center">
                <span className="text-2xl block mb-1">{stat.emoji}</span>
                <span className="text-2xl font-extrabold text-slate-900 block">{stat.value}</span>
                <span className="text-slate-500 text-xs">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent quiz results */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:col-span-2">
          <h3 className="font-bold text-slate-900 mb-4">Recent Quiz Results</h3>
          <div className="space-y-3">
            {[
              { quiz: 'Maths Week 3 Quiz', score: '9/10', pct: 90, date: 'Sep 18, 2026' },
              { quiz: 'English Phonics Quiz', score: '7/8', pct: 88, date: 'Sep 15, 2026' },
              { quiz: 'Sinhala Vowels Quiz', score: '6/12', pct: 50, date: 'Sep 10, 2026' },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm shrink-0 ${r.pct >= 80 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{r.pct}%</div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 text-sm">{r.quiz}</p>
                  <p className="text-slate-400 text-xs">{r.date}</p>
                </div>
                <span className="font-extrabold text-slate-700">{r.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN PORTAL
// ─────────────────────────────────────────────────────────────────────────────
function AdminLogin({ nav }: { nav: (s: Screen) => void }) {
  const login = useFirebaseLogin(nav, 'admin_dashboard', 'admin@edulanka.lk', 'password123');
  return (
    <div className="flex h-screen bg-slate-50 w-full overflow-hidden">
      <div className="hidden md:flex md:w-1/2 bg-[#1B3673] p-12 flex-col relative text-white">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center"><GraduationCap className="text-white w-6 h-6" /></div>
          <span className="font-bold text-2xl">EduLanka</span>
        </div>
        <div className="mt-auto mb-auto max-w-md">
          <div className="inline-flex items-center gap-2 border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <Lock className="w-4 h-4 text-white/70" /><span className="text-xs font-semibold tracking-wider">SECURED GATEWAY</span>
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-6">EduLanka Admin Console</h1>
          <p className="text-blue-200 text-lg leading-relaxed">Manage users, content, quizzes, and system metrics from the central administration hub.</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex gap-4">
          <Lock className="w-5 h-5 text-white/60 mt-0.5 shrink-0" />
          <p className="text-xs text-white/50 leading-relaxed">Authorized personnel only. All access is logged and audited in accordance with EduLanka security parameters.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white rounded-[2rem] p-10 shadow-xl max-w-md w-full border border-slate-100">
          <button onClick={() => nav('landing')} className="flex items-center gap-1 text-slate-400 hover:text-slate-700 text-sm font-semibold mb-6"><ChevronLeft className="w-4 h-4" /> Back to Home</button>
          <h2 className="text-3xl font-bold text-slate-900 mb-1">Admin Console Login</h2>
          <p className="text-slate-500 text-sm mb-8">Sign in with your administrator credentials.</p>
          <form onSubmit={login.handleSubmit}>
          <div className="space-y-5 mb-8">
            <FormField label="ADMINISTRATOR EMAIL" type="email" icon={<Mail />} value={login.email} onChange={login.handleEmailChange} />
            <FormField label="SYSTEM PASSWORD" type="password" icon={<Lock />} value={login.password} onChange={login.handlePasswordChange} />
          </div>
          {login.error && <p role="alert" className="mb-4 text-sm font-semibold text-red-600">{login.error}</p>}
          <button type="submit" disabled={login.isLoading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-sm mb-4">Authenticate & Sign In</button>
          </form>
          <p className="text-xs text-center text-slate-400">Authorized personnel only.</p>
        </div>
      </div>
    </div>
  );
}

const ADMIN_NAV: { id: Screen; icon: React.ReactNode; label: string }[] = [
  { id: 'admin_dashboard', icon: <LayoutDashboard />, label: 'Dashboard' },
  { id: 'admin_users', icon: <Users />, label: 'Users' },
  { id: 'admin_content', icon: <BookOpen />, label: 'Subjects & Lessons' },
  { id: 'admin_content', icon: <GraduationCap />, label: 'Quizzes' },
  { id: 'admin_content', icon: <FileText />, label: 'Content' },
  { id: 'admin_dashboard', icon: <Settings />, label: 'Settings' },
];

function AdminShell({ screen, nav }: { screen: Screen; nav: (s: Screen) => void }) {
  return (
    <div className="flex h-screen bg-white text-slate-900 overflow-hidden font-sans">
      <aside className="w-[260px] border-r border-slate-200 bg-white flex flex-col shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><GraduationCap className="text-white w-6 h-6" /></div>
            <div><h1 className="font-bold text-xl text-blue-900">EduLanka</h1><p className="text-[10px] font-bold text-slate-400 tracking-wider">ADMIN CONSOLE</p></div>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {ADMIN_NAV.map((item, i) => {
            const active = screen === item.id || (screen === 'admin_add_question' && item.id === 'admin_content' && i === 3);
            return (
              <button key={i} onClick={() => nav(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${active ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
                <div className={active ? 'text-blue-600' : 'text-slate-400'}>{React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5' })}</div>
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4">
          <button onClick={() => nav('admin_login')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 font-medium text-sm transition-colors">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-slate-50/50">
        {screen === 'admin_dashboard' && <AdminDashboard nav={nav} />}
        {screen === 'admin_users' && <AdminUsers />}
        {screen === 'admin_content' && <AdminContent nav={nav} />}
        {screen === 'admin_add_question' && <AdminAddQuestion nav={nav} />}
      </main>
    </div>
  );
}

function AdminDashboard({ nav }: { nav: (s: Screen) => void }) {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Ayubowan, Admin 👋</h1>
        <p className="text-slate-500">EduLanka system overview — {new Date().toLocaleDateString('en-LK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-8">
        {[
          { label: 'Total Students', value: '12,482', icon: <Users className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50', change: '+14%' },
          { label: 'Parents/Teachers', value: '1,204', icon: <GraduationCap className="w-5 h-5 text-green-600" />, bg: 'bg-green-50', change: '+6%' },
          { label: 'Active Lessons', value: '482', icon: <BookOpen className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-50', change: '+8%' },
          { label: 'Quizzes', value: '214', icon: <ClipboardList className="w-5 h-5 text-orange-600" />, bg: 'bg-orange-50', change: '+22%' },
          { label: 'Content Items', value: '1,820', icon: <FileText className="w-5 h-5 text-pink-600" />, bg: 'bg-pink-50', change: '+4%' },
        ].map((m, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex justify-between items-start mb-3"><p className="text-slate-500 text-xs font-medium">{m.label}</p><div className={`w-8 h-8 rounded-xl ${m.bg} flex items-center justify-center`}>{m.icon}</div></div>
            <h2 className="text-2xl font-bold text-slate-900 mb-0.5">{m.value}</h2>
            <p className="text-xs font-semibold text-green-600">{m.change} this month</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-900">Engagement Trend (Sep 2026)</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500"><div className="w-2 h-2 bg-blue-600 rounded-full" /> Active Students</div>
            </div>
            <div className="h-40 flex items-end gap-1.5 justify-between">
              {[40,52,45,63,55,68,80,72,88,92,95,82,100].map((h, i) => (
                <div key={i} className="w-full bg-blue-600 hover:bg-blue-500 rounded-t-md transition-colors cursor-pointer" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="flex justify-between mt-3 text-xs text-slate-400 font-medium">
              {['1','3','5','7','9','11','13'].map(d => <span key={d}>Sep {d}</span>)}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {[
                { icon: '📝', text: 'New Sinhala Vowels quiz added by Mrs. Jayasinghe', time: '5 mins ago' },
                { icon: '👤', text: '128 new student profiles imported (bulk)', time: '1 hour ago' },
                { icon: '📖', text: 'Mathematics Grade 3 — Lesson 4 published', time: 'Yesterday' },
              ].map((a, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50">
                  <span className="text-xl w-8 shrink-0">{a.icon}</span>
                  <div><p className="font-semibold text-sm text-slate-900">{a.text}</p><p className="text-xs text-slate-400 mt-0.5">{a.time}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Add New Lesson', icon: '📖', action: () => nav('admin_content') },
                { label: 'Create Quiz', icon: '✅', action: () => nav('admin_add_question') },
                { label: 'Manage Users', icon: '👥', action: () => nav('admin_users') },
                { label: 'Upload Resource', icon: '📤', action: () => {} },
              ].map((a, i) => (
                <button key={i} onClick={a.action} className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all text-left group">
                  <span className="text-xl w-8 shrink-0">{a.icon}</span>
                  <span className="font-semibold text-sm text-slate-900 flex-1">{a.label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Subject Coverage</h3>
            <div className="space-y-3">
              {SUBJECTS_DATA.map(s => (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="text-lg w-6 shrink-0">{s.emoji}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${s.color}`} style={{ width: `${s.progress}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-500 w-8 text-right">{s.progress}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ALL_USERS = [
  { name: 'Chamara Perera', email: 'chamara@school.lk', role: 'Student', grade: 'Grade 3', status: 'Active', joined: 'Sep 1, 2026' },
  { name: 'Dilani Silva', email: 'dilani@school.lk', role: 'Student', grade: 'Grade 3', status: 'Active', joined: 'Sep 2, 2026' },
  { name: 'Ravi Nandana', email: 'ravi@school.lk', role: 'Student', grade: 'Grade 3', status: 'Active', joined: 'Sep 3, 2026' },
  { name: 'Fatima Hussain', email: 'fatima@school.lk', role: 'Student', grade: 'Grade 3', status: 'Inactive', joined: 'Sep 5, 2026' },
  { name: 'Nimal Kumara', email: 'nimal@school.lk', role: 'Teacher', grade: '—', status: 'Active', joined: 'Aug 15, 2026' },
  { name: 'Priya Jayasinghe', email: 'priya@school.lk', role: 'Teacher', grade: '—', status: 'Active', joined: 'Aug 20, 2026' },
  { name: 'System Admin', email: 'admin@edulanka.lk', role: 'Admin', grade: '—', status: 'Active', joined: 'Jan 1, 2026' },
];

function AdminUsers() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Student' | 'Teacher' | 'Admin'>('All');
  const filtered = ALL_USERS.filter(u =>
    (filter === 'All' || u.role === filter) &&
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">User Management</h1>
          <p className="text-slate-500">Manage all students, teachers, and administrators.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} type="text" placeholder="Search users..." className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm w-56 focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
            {(['All', 'Student', 'Teacher', 'Admin'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 text-sm font-semibold transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{f}</button>
            ))}
          </div>
          <span className="text-xs text-slate-400 font-medium ml-auto">{filtered.length} users</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-200 text-slate-400 text-xs">
              <th className="px-6 py-4 font-bold text-left">USER</th>
              <th className="px-5 py-4 font-bold text-left">ROLE</th>
              <th className="px-5 py-4 font-bold text-left">GRADE</th>
              <th className="px-5 py-4 font-bold text-left">STATUS</th>
              <th className="px-5 py-4 font-bold text-left">JOINED</th>
              <th className="px-5 py-4" />
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u, i) => (
                <tr key={i} className="hover:bg-slate-50 group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${u.role === 'Admin' ? 'bg-blue-100 text-blue-700' : u.role === 'Teacher' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>{u.name[0]}</div>
                      <div><p className="font-semibold text-slate-900">{u.name}</p><p className="text-xs text-slate-400">{u.email}</p></div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${u.role === 'Admin' ? 'bg-blue-100 text-blue-700' : u.role === 'Teacher' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>{u.role}</span>
                  </td>
                  <td className="px-5 py-4 text-slate-600 text-sm">{u.grade}</td>
                  <td className="px-5 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-bold w-fit ${u.status === 'Active' ? 'text-green-700' : 'text-slate-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">{u.joined}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"><Edit3 className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminContent({ nav }: { nav: (s: Screen) => void }) {
  const [tab, setTab] = useState<'subjects' | 'lessons' | 'quizzes'>('quizzes');

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Content Management</h1>
          <p className="text-slate-500">Manage subjects, lessons, and quizzes.</p>
        </div>
        <button onClick={() => nav('admin_add_question')} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {(['subjects', 'lessons', 'quizzes'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-lg font-semibold text-sm transition-colors capitalize ${tab === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>{t}</button>
        ))}
      </div>

      {tab === 'quizzes' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex gap-3">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" placeholder="Search quizzes..." className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm w-64 focus:outline-none focus:border-blue-500" /></div>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"><Filter className="w-4 h-4" /> Filters</button>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-200 text-slate-400 text-xs">
              <th className="px-6 py-4 font-bold text-left">QUIZ TITLE</th>
              <th className="px-5 py-4 font-bold text-left">SUBJECT</th>
              <th className="px-5 py-4 font-bold text-left">GRADE</th>
              <th className="px-5 py-4 font-bold text-left">LANGUAGE</th>
              <th className="px-5 py-4 font-bold text-left">STATUS</th>
              <th className="px-5 py-4 font-bold text-left">MODIFIED</th>
              <th className="px-5 py-4" />
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { title: 'Basic Addition Test', subject: 'Mathematics', grade: 'Grade 3', lang: 'English', status: 'Published', date: 'Sep 18, 2026' },
                { title: 'Sinhala Vowels Quiz', subject: 'Sinhala', grade: 'Grade 1', lang: 'Sinhala', status: 'Draft', date: 'Sep 15, 2026' },
                { title: 'Animals of Sri Lanka', subject: 'Gen. Knowledge', grade: 'Grade 2', lang: 'English', status: 'Published', date: 'Sep 12, 2026' },
                { title: 'English Phonics Quiz', subject: 'English', grade: 'Grade 3', lang: 'English', status: 'Published', date: 'Sep 10, 2026' },
                { title: 'தமிழ் எழுத்துகள் வினா', subject: 'Tamil', grade: 'Grade 2', lang: 'Tamil', status: 'Draft', date: 'Sep 8, 2026' },
              ].map((q, i) => (
                <tr key={i} className="hover:bg-slate-50 group">
                  <td className="px-6 py-4 font-medium text-slate-900">{q.title}</td>
                  <td className="px-5 py-4 text-slate-600">{q.subject}</td>
                  <td className="px-5 py-4 text-slate-600">{q.grade}</td>
                  <td className="px-5 py-4"><span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{q.lang}</span></td>
                  <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-md text-xs font-bold ${q.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{q.status}</span></td>
                  <td className="px-5 py-4 text-slate-400 text-xs">{q.date}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600"><Edit3 className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'lessons' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Introduction to Addition', subject: 'Mathematics', grade: 'Grade 3', lang: 'English', status: 'Published' },
            { title: 'සිංහල ස්වර — ස, ආ, ඉ, ඊ', subject: 'Sinhala', grade: 'Grade 1', lang: 'Sinhala', status: 'Published' },
            { title: 'Animals of Sri Lanka', subject: 'Gen. Knowledge', grade: 'Grade 2', lang: 'English', status: 'Draft' },
            { title: 'ABC Phonics & Sounds', subject: 'English', grade: 'Grade 3', lang: 'English', status: 'Published' },
          ].map((l, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between mb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${l.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{l.status}</span>
                <div className="flex gap-1">
                  <button className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"><Edit3 className="w-4 h-4" /></button>
                  <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h4 className="font-bold text-slate-900 mb-1">{l.title}</h4>
              <p className="text-slate-500 text-sm">{l.subject} · {l.grade} · {l.lang}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'subjects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SUBJECTS_DATA.map(s => (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow flex items-center gap-4">
              <div className={`w-14 h-14 ${s.color} rounded-2xl flex items-center justify-center text-3xl`}>{s.emoji}</div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900">{s.nameKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h4>
                <p className="text-slate-500 text-sm">{s.lessonCount} lessons · {s.quizCount} quizzes</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"><Edit3 className="w-4 h-4" /></button>
                <button className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminAddQuestion({ nav }: { nav: (s: Screen) => void }) {
  return (
    <div className="p-8 max-w-5xl mx-auto pb-24">
      <div className="mb-8">
        <div className="flex items-center text-sm text-slate-500 mb-3 font-medium">
          <button onClick={() => nav('admin_content')} className="hover:text-slate-900 hover:underline">Quizzes</button>
          <ChevronRight className="w-4 h-4 mx-1" />
          <span>Basic Addition Test</span>
          <ChevronRight className="w-4 h-4 mx-1" />
          <span className="text-slate-900 font-semibold">Add Question</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Add Quiz Question</h1>
        <p className="text-slate-500">Define a multiple-choice question with localized language settings.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          {[['Subject', 'Mathematics'], ['Grade', 'Grade 3'], ['Language', 'English'], ['Difficulty', 'Medium']].map(([lbl, val]) => (
            <div key={lbl}>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{lbl}</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 bg-white">
                <option>{val}</option>
              </select>
            </div>
          ))}
        </div>

        <div className="mb-8">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Question Text</label>
          <textarea rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 resize-none" placeholder="Type your question here..." defaultValue="What is 5 + 3?" />
        </div>

        <div className="mb-8">
          <label className="block text-sm font-semibold text-slate-700 mb-4">Answer Options <span className="text-slate-400 font-normal">(Select the correct answer)</span></label>
          <div className="space-y-3">
            {[{ l: 'A', v: '6', correct: false }, { l: 'B', v: '7', correct: false }, { l: 'C', v: '8', correct: true }, { l: 'D', v: '9', correct: false }].map(opt => (
              <div key={opt.l} className={`flex items-center gap-4 px-4 py-3 rounded-xl border ${opt.correct ? 'border-2 border-blue-500 bg-blue-50/40' : 'border-slate-200'}`}>
                <input type="radio" name="correct" defaultChecked={opt.correct} className="w-5 h-5 accent-blue-600" />
                <span className={`font-bold w-8 ${opt.correct ? 'text-blue-700' : 'text-slate-600'}`}>{opt.l}</span>
                <input type="text" defaultValue={opt.v} className="flex-1 outline-none text-slate-900 bg-transparent font-medium" />
                {opt.correct && <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></div>}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Hint / Explanation <span className="text-slate-400 font-normal">(optional)</span></label>
          <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500" placeholder="e.g. Count on your fingers! 5 fingers + 3 more = ?" />
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-slate-100">
          <button className="flex items-center gap-2 text-orange-600 font-semibold bg-orange-50 px-4 py-2.5 rounded-lg hover:bg-orange-100 transition-colors">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
          <div className="flex items-center gap-3">
            <button onClick={() => nav('admin_content')} className="px-6 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
            <button className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-white shadow-sm transition-colors">Save Question</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function getEmailName(email: string | null | undefined) {
  const localPart = email?.split('@')[0]?.trim();
  if (!localPart) return 'there';

  return localPart
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || 'there';
}

function useCurrentUserProfile() {
  const [userName, setUserName] = useState('there');
  const [grade, setGrade] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (!user) {
        setUserName('there');
        setGrade('');
        return;
      }

      let profileName = '';
      let profileGrade = '';
      try {
        const profileSnapshot = await getDoc(doc(db, 'users', user.uid));
        const profile = profileSnapshot.data();
        profileName = String(profile?.displayName || '').trim();
        profileGrade = String(profile?.grade || '').trim();
      } catch (error) {
        console.error('Unable to load user profile:', error);
      }

      setUserName(user.displayName?.trim() || profileName || getEmailName(user.email));
      setGrade(profileGrade);
    });

    return unsubscribe;
  }, []);

  return { userName, grade };
}

function useFirebaseLogin(nav: (screen: Screen) => void, destination: Screen, initialEmail = '', initialPassword = '') {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value);
  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => setPassword(event.target.value);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Enter both your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      nav(destination);
    } catch (loginError) {
      const code = loginError instanceof Error && 'code' in loginError ? String(loginError.code) : '';
      setError(code.includes('invalid-credential') || code.includes('user-not-found') || code.includes('wrong-password')
        ? 'Invalid email or password.'
        : 'Unable to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return { email, password, error, isLoading, handleEmailChange, handlePasswordChange, handleSubmit };
}

function useFirebaseRegister(onSuccess: () => void) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value);
  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => setPassword(event.target.value);
  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const trimmedName = name.trim().replace(/\s+/g, ' ');
    if (!trimmedName) {
      setError('Enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9\s]/.test(password)) {
      setError('Password must be 8+ characters with a letter, number, and symbol.');
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(userCredential.user, { displayName: trimmedName });
      onSuccess();
    } catch (registrationError) {
      const code = registrationError instanceof Error && 'code' in registrationError ? String(registrationError.code) : '';
      setError(code.includes('email-already-in-use') ? 'An account with this email already exists.' : 'Unable to create your account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return { name, email, password, error, isLoading, handleNameChange, handleEmailChange, handlePasswordChange, handleSubmit };
}

function ElephantMascot({ size = 80, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <ellipse cx="60" cy="75" rx="36" ry="30" fill="#7BAFD4" />
      <circle cx="60" cy="48" r="28" fill="#7BAFD4" />
      <ellipse cx="28" cy="44" rx="14" ry="18" fill="#5B8DB8" />
      <ellipse cx="92" cy="44" rx="14" ry="18" fill="#5B8DB8" />
      <ellipse cx="28" cy="44" rx="9" ry="13" fill="#F4C2C2" />
      <ellipse cx="92" cy="44" rx="9" ry="13" fill="#F4C2C2" />
      <path d="M52 68 Q42 80 46 94 Q48 100 54 98" stroke="#7BAFD4" strokeWidth="8" strokeLinecap="round" fill="none" />
      <circle cx="50" cy="42" r="5" fill="white" /><circle cx="70" cy="42" r="5" fill="white" />
      <circle cx="51" cy="43" r="2.5" fill="#1E3A5F" /><circle cx="71" cy="43" r="2.5" fill="#1E3A5F" />
      <circle cx="52" cy="42" r="1" fill="white" /><circle cx="72" cy="42" r="1" fill="white" />
      <path d="M50 56 Q60 64 70 56" stroke="#1E3A5F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M54 60 Q50 68 46 70" stroke="#FFF8E7" strokeWidth="4" strokeLinecap="round" fill="none" />
      <ellipse cx="44" cy="102" rx="12" ry="7" fill="#5B8DB8" />
      <ellipse cx="76" cy="102" rx="12" ry="7" fill="#5B8DB8" />
      <path d="M96 68 Q104 72 100 80" stroke="#5B8DB8" strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="60" cy="22" r="6" fill="#FBBF24" /><circle cx="60" cy="22" r="3" fill="#F59E0B" />
    </svg>
  );
}

function FormField({ label, type, placeholder, icon, defaultValue, value, onChange, required }: { label: string; type: string; placeholder?: string; icon?: React.ReactNode; defaultValue?: string; value?: string; onChange?: React.ChangeEventHandler<HTMLInputElement>; required?: boolean }) {
  const [showPw, setShowPw] = useState(false);
  const isPw = type === 'password';
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 tracking-wider mb-2">{label.toUpperCase()}</label>
      <div className="relative">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400">{React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5' })}</div>}
        <input
          type={isPw && showPw ? 'text' : type}
          placeholder={placeholder}
          defaultValue={defaultValue}
          value={value}
          onChange={onChange}
          required={required}
          className={`w-full ${icon ? 'pl-11' : 'pl-4'} ${isPw ? 'pr-11' : 'pr-4'} py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-900 ${isPw ? 'font-mono tracking-widest text-lg' : ''}`}
        />
        {isPw && <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2"><EyeOff className="w-5 h-5 text-slate-400" /></button>}
      </div>
    </div>
  );
}

function Chip({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${color}`}>
      {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-3 h-3' })}
      {label}
    </div>
  );
}

function StatBox({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className={`border-2 rounded-2xl p-4 flex flex-col items-center gap-1 ${color}`}>
      <span className="text-2xl font-extrabold">{value}</span>
      <span className="text-xs font-bold">{label}</span>
    </div>
  );
}
