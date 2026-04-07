import { useState, useEffect, useCallback, useRef } from 'react';

const CHAR_IMG = 'https://cdn.poehali.dev/projects/fa02b305-cd43-45b0-8919-63c1c7e955ae/files/38c76cd9-73f6-4bc0-a53b-afc8e6663f26.jpg';
const CHAR_IMG2 = 'https://cdn.poehali.dev/projects/fa02b305-cd43-45b0-8919-63c1c7e955ae/files/587a0657-d135-478c-946c-5bf13778ef00.jpg';
const MARKET_IMG = 'https://cdn.poehali.dev/projects/fa02b305-cd43-45b0-8919-63c1c7e955ae/files/6c80952d-659b-4304-906f-8eda6d6c5a7c.jpg';
const TOYS_IMG = 'https://cdn.poehali.dev/projects/fa02b305-cd43-45b0-8919-63c1c7e955ae/files/8d2a5d86-ff86-4d77-94e7-cd34516b454e.jpg';

type Tab = 'home' | 'market' | 'toys' | 'gallery' | 'quests' | 'settings';

interface GameState {
  coins: number;
  gems: number;
  stars: number;
  level: number;
  xp: number;
  xpMax: number;
  username: string;
  energy: number;
  energyMax: number;
  unlockedToys: number[];
  completedQuests: number[];
  settings: { notifications: boolean; sound: boolean; music: boolean; tgSync: boolean };
}

const defaultState: GameState = {
  coins: 3.00,
  gems: 664,
  stars: 15,
  level: 1,
  xp: 0,
  xpMax: 100,
  username: 'sxzxtsv',
  energy: 17,
  energyMax: 30,
  unlockedToys: [1, 2],
  completedQuests: [1],
  settings: { notifications: true, sound: true, music: true, tgSync: false },
};

const CHARACTERS = [
  { id: 1, name: 'ЗАНЯТА С ДРУГОЙ УТКОЙ', subname: 'НЕ БЕСПОКОИТЬ', rarity: 'COMMON', level: 1, img: CHAR_IMG, hearts: 3, maxHearts: 5, energy: 17 },
  { id: 2, name: 'САКУРА-ЧАН', subname: 'СВОБОДНА', rarity: 'RARE', level: 3, img: CHAR_IMG2, hearts: 5, maxHearts: 5, energy: 22 },
];

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

const RARITY_COLOR: Record<string, { text: string; border: string; bg: string }> = {
  common: { text: '#9CA3AF', border: 'rgba(156,163,175,0.3)', bg: 'rgba(156,163,175,0.08)' },
  rare: { text: '#67E8F9', border: 'rgba(103,232,249,0.3)', bg: 'rgba(103,232,249,0.08)' },
  epic: { text: '#C084FC', border: 'rgba(192,132,252,0.3)', bg: 'rgba(192,132,252,0.08)' },
  legendary: { text: '#FDE047', border: 'rgba(253,224,71,0.3)', bg: 'rgba(253,224,71,0.08)' },
};

