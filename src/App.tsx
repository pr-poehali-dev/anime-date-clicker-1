import { useState, useEffect, useCallback } from 'react';

const HERO_IMG = 'https://cdn.poehali.dev/projects/fa02b305-cd43-45b0-8919-63c1c7e955ae/files/587a0657-d135-478c-946c-5bf13778ef00.jpg';
const MARKET_IMG = 'https://cdn.poehali.dev/projects/fa02b305-cd43-45b0-8919-63c1c7e955ae/files/6c80952d-659b-4304-906f-8eda6d6c5a7c.jpg';
const TOYS_IMG = 'https://cdn.poehali.dev/projects/fa02b305-cd43-45b0-8919-63c1c7e955ae/files/8d2a5d86-ff86-4d77-94e7-cd34516b454e.jpg';

type Tab = 'home' | 'market' | 'toys' | 'gallery' | 'quests' | 'settings';

interface GameState {
  coins: number;
  gems: number;
  level: number;
  xp: number;
  xpMax: number;
  username: string;
  avatar: string;
  unlockedToys: number[];
  completedQuests: number[];
  settings: { notifications: boolean; sound: boolean; music: boolean; tgSync: boolean };
}

const defaultState: GameState = {
  coins: 1250,
  gems: 34,
  level: 7,
  xp: 680,
  xpMax: 1000,
  username: 'Sakura-chan',
  avatar: '🌸',
  unlockedToys: [1, 2, 3],
  completedQuests: [1],
  settings: { notifications: true, sound: true, music: true, tgSync: false },
};

const SAKURA_PETALS = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  left: `${(i * 10 + 5)}%`,
  delay: `${(i * 0.8).toFixed(1)}s`,
  duration: `${7 + (i % 4)}s`,
  emoji: ['🌸', '🌺', '✨', '⭐', '💫'][i % 5],
}));

const MARKET_ITEMS = [
  { id: 1, name: 'Зелье силы', emoji: '⚗️', price: 120, gem: false, rarity: 'common', desc: 'Удваивает очки за 1 час' },
  { id: 2, name: 'Хрустальный шар', emoji: '🔮', price: 8, gem: true, rarity: 'rare', desc: 'Открывает секретный уровень' },
  { id: 3, name: 'Сакура-кристалл', emoji: '💎', price: 350, gem: false, rarity: 'epic', desc: 'Уникальный аватар-фрейм' },
  { id: 4, name: 'Лунный цветок', emoji: '🌙', price: 200, gem: false, rarity: 'rare', desc: '+50 XP при завершении' },
  { id: 5, name: 'Звёздный пыль', emoji: '✨', price: 3, gem: true, rarity: 'epic', desc: 'Анимация вокруг аватара' },
  { id: 6, name: 'Радуга-щит', emoji: '🌈', price: 90, gem: false, rarity: 'common', desc: 'Защита от штрафов' },
];

const TOYS = [
  { id: 1, name: 'Кото-кун', emoji: '🐱', desc: 'Котёнок с магическими усами', rarity: 'common', unlockLevel: 1 },
  { id: 2, name: 'Усаги-чан', emoji: '🐰', desc: 'Розовый кролик удачи', rarity: 'rare', unlockLevel: 3 },
  { id: 3, name: 'Тануки-сан', emoji: '🦝', desc: 'Тануки приносит монеты', rarity: 'rare', unlockLevel: 5 },
  { id: 4, name: 'Цуки-нэко', emoji: '🌙', desc: 'Лунный кот-хранитель', rarity: 'epic', unlockLevel: 8 },
  { id: 5, name: 'Сакура-дракон', emoji: '🐉', desc: 'Дракон сакуры — легенда', rarity: 'legendary', unlockLevel: 12 },
  { id: 6, name: 'Кодама', emoji: '🌿', desc: 'Дух леса, дающий XP', rarity: 'epic', unlockLevel: 10 },
];

