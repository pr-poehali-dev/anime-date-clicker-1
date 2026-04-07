import { useState, useEffect, useCallback, useRef } from 'react';

/* ── Изображения девочек по уровням (каждые 10 lvl новая картинка) ── */
const GIRL_IMAGES: Record<string, string[]> = {
  'girl_1': [
    'https://cdn.poehali.dev/projects/fa02b305-cd43-45b0-8919-63c1c7e955ae/files/38c76cd9-73f6-4bc0-a53b-afc8e6663f26.jpg',
    'https://cdn.poehali.dev/projects/fa02b305-cd43-45b0-8919-63c1c7e955ae/files/587a0657-d135-478c-946c-5bf13778ef00.jpg',
    'https://cdn.poehali.dev/projects/fa02b305-cd43-45b0-8919-63c1c7e955ae/files/38c76cd9-73f6-4bc0-a53b-afc8e6663f26.jpg',
  ],
  'girl_2': [
    'https://cdn.poehali.dev/projects/fa02b305-cd43-45b0-8919-63c1c7e955ae/files/587a0657-d135-478c-946c-5bf13778ef00.jpg',
    'https://cdn.poehali.dev/projects/fa02b305-cd43-45b0-8919-63c1c7e955ae/files/38c76cd9-73f6-4bc0-a53b-afc8e6663f26.jpg',
    'https://cdn.poehali.dev/projects/fa02b305-cd43-45b0-8919-63c1c7e955ae/files/587a0657-d135-478c-946c-5bf13778ef00.jpg',
  ],
};
const getGirlImg = (imgKey: string, level: number) => {
  const imgs = GIRL_IMAGES[imgKey] ?? Object.values(GIRL_IMAGES)[0];
  return imgs[Math.floor((level - 1) / 10) % imgs.length];
};

type Tab = 'home' | 'market' | 'toys' | 'quests' | 'gallery';

/* ── Типы ── */
interface Girl {
  id: number; name: string; subname: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  level: number; imgKey: string;
  love: number; loveMax: number;
  onDate: boolean; dateEndsAt: number | null;
  onMarket: boolean; marketPrice: number; owner: string;
  datesTotal: number; // всего свиданий
}

/* Ячейка мердж-сетки */
interface MergeCell {
  itemId: number; // id типа игрушки (1-10), 0 = пусто
  uid: string;    // уникальный id для анимации
}

/* Типы игрушек по уровням мерджа */
interface ToyType {
  id: number; name: string; emoji: string;
  tier: number; // 1 = базовый, выше = редкий
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
}

interface GameState {
  hearts: number; stars: number; username: string;
  girls: Girl[];
  grid: MergeCell[]; // 5×6 = 30 ячеек
  unlockedGirlIds: number[]; // id девочек в коллекции галереи
  settings: { notifications: boolean; sound: boolean; music: boolean; tgSync: boolean };
}

/* Цепочка мерджа: скрещиваешь 2 одинаковых — получаешь следующий tier */
const TOY_TYPES: ToyType[] = [
  { id: 1,  name: 'Вибратор',         emoji: '📳', tier: 1, rarity: 'COMMON'    },
  { id: 2,  name: 'Дилдо',            emoji: '🍆', tier: 2, rarity: 'COMMON'    },
  { id: 3,  name: 'Анальная пробка',  emoji: '🔌', tier: 3, rarity: 'COMMON'    },
  { id: 4,  name: 'Наручники',        emoji: '⛓️',  tier: 4, rarity: 'RARE'     },
  { id: 5,  name: 'Плётка',           emoji: '🪢', tier: 5, rarity: 'RARE'     },
  { id: 6,  name: 'Маска кошки',      emoji: '🐱', tier: 6, rarity: 'RARE'     },
  { id: 7,  name: 'Кляп-шар',         emoji: '⚽', tier: 7, rarity: 'EPIC'     },
  { id: 8,  name: 'Страпон',          emoji: '🎯', tier: 8, rarity: 'EPIC'     },
  { id: 9,  name: 'Пояс верности',    emoji: '🎀', tier: 9, rarity: 'EPIC'     },
  { id: 10, name: 'Золотой вибратор', emoji: '✨', tier: 10, rarity: 'LEGENDARY' },
];
const getToy = (id: number) => TOY_TYPES.find(t => t.id === id)!;
const nextTierId = (id: number) => Math.min(id + 1, 10);

/* Задания */
const QUESTS = [
  { id: 1, name: 'Первый мердж',    desc: 'Скрести 2 одинаковые игрушки',   triggerMerges: 1,  girlReward: false, hearts: 5   },
  { id: 2, name: 'Мердж-мастер',   desc: 'Сделай 5 мерджей',               triggerMerges: 5,  girlReward: true,  hearts: 0   },
  { id: 3, name: 'Прокачай сетку', desc: 'Сделай 15 мерджей',              triggerMerges: 15, girlReward: true,  hearts: 0   },
  { id: 4, name: 'Легенда',        desc: 'Получи Золотой вибратор',         triggerTier: 10,   girlReward: true,  hearts: 0   },
  { id: 5, name: 'Свидание',       desc: 'Отправь девочку на свидание',     triggerDate: 1,    girlReward: false, hearts: 10  },
  { id: 6, name: 'Страсть',        desc: '10 свиданий',                     triggerDate: 10,   girlReward: true,  hearts: 0   },
];

