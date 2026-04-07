import { useState, useEffect, useCallback, useRef } from 'react';

const CHAR_IMG = 'https://cdn.poehali.dev/projects/fa02b305-cd43-45b0-8919-63c1c7e955ae/files/38c76cd9-73f6-4bc0-a53b-afc8e6663f26.jpg';
const CHAR_IMG2 = 'https://cdn.poehali.dev/projects/fa02b305-cd43-45b0-8919-63c1c7e955ae/files/587a0657-d135-478c-946c-5bf13778ef00.jpg';
const TOYS_IMG = 'https://cdn.poehali.dev/projects/fa02b305-cd43-45b0-8919-63c1c7e955ae/files/8d2a5d86-ff86-4d77-94e7-cd34516b454e.jpg';

type Tab = 'home' | 'market' | 'gallery' | 'quests' | 'settings';

/* ── Типы ── */
interface Girl {
  id: number;
  name: string;
  subname: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  level: number;
  img: string;
  love: number;       // 0-100
  loveMax: number;
  onDate: boolean;
  dateEndsAt: number | null; // timestamp ms
  onMarket: boolean;
  marketPrice: number;
  owner: string;
}

interface GameState {
  hearts: number;
  stars: number;
  username: string;
  girls: Girl[];
  myListings: number[]; // girl ids listed on market
  settings: { notifications: boolean; sound: boolean; music: boolean; tgSync: boolean };
}

const INITIAL_GIRL: Girl = {
  id: 1,
  name: 'ЗАНЯТА С ДРУГОЙ УТКОЙ',
  subname: 'НЕ БЕСПОКОИТЬ',
  rarity: 'COMMON',
  level: 1,
  img: CHAR_IMG,
  love: 0,
  loveMax: 100,
  onDate: false,
  dateEndsAt: null,
  onMarket: false,
  marketPrice: 50,
  owner: 'sxzxtsv',
};

const defaultState: GameState = {
  hearts: 15,
  stars: 3,
  username: 'sxzxtsv',
  girls: [INITIAL_GIRL],
  myListings: [],
  settings: { notifications: true, sound: true, music: true, tgSync: false },
};

/* Рынок — чужие девочки */
const MARKET_GIRLS: Girl[] = [
  { id: 101, name: 'САКУРА-ЧАН', subname: 'СВОБОДНА', rarity: 'RARE', level: 3, img: CHAR_IMG2, love: 60, loveMax: 100, onDate: false, dateEndsAt: null, onMarket: true, marketPrice: 120, owner: 'narutofan99' },
  { id: 102, name: 'ЛУННАЯ ФЕЯ', subname: 'МЕЧТАЕТ', rarity: 'EPIC', level: 7, img: CHAR_IMG, love: 80, loveMax: 100, onDate: false, dateEndsAt: null, onMarket: true, marketPrice: 350, owner: 'moonlover' },
  { id: 103, name: 'ПРОСТУШКА', subname: 'В ПОИСКЕ', rarity: 'COMMON', level: 1, img: CHAR_IMG2, love: 20, loveMax: 100, onDate: false, dateEndsAt: null, onMarket: true, marketPrice: 30, owner: 'basic_user' },
];

const QUESTS = [
  { id: 1, name: 'Первые шаги', emoji: '👣', desc: 'Зайди в приложение впервые', reward: 5, xp: 50 },
  { id: 2, name: 'Первое свидание', emoji: '💕', desc: 'Отправь девочку на свидание', reward: 10, xp: 120 },
  { id: 3, name: 'Коллекционер', emoji: '🎁', desc: 'Получи 3 девочки', reward: 20, xp: 200 },
  { id: 4, name: 'Торговец', emoji: '🛍️', desc: 'Выставь девочку на рынок', reward: 8, xp: 80 },
  { id: 5, name: 'Социальный', emoji: '👥', desc: 'Поделись статистикой в ТГ', reward: 30, xp: 200 },
];

const GALLERY = [
  { id: 1, emoji: '🌸', title: 'Сакура в цвету', likes: 24 },
  { id: 2, emoji: '🏯', title: 'Замок Химэдзи', likes: 18 },
  { id: 3, emoji: '🌊', title: 'Морской бриз', likes: 31 },
  { id: 4, emoji: '🎋', title: 'Бамбуковый лес', likes: 12 },
  { id: 5, emoji: '🦊', title: 'Лисий фестиваль', likes: 45 },
  { id: 6, emoji: '🌺', title: 'Красный мак', likes: 9 },
];