const QUESTS = [
  { id: 1, name: 'Первые шаги', emoji: '👣', desc: 'Зайди в приложение впервые', reward: 100, xp: 50 },
  { id: 2, name: 'Коллекционер', emoji: '🎁', desc: 'Разблокируй 3 игрушки', reward: 250, xp: 120 },
  { id: 3, name: 'Торговец', emoji: '🛍️', desc: 'Купи 3 предмета на рынке', reward: 180, xp: 80 },
  { id: 4, name: 'Галерейщик', emoji: '🖼️', desc: 'Добавь 5 фото в галерею', reward: 300, xp: 150 },
  { id: 5, name: 'Социальный', emoji: '👥', desc: 'Поделись статистикой в ТГ', reward: 500, xp: 200 },
  { id: 6, name: 'Мастер', emoji: '⭐', desc: 'Достигни 10-го уровня', reward: 1000, xp: 500 },
];

const GALLERY = [
  { id: 1, emoji: '🌸', title: 'Сакура в цвету', likes: 24 },
  { id: 2, emoji: '🏯', title: 'Замок Химэдзи', likes: 18 },
  { id: 3, emoji: '🌊', title: 'Морской бриз', likes: 31 },
  { id: 4, emoji: '🎋', title: 'Бамбуковый лес', likes: 12 },
  { id: 5, emoji: '🦊', title: 'Лисий фестиваль', likes: 45 },
  { id: 6, emoji: '🌺', title: 'Красный мак', likes: 9 },
];