/* Новые девочки за задания */
const REWARD_GIRL_TEMPLATES: Omit<Girl, 'id' | 'love' | 'onDate' | 'dateEndsAt' | 'onMarket' | 'marketPrice' | 'owner' | 'datesTotal'>[] = [
  { name: 'САКУРА-ЧАН',   subname: 'СВОБОДНА',      rarity: 'RARE',      level: 1, imgKey: 'girl_2', loveMax: 100 },
  { name: 'ТЁМНАЯ ФЕЯ',   subname: 'ЗАГАДОЧНАЯ',    rarity: 'EPIC',      level: 1, imgKey: 'girl_1', loveMax: 100 },
  { name: 'ЛУННАЯ ДЕВА',  subname: 'МЕЧТАТЕЛЬНИЦА', rarity: 'LEGENDARY', level: 1, imgKey: 'girl_2', loveMax: 100 },
  { name: 'ОГНЕННАЯ',     subname: 'ГОРЯЧАЯ',        rarity: 'EPIC',      level: 1, imgKey: 'girl_1', loveMax: 100 },
];

/* Рынок */
const MARKET_GIRLS: Girl[] = [
  { id: 101, name: 'САКУРА',    subname: 'СВОБОДНА', rarity: 'RARE',  level: 5,  imgKey: 'girl_2', love: 0, loveMax: 100, onDate: false, dateEndsAt: null, onMarket: true, marketPrice: 120, owner: 'narutofan', datesTotal: 3 },
  { id: 102, name: 'ЛУННАЯ ФЕЯ',subname: 'МЕЧТАЕТ',  rarity: 'EPIC',  level: 12, imgKey: 'girl_1', love: 0, loveMax: 100, onDate: false, dateEndsAt: null, onMarket: true, marketPrice: 350, owner: 'moonlover', datesTotal: 8 },
  { id: 103, name: 'ПРОСТУШКА', subname: 'В ПОИСКЕ', rarity: 'COMMON',level: 1,  imgKey: 'girl_2', love: 0, loveMax: 100, onDate: false, dateEndsAt: null, onMarket: true, marketPrice: 30,  owner: 'user123',   datesTotal: 0 },
];

const RC: Record<string, { text: string; border: string; bg: string; glow: string }> = {
  COMMON:    { text: '#9CA3AF', border: 'rgba(156,163,175,.35)', bg: 'rgba(156,163,175,.12)', glow: 'rgba(156,163,175,.2)'  },
  RARE:      { text: '#67E8F9', border: 'rgba(103,232,249,.35)', bg: 'rgba(103,232,249,.12)', glow: 'rgba(103,232,249,.3)'  },
  EPIC:      { text: '#C084FC', border: 'rgba(192,132,252,.35)', bg: 'rgba(192,132,252,.12)', glow: 'rgba(192,132,252,.35)' },
  LEGENDARY: { text: '#FDE047', border: 'rgba(253,224,71,.35)',  bg: 'rgba(253,224,71,.12)',  glow: 'rgba(253,224,71,.4)'   },
};

const GRID_SIZE = 30; // 5×6
const mkCell = (itemId = 0): MergeCell => ({ itemId, uid: Math.random().toString(36).slice(2) });

const INITIAL_GIRL: Girl = {
  id: 1, name: 'ЗАНЯТА С ДРУГОЙ УТКОЙ', subname: 'НЕ БЕСПОКОИТЬ',
  rarity: 'COMMON', level: 1, imgKey: 'girl_1',
  love: 0, loveMax: 100, onDate: false, dateEndsAt: null,
  onMarket: false, marketPrice: 50, owner: 'sxzxtsv', datesTotal: 0,
};

const defaultGrid = (): MergeCell[] => {
  const g = Array.from({ length: GRID_SIZE }, () => mkCell());
  // стартовые предметы
  g[0] = mkCell(1); g[1] = mkCell(1); g[2] = mkCell(2); g[3] = mkCell(2); g[5] = mkCell(1);
  return g;
};

const defaultState: GameState = {
  hearts: 15, stars: 3, username: 'sxzxtsv',
  girls: [INITIAL_GIRL],
  grid: defaultGrid(),
  unlockedGirlIds: [1],
  settings: { notifications: true, sound: true, music: true, tgSync: false },
};

/* ── Таймер ── */
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

