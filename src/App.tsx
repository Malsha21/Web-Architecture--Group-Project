

import React, { useState, useEffect, useCallback } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from './firebase';
import { api, type UserProfile } from './lib/api';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  LayoutDashboard, Users, BookOpen, GraduationCap, Settings, Search, Plus,
  Filter, FileText, ChevronRight, MoreVertical, Upload, Lock, Mail, EyeOff,
  Trash2, Star, Trophy, Zap, Home, BarChart2, Edit3, LogOut, ChevronLeft,
  CheckCircle, XCircle, HelpCircle, ShoppingBag, Target, TrendingUp,
  ArrowRight, Menu, X, Play, Award, Globe, BookMarked, Gamepad2, ClipboardList,
  User, BarChart, ChevronDown, RefreshCw, Clock, Flame, Heart, Volume2,
  Lightbulb, ImagePlus, AlignLeft, Hash, ToggleLeft, Camera,
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
  | 'welcome'
  | 'student_login' | 'student_register' | 'student_forgot'
  | 'student_dashboard' | 'student_subjects' | 'student_grade'
  | 'student_lesson_list' | 'student_lesson'
  | 'student_games'
  | 'student_quiz_select' | 'student_quiz' | 'student_quiz_result'
  | 'student_progress' | 'student_profile'
  | 'parent_login' | 'parent_dashboard' | 'parent_student'
  | 'admin_login' | 'admin_dashboard' | 'admin_users'
  | 'admin_content' | 'admin_add_question';

type QuizSubject = 'math' | 'english' | 'sinhala' | 'gk';

type QuizQuestion = {
  q: string;
  options: string[];
  correct: number;
  hint?: string;
};

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
      {screen === 'welcome' && <WelcomePage nav={nav} />}
      {screen === 'student_login' && <StudentLogin nav={nav} t={t} />}
      {screen === 'student_register' && <StudentRegister nav={nav} t={t} />}
      {screen === 'student_forgot' && <ForgotPassword nav={nav} />}
      {screen === 'parent_login' && <ParentLogin nav={nav} />}
      {screen === 'admin_login' && <AdminLogin nav={nav} />}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// WELCOME PAGE