function useTimer(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);
  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s > 0 ? s - 1 : 0), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

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
  const [charIdx, setCharIdx] = useState(0);
  const touchStartX = useRef(0);

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

  const NAV = [
    { id: 'market' as Tab, icon: '📈', label: 'РЫНОК' },
    { id: 'gallery' as Tab, icon: '🖼️', label: 'ГАЛЕРЕЯ' },
    { id: 'home' as Tab, icon: '🌸', label: 'ГЛАВНАЯ', center: true },
    { id: 'quests' as Tab, icon: '👤', label: 'ЗАДАНИЯ' },
    { id: 'settings' as Tab, icon: '✅', label: 'ЕЩЕЩЁ' },
  ];

  return (
    <div style={{ background: '#0e0a1a', minHeight: '100vh', fontFamily: 'Nunito, sans-serif', position: 'relative', overflowX: 'hidden' }}>
      {notification && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: 'rgba(30,16,50,0.97)', border: '1px solid rgba(255,110,180,0.4)', borderRadius: 16, padding: '10px 20px', fontSize: 13, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', boxShadow: '0 0 30px rgba(255,110,180,0.3)' }}>
          {notification}
        </div>
      )}

      {/* ── TOP BAR ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 8px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: 21, overflow: 'hidden', border: '2px solid rgba(255,110,180,0.4)' }}>
            <img src={CHAR_IMG2} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#fff' }}>{state.username}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 800, color: '#FF6EB4', background: 'rgba(255,110,180,0.12)', borderRadius: 8, padding: '2px 7px' }}>
                🔥 СТАЯ
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 800, color: '#aaa', background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '2px 7px' }}>
                💳
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 900, color: '#4ade80' }}>
            <span style={{ fontSize: 15 }}>💚</span> {state.gems}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 900, color: '#FBBF24' }}>
            <span style={{ fontSize: 15 }}>⭐</span> {state.stars}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 88px' }}>

        {/* HOME */}
        {tab === 'home' && <HomeTab state={state} characters={CHARACTERS} charIdx={charIdx} setCharIdx={setCharIdx} onNotify={notify} touchStartX={touchStartX} />}
        {tab === 'market' && <MarketTab items={MARKET_ITEMS} onBuy={buyItem} onNotify={notify} />}
        {tab === 'gallery' && <GalleryTab items={GALLERY} likedItems={likedItems} onLike={likeGallery} toys={TOYS} state={state} onUnlock={unlockToy} />}
        {tab === 'quests' && <QuestsTab quests={QUESTS} state={state} onComplete={completeQuest} />}
        {tab === 'settings' && <SettingsTab state={state} onUpdate={updateSetting} onNotify={notify} />}
      </div>

      {/* ── BOTTOM NAV ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 480, margin: '0 auto', background: 'rgba(10,6,20,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '8px 4px 12px' }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', position: 'relative' }}>
              {n.center ? (
                <div style={{ width: 48, height: 48, borderRadius: 24, background: tab === n.id ? 'linear-gradient(135deg,#FF6EB4,#9B59D4)' : 'rgba(255,110,180,0.15)', border: '2px solid rgba(255,110,180,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginTop: -20, boxShadow: tab === n.id ? '0 0 20px rgba(255,110,180,0.5)' : 'none', transition: 'all 0.2s' }}>
                  {n.icon}
                </div>
              ) : (
                <span style={{ fontSize: 22 }}>{n.icon}</span>
              )}
              <span style={{ fontSize: 9, fontWeight: 900, color: tab === n.id ? '#FF6EB4' : 'rgba(255,255,255,0.35)', letterSpacing: 0.5, transition: 'color 0.2s' }}>{n.label}</span>
              {tab === n.id && !n.center && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: 2, background: '#FF6EB4' }} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── HOME ─── */
function HomeTab({ state, characters, charIdx, setCharIdx, onNotify, touchStartX }: {
  state: GameState;
  characters: typeof CHARACTERS;
  charIdx: number;
  setCharIdx: (i: number) => void;
  onNotify: (m: string) => void;
  touchStartX: React.MutableRefObject<number>;
}) {
  const char = characters[charIdx];
  const timer = useTimer(75470);

  const swipeLeft = () => setCharIdx(i => Math.min(i + 1, characters.length - 1));
  const swipeRight = () => setCharIdx(i => Math.max(i - 1, 0));

  return (
    <div style={{ padding: '0 0' }}>
      {/* Coins + gift */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Side badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button onClick={() => onNotify('👑 Дакер Пасс — откроется скоро!')} style={{ background: 'rgba(255,170,0,0.12)', border: '1px solid rgba(255,170,0,0.25)', borderRadius: 12, padding: '6px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ fontSize: 18 }}>👑</span>
              <span style={{ fontSize: 8, fontWeight: 900, color: '#FBBF24', lineHeight: 1 }}>ДАКЕР</span>
              <span style={{ fontSize: 8, fontWeight: 900, color: '#FBBF24', lineHeight: 1 }}>ПАСС</span>
            </button>
            <button onClick={() => onNotify('🏆 Турнир — скоро!')} style={{ background: 'rgba(255,170,0,0.12)', border: '1px solid rgba(255,170,0,0.25)', borderRadius: 12, padding: '6px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ fontSize: 18 }}>🏆</span>
              <span style={{ fontSize: 8, fontWeight: 900, color: '#FBBF24' }}>04:06:53</span>
            </button>
          </div>

          {/* Main coin display */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: 'linear-gradient(135deg,#FF6EB4,#9B59D4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🌸</div>
              <span style={{ fontSize: 32, fontWeight: 900, color: '#FF6EB4', letterSpacing: -1 }}>{state.coins.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Gift button */}
        <button onClick={() => onNotify('🎁 Бонус получен! +50 монет')} style={{ background: 'rgba(255,110,180,0.12)', border: '1px solid rgba(255,110,180,0.25)', borderRadius: 16, padding: '10px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
          <span style={{ fontSize: 24 }}>🎁</span>
          <span style={{ fontSize: 9, fontWeight: 900, color: '#FF6EB4' }}>6 ДНЕЙ</span>
        </button>
      </div>

      {/* Character card area */}
      <div
        style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}
        onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (dx > 50) swipeRight();
          if (dx < -50) swipeLeft();
        }}
      >
        {/* Prev character peek */}
        {charIdx > 0 && (
          <div onClick={swipeRight} style={{ position: 'absolute', left: 4, width: 50, height: 180, borderRadius: 16, overflow: 'hidden', opacity: 0.5, cursor: 'pointer', zIndex: 2 }}>
            <img src={characters[charIdx - 1].img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', filter: 'blur(1px)' }} />
          </div>
        )}

        {/* Main card */}
        <div style={{ flex: 1, maxWidth: 280, position: 'relative' }}>
          {/* Card frame */}
          <div style={{ borderRadius: 24, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(255,110,180,0.1)' }}>
            <div style={{ position: 'absolute', top: 10, left: 12, zIndex: 5, fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.6)' }}>LVL {char.level}</div>
            <div style={{ position: 'absolute', top: 10, right: 12, zIndex: 5, fontSize: 11, fontWeight: 900, color: RARITY_COLOR[char.rarity.toLowerCase()]?.text || '#fff', letterSpacing: 1 }}>{char.rarity}</div>

            {/* Energy badge */}
            <div style={{ position: 'absolute', top: 32, left: -8, zIndex: 6, background: 'linear-gradient(135deg,#e91e8c,#9b59d4)', borderRadius: 20, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 4px 12px rgba(233,30,140,0.5)' }}>
              <span style={{ fontSize: 10 }}>🌸</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{char.energy}</span>
            </div>

            <img src={char.img} alt={char.name} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />

            {/* Name plate */}
            <div style={{ background: 'rgba(255,255,255,0.95)', padding: '8px 12px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#1a0835', letterSpacing: 0.5 }}>{char.name}</div>
              <div style={{ fontSize: 10, color: '#888', fontWeight: 700, marginTop: 1 }}>{char.subname}</div>
            </div>
          </div>
        </div>

        {/* Next peek */}
        {charIdx < characters.length - 1 && (
          <div onClick={swipeLeft} style={{ position: 'absolute', right: 4, width: 50, height: 180, borderRadius: 16, overflow: 'hidden', opacity: 0.5, cursor: 'pointer', zIndex: 2 }}>
            <img src={characters[charIdx + 1].img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', filter: 'blur(1px)' }} />
          </div>
        )}
      </div>

      {/* Hearts row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '12px 16px' }}>
        <button onClick={() => onNotify('💨 Тип взаимодействия — скоро!')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, opacity: 0.5 }}>💨</button>
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
        {Array.from({ length: char.maxHearts }).map((_, i) => (
          <span key={i} style={{ fontSize: 22, filter: i < char.hearts ? 'none' : 'grayscale(1) opacity(0.3)', cursor: 'pointer', transition: 'transform 0.15s' }}
            onClick={() => onNotify(`💖 Сердечко ${i + 1}!`)}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.3)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            ❤️
          </span>
        ))}
        <button onClick={() => onNotify('➕ Добавить взаимодействие — скоро!')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'rgba(255,255,255,0.4)' }}>＋</button>
      </div>

      {/* Timer box */}
      <div style={{ margin: '0 16px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Разведение завершится через</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>ℹ️</span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#FF6EB4', marginTop: 4, letterSpacing: 2 }}>{timer}</div>
        {/* hearts progress */}
        <div style={{ display: 'flex', gap: 3, marginTop: 8, flexWrap: 'wrap' }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i} style={{ fontSize: 13, filter: i < 14 ? 'none' : 'grayscale(1) opacity(0.25)' }}>❤️</span>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingBottom: 4 }}>
        {characters.map((_, i) => (
          <div key={i} onClick={() => setCharIdx(i)} style={{ width: i === charIdx ? 20 : 6, height: 6, borderRadius: 3, background: i === charIdx ? '#FF6EB4' : 'rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'all 0.3s' }} />
        ))}
      </div>
    </div>
  );
}

/* ─── MARKET ─── */
function MarketTab({ items, onBuy, onNotify }: { items: typeof MARKET_ITEMS; onBuy: (i: typeof MARKET_ITEMS[0]) => void; onNotify: (m: string) => void }) {
  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, background: 'linear-gradient(135deg,#FF6EB4,#ff9cee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>Рынок</h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Магические предметы</p>
        </div>
        <img src={MARKET_IMG} alt="" style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 12, opacity: 0.7 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {items.map(item => {
          const rc = RARITY_COLOR[item.rarity];
          return (
            <div key={item.id} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${rc.border}`, borderRadius: 18, padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 32 }}>{item.emoji}</span>
                <span style={{ fontSize: 9, fontWeight: 800, color: rc.text, background: rc.bg, border: `1px solid ${rc.border}`, borderRadius: 99, padding: '2px 8px' }}>{item.rarity}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{item.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.3 }}>{item.desc}</div>
              <button onClick={() => onBuy(item)} style={{ marginTop: 4, padding: '8px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 13, background: item.gem ? 'linear-gradient(135deg,#00E5FF,#00FFCC)' : 'linear-gradient(135deg,#FF6EB4,#9B59D4)', color: item.gem ? '#0D0620' : '#fff' }}>
                {item.gem ? `💎 ${item.price}` : `🌸 ${item.price}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── GALLERY + TOYS merged ─── */
function GalleryTab({ items, likedItems, onLike, toys, state, onUnlock }: {
  items: typeof GALLERY; likedItems: number[]; onLike: (id: number) => void;
  toys: typeof TOYS; state: GameState; onUnlock: (t: typeof TOYS[0]) => void;
}) {
  const [subtab, setSubtab] = useState<'gallery' | 'toys'>('gallery');
  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['gallery', 'toys'] as const).map(t => (
          <button key={t} onClick={() => setSubtab(t)} style={{ flex: 1, padding: '8px', borderRadius: 14, border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 13, background: subtab === t ? 'linear-gradient(135deg,#FF6EB4,#9B59D4)' : 'rgba(255,255,255,0.06)', color: subtab === t ? '#fff' : 'rgba(255,255,255,0.4)' }}>
            {t === 'gallery' ? '🖼️ Галерея' : '🧸 Игрушки'}
          </button>
        ))}
      </div>

      {subtab === 'gallery' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {items.map(item => (
            <div key={item.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, overflow: 'hidden' }}>
              <div style={{ height: 100, background: 'linear-gradient(135deg,rgba(255,110,180,0.1),rgba(155,89,212,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>{item.emoji}</div>
              <div style={{ padding: '8px 10px' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{item.likes + (likedItems.includes(item.id) ? 1 : 0)} лайков</span>
                  <button onClick={() => onLike(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, transform: likedItems.includes(item.id) ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.15s' }}>
                    {likedItems.includes(item.id) ? '💖' : '🤍'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {subtab === 'toys' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 900, background: 'linear-gradient(135deg,#00E5FF,#00FFCC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>Игрушки</h2>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>{state.unlockedToys.length}/{toys.length} разблокировано</p>
            </div>
            <img src={TOYS_IMG} alt="" style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 12, opacity: 0.7 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {toys.map(toy => {
              const unlocked = state.unlockedToys.includes(toy.id);
              const canUnlock = state.level >= toy.unlockLevel;
              const rc = RARITY_COLOR[toy.rarity];
              return (
                <div key={toy.id} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${rc.border}`, borderRadius: 18, padding: 14, opacity: unlocked ? 1 : 0.65, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 40, filter: unlocked ? 'none' : 'grayscale(1) brightness(0.4)', display: 'block' }}>{toy.emoji}</span>
                  <div style={{ fontSize: 12, fontWeight: 900, color: '#fff', textAlign: 'center' }}>{toy.name}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center', lineHeight: 1.3 }}>{toy.desc}</div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: rc.text, letterSpacing: 0.5 }}>{toy.rarity.toUpperCase()}</div>
                  {!unlocked ? (
                    <button onClick={() => onUnlock(toy)} disabled={!canUnlock} style={{ width: '100%', padding: '7px', borderRadius: 11, border: 'none', cursor: canUnlock ? 'pointer' : 'not-allowed', fontWeight: 900, fontSize: 11, background: canUnlock ? 'linear-gradient(135deg,#FF6EB4,#9B59D4)' : 'rgba(255,255,255,0.06)', color: canUnlock ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                      {canUnlock ? '🔓 Разблокировать' : `🔒 Lv.${toy.unlockLevel}`}
                    </button>
                  ) : (
                    <div style={{ fontSize: 11, fontWeight: 900, background: 'linear-gradient(135deg,#FF6EB4,#ff9cee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>✅ Разблокировано!</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── QUESTS ─── */
function QuestsTab({ quests, state, onComplete }: { quests: typeof QUESTS; state: GameState; onComplete: (q: typeof QUESTS[0]) => void }) {
  return (
    <div style={{ padding: '12px 16px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: '#FBBF24', margin: '0 0 4px' }}>Задания</h2>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '0 0 16px' }}>Выполняй и получай награды</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {quests.map(q => {
          const done = state.completedQuests.includes(q.id);
          return (
            <div key={q.id} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${done ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 18, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, opacity: done ? 0.55 : 1 }}>
              <span style={{ fontSize: 32 }}>{q.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{q.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{q.desc}</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#FBBF24' }}>🌸 {q.reward}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#67E8F9' }}>✨ +{q.xp} XP</span>
                </div>
              </div>
              {done ? <span style={{ fontSize: 22 }}>✅</span> : (
                <button onClick={() => onComplete(q)} style={{ padding: '8px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 12, background: 'linear-gradient(135deg,#FF6EB4,#9B59D4)', color: '#fff' }}>
                  Взять
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── SETTINGS ─── */
function SettingsTab({ state, onUpdate, onNotify }: { state: GameState; onUpdate: (k: keyof GameState['settings'], v: boolean) => void; onNotify: (m: string) => void }) {
  const toggles = [
    { key: 'notifications' as const, label: 'Уведомления', emoji: '🔔', desc: 'Push-уведомления о событиях' },
    { key: 'sound' as const, label: 'Звуки', emoji: '🔊', desc: 'Звуковые эффекты' },
    { key: 'music' as const, label: 'Музыка', emoji: '🎵', desc: 'Фоновая аниме-музыка' },
    { key: 'tgSync' as const, label: 'Telegram синхронизация', emoji: '📱', desc: 'Статистика видна в ТГ группе' },
  ];
  return (
    <div style={{ padding: '12px 16px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, background: 'linear-gradient(135deg,#FF6EB4,#ff9cee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 16px' }}>Настройки</h2>

      {/* Profile */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,110,180,0.15)', borderRadius: 18, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 24, overflow: 'hidden', border: '2px solid rgba(255,110,180,0.4)' }}>
          <img src={CHAR_IMG2} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>{state.username}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Уровень {state.level} · {state.xp}/{state.xpMax} XP</div>
        </div>
        <button onClick={() => onNotify('✏️ Редактирование — скоро!')} style={{ marginLeft: 'auto', padding: '7px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 12, background: 'linear-gradient(135deg,#FF6EB4,#9B59D4)', color: '#fff' }}>Изменить</button>
      </div>

      {/* Toggles */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, overflow: 'hidden', marginBottom: 12 }}>
        {toggles.map((t, i) => (
          <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < toggles.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <span style={{ fontSize: 20 }}>{t.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{t.label}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{t.desc}</div>
            </div>
            <button
              onClick={() => onUpdate(t.key, !state.settings[t.key])}
              style={{ width: 46, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', position: 'relative', background: state.settings[t.key] ? 'linear-gradient(135deg,#FF6EB4,#9B59D4)' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }}
            >
              <span style={{ position: 'absolute', width: 20, height: 20, borderRadius: 10, background: '#fff', top: 3, left: state.settings[t.key] ? 23 : 3, transition: 'left 0.25s', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }} />
            </button>
          </div>
        ))}
      </div>

      {state.settings.tgSync && (
        <div style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.25)', borderRadius: 16, padding: '12px 16px', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#67E8F9', marginBottom: 2 }}>📱 Telegram подключён</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Статистика видна всем в группе</div>
        </div>
      )}

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: '14px 16px' }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#F87171', marginBottom: 8 }}>⚠️ Опасная зона</div>
        <button onClick={() => onNotify('🔒 Сброс — скоро!')} style={{ width: '100%', padding: '10px', borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', background: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 12, color: '#F87171' }}>
          Сбросить прогресс
        </button>
      </div>

      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.15)', fontSize: 16, fontFamily: 'Caveat, cursive', marginTop: 16 }}>Anime World v1.0 ✨</div>
    </div>
  );
}