/* ═══════════════════════ APP ═══════════════════════ */
export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [state, setState] = useState<GameState>(() => {
    try {
      const s = localStorage.getItem('animeworld_v4');
      if (s) {
        const p = JSON.parse(s);
        return {
          ...defaultState, ...p,
          girls: p.girls?.map((g: Girl) => ({ ...INITIAL_GIRL, ...g })) ?? defaultState.girls,
          grid:  p.grid  ?? defaultGrid(),
        };
      }
    } catch { /* */ }
    return defaultState;
  });

  const [notification, setNotification] = useState<string | null>(null);
  const [completedQuests, setCompletedQuests] = useState<number[]>([]);
  const [totalMerges, setTotalMerges] = useState(0);
  const [totalDates, setTotalDates] = useState(0);
  const [rewardIdx, setRewardIdx] = useState(0);
  const [maxTierReached, setMaxTierReached] = useState(1);

  const save = useCallback((s: GameState) => localStorage.setItem('animeworld_v4', JSON.stringify(s)), []);
  useEffect(() => { save(state); }, [state, save]);

  useEffect(() => {
    const t = setInterval(() => {
      setState(s => {
        let ch = false;
        const girls = s.girls.map(g => {
          if (g.onDate && g.dateEndsAt && Date.now() >= g.dateEndsAt) {
            ch = true;
            return { ...g, onDate: false, dateEndsAt: null, love: 0, level: g.level + 1, datesTotal: g.datesTotal + 1 };
          }
          return g;
        });
        if (!ch) return s;
        notify('💌 Вернулась со свидания! +1 уровень');
        return { ...s, girls };
      });
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const notify = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(null), 3500); };

  /* Quest checker */
  const checkQuests = useCallback((merges: number, dates: number, tierMax: number) => {
    QUESTS.forEach(q => {
      if (completedQuests.includes(q.id)) return;
      let done = false;
      if (q.triggerMerges && merges >= q.triggerMerges) done = true;
      if (q.triggerTier  && tierMax >= q.triggerTier)  done = true;
      if (q.triggerDate  && dates >= q.triggerDate)    done = true;
      if (!done) return;
      setCompletedQuests(p => [...p, q.id]);
      if (q.girlReward) {
        const tmpl = REWARD_GIRL_TEMPLATES[rewardIdx % REWARD_GIRL_TEMPLATES.length];
        setRewardIdx(i => i + 1);
        const ng: Girl = { ...tmpl, id: Date.now(), love: 0, onDate: false, dateEndsAt: null, onMarket: false, marketPrice: 80, owner: 'sxzxtsv', datesTotal: 0 };
        setState(s => ({ ...s, girls: [...s.girls, ng], unlockedGirlIds: [...s.unlockedGirlIds, ng.id] }));
        notify(`🎉 «${q.name}» выполнено! Новая девочка — ${tmpl.name}!`);
      } else {
        setState(s => ({ ...s, hearts: s.hearts + (q.hearts || 0) }));
        notify(`🎉 «${q.name}»! +${q.hearts} ❤️`);
      }
    });
  }, [completedQuests, rewardIdx]);

  /* MERGE */
  const doMerge = (idxA: number, idxB: number) => {
    setState(s => {
      const grid = [...s.grid];
      const a = grid[idxA]; const b = grid[idxB];
      if (!a || !b || a.itemId === 0 || b.itemId === 0 || a.itemId !== b.itemId) return s;
      const next = nextTierId(a.itemId);
      grid[idxA] = mkCell(next);
      grid[idxB] = mkCell(0);
      const newMerges = totalMerges + 1;
      const newTier   = Math.max(maxTierReached, next);
      setTotalMerges(newMerges);
      setMaxTierReached(newTier);
      setTimeout(() => checkQuests(newMerges, totalDates, newTier), 100);
      return { ...s, grid };
    });
    notify(`✨ Мердж! ${getToy(nextTierId(state.grid[idxA]?.itemId ?? 1)).emoji} ${getToy(nextTierId(state.grid[idxA]?.itemId ?? 1)).name}`);
  };

  const sendOnDate = (girlId: number) => {
    setState(s => ({ ...s, girls: s.girls.map(g => g.id === girlId ? { ...g, onDate: true, love: 0, dateEndsAt: Date.now() + 30000 } : g) }));
    const nd = totalDates + 1; setTotalDates(nd);
    setTimeout(() => checkQuests(totalMerges, nd, maxTierReached), 100);
    notify('💕 Ушла на свидание! Вернётся через 30 сек');
  };

  const addLove = (girlId: number) => {
    setState(s => {
      const g = s.girls.find(x => x.id === girlId);
      if (!g || g.onDate) return s;
      const nl = Math.min(g.love + 10, g.loveMax);
      if (nl >= g.loveMax) { sendOnDate(girlId); return s; }
      return { ...s, girls: s.girls.map(x => x.id === girlId ? { ...x, love: nl } : x) };
    });
  };

  const spawnToy = () => {
    setState(s => {
      const grid = [...s.grid];
      const emptyIdx = grid.findIndex(c => c.itemId === 0);
      if (emptyIdx === -1) { notify('🚫 Сетка заполнена! Сделай мердж'); return s; }
      if (s.hearts < 3) { notify('❌ Нужно 3 ❤️'); return s; }
      grid[emptyIdx] = mkCell(1);
      return { ...s, grid, hearts: s.hearts - 3 };
    });
    notify('🛒 Куплен вибратор за 3 ❤️');
  };

  const listOnMarket   = (id: number, price: number) => { setState(s => ({ ...s, girls: s.girls.map(g => g.id === id ? { ...g, onMarket: true, marketPrice: price } : g) })); notify('🛒 Выставлена!'); };
  const removeFromMarket = (id: number) => { setState(s => ({ ...s, girls: s.girls.map(g => g.id === id ? { ...g, onMarket: false } : g) })); notify('✅ Снята'); };
  const buyFromMarket  = (girl: Girl) => {
    if (state.hearts < girl.marketPrice) { notify('❌ Не хватает ❤️'); return; }
    const ng: Girl = { ...girl, id: Date.now(), owner: state.username, onMarket: false };
    setState(s => ({ ...s, hearts: s.hearts - girl.marketPrice, girls: [...s.girls, ng], unlockedGirlIds: [...s.unlockedGirlIds, ng.id] }));
    notify(`💖 Куплена: ${girl.name}!`);
  };

  const NAV = [
    { id: 'market' as Tab, icon: '📈', label: 'РЫНОК'   },
    { id: 'toys'   as Tab, icon: '🧸', label: 'ИГРУШКИ' },
    { id: 'home'   as Tab, icon: '🌸', label: 'ГЛАВНАЯ', center: true },
    { id: 'quests' as Tab, icon: '⚔️', label: 'ЗАДАНИЯ' },
    { id: 'gallery'as Tab, icon: '🖼️', label: 'ГАЛЕРЕЯ' },
  ];

  return (
    <div style={{ background: '#080412', minHeight: '100vh', fontFamily: 'Nunito, sans-serif', maxWidth: 480, margin: '0 auto', position: 'relative', overflowX: 'hidden' }}>
      {notification && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 200, background: 'rgba(15,8,30,.97)', border: '1px solid rgba(255,110,180,.55)', borderRadius: 20, padding: '10px 22px', fontSize: 13, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', boxShadow: '0 0 30px rgba(255,110,180,.4)', animation: 'slideDown .3s ease' }}>
          {notification}
        </div>
      )}

      {/* TOP BAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: 19, overflow: 'hidden', border: '2px solid rgba(255,110,180,.45)' }}>
            <img src={getGirlImg('girl_1', state.girls[0]?.level ?? 1)} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{state.username}</span>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#f472b6' }}>❤️ {state.hearts}</span>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#FBBF24' }}>⭐ {state.stars}</span>
        </div>
      </div>

      <div style={{ paddingBottom: 88 }}>
        {tab === 'home'    && <HomeTab state={state} onAddLove={addLove} onListMarket={listOnMarket} onRemoveMarket={removeFromMarket} />}
        {tab === 'market'  && <MarketTab state={state} marketGirls={MARKET_GIRLS} onBuy={buyFromMarket} onListMarket={listOnMarket} onRemoveMarket={removeFromMarket} onNotify={notify} />}
        {tab === 'toys'    && <ToysTab state={state} onMerge={doMerge} onSpawn={spawnToy} />}
        {tab === 'quests'  && <QuestsTab quests={QUESTS} completed={completedQuests} totalMerges={totalMerges} totalDates={totalDates} maxTier={maxTierReached} />}
        {tab === 'gallery' && <GalleryTab state={state} />}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, zIndex: 50 }}>
        <div style={{ background: 'rgba(6,3,14,.97)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '8px 4px 14px' }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
              {n.center
                ? <div style={{ width: 52, height: 52, borderRadius: 26, background: tab === n.id ? 'linear-gradient(135deg,#FF6EB4,#9B59D4)' : 'rgba(255,110,180,.1)', border: '2px solid rgba(255,110,180,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginTop: -24, boxShadow: tab === n.id ? '0 0 28px rgba(255,110,180,.6)' : 'none', transition: 'all .25s' }}>{n.icon}</div>
                : <span style={{ fontSize: 22 }}>{n.icon}</span>
              }
              <span style={{ fontSize: 9, fontWeight: 900, color: tab === n.id ? '#FF6EB4' : 'rgba(255,255,255,.3)', letterSpacing: .5 }}>{n.label}</span>
              {tab === n.id && !n.center && <div style={{ width: 4, height: 4, borderRadius: 2, background: '#FF6EB4' }} />}
            </button>
          ))}
        </div>
      </div>
      <style>{`@keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}} @keyframes pop{0%{transform:scale(1)}50%{transform:scale(1.3)}100%{transform:scale(1)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}`}</style>
    </div>
  );
}

/* ══════════ HOME ══════════ */
function HomeTab({ state, onAddLove, onListMarket, onRemoveMarket }: {
  state: GameState; onAddLove: (id: number) => void;
  onListMarket: (id: number, price: number) => void; onRemoveMarket: (id: number) => void;
}) {
  const [cardIdx, setCardIdx] = useState(0);
  const [swipeX, setSwipeX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exitDir, setExitDir] = useState<'l'|'r'|null>(null);
  const [entering, setEntering] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [price, setPrice] = useState('50');
  const startX = useRef(0);
  const girls = state.girls;
  const girl  = girls[cardIdx] ?? girls[0];
  const lovePct = girl ? Math.round((girl.love / girl.loveMax) * 100) : 0;
  const countdown = useCountdown(girl?.dateEndsAt ?? null);
  const imgSrc = girl ? getGirlImg(girl.imgKey, girl.level) : '';
  const rc = girl ? RC[girl.rarity] : RC.COMMON;

  const goTo = (dir: 'l'|'r', idx: number) => {
    setExitDir(dir); setSwipeX(0);
    setTimeout(() => { setCardIdx(idx); setExitDir(null); setEntering(true); setTimeout(() => setEntering(false), 300); }, 260);
  };
  const onTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; setDragging(true); };
  const onTouchMove  = (e: React.TouchEvent) => { if (dragging) setSwipeX(e.touches[0].clientX - startX.current); };
  const onTouchEnd   = () => {
    setDragging(false);
    if (swipeX < -60 && cardIdx < girls.length - 1) goTo('l', cardIdx + 1);
    else if (swipeX > 60 && cardIdx > 0) goTo('r', cardIdx - 1);
    else setSwipeX(0);
  };

  const cardTx = exitDir === 'l' ? 'translateX(-130%) rotate(-16deg)' :
                 exitDir === 'r' ? 'translateX(130%) rotate(16deg)' :
                 entering ? 'translateX(0) scale(1)' :
                 `translateX(${swipeX}px) rotate(${swipeX * 0.04}deg)`;

  if (!girl) return null;

  return (
    <div style={{ padding: '4px 16px 0' }}>
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#13082a', border: '1px solid rgba(255,110,180,.25)', borderRadius: '24px 24px 0 0', padding: 24, width: '100%', maxWidth: 480 }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Выставить на рынок</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 14 }}>{girl.name} · {girl.rarity} · Lv.{girl.level}</div>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,110,180,.25)', borderRadius: 14, padding: '12px 16px', fontSize: 20, fontWeight: 900, color: '#fff', outline: 'none', marginBottom: 14, boxSizing: 'border-box' }} placeholder="Цена ❤️" />
            <button onClick={() => { onListMarket(girl.id, Number(price) || 50); setShowModal(false); }}
              style={{ width: '100%', padding: 14, borderRadius: 16, border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 15, background: 'linear-gradient(135deg,#FF6EB4,#9B59D4)', color: '#fff' }}>
              Выставить
            </button>
          </div>
        </div>
      )}

      <div style={{ transform: cardTx, transition: (exitDir || entering) ? 'transform .26s ease' : dragging ? 'none' : 'transform .2s ease', opacity: exitDir ? 0 : 1, userSelect: 'none' }}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>

        {swipeX > 40  && <div style={{ position: 'absolute', top: '38%', left: 18, zIndex: 10, fontSize: 50, opacity: Math.min(swipeX / 80, 1) }}>❤️</div>}
        {swipeX < -40 && <div style={{ position: 'absolute', top: '38%', right: 18, zIndex: 10, fontSize: 50, opacity: Math.min(-swipeX / 80, 1) }}>💨</div>}

        <div style={{ borderRadius: 24, overflow: 'hidden', border: `2px solid ${rc.border}`, boxShadow: `0 24px 60px rgba(0,0,0,.75), 0 0 48px ${rc.glow}`, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 12, left: 14, zIndex: 5, fontSize: 11, fontWeight: 900, color: '#fff', background: 'rgba(0,0,0,.5)', borderRadius: 8, padding: '3px 8px' }}>Lv.{girl.level}</div>
          <div style={{ position: 'absolute', top: 12, right: 14, zIndex: 5, fontSize: 11, fontWeight: 900, color: rc.text, background: rc.bg, border: `1px solid ${rc.border}`, borderRadius: 8, padding: '3px 8px' }}>{girl.rarity}</div>
          {girl.onMarket && <div style={{ position: 'absolute', top: 42, right: 14, zIndex: 5, fontSize: 10, fontWeight: 900, color: '#FBBF24', background: 'rgba(251,191,36,.15)', border: '1px solid rgba(251,191,36,.35)', borderRadius: 8, padding: '3px 8px' }}>🛒 НА РЫНКЕ</div>}

          {girl.onDate && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 8, background: 'rgba(8,3,18,.88)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <span style={{ fontSize: 60, animation: 'pulse 1.5s ease-in-out infinite' }}>💕</span>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#FF6EB4' }}>НА СВИДАНИИ</div>
              {countdown && <div style={{ fontSize: 34, fontWeight: 900, color: '#fff', letterSpacing: 3, fontVariantNumeric: 'tabular-nums' }}>{countdown}</div>}
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>+1 уровень по возвращении</div>
            </div>
          )}

          <img src={imgSrc} alt={girl.name} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />

          {!girl.onDate && (
            <div style={{ position: 'absolute', bottom: 54, left: 14, right: 14, zIndex: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.8)' }}>❤️ Любовь</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#FF6EB4' }}>{lovePct}%</span>
              </div>
              <div style={{ height: 9, background: 'rgba(0,0,0,.5)', borderRadius: 99, overflow: 'hidden', border: '1px solid rgba(255,110,180,.2)' }}>
                <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#FF6EB4,#C084FC)', width: `${lovePct}%`, transition: 'width .5s cubic-bezier(.34,1.56,.64,1)' }} />
              </div>
              {lovePct >= 90 && <div style={{ textAlign: 'center', fontSize: 11, color: '#FF6EB4', fontWeight: 900, marginTop: 4 }}>💕 Ещё раз → свидание!</div>}
            </div>
          )}

          <div style={{ background: 'rgba(255,255,255,.95)', padding: '10px 14px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#1a0835' }}>{girl.name}</div>
            <div style={{ fontSize: 10, color: '#888', fontWeight: 700, marginTop: 1 }}>{girl.subname} · {girl.datesTotal} свиданий</div>
          </div>
        </div>
      </div>

      {girls.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          {girls.map((_, i) => (
            <div key={i} onClick={() => goTo(i > cardIdx ? 'l' : 'r', i)}
              style={{ width: i === cardIdx ? 20 : 6, height: 6, borderRadius: 3, background: i === cardIdx ? '#FF6EB4' : 'rgba(255,255,255,.2)', cursor: 'pointer', transition: 'all .3s' }} />
          ))}
        </div>
      )}

      {!girl.onDate && (
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button onClick={() => onAddLove(girl.id)}
            style={{ flex: 2, padding: 14, borderRadius: 18, border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 15, background: 'linear-gradient(135deg,#FF6EB4,#e91e8c)', color: '#fff', boxShadow: '0 4px 20px rgba(255,110,180,.4)' }}>
            ❤️ +Любовь ({lovePct}%)
          </button>
          {!girl.onMarket
            ? <button onClick={() => setShowModal(true)} style={{ flex: 1, padding: 14, borderRadius: 18, border: '1px solid rgba(255,255,255,.12)', cursor: 'pointer', fontWeight: 900, fontSize: 13, background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.7)' }}>🛒 Рынок</button>
            : <button onClick={() => onRemoveMarket(girl.id)} style={{ flex: 1, padding: 14, borderRadius: 18, border: '1px solid rgba(251,191,36,.3)', cursor: 'pointer', fontWeight: 900, fontSize: 11, background: 'rgba(251,191,36,.06)', color: '#FBBF24' }}>❌ Снять</button>
          }
        </div>
      )}
    </div>
  );
}