// ────────────────────────────────────────────────────────────────────────
function WelcomePage({ nav }: { nav: (s: Screen) => void }) {
  const features = [
    { icon: BookOpen, title: 'Learn', desc: 'Maths, Sinhala and English lessons for your grade.', bg: 'bg-blue-100 text-blue-700' },
    { icon: Trophy, title: 'Take quizzes', desc: 'Test what you know and earn points as you go.', bg: 'bg-amber-100 text-amber-700' },
    { icon: Zap, title: 'Play games', desc: 'Fun puzzles that make practice feel like play.', bg: 'bg-green-100 text-green-700' },
    { icon: TrendingUp, title: 'Track progress', desc: 'See how far you have come, one step at a time.', bg: 'bg-purple-100 text-purple-700' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-[#FDFDF8] to-[#FDFDF8] flex flex-col">
      <header className="max-w-6xl w-full mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ElephantMascot size={34} />
          <span className="font-extrabold text-xl text-blue-900">EduLanka</span>
        </div>
        <button onClick={() => nav('landing')} className="text-sm font-bold text-slate-500 hover:text-blue-700 transition-colors">
          ← Back to home
        </button>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-10 md:py-16">
        <section className="text-center max-w-2xl mx-auto">
          <div className="inline-block mb-6">
            <ElephantMascot size={120} />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">Welcome to EduLanka! 🎉</h1>
          <p className="text-slate-600 text-lg leading-relaxed mb-8">
            Learn, play and grow every day. Sign in to pick up where you left off, or create a free student account to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => nav('student_register')} className="btn-chunky bg-yellow-400 shadow-[0_6px_0_#D97706] hover:bg-yellow-500 text-yellow-900 font-extrabold px-8 py-4 rounded-2xl text-base active:translate-y-1.5 active:shadow-none transition-all">
              Register
            </button>
            <button onClick={() => nav('student_login')} className="bg-white border-2 border-blue-200 hover:border-blue-400 text-blue-700 font-extrabold px-8 py-4 rounded-2xl text-base transition-colors">
              Login
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-16">
          {features.map(f => (
            <div key={f.title} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-lg transition-shadow">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.bg}`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-1">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="text-center text-xs text-slate-400 py-6">© EduLanka · Web Architecture Group Project</footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LANDING PAGE
// ─────────────────────────────────────────────────────────────────────────────
function LandingPage({
  nav,
  lang,
  setLang,
  t,
}: {
  nav: (s: Screen) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: string) => string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const login = useFirebaseLogin(nav);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
    setMenuOpen(false);
  };

  const startLearning = () => {
    nav('student_register');
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-slate-800 overflow-x-hidden">

      {/* ================= NAVBAR ================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-20 flex items-center">

          {/* LOGO */}
          <button
            onClick={() => scrollTo('home')}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center shadow-md rotate-[-3deg]">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>

            <div className="text-left">
              <div className="text-xl font-black tracking-tight text-slate-800">
                Edu<span className="text-blue-500">Lanka</span>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Learn • Play • Grow
              </div>
            </div>
          </button>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-2 ml-12">
            <button
              onClick={() => scrollTo('home')}
              className="px-4 py-2 rounded-full text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
            >
              Home
            </button>

            <button
              onClick={() => scrollTo('subjects')}
              className="px-4 py-2 rounded-full text-sm font-bold text-slate-600 hover:bg-yellow-50 hover:text-yellow-600 transition"
            >
              Subjects
            </button>

            <button
              onClick={() => scrollTo('games')}
              className="px-4 py-2 rounded-full text-sm font-bold text-slate-600 hover:bg-purple-50 hover:text-purple-600 transition"
            >
              Games
            </button>

            <button
              onClick={() => scrollTo('quiz')}
              className="px-4 py-2 rounded-full text-sm font-bold text-slate-600 hover:bg-green-50 hover:text-green-600 transition"
            >
              Quizzes
            </button>

            <button
              onClick={() => scrollTo('about')}
              className="px-4 py-2 rounded-full text-sm font-bold text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition"
            >
              About
            </button>
          </nav>

          {/* RIGHT SIDE */}
          <div className="ml-auto flex items-center gap-2">

            {/* LANGUAGE */}
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className="hidden sm:block px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 outline-none"
            >
              <option value="en">English</option>
              <option value="si">සිංහල</option>
              <option value="ta">தமிழ்</option>
            </select>

            {/* LOGIN */}
            <button
              onClick={() => scrollTo('login')}
              className="hidden sm:block px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              {t('login')}
            </button>

            {/* REGISTER */}
            <button
              onClick={startLearning}
              className="hidden sm:flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-black shadow-lg shadow-blue-200 hover:-translate-y-0.5 transition-all"
            >
              {t('register')}
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* MOBILE MENU */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2.5 rounded-xl bg-slate-100"
            >
              {menuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* MOBILE NAV */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-5 py-5">
            <div className="flex flex-col gap-2">

              <button
                onClick={() => scrollTo('home')}
                className="text-left px-4 py-3 rounded-xl bg-blue-50 text-blue-600 font-bold"
              >
                Home
              </button>

              <button
                onClick={() => scrollTo('subjects')}
                className="text-left px-4 py-3 rounded-xl hover:bg-yellow-50 font-bold"
              >
                Subjects
              </button>

              <button
                onClick={() => scrollTo('games')}
                className="text-left px-4 py-3 rounded-xl hover:bg-purple-50 font-bold"
              >
                Games
              </button>

              <button
                onClick={() => scrollTo('quiz')}
                className="text-left px-4 py-3 rounded-xl hover:bg-green-50 font-bold"
              >
                Quizzes
              </button>

              <button
                onClick={() => scrollTo('about')}
                className="text-left px-4 py-3 rounded-xl hover:bg-orange-50 font-bold"
              >
                About
              </button>

              <div className="flex gap-2 mt-3 pt-3 border-t">
                <button
                  onClick={() => scrollTo('login')}
                  className="flex-1 py-3 rounded-xl border border-slate-200 font-bold"
                >
                  Login
                </button>

                <button
                  onClick={startLearning}
                  className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-bold"
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ================= HERO ================= */}
      <section
        id="home"
        className="relative overflow-hidden bg-gradient-to-br from-[#FFF7D6] via-[#F4FAFF] to-[#F3E9FF]"
      >

        {/* DECORATIONS */}
        <div className="absolute top-10 left-[-40px] w-32 h-32 bg-yellow-300 rounded-full opacity-60 blur-sm" />
        <div className="absolute top-24 right-10 w-24 h-24 bg-pink-300 rounded-full opacity-50" />
        <div className="absolute bottom-[-50px] left-1/3 w-40 h-40 bg-blue-200 rounded-full opacity-40" />

        <div className="absolute top-24 left-[12%] text-yellow-400 text-3xl">
          ★
        </div>

        <div className="absolute top-36 right-[15%] text-purple-400 text-2xl">
          ✦
        </div>

        <div className="absolute bottom-20 right-[8%] text-blue-400 text-3xl">
          ★
        </div>

        <div className="relative max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-24">

          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* LEFT */}
            <div>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border-2 border-yellow-200 shadow-sm mb-6">
                <span className="text-lg">🌟</span>
                <span className="text-xs font-black text-orange-500 uppercase tracking-wide">
                  Welcome to EduLanka
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.02] tracking-tight">

                <span className="text-slate-800">
                  Learn.
                </span>

                <br />

                <span className="text-blue-500">
                  Play.
                </span>

                <span className="text-yellow-500">
                  {' '}Grow!
                </span>

                <span className="text-pink-400">
                  {' '}★
                </span>
              </h1>

              <p className="mt-7 text-lg md:text-xl text-slate-600 leading-relaxed max-w-xl">
                A fun and interactive learning space made especially for
                Sri Lankan primary school children.
              </p>

              <p className="mt-3 text-sm md:text-base text-slate-500 max-w-lg">
                Learn Mathematics, Sinhala, English and General Knowledge
                through colourful lessons, exciting games and fun quizzes.
              </p>

              {/* BUTTONS */}
              <div className="flex flex-wrap gap-4 mt-8">

                <button
                  onClick={startLearning}
                  className="group flex items-center gap-3 px-7 py-4 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-black shadow-xl shadow-blue-200 hover:-translate-y-1 transition-all"
                >
                  <span className="text-xl">🚀</span>
                  Start Learning
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => scrollTo('subjects')}
                  className="flex items-center gap-3 px-7 py-4 rounded-2xl bg-white border-2 border-yellow-200 hover:border-yellow-300 text-slate-700 font-black shadow-sm hover:-translate-y-1 transition-all"
                >
                  <span className="text-xl">📚</span>
                  Explore Subjects
                </button>

              </div>

              {/* MINI STATS */}
              <div className="flex flex-wrap gap-3 mt-8">

                <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-sm border border-blue-100">
                  <span>👩‍🎓</span>
                  <span className="text-sm font-black text-slate-700">
                    12K+ Learners
                  </span>
                </div>

                <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-sm border border-yellow-100">
                  <span>🏆</span>
                  <span className="text-sm font-black text-slate-700">
                    Fun Activities
                  </span>
                </div>

              </div>
            </div>

            {/* RIGHT ILLUSTRATION AREA */}
            <div className="relative">

              <div className="relative max-w-xl mx-auto">

                {/* MAIN CARD */}
                <div className="relative bg-white rounded-[2.5rem] border-4 border-white shadow-2xl p-6 md:p-8">

                  {/* TOP */}
                  <div className="flex items-center justify-between mb-6">

                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        My Learning Space
                      </p>

                      <h3 className="text-2xl font-black text-slate-800 mt-1">
                        Hello, Learner! 👋
                      </h3>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-yellow-100 flex items-center justify-center text-2xl">
                      😊
                    </div>
                  </div>

                  {/* PROGRESS */}
                  <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 p-5 mb-5">

                    <div className="flex items-center justify-between mb-3">

                      <div className="flex items-center gap-3">

                        <div className="w-11 h-11 rounded-xl bg-blue-500 flex items-center justify-center">
                          <BarChart className="w-6 h-6 text-white" />
                        </div>

                        <div>
                          <p className="font-black text-slate-800">
                            My Progress
                          </p>

                          <p className="text-xs text-slate-400">
                            Keep learning!
                          </p>
                        </div>

                      </div>

                      <span className="text-xl font-black text-blue-500">
                        78%
                      </span>

                    </div>

                    <div className="h-3 bg-white rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
                        style={{ width: '78%' }}
                      />
                    </div>
                  </div>

                  {/* SUBJECT CARDS */}
                  <div className="grid grid-cols-2 gap-3">

                    <div className="p-4 rounded-2xl bg-orange-50 border-2 border-orange-100 hover:scale-[1.02] transition">
                      <div className="text-3xl mb-3">🔢</div>
                      <p className="font-black text-orange-700">
                        Mathematics
                      </p>
                      <p className="text-xs text-orange-400 mt-1">
                        Learn & practise
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-purple-50 border-2 border-purple-100 hover:scale-[1.02] transition">
                      <div className="text-3xl mb-3">📖</div>
                      <p className="font-black text-purple-700">
                        Sinhala
                      </p>
                      <p className="text-xs text-purple-400 mt-1">
                        Read & learn
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-100 hover:scale-[1.02] transition">
                      <div className="text-3xl mb-3">🔤</div>
                      <p className="font-black text-blue-700">
                        English
                      </p>
                      <p className="text-xs text-blue-400 mt-1">
                        Words & letters
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-green-50 border-2 border-green-100 hover:scale-[1.02] transition">
                      <div className="text-3xl mb-3">🌍</div>
                      <p className="font-black text-green-700">
                        General Knowledge
                      </p>
                      <p className="text-xs text-green-400 mt-1">
                        Discover more
                      </p>
                    </div>

                  </div>
                </div>

                {/* FLOATING BADGE */}
                <div className="absolute -top-5 -right-3 md:-right-7 bg-white rounded-2xl shadow-xl border-2 border-yellow-100 px-4 py-3 flex items-center gap-3 rotate-3">
                  <div className="text-3xl">🏆</div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      Achievement
                    </p>

                    <p className="text-sm font-black text-yellow-600">
                      Quiz Master!
                    </p>
                  </div>
                </div>

                {/* FLOATING STREAK */}
                <div className="absolute -bottom-5 -left-3 md:-left-7 bg-white rounded-2xl shadow-xl border-2 border-pink-100 px-4 py-3 flex items-center gap-3 -rotate-2">
                  <div className="text-3xl">🔥</div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      Learning Streak
                    </p>

                    <p className="text-sm font-black text-pink-500">
                      7 Days!
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= SUBJECTS ================= */}
      <section
        id="subjects"
        className="py-20 md:py-24 bg-white"
      >

        <div className="max-w-7xl mx-auto px-5 md:px-8">

          <div className="text-center max-w-2xl mx-auto mb-12">

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-50 text-yellow-600 font-black text-sm mb-4">
              📚 Explore & Learn
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-slate-800">
              What do you want to learn?
            </h2>

            <p className="text-slate-500 mt-4">
              Choose a subject and start your learning adventure!
            </p>

          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">

            {SUBJECTS_DATA.map((subj, index) => {

              const icons = [
                <span className="text-4xl">🔢</span>,
                <span className="text-4xl">📖</span>,
                <span className="text-4xl">🔤</span>,
                <span className="text-4xl">🌍</span>,
              ];

              const backgrounds = [
                'bg-orange-50 border-orange-200 hover:border-orange-400',
                'bg-purple-50 border-purple-200 hover:border-purple-400',
                'bg-blue-50 border-blue-200 hover:border-blue-400',
                'bg-green-50 border-green-200 hover:border-green-400',
              ];

              const titleColors = [
                'text-orange-600',
                'text-purple-600',
                'text-blue-600',
                'text-green-600',
              ];

              return (
                <button
                  key={subj.id}
                  onClick={startLearning}
                  className={`group text-left p-6 rounded-[2rem] border-2 ${backgrounds[index]} hover:-translate-y-2 hover:shadow-xl transition-all duration-300`}
                >

                  <div className="flex items-start justify-between">

                    <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                      {icons[index]}
                    </div>

                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center group-hover:translate-x-1 transition">
                      <ArrowRight className="w-5 h-5 text-slate-400" />
                    </div>

                  </div>

                  <h3 className={`text-xl font-black mt-6 ${titleColors[index]}`}>
                    {t(subj.nameKey)}
                  </h3>

                  <p className="text-sm text-slate-500 mt-2">
                    {subj.lessonCount} fun lessons
                  </p>

                  <div className="flex items-center gap-2 mt-5 text-xs font-bold text-slate-500">
                    <span>✨</span>
                    Learn something new
                  </div>

                </button>
              );
            })}

          </div>
        </div>
      </section>

      {/* ================= GAMES ================= */}
      <section
        id="games"
        className="py-20 md:py-24 bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50"
      >

        <div className="max-w-7xl mx-auto px-5 md:px-8">

          <div className="text-center max-w-2xl mx-auto mb-12">

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-600 font-black text-sm mb-4">
              🎮 Fun Zone
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-slate-800">
              Learn while you play!
            </h2>

            <p className="text-slate-500 mt-4">
              Challenge yourself with fun educational games.
            </p>

          </div>

          <div className="grid md:grid-cols-3 gap-6">

            {GAMES_DATA.slice(0, 3).map((game, index) => {

              const styles = [
                {
                  bg: 'bg-orange-100',
                  border: 'border-orange-200',
                  icon: '🧮',
                  color: 'text-orange-600',
                },
                {
                  bg: 'bg-purple-100',
                  border: 'border-purple-200',
                  icon: '🧩',
                  color: 'text-purple-600',
                },
                {
                  bg: 'bg-blue-100',
                  border: 'border-blue-200',
                  icon: '🔤',
                  color: 'text-blue-600',
                },
              ];

              const style = styles[index];

              return (
                <div
                  key={game.id}
                  className={`bg-white rounded-[2rem] border-2 ${style.border} overflow-hidden hover:-translate-y-2 hover:shadow-xl transition-all duration-300`}
                >

                  <div className={`${style.bg} h-44 flex items-center justify-center relative overflow-hidden`}>

                    <div className="absolute top-5 left-6 text-2xl opacity-70">
                      ✦
                    </div>

                    <div className="absolute bottom-5 right-7 text-2xl opacity-70">
                      ★
                    </div>

                    <div className="w-24 h-24 rounded-3xl bg-white shadow-lg flex items-center justify-center text-5xl rotate-[-4deg]">
                      {style.icon}
                    </div>

                  </div>

                  <div className="p-6">

                    <div className="flex items-start justify-between gap-3">

                      <div>
                        <h3 className={`text-xl font-black ${style.color}`}>
                          {game.title}
                        </h3>

                        <p className="text-sm text-slate-500 mt-2">
                          {game.desc}
                        </p>
                      </div>

                      <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-black">
                        FUN
                      </span>

                    </div>

                    <button
                      onClick={startLearning}
                      className={`w-full mt-6 py-3.5 rounded-xl ${style.bg} ${style.color} font-black hover:scale-[1.02] transition`}
                    >
                      🎮 Play Now
                    </button>

                  </div>
                </div>
              );
            })}

          </div>
        </div>
      </section>

      {/* ================= QUIZ ================= */}
      <section
        id="quiz"
        className="py-20 md:py-24 bg-white"
      >

        <div className="max-w-6xl mx-auto px-5 md:px-8">

          <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden">

            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
            <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full" />

            <div className="relative grid md:grid-cols-2 gap-10 items-center">

              <div>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 mb-5">
                  🏆 Challenge Yourself
                </div>

                <h2 className="text-4xl md:text-5xl font-black">
                  Ready for a quiz?
                </h2>

                <p className="mt-4 text-white/80 leading-relaxed">
                  Test what you have learned and earn achievements along
                  your learning journey!
                </p>

                <button
                  onClick={startLearning}
                  className="mt-7 px-6 py-3.5 rounded-xl bg-white text-blue-600 font-black hover:scale-105 transition shadow-lg"
                >
                  🚀 Take a Quiz
                </button>

              </div>

              <div className="flex justify-center">

                <div className="w-48 h-48 rounded-full bg-white/15 border-4 border-white/20 flex items-center justify-center">

                  <div className="w-32 h-32 rounded-[2rem] bg-white flex items-center justify-center shadow-xl rotate-3">
                    <span className="text-7xl">🧠</span>
                  </div>

                </div>

              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section
        id="about"
        className="py-20 md:py-24 bg-[#FFF9E8]"
      >

        <div className="max-w-7xl mx-auto px-5 md:px-8">

          <div className="text-center mb-12">

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 font-black text-sm mb-4">
              💡 Why EduLanka?
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-slate-800">
              Learning made fun & easy
            </h2>

          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">

            {[
              {
                icon: '📚',
                title: 'Easy Lessons',
                text: 'Simple learning content made for young students.',
                bg: 'bg-blue-50',
                border: 'border-blue-200',
                color: 'text-blue-600',
              },
              {
                icon: '🎮',
                title: 'Fun Games',
                text: 'Learn important concepts while playing.',
                bg: 'bg-purple-50',
                border: 'border-purple-200',
                color: 'text-purple-600',
              },
              {
                icon: '🧠',
                title: 'Smart Quizzes',
                text: 'Test your knowledge and improve every day.',
                bg: 'bg-green-50',
                border: 'border-green-200',
                color: 'text-green-600',
              },
              {
                icon: '🏆',
                title: 'Earn Badges',
                text: 'Celebrate your achievements and progress.',
                bg: 'bg-yellow-50',
                border: 'border-yellow-200',
                color: 'text-yellow-600',
              },
            ].map(item => (

              <div
                key={item.title}
                className={`p-6 rounded-[2rem] ${item.bg} border-2 ${item.border} hover:-translate-y-2 transition-all`}
              >

                <div className="text-5xl mb-5">
                  {item.icon}
                </div>

                <h3 className={`text-lg font-black ${item.color}`}>
                  {item.title}
                </h3>

                <p className="text-sm text-slate-500 leading-relaxed mt-2">
                  {item.text}
                </p>

              </div>

            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-20 bg-white">

        <div className="max-w-5xl mx-auto px-5 md:px-8">

          <div className="rounded-[2.5rem] bg-gradient-to-br from-yellow-300 via-orange-300 to-pink-300 p-8 md:p-14 text-center relative overflow-hidden">

            <div className="absolute top-5 left-10 text-3xl">
              ⭐
            </div>

            <div className="absolute bottom-5 right-10 text-3xl">
              🌈
            </div>

            <div className="relative">

              <div className="text-6xl mb-5">
                🚀
              </div>

              <h2 className="text-4xl md:text-5xl font-black text-slate-800">
                Let's start learning!
              </h2>

              <p className="mt-4 text-slate-700 max-w-xl mx-auto">
                Join EduLanka and discover a fun new way to learn every day.
              </p>

              <button
                onClick={startLearning}
                className="mt-8 px-8 py-4 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-black shadow-xl hover:-translate-y-1 transition-all"
              >
                🎓 Create Free Account
              </button>

            </div>
          </div>

        </div>
      </section>

      {/* ================= LOGIN ================= */}
      <section
        id="login"
        className="py-20 bg-slate-50"
      >

        <div className="max-w-md mx-auto px-5">

          <div className="text-center mb-8">

            <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-100 flex items-center justify-center text-3xl mb-4">
              🔐
            </div>

            <h2 className="text-3xl font-black text-slate-800">
              Welcome Back! 👋
            </h2>

            <p className="text-slate-500 mt-2">
              Continue your learning adventure.
            </p>

          </div>

          <div className="bg-white rounded-[2rem] border-2 border-blue-100 p-7 shadow-xl">

            <form onSubmit={login.handleSubmit}>

              <div className="space-y-4 mb-6">

                <FormField
                  label="Email"
                  type="email"
                  placeholder="you@school.lk"
                  icon={<Mail />}
                  value={login.email}
                  onChange={login.handleEmailChange}
                />

                <FormField
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  icon={<Lock />}
                  value={login.password}
                  onChange={login.handlePasswordChange}
                />

              </div>

              {login.error && (
                <p
                  role="alert"
                  className="mb-4 text-sm font-semibold text-red-600"
                >
                  {login.error}
                </p>
              )}

              <button
                type="submit"
                disabled={login.isLoading}
                className="w-full py-4 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-black transition"
              >
                {login.isLoading ? 'Signing in...' : '🔐 Login'}
              </button>

            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center">

              <p className="text-sm text-slate-500">
                Don't have an account?
              </p>

              <button
                onClick={startLearning}
                className="mt-2 font-black text-blue-500 hover:underline"
              >
                Create an account 🚀
              </button>

            </div>

          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-slate-800 text-white">

        <div className="max-w-7xl mx-auto px-5 md:px-8 py-12">

          <div className="grid md:grid-cols-4 gap-10">

            <div>

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-xl bg-yellow-400 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-slate-800" />
                </div>

                <div>
                  <p className="text-xl font-black">
                    Edu<span className="text-blue-400">Lanka</span>
                  </p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider">
                    Learn • Play • Grow
                  </p>
                </div>

              </div>

              <p className="text-sm text-slate-400 mt-5 leading-relaxed">
                Making learning fun, simple and accessible for Sri Lankan
                primary school children.
              </p>

            </div>

            <div>

              <h4 className="font-black mb-4">
                📚 Subjects
              </h4>

              <div className="space-y-2 text-sm text-slate-400">
                <p>Mathematics</p>
                <p>Sinhala</p>
                <p>English</p>
                <p>General Knowledge</p>
              </div>

            </div>

            <div>

              <h4 className="font-black mb-4">
                🎮 Explore
              </h4>

              <div className="space-y-2 text-sm text-slate-400">

                <button
                  onClick={() => scrollTo('games')}
                  className="block hover:text-white"
                >
                  Games
                </button>

                <button
                  onClick={() => scrollTo('quiz')}
                  className="block hover:text-white"
                >
                  Quizzes
                </button>

                <button
                  onClick={startLearning}
                  className="block hover:text-white"
                >
                  Register
                </button>

              </div>

            </div>

            <div>

              <h4 className="font-black mb-4">
                🌟 EduLanka
              </h4>

              <p className="text-sm text-slate-400 leading-relaxed">
                Learn something new every day and enjoy your learning journey!
              </p>

              <div className="flex gap-2 mt-5 text-2xl">
                ⭐ 🚀 🏆
              </div>

            </div>

          </div>

          <div className="border-t border-white/10 mt-10 pt-6 text-center">

            <p className="text-xs text-slate-500">
              © 2026 EduLanka • Learn • Play • Grow 🌈
            </p>

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
  { id: 'g1', file: 'number-quest.html', title: 'Number Quest', desc: 'Solve fun maths puzzles!', emoji: '🧮', heroBg: 'bg-orange-100', difficulty: 'Easy', diffColor: 'bg-green-100 text-green-700' },
  { id: 'g2', file: 'sinhala-letter-match.html', title: 'Sinhala Letter Match', desc: 'Match Sinhala letters to pictures!', emoji: '📝', heroBg: 'bg-purple-100', difficulty: 'Medium', diffColor: 'bg-yellow-100 text-yellow-700' },
  { id: 'g3', file: 'alphabet-adventure.html', title: 'Alphabet Adventure', desc: 'Journey through the English alphabet!', emoji: '🔤', heroBg: 'bg-cyan-100', difficulty: 'Easy', diffColor: 'bg-green-100 text-green-700' },
  { id: 'g4', file: 'island-explorer.html', title: 'Island Explorer', desc: 'Discover facts about Sri Lanka!', emoji: '🌍', heroBg: 'bg-green-100', difficulty: 'Hard', diffColor: 'bg-red-100 text-red-700' },
];

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT AUTH
// ─────────────────────────────────────────────────────────────────────────────
function StudentLogin({ nav, t }: { nav: (s: Screen) => void; t: (k: string) => string }) {
  const login = useFirebaseLogin(nav);
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
  const [grade, setGrade] = useState('Grade 5');
  const [language, setLanguage] = useState('si');
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
              <div className="grid grid-cols-5 gap-3">
                {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'].map(option => (
                  <button type="button" key={option} aria-pressed={grade === option} onClick={() => { setGrade(option); setProfileError(''); }} className={`aspect-square w-full rounded-full border-2 font-extrabold transition-all ${grade === option ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50'}`}>
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
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Enter your email address.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setSent(true);
    } catch (resetError) {
      const code = resetError instanceof Error && 'code' in resetError ? String(resetError.code) : '';
      if (code.includes('user-not-found')) {
        setError('No account was found with that email address.');
      } else if (code.includes('invalid-email')) {
        setError('Enter a valid email address.');
      } else {
        setError('Unable to send the reset link. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

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
            <p role="status" className="text-slate-500">Password reset link sent! Please check your inbox/spam folder.</p>
            <button onClick={() => nav('student_login')} className="mt-6 w-full bg-blue-600 text-white font-bold py-3 rounded-xl">Back to Login</button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Forgot Password?</h2>
            <p className="text-slate-500 text-sm mb-6">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit}>
              <label htmlFor="reset-email" className="block text-sm font-bold text-slate-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={event => { setEmail(event.target.value); setError(''); }}
                  placeholder="you@school.lk"
                  autoComplete="email"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
              <button type="submit" disabled={loading} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
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
  const [activeQuizSubject, setActiveQuizSubject] = useState<QuizSubject>('math');
  const [quizResult, setQuizResult] = useState({ score: 0, total: getQuizQuestions('math').length });
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
        {screen === 'student_lesson' && <LessonView nav={nav} onStartQuiz={subject => { setActiveQuizSubject(subject); nav('student_quiz'); }} />}
        {screen === 'student_games' && <GamesPage nav={nav} t={t} />}
        {screen === 'student_quiz_select' && <QuizSelect nav={nav} t={t} onStartQuiz={subject => { setActiveQuizSubject(subject); nav('student_quiz'); }} />}
        {screen === 'student_quiz' && <QuizPlay subject={activeQuizSubject} nav={nav} onFinish={score => { setQuizResult({ score, total: getQuizQuestions(activeQuizSubject).length }); nav('student_quiz_result'); }} />}
        {screen === 'student_quiz_result' && <QuizResult nav={nav} score={quizResult.score} total={quizResult.total} />}
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

function LessonView({ nav, onStartQuiz }: { nav: (s: Screen) => void; onStartQuiz: (subject: QuizSubject) => void }) {
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
          <button onClick={() => onStartQuiz('english')} className="flex-1 btn-chunky bg-green-500 shadow-[0_5px_0_#16A34A] hover:bg-green-600 text-white font-extrabold py-3.5 rounded-2xl active:translate-y-1 active:shadow-none transition-all">
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
              <button onClick={() => window.location.assign(`/games/${game.file}`)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                <Play className="w-4 h-4 fill-white" /> Play Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuizSelect({ nav, t, onStartQuiz }: { nav: (s: Screen) => void; t: (k: string) => string; onStartQuiz: (subject: QuizSubject) => void }) {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{t('quizzes')} ✅</h1>
      <p className="text-slate-500 mb-8">Test your knowledge and earn stars!</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[
          { title: 'Maths Week 3 Quiz', subject: 'Mathematics', subjectKey: 'math', emoji: '🧮', questions: 10, time: '10 min', stars: 3, color: 'border-orange-200 bg-orange-50' },
          { title: 'English Alphabet Quiz', subject: 'English Alphabet', subjectKey: 'english', emoji: '🔤', questions: 3, time: '3 min', stars: 0, color: 'border-cyan-200 bg-cyan-50' },
          { title: 'Sinhala Vowels Quiz', subject: 'Sinhala', subjectKey: 'sinhala', emoji: '📝', questions: 12, time: '12 min', stars: 0, color: 'border-purple-200 bg-purple-50' },
          { title: 'Sri Lanka General Knowledge', subject: 'Gen. Knowledge', subjectKey: 'gk', emoji: '🌍', questions: 15, time: '15 min', stars: 0, color: 'border-green-200 bg-green-50' },
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
            <button onClick={() => onStartQuiz(q.subjectKey as QuizSubject)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl transition-colors">
              {q.stars > 0 ? 'Retake Quiz' : 'Start Quiz'} →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const QUIZ_QUESTIONS: Record<QuizSubject, QuizQuestion[]> = {
  math: [
    { q: 'What is 5 + 3?', options: ['6', '7', '8', '9'], correct: 1, hint: 'Count on your fingers! 5 fingers, then 3 more.' },
    { q: 'Which number comes after 9?', options: ['8', '10', '11', '7'], correct: 1, hint: 'Think of the number line! 1, 2, 3... 🔢' },
    { q: 'What is 10 - 4?', options: ['5', '6', '7', '8'], correct: 2, hint: 'Start at 10, count back 4 steps. 🤚' },
  ],
  english: [
    { q: 'Which of these is a vowel?', options: ['B', 'E', 'K', 'T'], correct: 1 },
    { q: 'How many vowels are in the English alphabet?', options: ['3', '4', '5', '6'], correct: 2 },
    { q: 'Which letter is NOT a vowel?', options: ['A', 'I', 'M', 'U'], correct: 2 },
  ],
  sinhala: [],
  gk: [],
};

function getQuizQuestions(subject: QuizSubject): QuizQuestion[] {
  return QUIZ_QUESTIONS[subject];
}

function QuizPlay({ nav, onFinish, subject }: { nav: (s: Screen) => void; onFinish?: (score: number) => void; subject: QuizSubject }) {
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const quizQuestions = getQuizQuestions(subject);
  const q = quizQuestions[qIdx];
  const COLORS = ['bg-orange-400 shadow-[0_5px_0_#EA580C]', 'bg-green-400 shadow-[0_5px_0_#16A34A]', 'bg-blue-400 shadow-[0_5px_0_#0369A1]', 'bg-purple-400 shadow-[0_5px_0_#9333EA]'];

  if (!quizQuestions.length) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-10 shadow-md border border-slate-100">
          <p className="text-5xl mb-4">🚧</p>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Quiz coming soon</h2>
          <p className="text-slate-500">This subject is still being prepared. Check back soon.</p>
        </div>
      </div>
    );
  }

  const handleNext = () => {
    if (qIdx < quizQuestions.length - 1) {
      setQIdx(i => i + 1);
      setSelected(null);
      setSubmitted(false);
      setShowHint(false);
    }
  };

  const handlePrimaryAction = () => {
    if (selected === null) return;

    if (!submitted) {
      const isCorrect = selected === q.correct;
      const nextScore = isCorrect ? score + 1 : score;
      setSubmitted(true);
      if (isCorrect) {
        setScore(s => s + 1);
      }
      if (qIdx === quizQuestions.length - 1) {
        onFinish?.(nextScore);
      }
      return;
    }

    if (qIdx < quizQuestions.length - 1) {
      handleNext();
    } else {
      onFinish?.(score);
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
            <span>Question {qIdx + 1} of {quizQuestions.length}</span>
            <span className="text-amber-600">🪙 +{score * 10} coins</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div className="bg-gradient-to-r from-amber-400 to-orange-400 h-3 rounded-full transition-all" style={{ width: `${((qIdx) / quizQuestions.length) * 100}%` }} />
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
          onClick={handlePrimaryAction}
          disabled={selected === null}
          className={`flex-1 py-4 rounded-2xl font-extrabold text-base transition-all shadow-[0_5px_0_#D97706] btn-chunky active:translate-y-1 active:shadow-none ${
            selected === null ? 'bg-slate-200 text-slate-400 shadow-[0_5px_0_#CBD5E1] cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900'
          }`}
        >
          {submitted ? (qIdx < quizQuestions.length - 1 ? 'Next Question →' : '🏁 See Results') : '✅ Submit'}
        </button>
      </div>
    </div>
  );
}

function QuizResult({ nav, score, total }: { nav: (s: Screen) => void; score: number; total: number }) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const rating = pct >= 80 ? { label: 'Excellent!', emoji: '🏆', stars: 3 } : pct >= 60 ? { label: 'Good Job!', emoji: '🎉', stars: 2 } : { label: 'Keep Trying!', emoji: '💪', stars: 1 };
  const wrong = total - score;

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
        <StatBox value={wrong.toString()} label="Wrong ❌" color="bg-red-50 border-red-200 text-red-800" />
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
  const { userName, email, grade } = useCurrentUserProfile();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-8">{t('profile')}</h1>

      {/* Profile card */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl p-6 mb-8 flex items-center gap-6 text-white">
        <div className="relative shrink-0">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-4xl shrink-0 shadow-lg overflow-hidden">
            {avatarPreview ? <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" /> : '🧒'}
          </div>
          <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white text-blue-600 shadow-md flex items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors" aria-label="Upload profile picture">
            <Camera className="w-4 h-4" />
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={event => {
                const file = event.target.files?.[0];
                if (file) setAvatarPreview(URL.createObjectURL(file));
              }}
            />
          </label>
        </div>
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
          { label: 'Full Name', value: userName, icon: <User /> },
          { label: 'Email', value: email, icon: <Mail /> },
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
  const login = useFirebaseLogin(nav);
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
  const login = useFirebaseLogin(nav);
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
  const [metrics, setMetrics] = useState({ users: 0, active: 0 });
  const [metricsError, setMetricsError] = useState('');
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.getAdminMetrics()
      .then(data => {
        if (!cancelled) setMetrics(data);
      })
      .catch(error => {
        console.error('Failed to load dashboard metrics:', error);
        if (!cancelled) setMetricsError('Unable to load user metrics.');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingMetrics(false);
      });

    return () => { cancelled = true; };
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Ayubowan, Admin 👋</h1>
        <p className="text-slate-500">EduLanka system overview — {new Date().toLocaleDateString('en-LK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8 max-w-2xl">
        {[
          { label: 'Total Users', value: metrics.users, icon: <Users className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50' },
          { label: 'Active Accounts', value: metrics.active, icon: <CheckCircle className="w-5 h-5 text-green-600" />, bg: 'bg-green-50' },
        ].map((metric) => (
          <div key={metric.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex justify-between items-start mb-3"><p className="text-slate-500 text-xs font-medium">{metric.label}</p><div className={`w-8 h-8 rounded-xl ${metric.bg} flex items-center justify-center`}>{metric.icon}</div></div>
            <h2 className="text-2xl font-bold text-slate-900 mb-0.5">{isLoadingMetrics ? '—' : metric.value.toLocaleString()}</h2>
            <p className="text-xs text-slate-500">{metricsError || (metric.label === 'Active Accounts' ? 'Enabled Firebase accounts' : 'Firebase accounts')}</p>
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

type AdminUserRow = {
  uid: string;
  name: string;
  email: string;
  role: string;
  grade: string;
  status: string;
  joined: string;
};

function formatJoinedDate(value: unknown): string {
  // Firestore timestamps arrive as JSON objects like { _seconds, _nanoseconds }; ISO strings are also possible.
  const seconds = (value as { _seconds?: number } | null)?._seconds;
  const date = typeof seconds === 'number'
    ? new Date(seconds * 1000)
    : typeof value === 'string' ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
}

function toAdminUserRow(user: UserProfile): AdminUserRow {
  const role = String(user.role || 'student');
  return {
    uid: user.uid || user.id || '',
    name: user.displayName?.trim() || user.email || 'Unnamed user',
    email: user.email || '—',
    role: role.charAt(0).toUpperCase() + role.slice(1),
    grade: user.grade || '—',
    status: 'Active',
    joined: formatJoinedDate(user.createdAt),
  };
}

function AdminUsers() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Student' | 'Parent' | 'Teacher' | 'Admin'>('All');
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.listUsers()
      .then(res => { if (!cancelled) setUsers(res.users.map(toAdminUserRow)); })
      .catch(error => { if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Unable to load users.'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserProfile['role']) => {
    try {
      setUpdatingUserId(userId);
      await api.setRole(userId, newRole);
      setUsers(currentUsers => currentUsers.map(user => user.uid === userId
        ? { ...user, role: newRole.charAt(0).toUpperCase() + newRole.slice(1) }
        : user));
      alert('Role updated successfully! The user must log out and log in again for the changes to take effect.');
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('Error updating role. Please try again.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filtered = users.filter(u =>
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
            {(['All', 'Student', 'Parent', 'Teacher', 'Admin'] as const).map(f => (
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
              {(isLoading || loadError || (!isLoading && filtered.length === 0)) && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-400">
                    {isLoading ? 'Loading users...' : loadError ? loadError : 'No users found.'}
                  </td>
                </tr>
              )}
              {filtered.map((u, i) => (
                <tr key={i} className="hover:bg-slate-50 group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${u.role === 'Admin' ? 'bg-blue-100 text-blue-700' : u.role === 'Teacher' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>{u.name[0]}</div>
                      <div><p className="font-semibold text-slate-900">{u.name}</p><p className="text-xs text-slate-400">{u.email}</p></div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      aria-label={`Role for ${u.name}`}
                      value={u.role.toLowerCase()}
                      disabled={!u.uid || updatingUserId === u.uid}
                      onChange={event => { void handleRoleChange(u.uid, event.target.value as UserProfile['role']); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${u.role === 'Admin' ? 'bg-blue-100 text-blue-700' : u.role === 'Teacher' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}
                    >
                      {(['student', 'parent', 'teacher', 'admin'] as const).map(role => (
                        <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                      ))}
                    </select>
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
  const [subject, setSubject] = useState('Mathematics');
  const [grade, setGrade] = useState('Grade 3');
  const [language, setLanguage] = useState<'English' | 'Sinhala' | 'Tamil'>('English');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correct, setCorrect] = useState(0);
  const [hint, setHint] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const result = await api.createQuizQuestion({
        subject,
        grade,
        language,
        difficulty,
        question,
        options,
        correct,
        ...(hint.trim() ? { hint: hint.trim() } : {}),
      });
      setSuccess(`Question saved successfully (ID: ${result.id}).`);
      setQuestion('');
      setOptions(['', '', '', '']);
      setCorrect(0);
      setHint('');
    } catch (saveError) {
      console.error('Failed to save quiz question:', saveError);
      setError(saveError instanceof Error ? saveError.message : 'Unable to save the question. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

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

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div>
            <label htmlFor="quiz-subject" className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
            <select id="quiz-subject" value={subject} onChange={event => setSubject(event.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 bg-white">
              {['Mathematics', 'English', 'Sinhala', 'Tamil', 'General Knowledge'].map(value => <option key={value}>{value}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="quiz-grade" className="block text-sm font-semibold text-slate-700 mb-2">Grade</label>
            <select id="quiz-grade" value={grade} onChange={event => setGrade(event.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 bg-white">
              {[1, 2, 3, 4, 5].map(value => <option key={value}>Grade {value}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="quiz-language" className="block text-sm font-semibold text-slate-700 mb-2">Language</label>
            <select id="quiz-language" value={language} onChange={event => setLanguage(event.target.value as typeof language)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 bg-white">
              {(['English', 'Sinhala', 'Tamil'] as const).map(value => <option key={value}>{value}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="quiz-difficulty" className="block text-sm font-semibold text-slate-700 mb-2">Difficulty</label>
            <select id="quiz-difficulty" value={difficulty} onChange={event => setDifficulty(event.target.value as typeof difficulty)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 bg-white">
              {(['Easy', 'Medium', 'Hard'] as const).map(value => <option key={value}>{value}</option>)}
            </select>
          </div>
        </div>

        <div className="mb-8">
          <label htmlFor="quiz-question" className="block text-sm font-semibold text-slate-700 mb-2">Question Text</label>
          <textarea id="quiz-question" rows={3} required maxLength={1000} value={question} onChange={event => setQuestion(event.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 resize-none" placeholder="Type your question here..." />
        </div>

        <div className="mb-8">
          <label className="block text-sm font-semibold text-slate-700 mb-4">Answer Options <span className="text-slate-400 font-normal">(Select the correct answer)</span></label>
          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={index} className={`flex items-center gap-4 px-4 py-3 rounded-xl border ${correct === index ? 'border-2 border-blue-500 bg-blue-50/40' : 'border-slate-200'}`}>
                <input type="radio" name="correct" aria-label={`Mark option ${index + 1} correct`} checked={correct === index} onChange={() => setCorrect(index)} className="w-5 h-5 accent-blue-600" />
                <span className={`font-bold w-8 ${correct === index ? 'text-blue-700' : 'text-slate-600'}`}>{String.fromCharCode(65 + index)}</span>
                <input type="text" required maxLength={300} aria-label={`Answer option ${index + 1}`} value={option} onChange={event => setOptions(current => current.map((value, optionIndex) => optionIndex === index ? event.target.value : value))} className="flex-1 outline-none text-slate-900 bg-transparent font-medium" />
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <label htmlFor="quiz-hint" className="block text-sm font-semibold text-slate-700 mb-2">Hint / Explanation <span className="text-slate-400 font-normal">(optional)</span></label>
          <input id="quiz-hint" type="text" maxLength={500} value={hint} onChange={event => setHint(event.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500" placeholder="e.g. Count on your fingers! 5 fingers + 3 more = ?" />
        </div>

        {error && <p role="alert" className="mb-4 text-sm font-semibold text-red-600">{error}</p>}
        {success && <p role="status" className="mb-4 text-sm font-semibold text-green-700">{success}</p>}

        <div className="flex justify-between items-center pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => nav('admin_content')} className="px-6 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={isSaving} className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 font-semibold text-white shadow-sm transition-colors">{isSaving ? 'Saving...' : 'Save Question'}</button>
          </div>
        </div>
      </form>
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
  const [email, setEmail] = useState('');
  const [grade, setGrade] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (!user) {
        setUserName('there');
        setEmail('');
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
      setEmail(user.email || '');
      setGrade(profileGrade);
    });

    return unsubscribe;
  }, []);

  return { userName, email, grade };
}

function useFirebaseLogin(nav: (screen: Screen) => void) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

      // The role is decided by the backend (verified token claim), not by the browser.
      let me: UserProfile;
      try {
        me = await api.getMe();
      } catch {
        setError('Unable to load your account role. Please check your connection and try again.');
        return;
      }

      const destination = getDashboardForRole(me.role);
      if (!destination) {
        setError('Your account role is not recognized. Please contact an administrator.');
        return;
      }

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

function getDashboardForRole(role: unknown): Screen | undefined {
  switch (String(role ?? '').trim().toLowerCase()) {
    case 'student':
      return 'student_dashboard';
    case 'teacher':
    case 'parent':
      return 'parent_dashboard';
    case 'admin':
    case 'administrator':
      return 'admin_dashboard';
    default:
      return undefined;
  }
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