const RARITY_COLOR: Record<string, { text: string; border: string; bg: string; glow: string }> = {
  COMMON:    { text: '#9CA3AF', border: 'rgba(156,163,175,0.35)', bg: 'rgba(156,163,175,0.08)', glow: 'rgba(156,163,175,0.2)' },
  RARE:      { text: '#67E8F9', border: 'rgba(103,232,249,0.35)', bg: 'rgba(103,232,249,0.08)', glow: 'rgba(103,232,249,0.25)' },
  EPIC:      { text: '#C084FC', border: 'rgba(192,132,252,0.35)', bg: 'rgba(192,132,252,0.08)', glow: 'rgba(192,132,252,0.3)' },
  LEGENDARY: { text: '#FDE047', border: 'rgba(253,224,71,0.35)',  bg: 'rgba(253,224,71,0.08)',  glow: 'rgba(253,224,71,0.35)' },
};

/* ── Хук таймера ── */
function useCountdown(endsAt: number | null) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!endsAt) { setLeft(0); return; }
    const tick = () => setLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  if (!endsAt || left <= 0) return null;
  const h = Math.floor(left / 3600).toString().padStart(2, '0');
  const m = Math.floor((left % 3600) / 60).toString().padStart(2, '0');
  const s = (left % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/* ─── ГЛАВНЫЙ КОМПОНЕНТ ─── */
export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [state, setState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem('animeworld_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        // restore girls with defaults for missing fields
        if (parsed.girls) {
          parsed.girls = parsed.girls.map((g: Girl) => ({ ...INITIAL_GIRL, ...g }));
        }
        return { ...defaultState, ...parsed };
      }
    } catch { /* ignore */ }
    return defaultState;
  });
  const [notification, setNotification] = useState<string | null>(null);
  const [likedItems, setLikedItems] = useState<number[]>([]);
  const [completedQuests, setCompletedQuests] = useState<number[]>([1]);

  const save = useCallback((s: GameState) => {
    localStorage.setItem('animeworld_v2', JSON.stringify(s));
  }, []);

  useEffect(() => { save(state); }, [state, save]);

  // Проверяем вернулись ли девочки со свидания
  useEffect(() => {
    const interval = setInterval(() => {
      setState(s => {
        let changed = false;
        const girls = s.girls.map(g => {
          if (g.onDate && g.dateEndsAt && Date.now() >= g.dateEndsAt) {
            changed = true;
            return { ...g, onDate: false, dateEndsAt: null, love: 0 };
          }
          return g;
        });
        if (!changed) return s;
        notify('💌 Девочка вернулась со свидания!');
        return { ...s, girls };
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const sendOnDate = (girlId: number) => {
    setState(s => ({
      ...s,
      girls: s.girls.map(g =>
        g.id === girlId ? { ...g, onDate: true, love: 0, dateEndsAt: Date.now() + 30 * 1000 } : g
      ),
    }));
    notify('💕 Ушла на свидание! Вернётся через 30 секунд');
  };

  const addLove = (girlId: number) => {
    setState(s => {
      const girl = s.girls.find(g => g.id === girlId);
      if (!girl || girl.onDate) return s;
      const newLove = Math.min(girl.love + 10, girl.loveMax);
      if (newLove >= girl.loveMax) {
        // отправляем на свидание
        sendOnDate(girlId);
        return s;
      }
      return { ...s, girls: s.girls.map(g => g.id === girlId ? { ...g, love: newLove } : g) };
    });
  };

  const listOnMarket = (girlId: number, price: number) => {
    setState(s => ({
      ...s,
      girls: s.girls.map(g => g.id === girlId ? { ...g, onMarket: true, marketPrice: price } : g),
      myListings: [...s.myListings, girlId],
    }));
    notify('🛒 Девочка выставлена на рынок!');
  };

  const removeFromMarket = (girlId: number) => {
    setState(s => ({
      ...s,
      girls: s.girls.map(g => g.id === girlId ? { ...g, onMarket: false } : g),
      myListings: s.myListings.filter(id => id !== girlId),
    }));
    notify('✅ Снята с рынка');
  };

  const buyFromMarket = (girl: Girl) => {
    if (state.hearts < girl.marketPrice) { notify('❌ Не хватает сердец!'); return; }
    const newGirl: Girl = { ...girl, id: Date.now(), owner: state.username, onMarket: false, love: 0, onDate: false, dateEndsAt: null };
    setState(s => ({ ...s, hearts: s.hearts - girl.marketPrice, girls: [...s.girls, newGirl] }));
    notify(`💖 Куплена: ${girl.name}!`);
  };

  const updateSetting = (key: keyof GameState['settings'], val: boolean) => {
    setState(s => ({ ...s, settings: { ...s.settings, [key]: val } }));
  };

  const completeQuest = (questId: number, reward: number) => {
    if (completedQuests.includes(questId)) { notify('✅ Уже выполнено!'); return; }
    setCompletedQuests(p => [...p, questId]);
    setState(s => ({ ...s, hearts: s.hearts + reward }));
    notify(`🎁 +${reward} сердец!`);
  };

  const likeGallery = (id: number) => {
    if (likedItems.includes(id)) return;
    setLikedItems(p => [...p, id]);
    notify('💖 Лайк!');
  };

  const NAV = [
    { id: 'market' as Tab, icon: '📈', label: 'РЫНОК' },
    { id: 'gallery' as Tab, icon: '🖼️', label: 'ГАЛЕРЕЯ' },
    { id: 'home' as Tab, icon: '🌸', label: 'ГЛАВНАЯ', center: true },
    { id: 'quests' as Tab, icon: '⚔️', label: 'ЗАДАНИЯ' },
    { id: 'settings' as Tab, icon: '⚙️', label: 'ПРОФИЛЬ' },
  ];

  return (
    <div style={{ background: '#0a0614', minHeight: '100vh', fontFamily: 'Nunito, sans-serif', position: 'relative', overflowX: 'hidden', maxWidth: 480, margin: '0 auto' }}>
      {notification && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 200, background: 'rgba(20,10,40,0.97)', border: '1px solid rgba(255,110,180,0.5)', borderRadius: 18, padding: '10px 22px', fontSize: 13, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', boxShadow: '0 0 30px rgba(255,110,180,0.35)' }}>
          {notification}
        </div>
      )}

      {/* TOP BAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: 19, overflow: 'hidden', border: '2px solid rgba(255,110,180,0.45)' }}>
            <img src={CHAR_IMG2} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{state.username}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 15, fontWeight: 900, color: '#f472b6' }}>
            <span>❤️</span><span>{state.hearts}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 15, fontWeight: 900, color: '#FBBF24' }}>
            <span>⭐</span><span>{state.stars}</span>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ paddingBottom: 88 }}>
        {tab === 'home' && <HomeTab state={state} onAddLove={addLove} onListMarket={listOnMarket} onRemoveMarket={removeFromMarket} onNotify={notify} />}
        {tab === 'market' && <MarketTab state={state} marketGirls={MARKET_GIRLS} onBuy={buyFromMarket} onListMarket={listOnMarket} onRemoveMarket={removeFromMarket} onNotify={notify} />}
        {tab === 'gallery' && <GalleryTab items={GALLERY} likedItems={likedItems} onLike={likeGallery} />}
        {tab === 'quests' && <QuestsTab quests={QUESTS} completedQuests={completedQuests} onComplete={completeQuest} />}
        {tab === 'settings' && <SettingsTab state={state} onUpdate={updateSetting} onNotify={notify} />}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, zIndex: 50 }}>
        <div style={{ background: 'rgba(8,4,18,0.97)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '8px 4px 14px' }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', position: 'relative' }}>
              {n.center ? (
                <div style={{ width: 50, height: 50, borderRadius: 25, background: tab === n.id ? 'linear-gradient(135deg,#FF6EB4,#9B59D4)' : 'rgba(255,110,180,0.12)', border: '2px solid rgba(255,110,180,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginTop: -22, boxShadow: tab === n.id ? '0 0 24px rgba(255,110,180,0.6)' : 'none', transition: 'all 0.25s' }}>
                  {n.icon}
                </div>
              ) : (
                <span style={{ fontSize: 22 }}>{n.icon}</span>
              )}
              <span style={{ fontSize: 9, fontWeight: 900, color: tab === n.id ? '#FF6EB4' : 'rgba(255,255,255,0.3)', letterSpacing: 0.5 }}>{n.label}</span>
              {tab === n.id && !n.center && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: 2, background: '#FF6EB4' }} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── HOME TAB ─── */
function HomeTab({ state, onAddLove, onListMarket, onRemoveMarket, onNotify }: {
  state: GameState;
  onAddLove: (id: number) => void;
  onListMarket: (id: number, price: number) => void;
  onRemoveMarket: (id: number) => void;
  onNotify: (m: string) => void;
}) {
  const [cardIdx, setCardIdx] = useState(0);
  const [swipeX, setSwipeX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [animate, setAnimate] = useState<'left' | 'right' | null>(null);
  const [showMarketModal, setShowMarketModal] = useState(false);
  const [priceInput, setPriceInput] = useState('50');
  const startX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const girls = state.girls;
  const girl = girls[cardIdx] || girls[0];
  const rc = RARITY_COLOR[girl?.rarity || 'COMMON'];
  const lovePct = girl ? Math.round((girl.love / girl.loveMax) * 100) : 0;
  const countdown = useCountdown(girl?.dateEndsAt || null);

  const goTo = (dir: 'left' | 'right') => {
    setAnimate(dir);
    setTimeout(() => {
      setCardIdx(i => dir === 'right' ? Math.min(i + 1, girls.length - 1) : Math.max(i - 1, 0));
      setSwipeX(0);
      setAnimate(null);
    }, 280);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setDragging(true);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return;
    setSwipeX(e.touches[0].clientX - startX.current);
  };
  const onTouchEnd = () => {
    setDragging(false);
    if (swipeX < -60 && cardIdx < girls.length - 1) goTo('right');
    else if (swipeX > 60 && cardIdx > 0) goTo('left');
    else setSwipeX(0);
  };

  const cardStyle: React.CSSProperties = {
    transform: animate === 'left'
      ? 'translateX(-120%) rotate(-15deg)'
      : animate === 'right'
      ? 'translateX(120%) rotate(15deg)'
      : `translateX(${swipeX}px) rotate(${swipeX * 0.05}deg)`,
    transition: animate ? 'transform 0.28s cubic-bezier(0.4,0,0.2,1)' : dragging ? 'none' : 'transform 0.3s ease',
    opacity: animate ? 0 : 1,
  };

  if (!girl) return null;

  return (
    <div style={{ padding: '0 16px' }}>

      {/* Market modal */}
      {showMarketModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowMarketModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#13082a', border: '1px solid rgba(255,110,180,0.25)', borderRadius: '24px 24px 0 0', padding: 24, width: '100%', maxWidth: 480 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 6 }}>Выставить на рынок</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>{girl.name} · {girl.rarity}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 8, fontWeight: 700 }}>Цена (❤️ сердца):</div>
            <input
              type="number"
              value={priceInput}
              onChange={e => setPriceInput(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,110,180,0.25)', borderRadius: 14, padding: '12px 16px', fontSize: 18, fontWeight: 900, color: '#fff', outline: 'none', marginBottom: 16, boxSizing: 'border-box' }}
            />
            <button
              onClick={() => { onListMarket(girl.id, Number(priceInput) || 50); setShowMarketModal(false); }}
              style={{ width: '100%', padding: 14, borderRadius: 16, border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 15, background: 'linear-gradient(135deg,#FF6EB4,#9B59D4)', color: '#fff' }}
            >
              Выставить
            </button>
          </div>
        </div>
      )}

      {/* Card */}
      <div
        ref={cardRef}
        style={{ ...cardStyle, position: 'relative', userSelect: 'none', marginTop: 8 }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Swipe hints */}
        {swipeX > 30 && <div style={{ position: 'absolute', top: '40%', left: 12, zIndex: 10, fontSize: 40, opacity: Math.min(swipeX / 100, 1) }}>❤️</div>}
        {swipeX < -30 && <div style={{ position: 'absolute', top: '40%', right: 12, zIndex: 10, fontSize: 40, opacity: Math.min(-swipeX / 100, 1) }}>💨</div>}

        <div style={{ borderRadius: 24, overflow: 'hidden', border: `2px solid ${rc.border}`, background: 'rgba(255,255,255,0.03)', boxShadow: `0 24px 64px rgba(0,0,0,0.7), 0 0 50px ${rc.glow}`, position: 'relative' }}>
          {/* Badges */}
          <div style={{ position: 'absolute', top: 12, left: 14, zIndex: 5, fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: '3px 8px' }}>LVL {girl.level}</div>
          <div style={{ position: 'absolute', top: 12, right: 14, zIndex: 5, fontSize: 11, fontWeight: 900, color: rc.text, background: rc.bg, border: `1px solid ${rc.border}`, borderRadius: 8, padding: '3px 8px', letterSpacing: 1 }}>{girl.rarity}</div>

          {/* On market badge */}
          {girl.onMarket && (
            <div style={{ position: 'absolute', top: 44, right: 14, zIndex: 5, fontSize: 10, fontWeight: 900, color: '#FBBF24', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.35)', borderRadius: 8, padding: '3px 8px' }}>🛒 НА РЫНКЕ</div>
          )}

          {/* On date overlay */}
          {girl.onDate && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 8, background: 'rgba(10,4,22,0.82)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <span style={{ fontSize: 56 }}>💕</span>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#FF6EB4' }}>НА СВИДАНИИ</div>
              {countdown && <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: 2 }}>{countdown}</div>}
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Вернётся скоро...</div>
            </div>
          )}

          <img src={girl.img} alt={girl.name} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />

          {/* Love progress bar */}
          {!girl.onDate && (
            <div style={{ position: 'absolute', bottom: 56, left: 14, right: 14, zIndex: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>❤️ Любовь</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#FF6EB4' }}>{lovePct}%</span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#FF6EB4,#9B59D4,#FF6EB4)', backgroundSize: '200% 100%', width: `${lovePct}%`, transition: 'width 0.5s cubic-bezier(0.34,1.56,0.64,1)', animation: 'gradMove 2s linear infinite' }} />
              </div>
              {lovePct >= 90 && <div style={{ textAlign: 'center', fontSize: 11, color: '#FF6EB4', fontWeight: 900, marginTop: 4 }}>💕 Готова на свидание!</div>}
            </div>
          )}

          {/* Name plate */}
          <div style={{ background: 'rgba(255,255,255,0.95)', padding: '10px 14px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#1a0835', letterSpacing: 0.5 }}>{girl.name}</div>
            <div style={{ fontSize: 10, color: '#888', fontWeight: 700, marginTop: 1 }}>{girl.subname}</div>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
        {girls.map((_, i) => (
          <div key={i} onClick={() => setCardIdx(i)} style={{ width: i === cardIdx ? 20 : 6, height: 6, borderRadius: 3, background: i === cardIdx ? '#FF6EB4' : 'rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'all 0.3s' }} />
        ))}
      </div>

      {/* Action buttons */}
      {!girl.onDate && (
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button
            onClick={() => onAddLove(girl.id)}
            style={{ flex: 2, padding: '14px', borderRadius: 18, border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 15, background: 'linear-gradient(135deg,#FF6EB4,#e91e8c)', color: '#fff', boxShadow: '0 4px 20px rgba(255,110,180,0.4)', transition: 'transform 0.15s' }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.96)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            ❤️ +Любовь ({lovePct}%)
          </button>
          {!girl.onMarket ? (
            <button
              onClick={() => setShowMarketModal(true)}
              style={{ flex: 1, padding: '14px', borderRadius: 18, border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontWeight: 900, fontSize: 13, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', transition: 'all 0.2s' }}
            >
              🛒 Рынок
            </button>
          ) : (
            <button
              onClick={() => onRemoveMarket(girl.id)}
              style={{ flex: 1, padding: '14px', borderRadius: 18, border: '1px solid rgba(251,191,36,0.3)', cursor: 'pointer', fontWeight: 900, fontSize: 11, background: 'rgba(251,191,36,0.06)', color: '#FBBF24', transition: 'all 0.2s' }}
            >
              ❌ Снять
            </button>
          )}
        </div>
      )}

      <style>{`
        @keyframes gradMove { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
      `}</style>
    </div>
  );
}

/* ─── MARKET TAB ─── */
function MarketTab({ state, marketGirls, onBuy, onListMarket, onRemoveMarket, onNotify }: {
  state: GameState;
  marketGirls: Girl[];
  onBuy: (g: Girl) => void;
  onListMarket: (id: number, price: number) => void;
  onRemoveMarket: (id: number) => void;
  onNotify: (m: string) => void;
}) {
  const [subtab, setSubtab] = useState<'buy' | 'sell'>('buy');

  const allForSale = [
    ...marketGirls,
    ...state.girls.filter(g => g.onMarket && g.owner !== state.username),
  ];
  const myGirlsForSale = state.girls.filter(g => g.onMarket);

  return (
    <div style={{ padding: '12px 16px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, background: 'linear-gradient(135deg,#FF6EB4,#ff9cee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 4px' }}>Рынок девочек</h2>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '0 0 14px' }}>Покупай и выставляй своих</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['buy', 'sell'] as const).map(t => (
          <button key={t} onClick={() => setSubtab(t)} style={{ flex: 1, padding: '9px', borderRadius: 14, border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 13, background: subtab === t ? 'linear-gradient(135deg,#FF6EB4,#9B59D4)' : 'rgba(255,255,255,0.06)', color: subtab === t ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}>
            {t === 'buy' ? '🛒 Купить' : '💰 Мои лоты'}
          </button>
        ))}
      </div>

      {subtab === 'buy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {allForSale.length === 0 && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14, padding: 40 }}>Пусто на рынке 🌸</div>}
          {allForSale.map(girl => {
            const rc = RARITY_COLOR[girl.rarity];
            const isMine = girl.owner === state.username;
            return (
              <div key={girl.id} style={{ display: 'flex', gap: 12, background: 'rgba(255,255,255,0.04)', border: `1px solid ${rc.border}`, borderRadius: 20, overflow: 'hidden' }}>
                <img src={girl.img} alt={girl.name} style={{ width: 80, height: 100, objectFit: 'cover', objectPosition: 'top', flexShrink: 0 }} />
                <div style={{ flex: 1, padding: '12px 12px 12px 0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: rc.text, letterSpacing: 1, marginBottom: 3 }}>{girl.rarity} · LVL {girl.level}</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{girl.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>от {girl.owner}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#f472b6' }}>❤️ {girl.marketPrice}</div>
                    {isMine ? (
                      <button onClick={() => onRemoveMarket(girl.id)} style={{ padding: '7px 12px', borderRadius: 12, border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.06)', cursor: 'pointer', fontWeight: 900, fontSize: 11, color: '#FBBF24' }}>
                        Снять
                      </button>
                    ) : (
                      <button onClick={() => onBuy(girl)} style={{ padding: '7px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 13, background: 'linear-gradient(135deg,#FF6EB4,#9B59D4)', color: '#fff' }}>
                        Купить
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {subtab === 'sell' && (
        <div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Твои девочки на рынке:</div>
          {myGirlsForSale.length === 0 && (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14, padding: '30px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🌸</div>
              Нет активных лотов.<br />
              <span style={{ fontSize: 12 }}>Выставь девочку на рынок с главного экрана</span>
            </div>
          )}
          {myGirlsForSale.map(girl => {
            const rc = RARITY_COLOR[girl.rarity];
            return (
              <div key={girl.id} style={{ display: 'flex', gap: 12, background: 'rgba(255,255,255,0.04)', border: `1px solid ${rc.border}`, borderRadius: 20, overflow: 'hidden', marginBottom: 10 }}>
                <img src={girl.img} alt={girl.name} style={{ width: 72, height: 88, objectFit: 'cover', objectPosition: 'top', flexShrink: 0 }} />
                <div style={{ flex: 1, padding: '12px 12px 12px 0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: rc.text, letterSpacing: 1 }}>{girl.rarity} · LVL {girl.level}</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', marginTop: 2 }}>{girl.name}</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#f472b6', marginTop: 4 }}>❤️ {girl.marketPrice}</div>
                  </div>
                  <button onClick={() => onRemoveMarket(girl.id)} style={{ padding: '7px 14px', borderRadius: 12, border: '1px solid rgba(251,191,36,0.3)', background: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 12, color: '#FBBF24', alignSelf: 'flex-start' }}>
                    ❌ Снять с рынка
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── GALLERY TAB ─── */
function GalleryTab({ items, likedItems, onLike }: { items: typeof GALLERY; likedItems: number[]; onLike: (id: number) => void }) {
  return (
    <div style={{ padding: '12px 16px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, background: 'linear-gradient(135deg,#FF6EB4,#ff9cee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 4px' }}>Галерея</h2>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '0 0 16px' }}>Аниме-артефакты сообщества</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {items.map(item => (
          <div key={item.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ height: 100, background: 'linear-gradient(135deg,rgba(255,110,180,0.1),rgba(155,89,212,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>{item.emoji}</div>
            <div style={{ padding: '8px 10px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{item.likes + (likedItems.includes(item.id) ? 1 : 0)} лайков</span>
                <button onClick={() => onLike(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, transition: 'transform 0.15s', transform: likedItems.includes(item.id) ? 'scale(1.2)' : 'scale(1)' }}>
                  {likedItems.includes(item.id) ? '💖' : '🤍'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => {}} style={{ width: '100%', marginTop: 12, padding: 14, borderRadius: 18, border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 14, background: 'linear-gradient(135deg,#FF6EB4,#9B59D4)', color: '#fff' }}>
        📸 Добавить в галерею
      </button>
    </div>
  );
}

/* ─── QUESTS TAB ─── */
function QuestsTab({ quests, completedQuests, onComplete }: { quests: typeof QUESTS; completedQuests: number[]; onComplete: (id: number, reward: number) => void }) {
  return (
    <div style={{ padding: '12px 16px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: '#FBBF24', margin: '0 0 4px' }}>Задания</h2>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '0 0 16px' }}>Выполняй и получай сердца</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {quests.map(q => {
          const done = completedQuests.includes(q.id);
          return (
            <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', border: `1px solid ${done ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 18, padding: '14px 16px', opacity: done ? 0.5 : 1 }}>
              <span style={{ fontSize: 30 }}>{q.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{q.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{q.desc}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#f472b6', marginTop: 4 }}>❤️ +{q.reward} сердец</div>
              </div>
              {done ? <span style={{ fontSize: 22 }}>✅</span> : (
                <button onClick={() => onComplete(q.id, q.reward)} style={{ padding: '8px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 12, background: 'linear-gradient(135deg,#FF6EB4,#9B59D4)', color: '#fff' }}>
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

/* ─── SETTINGS TAB ─── */
function SettingsTab({ state, onUpdate, onNotify }: { state: GameState; onUpdate: (k: keyof GameState['settings'], v: boolean) => void; onNotify: (m: string) => void }) {
  const toggles = [
    { key: 'notifications' as const, label: 'Уведомления', emoji: '🔔', desc: 'Push-уведомления о событиях' },
    { key: 'sound' as const, label: 'Звуки', emoji: '🔊', desc: 'Звуковые эффекты' },
    { key: 'music' as const, label: 'Музыка', emoji: '🎵', desc: 'Фоновая аниме-музыка' },
    { key: 'tgSync' as const, label: 'Telegram синхронизация', emoji: '📱', desc: 'Статистика видна в ТГ группе' },
  ];
  return (
    <div style={{ padding: '12px 16px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, background: 'linear-gradient(135deg,#FF6EB4,#ff9cee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 16px' }}>Профиль</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,110,180,0.15)', borderRadius: 18, padding: '14px 16px', marginBottom: 12 }}>
        <div style={{ width: 50, height: 50, borderRadius: 25, overflow: 'hidden', border: '2px solid rgba(255,110,180,0.4)' }}>
          <img src={CHAR_IMG2} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{state.username}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>❤️ {state.hearts} сердец · ⭐ {state.stars} звёзд</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>Девочек: {state.girls.length}</div>
        </div>
        <button onClick={() => onNotify('✏️ Редактирование — скоро!')} style={{ marginLeft: 'auto', padding: '8px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 12, background: 'linear-gradient(135deg,#FF6EB4,#9B59D4)', color: '#fff' }}>Изменить</button>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, overflow: 'hidden', marginBottom: 12 }}>
        {toggles.map((t, i) => (
          <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < toggles.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <span style={{ fontSize: 20 }}>{t.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{t.label}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{t.desc}</div>
            </div>
            <button onClick={() => onUpdate(t.key, !state.settings[t.key])} style={{ width: 46, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', position: 'relative', background: state.settings[t.key] ? 'linear-gradient(135deg,#FF6EB4,#9B59D4)' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }}>
              <span style={{ position: 'absolute', width: 20, height: 20, borderRadius: 10, background: '#fff', top: 3, left: state.settings[t.key] ? 23 : 3, transition: 'left 0.25s', boxShadow: '0 2px 6px rgba(0,0,0,0.3)', display: 'block' }} />
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
        <button onClick={() => onNotify('🔒 Подтверди сброс — скоро!')} style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', background: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 12, color: '#F87171' }}>
          Сбросить прогресс
        </button>
      </div>

      <div style={{ textAlign: 'center', fontSize: 16, color: 'rgba(255,255,255,0.15)', fontFamily: 'Caveat, cursive', marginTop: 16 }}>Anime World v1.0 ✨</div>
    </div>
  );
}