/* ══════════ MARKET ══════════ */
function MarketTab({ state, marketGirls, onBuy, onListMarket, onRemoveMarket, onNotify }: {
  state: GameState; marketGirls: Girl[]; onBuy: (g: Girl) => void;
  onListMarket: (id: number, price: number) => void; onRemoveMarket: (id: number) => void; onNotify: (m: string) => void;
}) {
  const [sub, setSub] = useState<'buy'|'sell'>('buy');
  const forSale = [...marketGirls, ...state.girls.filter(g => g.onMarket && g.owner !== state.username)];
  const mine    = state.girls.filter(g => g.onMarket);

  return (
    <div style={{ padding: '12px 16px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, background: 'linear-gradient(135deg,#FF6EB4,#ff9cee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 4px' }}>Рынок</h2>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', margin: '0 0 14px' }}>Покупай и выставляй девочек</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['buy','sell'] as const).map(t => (
          <button key={t} onClick={() => setSub(t)} style={{ flex: 1, padding: 9, borderRadius: 14, border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 13, background: sub === t ? 'linear-gradient(135deg,#FF6EB4,#9B59D4)' : 'rgba(255,255,255,.06)', color: sub === t ? '#fff' : 'rgba(255,255,255,.4)' }}>
            {t === 'buy' ? '🛒 Купить' : '💰 Мои лоты'}
          </button>
        ))}
      </div>

      {sub === 'buy' && forSale.map(girl => {
        const rc = RC[girl.rarity]; const isMine = girl.owner === state.username;
        const img = getGirlImg(girl.imgKey, girl.level);
        return (
          <div key={girl.id} style={{ display: 'flex', gap: 12, background: 'rgba(255,255,255,.04)', border: `1px solid ${rc.border}`, borderRadius: 20, overflow: 'hidden', marginBottom: 10 }}>
            <img src={img} alt="" style={{ width: 80, height: 100, objectFit: 'cover', objectPosition: 'top', flexShrink: 0 }} />
            <div style={{ flex: 1, padding: '12px 12px 12px 0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, color: rc.text }}>{girl.rarity} · Lv.{girl.level}</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', marginTop: 2 }}>{girl.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>от {girl.owner}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#f472b6' }}>❤️ {girl.marketPrice}</span>
                {isMine
                  ? <button onClick={() => onRemoveMarket(girl.id)} style={{ padding: '7px 12px', borderRadius: 12, border: '1px solid rgba(251,191,36,.3)', background: 'rgba(251,191,36,.06)', cursor: 'pointer', fontWeight: 900, fontSize: 11, color: '#FBBF24' }}>Снять</button>
                  : <button onClick={() => onBuy(girl)} style={{ padding: '7px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 13, background: 'linear-gradient(135deg,#FF6EB4,#9B59D4)', color: '#fff' }}>Купить</button>
                }
              </div>
            </div>
          </div>
        );
      })}

      {sub === 'sell' && (
        mine.length === 0
          ? <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.3)', padding: '30px 0' }}><div style={{ fontSize: 40 }}>🌸</div>Нет активных лотов<br/><span style={{ fontSize: 12 }}>Выставь с главного экрана</span></div>
          : mine.map(girl => {
              const rc = RC[girl.rarity];
              return (
                <div key={girl.id} style={{ display: 'flex', gap: 12, background: 'rgba(255,255,255,.04)', border: `1px solid ${rc.border}`, borderRadius: 20, overflow: 'hidden', marginBottom: 10 }}>
                  <img src={getGirlImg(girl.imgKey, girl.level)} alt="" style={{ width: 72, height: 88, objectFit: 'cover', objectPosition: 'top', flexShrink: 0 }} />
                  <div style={{ flex: 1, padding: '12px 12px 12px 0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 800, color: rc.text }}>{girl.rarity} · Lv.{girl.level}</div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', marginTop: 2 }}>{girl.name}</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#f472b6' }}>❤️ {girl.marketPrice}</div>
                    </div>
                    <button onClick={() => onRemoveMarket(girl.id)} style={{ padding: '7px 14px', borderRadius: 12, border: '1px solid rgba(251,191,36,.3)', background: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 12, color: '#FBBF24', alignSelf: 'flex-start' }}>❌ Снять</button>
                  </div>
                </div>
              );
            })
      )}
    </div>
  );
}

/* ══════════ TOYS — MERGE GRID ══════════ */
function ToysTab({ state, onMerge, onSpawn }: { state: GameState; onMerge: (a: number, b: number) => void; onSpawn: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [mergeFlash, setMergeFlash] = useState<number | null>(null);

  const tap = (idx: number) => {
    const cell = state.grid[idx];
    if (cell.itemId === 0) { if (selected !== null) { setSelected(null); } return; }

    if (selected === null) { setSelected(idx); return; }
    if (selected === idx)  { setSelected(null); return; }

    const selCell = state.grid[selected];
    if (selCell.itemId === cell.itemId) {
      // MERGE!
      setMergeFlash(idx);
      setTimeout(() => setMergeFlash(null), 400);
      onMerge(selected, idx);
      setSelected(null);
    } else {
      // просто переключаем выбор
      setSelected(idx);
    }
  };

  const COLS = 5;
  const rc = (id: number) => id > 0 ? RC[getToy(id).rarity] : RC.COMMON;

  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, background: 'linear-gradient(135deg,#67E8F9,#C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>Игрушки</h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', margin: '2px 0 0' }}>Тапни → выбери → тапни такую же</p>
        </div>
        <button onClick={onSpawn} style={{ padding: '9px 14px', borderRadius: 16, border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 13, background: 'linear-gradient(135deg,#FF6EB4,#9B59D4)', color: '#fff', boxShadow: '0 4px 16px rgba(255,110,180,.35)' }}>
          +🧸 3❤️
        </button>
      </div>

      {/* Справка по уровням */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 12, scrollbarWidth: 'none' }}>
        {TOY_TYPES.map(t => (
          <div key={t.id} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,.04)', border: `1px solid ${RC[t.rarity].border}`, borderRadius: 12, padding: '6px 8px', minWidth: 48 }}>
            <span style={{ fontSize: 20 }}>{t.emoji}</span>
            <span style={{ fontSize: 8, color: RC[t.rarity].text, fontWeight: 800 }}>T{t.tier}</span>
          </div>
        ))}
      </div>

      {/* Сетка */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 6 }}>
        {state.grid.map((cell, idx) => {
          const toy = cell.itemId > 0 ? getToy(cell.itemId) : null;
          const r = rc(cell.itemId);
          const isSel = selected === idx;
          const isFlash = mergeFlash === idx;
          const isCompatible = selected !== null && selected !== idx && state.grid[selected].itemId === cell.itemId && cell.itemId > 0;

          return (
            <div key={cell.uid} onClick={() => tap(idx)}
              style={{
                aspectRatio: '1', borderRadius: 14,
                border: `2px solid ${isSel ? '#FF6EB4' : isCompatible ? r.border : cell.itemId > 0 ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.04)'}`,
                background: isSel ? 'rgba(255,110,180,.18)' : isCompatible ? r.bg : cell.itemId > 0 ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.02)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                cursor: cell.itemId > 0 ? 'pointer' : 'default',
                transition: 'all .18s',
                boxShadow: isSel ? '0 0 18px rgba(255,110,180,.5)' : isCompatible ? `0 0 12px ${r.glow}` : isFlash ? '0 0 30px #fff' : 'none',
                transform: isSel ? 'scale(1.08)' : isFlash ? 'scale(1.2)' : 'scale(1)',
                animation: isFlash ? 'pop .4s ease' : 'none',
                position: 'relative',
              }}>
              {toy ? (
                <>
                  <span style={{ fontSize: 26 }}>{toy.emoji}</span>
                  <span style={{ fontSize: 8, color: r.text, fontWeight: 900 }}>T{toy.tier}</span>
                  {isSel && <div style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, background: '#FF6EB4' }} />}
                  {isCompatible && <div style={{ position: 'absolute', bottom: 3, fontSize: 10 }}>✓</div>}
                </>
              ) : (
                <span style={{ fontSize: 16, opacity: .15 }}>·</span>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 16, background: 'rgba(255,255,255,.03)', borderRadius: 16, padding: '12px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.4)', marginBottom: 6 }}>КАК ИГРАТЬ</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', lineHeight: 1.7 }}>
          1. Тапни игрушку → она выделится<br/>
          2. Тапни такую же → они сольются в следующий уровень<br/>
          3. Зелёные ячейки = можно слить прямо сейчас<br/>
          4. Новую игрушку купи за 3 ❤️
        </div>
      </div>
    </div>
  );
}