const RARITY: Record<string, string> = {
  common: 'text-gray-400 border-gray-500/30',
  rare: 'text-cyan-300 border-cyan-400/30',
  epic: 'text-purple-300 border-purple-400/30',
  legendary: 'text-yellow-300 border-yellow-400/30',
};

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [state, setState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem('animeworld_save');
      return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState;
    } catch { return defaultState; }
  });
  const [notification, setNotification] = useState<string | null>(null);
  const [likedItems, setLikedItems] = useState<number[]>([]);

  const save = useCallback((s: GameState) => {
    localStorage.setItem('animeworld_save', JSON.stringify(s));
  }, []);

  useEffect(() => { save(state); }, [state, save]);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  const buyItem = (item: typeof MARKET_ITEMS[0]) => {
    if (item.gem) {
      if (state.gems < item.price) { notify('❌ Не хватает самоцветов!'); return; }
      setState(s => ({ ...s, gems: s.gems - item.price }));
    } else {
      if (state.coins < item.price) { notify('❌ Не хватает монет!'); return; }
      setState(s => ({ ...s, coins: s.coins - item.price }));
    }
    notify(`✨ Куплено: ${item.name}!`);
  };

  const unlockToy = (toy: typeof TOYS[0]) => {
    if (state.level < toy.unlockLevel) { notify(`🔒 Нужен ${toy.unlockLevel}-й уровень!`); return; }
    if (state.unlockedToys.includes(toy.id)) { notify('✅ Уже разблокировано!'); return; }
    setState(s => ({ ...s, unlockedToys: [...s.unlockedToys, toy.id] }));
    notify(`🎉 Разблокировано: ${toy.name}!`);
  };

  const likeGallery = (id: number) => {
    if (likedItems.includes(id)) return;
    setLikedItems(p => [...p, id]);
    notify('💖 Лайк!');
  };

  const completeQuest = (quest: typeof QUESTS[0]) => {
    if (state.completedQuests.includes(quest.id)) { notify('✅ Уже выполнено!'); return; }
    setState(s => ({
      ...s,
      coins: s.coins + quest.reward,
      xp: Math.min(s.xp + quest.xp, s.xpMax),
      completedQuests: [...s.completedQuests, quest.id],
    }));
    notify(`🎁 +${quest.reward} монет, +${quest.xp} XP!`);
  };

  const updateSetting = (key: keyof GameState['settings'], val: boolean) => {
    setState(s => ({ ...s, settings: { ...s.settings, [key]: val } }));
  };

  const NAV: { id: Tab; emoji: string; label: string }[] = [
    { id: 'home', emoji: '🏠', label: 'Главная' },
    { id: 'market', emoji: '🛒', label: 'Рынок' },
    { id: 'toys', emoji: '🧸', label: 'Игрушки' },
    { id: 'gallery', emoji: '🖼️', label: 'Галерея' },
    { id: 'quests', emoji: '⚔️', label: 'Задания' },
    { id: 'settings', emoji: '⚙️', label: 'Настройки' },
  ];

  const xpPct = Math.round((state.xp / state.xpMax) * 100);

  return (
    <div className="anime-bg min-h-screen font-nunito relative">
      {SAKURA_PETALS.map(p => (
        <span key={p.id} className="sakura" style={{ left: p.left, animationDelay: p.delay, animationDuration: p.duration }}>
          {p.emoji}
        </span>
      ))}

      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 anime-card px-5 py-3 text-sm font-bold whitespace-nowrap glow-pink" style={{ animation: 'slide-up 0.3s ease' }}>
          {notification}
        </div>
      )}

      {/* Header */}
      <header className="relative z-10 px-4 pt-4 pb-2 flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl float-anim">{state.avatar}</span>
          <div>
            <p className="font-black text-sm leading-tight gradient-text-pink">{state.username}</p>
            <p className="text-xs text-white/40">Уровень {state.level}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 anime-card px-3 py-1.5">
            <span className="text-sm">🪙</span>
            <span className="text-sm font-black text-yellow-300">{state.coins.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 anime-card px-3 py-1.5">
            <span className="text-sm">💎</span>
            <span className="text-sm font-black text-cyan-300">{state.gems}</span>
          </div>
        </div>
      </header>

      {/* XP bar */}
      <div className="relative z-10 px-4 max-w-lg mx-auto mb-1">
        <div className="flex justify-between text-[10px] text-white/30 mb-1 font-bold">
          <span>XP: {state.xp}</span><span>{xpPct}% → Lv.{state.level + 1}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
          <div className="progress-bar h-full" style={{ width: `${xpPct}%` }} />
        </div>
      </div>

      {/* Content */}
      <main className="relative z-10 px-4 pb-28 pt-3 max-w-lg mx-auto">

        {/* HOME */}
        {tab === 'home' && (
          <div className="space-y-4">
            <div className="anime-card overflow-hidden relative slide-up" style={{ background: 'linear-gradient(135deg, rgba(255,110,180,0.1), rgba(155,89,212,0.1))' }}>
              <div className="absolute top-0 right-0 w-36 h-36 opacity-20 rounded-full" style={{ background: 'radial-gradient(circle, #FF6EB4, transparent)' }} />
              <div className="flex items-end gap-2 p-4">
                <div className="flex-1">
                  <p className="font-black text-2xl leading-tight">
                    <span className="gradient-text-pink">Привет,</span><br />
                    <span className="text-white">{state.username}!</span>
                  </p>
                  <p className="text-white/40 text-sm mt-1">Добро пожаловать в аниме-мир ✨</p>
                  <div className="mt-3 flex gap-2">
                    <div className="anime-card px-3 py-1.5 text-center">
                      <p className="text-yellow-300 font-black text-base">⭐ Lv.{state.level}</p>
                    </div>
                    <div className="anime-card px-3 py-1.5 text-center">
                      <p className="text-green-300 font-black text-base">🎁 {state.completedQuests.length} задан.</p>
                    </div>
                  </div>
                </div>
                <img src={HERO_IMG} alt="anime" className="w-28 h-32 object-cover rounded-2xl float-anim" style={{ objectPosition: 'top' }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 slide-up slide-up-1">
              <div className="anime-card p-4" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,170,0,0.05))' }}>
                <span className="text-3xl star-shine block mb-1">🎁</span>
                <p className="font-black text-sm text-white">Ежедневный бонус</p>
                <p className="text-white/40 text-xs mb-3">+50 монет каждый день</p>
                <button className="btn-anime w-full py-2 text-xs">Забрать</button>
              </div>
              <div className="anime-card p-4" style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.08), rgba(0,255,204,0.05))' }}>
                <span className="text-3xl block mb-1">📱</span>
                <p className="font-black text-sm text-white">Telegram</p>
                <p className="text-white/40 text-xs mb-3">Статистика для друзей</p>
                <button className="btn-cyan w-full py-2 text-xs" onClick={() => notify('📱 Включи в Настройках!')}>Подключить</button>
              </div>
            </div>

            <div className="anime-card p-4 slide-up slide-up-2">
              <div className="flex items-center gap-2 mb-3">
                <span>📊</span>
                <p className="font-black text-sm text-white">Статистика</p>
                <div className="ml-auto flex items-center gap-1">
                  <span className="pulse-dot w-2 h-2 rounded-full bg-green-400 inline-block" />
                  <span className="text-xs text-green-400 font-bold">В сети</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Игрушек', val: `${state.unlockedToys.length}/6`, color: 'gradient-text-pink' },
                  { label: 'Заданий', val: `${state.completedQuests.length}/6`, color: 'gradient-text-cyan' },
                  { label: 'Монет', val: state.coins.toLocaleString(), color: 'text-yellow-300' },
                  { label: 'Самоцветов', val: state.gems, color: 'text-cyan-300' },
                ].map(s => (
                  <div key={s.label} className="bg-white/5 rounded-xl p-3">
                    <p className={`font-black text-base ${s.color}`}>{s.val}</p>
                    <p className="text-white/40 text-xs">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* TG leaderboard teaser */}
            <div className="anime-card p-3 slide-up slide-up-3 stripe-bg">
              <p className="text-white/40 text-xs font-bold mb-2 uppercase tracking-wider">🏆 Топ игроков</p>
              {['🌸 Sakura-chan', '⚡ NarutoBoy', '🔮 MagicGirl99'].map((u, i) => (
                <div key={u} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-sm font-bold text-white">{['🥇','🥈','🥉'][i]} {u}</span>
                  <span className="text-xs text-white/40">{[2400, 1980, 1750][i]} очков</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MARKET */}
        {tab === 'market' && (
          <div className="space-y-4">
            <div className="slide-up flex items-end gap-3 mb-2">
              <div>
                <h2 className="font-black text-xl gradient-text-pink">Рынок</h2>
                <p className="text-white/40 text-xs">Магические предметы и артефакты</p>
              </div>
              <img src={MARKET_IMG} alt="market" className="ml-auto w-20 h-14 object-cover rounded-xl opacity-70" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {MARKET_ITEMS.map((item, i) => (
                <div key={item.id} className="anime-card p-3 slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-3xl">{item.emoji}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${RARITY[item.rarity]}`}>{item.rarity}</span>
                  </div>
                  <p className="font-black text-sm text-white">{item.name}</p>
                  <p className="text-white/40 text-[11px] mb-3 leading-tight">{item.desc}</p>
                  <button onClick={() => buyItem(item)} className={`w-full py-2 text-xs font-black rounded-xl transition-all ${item.gem ? 'btn-cyan' : 'btn-anime'}`}>
                    {item.gem ? `💎 ${item.price}` : `🪙 ${item.price}`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TOYS */}
        {tab === 'toys' && (
          <div className="space-y-4">
            <div className="slide-up flex items-end gap-3 mb-2">
              <div>
                <h2 className="font-black text-xl gradient-text-cyan">Игрушки</h2>
                <p className="text-white/40 text-xs">Твоя коллекция существ</p>
              </div>
              <img src={TOYS_IMG} alt="toys" className="ml-auto w-20 h-14 object-cover rounded-xl opacity-70" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {TOYS.map((toy, i) => {
                const unlocked = state.unlockedToys.includes(toy.id);
                const canUnlock = state.level >= toy.unlockLevel;
                return (
                  <div key={toy.id} className={`anime-card p-4 slide-up ${!unlocked ? 'opacity-60' : ''}`} style={{ animationDelay: `${i * 0.05}s`, borderColor: unlocked ? 'rgba(255,110,180,0.3)' : undefined }}>
                    <div className="relative mb-2 text-center">
                      <span className={`text-4xl block ${unlocked ? 'float-anim' : ''}`} style={!unlocked ? { filter: 'grayscale(1) brightness(0.4)' } : {}}>
                        {toy.emoji}
                      </span>
                      {unlocked && <span className="absolute -top-1 right-0 text-sm">✅</span>}
                    </div>
                    <p className="font-black text-sm text-center text-white">{toy.name}</p>
                    <p className="text-white/40 text-[11px] text-center mb-2 leading-tight">{toy.desc}</p>
                    <div className={`text-center text-[10px] font-bold mb-2 ${RARITY[toy.rarity].split(' ')[0]}`}>{toy.rarity.toUpperCase()}</div>
                    {!unlocked ? (
                      <button onClick={() => unlockToy(toy)} disabled={!canUnlock} className={`w-full py-1.5 text-xs font-black rounded-xl transition-all ${canUnlock ? 'btn-anime' : 'bg-white/5 text-white/30 cursor-not-allowed rounded-xl'}`}>
                        {canUnlock ? '🔓 Разблокировать' : `🔒 Lv.${toy.unlockLevel}`}
                      </button>
                    ) : (
                      <div className="text-center text-xs font-bold gradient-text-pink">Разблокировано!</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* GALLERY */}
        {tab === 'gallery' && (
          <div className="space-y-4">
            <div className="slide-up">
              <h2 className="font-black text-xl gradient-text-pink mb-0.5">Галерея</h2>
              <p className="text-white/40 text-xs">Аниме-артефакты сообщества</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {GALLERY.map((item, i) => (
                <div key={item.id} className="anime-card overflow-hidden slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="h-28 flex items-center justify-center text-5xl" style={{ background: 'linear-gradient(135deg, rgba(255,110,180,0.1), rgba(155,89,212,0.1))' }}>
                    {item.emoji}
                  </div>
                  <div className="p-2.5">
                    <p className="font-bold text-xs text-white truncate">{item.title}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-white/40 text-[10px]">{item.likes + (likedItems.includes(item.id) ? 1 : 0)} лайков</span>
                      <button onClick={() => likeGallery(item.id)} className={`text-sm transition-transform hover:scale-125 ${likedItems.includes(item.id) ? '' : 'opacity-30'}`}>
                        {likedItems.includes(item.id) ? '💖' : '🤍'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full btn-anime py-3 text-sm" onClick={() => notify('📸 Загрузка фото — скоро!')}>📸 Добавить в галерею</button>
          </div>
        )}

        {/* QUESTS */}
        {tab === 'quests' && (
          <div className="space-y-3">
            <div className="slide-up">
              <h2 className="font-black text-xl text-yellow-300 mb-0.5">Задания</h2>
              <p className="text-white/40 text-xs">Выполняй и получай награды</p>
            </div>
            {QUESTS.map((q, i) => {
              const done = state.completedQuests.includes(q.id);
              return (
                <div key={q.id} className={`anime-card p-4 slide-up flex items-center gap-3 ${done ? 'opacity-50' : ''}`} style={{ animationDelay: `${i * 0.05}s`, borderColor: done ? 'rgba(255,215,0,0.2)' : undefined }}>
                  <span className="text-3xl">{q.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-white">{q.name}</p>
                    <p className="text-white/40 text-[11px] leading-tight">{q.desc}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-yellow-300 text-[11px] font-bold">🪙 {q.reward}</span>
                      <span className="text-cyan-300 text-[11px] font-bold">✨ +{q.xp} XP</span>
                    </div>
                  </div>
                  {done ? <div className="text-xl">✅</div> : (
                    <button onClick={() => completeQuest(q)} className="btn-anime px-3 py-2 text-xs shrink-0">Взять</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* SETTINGS */}
        {tab === 'settings' && (
          <div className="space-y-4">
            <div className="slide-up">
              <h2 className="font-black text-xl gradient-text-pink mb-0.5">Настройки</h2>
              <p className="text-white/40 text-xs">Персонализируй свой мир</p>
            </div>

            <div className="anime-card p-4 slide-up slide-up-1">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{state.avatar}</span>
                <div>
                  <p className="font-black text-white">{state.username}</p>
                  <p className="text-white/40 text-xs">Уровень {state.level} · {state.xp}/{state.xpMax} XP</p>
                </div>
                <button className="ml-auto btn-anime px-3 py-1.5 text-xs" onClick={() => notify('✏️ Редактирование — скоро!')}>Изменить</button>
              </div>
            </div>

            <div className="anime-card p-1 slide-up slide-up-2 overflow-hidden">
              {([
                { key: 'notifications' as const, label: 'Уведомления', emoji: '🔔', desc: 'Push-уведомления о событиях' },
                { key: 'sound' as const, label: 'Звуки', emoji: '🔊', desc: 'Звуковые эффекты в игре' },
                { key: 'music' as const, label: 'Музыка', emoji: '🎵', desc: 'Фоновая аниме-музыка' },
                { key: 'tgSync' as const, label: 'Telegram синхронизация', emoji: '📱', desc: 'Статистика видна друзьям в группе' },
              ]).map((t, i, arr) => (
                <div key={t.key} className={`flex items-center gap-3 px-4 py-3 ${i < arr.length - 1 ? 'border-b border-white/5' : ''}`}>
                  <span className="text-xl">{t.emoji}</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-white">{t.label}</p>
                    <p className="text-white/30 text-[11px]">{t.desc}</p>
                  </div>
                  <button
                    onClick={() => updateSetting(t.key, !state.settings[t.key])}
                    className={`w-12 h-6 rounded-full transition-all relative ${state.settings[t.key] ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-white/10'}`}
                  >
                    <span className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-md ${state.settings[t.key] ? 'left-6' : 'left-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>

            {state.settings.tgSync && (
              <div className="anime-card p-4 slide-up" style={{ border: '1px solid rgba(0,229,255,0.3)', background: 'rgba(0,229,255,0.06)' }}>
                <p className="font-black text-sm text-cyan-300 mb-1">📱 Telegram подключён</p>
                <p className="text-white/40 text-xs">Твоя статистика видна всем пользователям в группе</p>
              </div>
            )}

            <div className="anime-card p-4 slide-up slide-up-3" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="font-black text-sm text-red-400 mb-2">⚠️ Опасная зона</p>
              <button onClick={() => notify('🔒 Сброс требует подтверждения — скоро!')} className="w-full py-2.5 text-xs font-black rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all">
                Сбросить прогресс
              </button>
            </div>

            <div className="text-center text-white/20 text-xs pt-2" style={{ fontFamily: 'Caveat, cursive', fontSize: '16px' }}>
              Anime World v1.0 ✨ Made with love
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 px-2 pb-3 pt-2">
        <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2 rounded-2xl" style={{ background: 'rgba(13,6,32,0.92)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,110,180,0.2)' }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)} className={`nav-item flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all ${tab === n.id ? 'active' : 'opacity-40 hover:opacity-70'}`}>
              <span className="text-xl">{n.emoji}</span>
              <span className={`text-[9px] font-black ${tab === n.id ? 'gradient-text-pink' : 'text-white'}`}>{n.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