/* ══════════ QUESTS ══════════ */
function QuestsTab({ quests, completed, totalMerges, totalDates, maxTier }: {
  quests: typeof QUESTS; completed: number[]; totalMerges: number; totalDates: number; maxTier: number;
}) {
  const progress = (q: typeof QUESTS[0]) => {
    if (q.triggerMerges) return { cur: Math.min(totalMerges, q.triggerMerges), max: q.triggerMerges };
    if (q.triggerTier)   return { cur: Math.min(maxTier, q.triggerTier), max: q.triggerTier };
    if (q.triggerDate)   return { cur: Math.min(totalDates, q.triggerDate), max: q.triggerDate };
    return null;
  };

  return (
    <div style={{ padding: '12px 16px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: '#FBBF24', margin: '0 0 4px' }}>Задания</h2>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', margin: '0 0 16px' }}>Выполняй → получай девочек</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {quests.map(q => {
          const done = completed.includes(q.id);
          const pr   = progress(q);
          const pct  = pr ? Math.round((pr.cur / pr.max) * 100) : 0;
          return (
            <div key={q.id} style={{ background: done ? 'rgba(255,215,0,.05)' : 'rgba(255,255,255,.04)', border: `1px solid ${done ? 'rgba(255,215,0,.2)' : 'rgba(255,255,255,.08)'}`, borderRadius: 18, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: pr && !done ? 8 : 0 }}>
                <span style={{ fontSize: 28 }}>{done ? '✅' : q.girlReward ? '🎀' : '🧸'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: done ? 'rgba(255,255,255,.5)' : '#fff' }}>{q.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 1 }}>{q.desc}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color: q.girlReward ? '#FF6EB4' : '#FBBF24', textAlign: 'right' }}>
                  {q.girlReward ? '🌸 Девочка' : `❤️ +${q.hearts}`}
                </div>
              </div>
              {pr && !done && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', fontWeight: 700 }}>Прогресс</span>
                    <span style={{ fontSize: 10, color: '#FF6EB4', fontWeight: 800 }}>{pr.cur}/{pr.max}</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'linear-gradient(90deg,#FF6EB4,#9B59D4)', width: `${pct}%`, borderRadius: 99, transition: 'width .4s ease' }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════ GALLERY ══════════ */
function GalleryTab({ state }: { state: GameState }) {
  const [selected, setSelected] = useState<Girl | null>(null);

  const myGirls = state.girls.filter(g => state.unlockedGirlIds.includes(g.id));

  return (
    <div style={{ padding: '12px 16px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, background: 'linear-gradient(135deg,#FF6EB4,#ff9cee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 4px' }}>Галерея</h2>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', margin: '0 0 4px' }}>Твои девочки · {myGirls.length} открыто</p>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,.2)', margin: '0 0 16px' }}>Картинка меняется каждые 10 уровней</p>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#13082a', borderRadius: 24, overflow: 'hidden', width: '100%', maxWidth: 340, border: `2px solid ${RC[selected.rarity].border}`, boxShadow: `0 0 60px ${RC[selected.rarity].glow}` }}>
            <img src={getGirlImg(selected.imgKey, selected.level)} alt="" style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', objectPosition: 'top' }} />
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{selected.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>{selected.subname}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color: RC[selected.rarity].text, background: RC[selected.rarity].bg, border: `1px solid ${RC[selected.rarity].border}`, borderRadius: 8, padding: '3px 8px' }}>{selected.rarity}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 14 }}>
                {[
                  { label: 'Уровень', value: selected.level },
                  { label: 'Свиданий', value: selected.datesTotal },
                  { label: 'Цена', value: `❤️${selected.marketPrice}` },
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,.05)', borderRadius: 12, padding: '8px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {/* Прогресс до следующей картинки */}
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 700 }}>До новой картинки</span>
                  <span style={{ fontSize: 11, color: '#FF6EB4', fontWeight: 800 }}>Lv.{Math.ceil(selected.level / 10) * 10}</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg,#FF6EB4,#9B59D4)', width: `${((selected.level % 10) / 10) * 100 || 100}%`, borderRadius: 99 }} />
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ width: '100%', marginTop: 14, padding: 12, borderRadius: 14, border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 14, background: 'rgba(255,255,255,.07)', color: 'rgba(255,255,255,.7)' }}>Закрыть</button>
            </div>
          </div>
        </div>
      )}

      {myGirls.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,.3)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌸</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Пока пусто</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>Выполняй задания чтобы открыть девочек</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {myGirls.map(girl => {
          const rc = RC[girl.rarity];
          const imgSlot = Math.floor((girl.level - 1) / 10);
          return (
            <div key={girl.id} onClick={() => setSelected(girl)}
              style={{ background: 'rgba(255,255,255,.04)', border: `2px solid ${rc.border}`, borderRadius: 20, overflow: 'hidden', cursor: 'pointer', transition: 'all .2s', boxShadow: `0 0 20px ${rc.glow}` }}>
              <div style={{ position: 'relative' }}>
                <img src={getGirlImg(girl.imgKey, girl.level)} alt={girl.name} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
                <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 10, fontWeight: 900, color: '#fff', background: 'rgba(0,0,0,.55)', borderRadius: 7, padding: '2px 7px' }}>Lv.{girl.level}</div>
                <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, fontWeight: 900, color: rc.text, background: rc.bg, border: `1px solid ${rc.border}`, borderRadius: 7, padding: '2px 7px' }}>{girl.rarity}</div>
                {girl.onDate && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>💕</div>}
                {/* Индикатор слота картинки */}
                <div style={{ position: 'absolute', bottom: 6, right: 6, fontSize: 9, fontWeight: 900, color: '#FBBF24', background: 'rgba(0,0,0,.6)', borderRadius: 6, padding: '2px 6px' }}>🖼️{imgSlot + 1}</div>
              </div>
              <div style={{ padding: '8px 10px 10px' }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{girl.name}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>{girl.datesTotal} свиданий</div>
                {/* Mini progress */}
                <div style={{ height: 3, background: 'rgba(255,255,255,.08)', borderRadius: 99, overflow: 'hidden', marginTop: 6 }}>
                  <div style={{ height: '100%', background: rc.text, width: `${((girl.level % 10) / 10) * 100 || 100}%`, borderRadius: 99 }} />
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', marginTop: 3 }}>до Lv.{Math.ceil(girl.level / 10) * 10}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
