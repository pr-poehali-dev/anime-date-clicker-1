import { useState, useEffect, useCallback, useRef } from 'react';

const CHAR_IMG  = 'https://cdn.poehali.dev/projects/fa02b305-cd43-45b0-8919-63c1c7e955ae/files/38c76cd9-73f6-4bc0-a53b-afc8e6663f26.jpg';
const CHAR_IMG2 = 'https://cdn.poehali.dev/projects/fa02b305-cd43-45b0-8919-63c1c7e955ae/files/587a0657-d135-478c-946c-5bf13778ef00.jpg';

type Tab = 'home' | 'market' | 'toys' | 'quests' | 'gallery';

/* ── Типы ── */
interface Girl {
  id: number; name: string; subname: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  level: number; img: string; love: number; loveMax: number;
  onDate: boolean; dateEndsAt: number | null;
  onMarket: boolean; marketPrice: number; owner: string;
}

interface Toy {
  id: number; name: string; emoji: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  count: number;
}

interface GameState {
  hearts: number; stars: number; username: string;
  girls: Girl[]; toys: Toy[];
  settings: { notifications: boolean; sound: boolean; music: boolean; tgSync: boolean };
}

/* ── Предметы ── */
const ALL_TOYS: Omit<Toy, 'count'>[] = [
  { id: 1,  name: 'Дилдо',          emoji: '🍆', rarity: 'COMMON'    },
  { id: 2,  name: 'Анальная пробка', emoji: '🔌', rarity: 'COMMON'    },
  { id: 3,  name: 'Вибратор',        emoji: '📳', rarity: 'COMMON'    },
  { id: 4,  name: 'Наручники',       emoji: '⛓️',  rarity: 'RARE'     },
  { id: 5,  name: 'Плётка',          emoji: '🪢', rarity: 'RARE'     },
  { id: 6,  name: 'Маска кошки',     emoji: '🐱', rarity: 'RARE'     },
  { id: 7,  name: 'Кляп-шар',        emoji: '⚽', rarity: 'EPIC'     },
  { id: 8,  name: 'Страпон',         emoji: '🎯', rarity: 'EPIC'     },
  { id: 9,  name: 'Фиксирующий пояс',emoji: '🎀', rarity: 'EPIC'     },
  { id: 10, name: 'Золотой вибратор',emoji: '✨', rarity: 'LEGENDARY' },
];

/* Рецепты скрещивания: [id_a, id_b] -> id_результата */
const RECIPES: [number, number, number][] = [
  [1, 2, 4],  // дилдо + пробка = наручники
  [2, 3, 5],  // пробка + вибратор = плётка
  [1, 3, 6],  // дилдо + вибратор = маска кошки
  [4, 5, 7],  // наручники + плётка = кляп-шар
  [4, 6, 8],  // наручники + маска = страпон
  [5, 6, 9],  // плётка + маска = пояс
  [7, 8, 10], // кляп + страпон = золотой вибратор
  [8, 9, 10], // страпон + пояс = золотой вибратор
];

/* Задания на скрещивание */
const MERGE_QUESTS = [
  { id: 1, name: 'Первое скрещивание',   desc: 'Скрести любые 2 предмета',            req: 'any',   count: 1,  reward: 'hearts', amount: 5,  girlReward: false },
  { id: 2, name: 'Любитель резины',      desc: 'Скрести Дилдо + Анальная пробка',     req: [1,2],   count: 1,  reward: 'girl',   amount: 0,  girlReward: true  },
  { id: 3, name: 'БДСМ-мастер',          desc: 'Скрести Наручники + Плётка',          req: [4,5],   count: 1,  reward: 'girl',   amount: 0,  girlReward: true  },
  { id: 4, name: 'Коллекционер',         desc: 'Получи 5 разных предметов',           req: 'collect',count: 5, reward: 'hearts', amount: 20, girlReward: false },
  { id: 5, name: 'Легендарный',          desc: 'Скрести до Золотого вибратора',       req: 'legendary',count:1,reward: 'girl',   amount: 0,  girlReward: true  },
];

/* Новые девочки-награды */
const REWARD_GIRLS: Omit<Girl, 'id' | 'love' | 'onDate' | 'dateEndsAt' | 'onMarket' | 'marketPrice' | 'owner'>[] = [
  { name: 'САКУРА-ЧАН',  subname: 'СВОБОДНА',    rarity: 'RARE',      level: 3, img: CHAR_IMG2, loveMax: 100 },
  { name: 'ТЁМНАЯ ФЕЯ',  subname: 'ЗАГАДОЧНАЯ',  rarity: 'EPIC',      level: 5, img: CHAR_IMG,  loveMax: 100 },
  { name: 'ЛУННАЯ ДЕВА',  subname: 'МЕЧТАТЕЛЬНИЦА',rarity:'LEGENDARY', level: 9, img: CHAR_IMG2, loveMax: 100 },
];

/* Рынок чужих девочек */
const MARKET_GIRLS: Girl[] = [
  { id: 101, name: 'САКУРА-ЧАН', subname: 'СВОБОДНА',  rarity: 'RARE',  level: 3, img: CHAR_IMG2, love: 60, loveMax: 100, onDate: false, dateEndsAt: null, onMarket: true, marketPrice: 120, owner: 'narutofan99' },
  { id: 102, name: 'ЛУННАЯ ФЕЯ', subname: 'МЕЧТАЕТ',   rarity: 'EPIC',  level: 7, img: CHAR_IMG,  love: 80, loveMax: 100, onDate: false, dateEndsAt: null, onMarket: true, marketPrice: 350, owner: 'moonlover'   },
  { id: 103, name: 'ПРОСТУШКА',  subname: 'В ПОИСКЕ',  rarity: 'COMMON',level: 1, img: CHAR_IMG2, love: 20, loveMax: 100, onDate: false, dateEndsAt: null, onMarket: true, marketPrice: 30,  owner: 'basic_user'  },
];

const GALLERY = [
  { id: 1, emoji: '🌸', title: 'Сакура в цвету', likes: 24 },
  { id: 2, emoji: '🏯', title: 'Замок Химэдзи',  likes: 18 },
  { id: 3, emoji: '🌊', title: 'Морской бриз',   likes: 31 },
  { id: 4, emoji: '🎋', title: 'Бамбуковый лес', likes: 12 },
  { id: 5, emoji: '🦊', title: 'Лисий фестиваль',likes: 45 },
  { id: 6, emoji: '🌺', title: 'Красный мак',     likes: 9  },
];

const RC: Record<string, { text: string; border: string; bg: string; glow: string }> = {
  COMMON:    { text: '#9CA3AF', border: 'rgba(156,163,175,.35)', bg: 'rgba(156,163,175,.08)', glow: 'rgba(156,163,175,.2)'  },
  RARE:      { text: '#67E8F9', border: 'rgba(103,232,249,.35)', bg: 'rgba(103,232,249,.08)', glow: 'rgba(103,232,249,.25)' },
  EPIC:      { text: '#C084FC', border: 'rgba(192,132,252,.35)', bg: 'rgba(192,132,252,.08)', glow: 'rgba(192,132,252,.3)'  },
  LEGENDARY: { text: '#FDE047', border: 'rgba(253,224,71,.35)',  bg: 'rgba(253,224,71,.08)',  glow: 'rgba(253,224,71,.35)'  },
};

const INITIAL_GIRL: Girl = {
  id: 1, name: 'ЗАНЯТА С ДРУГОЙ УТКОЙ', subname: 'НЕ БЕСПОКОИТЬ',
  rarity: 'COMMON', level: 1, img: CHAR_IMG,
  love: 0, loveMax: 100, onDate: false, dateEndsAt: null,
  onMarket: false, marketPrice: 50, owner: 'sxzxtsv',
};

const defaultState: GameState = {
  hearts: 15, stars: 3, username: 'sxzxtsv',
  girls: [INITIAL_GIRL],
  toys: [
    { ...ALL_TOYS[0], count: 2 },
    { ...ALL_TOYS[1], count: 1 },
    { ...ALL_TOYS[2], count: 1 },
  ],
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
      const s = localStorage.getItem('animeworld_v3');
      if (s) { const p = JSON.parse(s); return { ...defaultState, ...p, girls: p.girls?.map((g: Girl) => ({ ...INITIAL_GIRL, ...g })) ?? defaultState.girls }; }
    } catch { /* */ }
    return defaultState;
  });
  const [notification, setNotification] = useState<string | null>(null);
  const [likedItems, setLikedItems] = useState<number[]>([]);
  const [completedQuests, setCompletedQuests] = useState<number[]>([]);
  const [mergeCount, setMergeCount] = useState(0);
  const [rewardGirlIdx, setRewardGirlIdx] = useState(0);

  const save = useCallback((s: GameState) => localStorage.setItem('animeworld_v3', JSON.stringify(s)), []);
  useEffect(() => { save(state); }, [state, save]);

  /* вернулась со свидания */
  useEffect(() => {
    const t = setInterval(() => {
      setState(s => {
        let ch = false;
        const girls = s.girls.map(g => {
          if (g.onDate && g.dateEndsAt && Date.now() >= g.dateEndsAt) { ch = true; return { ...g, onDate: false, dateEndsAt: null, love: 0 }; }
          return g;
        });
        if (!ch) return s;
        notify('💌 Девочка вернулась со свидания!');
        return { ...s, girls };
      });
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const notify = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };

  const sendOnDate = (girlId: number) => {
    setState(s => ({ ...s, girls: s.girls.map(g => g.id === girlId ? { ...g, onDate: true, love: 0, dateEndsAt: Date.now() + 30000 } : g) }));
    notify('💕 Ушла на свидание! Вернётся через 30 сек');
  };

  const addLove = (girlId: number) => {
    setState(s => {
      const g = s.girls.find(x => x.id === girlId);
      if (!g || g.onDate) return s;
      const newLove = Math.min(g.love + 10, g.loveMax);
      if (newLove >= g.loveMax) { sendOnDate(girlId); return s; }
      return { ...s, girls: s.girls.map(x => x.id === girlId ? { ...x, love: newLove } : x) };
    });
  };

  const listOnMarket   = (id: number, price: number) => { setState(s => ({ ...s, girls: s.girls.map(g => g.id === id ? { ...g, onMarket: true, marketPrice: price } : g) })); notify('🛒 Выставлена на рынок!'); };
  const removeFromMarket = (id: number) => { setState(s => ({ ...s, girls: s.girls.map(g => g.id === id ? { ...g, onMarket: false } : g) })); notify('✅ Снята с рынка'); };
  const buyFromMarket  = (girl: Girl) => {
    if (state.hearts < girl.marketPrice) { notify('❌ Не хватает сердец!'); return; }
    const ng: Girl = { ...girl, id: Date.now(), owner: state.username, onMarket: false, love: 0, onDate: false, dateEndsAt: null };
    setState(s => ({ ...s, hearts: s.hearts - girl.marketPrice, girls: [...s.girls, ng] }));
    notify(`💖 Куплена: ${girl.name}!`);
  };

  /* СКРЕЩИВАНИЕ */
  const mergeToys = (idA: number, idB: number): boolean => {
    const recipe = RECIPES.find(([a, b]) => (a === idA && b === idB) || (a === idB && b === idA));
    if (!recipe) return false;
    const resultToy = ALL_TOYS.find(t => t.id === recipe[2]);
    if (!resultToy) return false;

    setState(s => {
      const toys = [...s.toys];
      const consumeOne = (id: number) => {
        const idx = toys.findIndex(t => t.id === id);
        if (idx === -1) return;
        if (toys[idx].count > 1) toys[idx] = { ...toys[idx], count: toys[idx].count - 1 };
        else toys.splice(idx, 1);
      };
      consumeOne(idA); consumeOne(idB);
      const existIdx = toys.findIndex(t => t.id === resultToy.id);
      if (existIdx >= 0) toys[existIdx] = { ...toys[existIdx], count: toys[existIdx].count + 1 };
      else toys.push({ ...resultToy, count: 1 });
      return { ...s, toys };
    });

    const newCount = mergeCount + 1;
    setMergeCount(newCount);
    checkMergeQuests(idA, idB, recipe[2], newCount);
    return true;
  };

  const checkMergeQuests = (idA: number, idB: number, resultId: number, totalMerges: number) => {
    MERGE_QUESTS.forEach(q => {
      if (completedQuests.includes(q.id)) return;
      let done = false;
      if (q.req === 'any' && totalMerges >= q.count) done = true;
      if (Array.isArray(q.req) && ((q.req[0] === idA && q.req[1] === idB) || (q.req[0] === idB && q.req[1] === idA))) done = true;
      if (q.req === 'legendary' && resultId === 10) done = true;
      if (q.req === 'collect') {
        const unique = new Set(state.toys.map(t => t.id)).size;
        if (unique >= q.count) done = true;
      }
      if (done) { giveQuestReward(q); }
    });
  };

  const giveQuestReward = (q: typeof MERGE_QUESTS[0]) => {
    setCompletedQuests(p => [...p, q.id]);
    if (q.girlReward) {
      const template = REWARD_GIRLS[rewardGirlIdx % REWARD_GIRLS.length];
      setRewardGirlIdx(i => i + 1);
      const newGirl: Girl = { ...template, id: Date.now(), love: 0, onDate: false, dateEndsAt: null, onMarket: false, marketPrice: 80, owner: state.username };
      setState(s => ({ ...s, girls: [...s.girls, newGirl] }));
      notify(`🎉 Задание «${q.name}»! Новая девочка — ${template.name}!`);
    } else {
      setState(s => ({ ...s, hearts: s.hearts + (q.amount || 0) }));
      notify(`🎉 Задание «${q.name}»! +${q.amount} ❤️`);
    }
  };

  const updateSetting = (key: keyof GameState['settings'], val: boolean) => setState(s => ({ ...s, settings: { ...s.settings, [key]: val } }));

  const NAV = [
    { id: 'market' as Tab, icon: '📈', label: 'РЫНОК'    },
    { id: 'toys'   as Tab, icon: '🧸', label: 'ИГРУШКИ'  },
    { id: 'home'   as Tab, icon: '🌸', label: 'ГЛАВНАЯ',  center: true },
    { id: 'quests' as Tab, icon: '⚔️', label: 'ЗАДАНИЯ'  },
    { id: 'gallery'as Tab, icon: '🖼️', label: 'ГАЛЕРЕЯ'  },
  ];

  return (
    <div style={{ background: '#0a0614', minHeight: '100vh', fontFamily: 'Nunito, sans-serif', maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      {notification && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 200, background: 'rgba(20,10,40,.97)', border: '1px solid rgba(255,110,180,.5)', borderRadius: 18, padding: '10px 22px', fontSize: 13, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', boxShadow: '0 0 30px rgba(255,110,180,.35)' }}>
          {notification}
        </div>
      )}

      {/* TOP BAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: 19, overflow: 'hidden', border: '2px solid rgba(255,110,180,.45)' }}>
            <img src={CHAR_IMG2} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{state.username}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 15, fontWeight: 900, color: '#f472b6' }}>❤️ {state.hearts}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 15, fontWeight: 900, color: '#FBBF24' }}>⭐ {state.stars}</div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ paddingBottom: 88 }}>
        {tab === 'home'    && <HomeTab    state={state} onAddLove={addLove} onListMarket={listOnMarket} onRemoveMarket={removeFromMarket} onNotify={notify} />}
        {tab === 'market'  && <MarketTab  state={state} marketGirls={MARKET_GIRLS} onBuy={buyFromMarket} onListMarket={listOnMarket} onRemoveMarket={removeFromMarket} onNotify={notify} />}
        {tab === 'toys'    && <ToysTab    state={state} onMerge={mergeToys} onNotify={notify} />}
        {tab === 'quests'  && <QuestsTab  completedQuests={completedQuests} mergeCount={mergeCount} toyCount={state.toys.reduce((a,t)=>a+t.count,0)} uniqueToyCount={new Set(state.toys.map(t=>t.id)).size} />}
        {tab === 'gallery' && <GalleryTab items={GALLERY} likedItems={likedItems} onLike={id => { if (!likedItems.includes(id)) { setLikedItems(p=>[...p,id]); notify('💖 Лайк!'); } }} />}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, zIndex: 50 }}>
        <div style={{ background: 'rgba(8,4,18,.97)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '8px 4px 14px' }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', position: 'relative' }}>
              {n.center ? (
                <div style={{ width: 50, height: 50, borderRadius: 25, background: tab === n.id ? 'linear-gradient(135deg,#FF6EB4,#9B59D4)' : 'rgba(255,110,180,.12)', border: '2px solid rgba(255,110,180,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginTop: -22, boxShadow: tab === n.id ? '0 0 24px rgba(255,110,180,.6)' : 'none', transition: 'all .25s' }}>
                  {n.icon}
                </div>
              ) : <span style={{ fontSize: 22 }}>{n.icon}</span>}
              <span style={{ fontSize: 9, fontWeight: 900, color: tab === n.id ? '#FF6EB4' : 'rgba(255,255,255,.3)', letterSpacing: .5 }}>{n.label}</span>
              {tab === n.id && !n.center && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: 2, background: '#FF6EB4' }} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════ HOME ══════════ */
function HomeTab({ state, onAddLove, onListMarket, onRemoveMarket, onNotify }: {
  state: GameState; onAddLove: (id: number) => void;
  onListMarket: (id: number, price: number) => void; onRemoveMarket: (id: number) => void; onNotify: (m: string) => void;
}) {
  const [cardIdx, setCardIdx] = useState(0);
  const [swipeX, setSwipeX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exitDir, setExitDir] = useState<'left' | 'right' | null>(null);
  const [entering, setEntering] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [priceInput, setPriceInput] = useState('50');
  const startX = useRef(0);
  const girls = state.girls;
  const girl = girls[cardIdx] ?? girls[0];
  const lovePct = girl ? Math.round((girl.love / girl.loveMax) * 100) : 0;
  const countdown = useCountdown(girl?.dateEndsAt ?? null);

  const animateTo = (dir: 'left' | 'right', newIdx: number) => {
    setExitDir(dir);
    setTimeout(() => { setCardIdx(newIdx); setSwipeX(0); setExitDir(null); setEntering(true); setTimeout(() => setEntering(false), 320); }, 280);
  };

  const onTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; setDragging(true); };
  const onTouchMove  = (e: React.TouchEvent) => { if (dragging) setSwipeX(e.touches[0].clientX - startX.current); };
  const onTouchEnd   = () => {
    setDragging(false);
    if (swipeX < -70 && cardIdx < girls.length - 1) animateTo('left', cardIdx + 1);
    else if (swipeX > 70 && cardIdx > 0) animateTo('right', cardIdx - 1);
    else setSwipeX(0);
  };

  const cardStyle: React.CSSProperties = {
    transform: exitDir === 'left'  ? 'translateX(-130%) rotate(-18deg)' :
               exitDir === 'right' ? 'translateX(130%)  rotate(18deg)'  :
               entering            ? 'translateX(0) scale(1)'           :
               `translateX(${swipeX}px) rotate(${swipeX * 0.04}deg)`,
    transition: (exitDir || entering) ? 'transform .28s cubic-bezier(.4,0,.2,1)' : dragging ? 'none' : 'transform .25s ease',
    opacity: exitDir ? 0 : 1,
  };

  if (!girl) return null;
  const rc = RC[girl.rarity];

  return (
    <div style={{ padding: '4px 16px 0' }}>
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,.78)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#13082a', border: '1px solid rgba(255,110,180,.25)', borderRadius: '24px 24px 0 0', padding: 24, width: '100%', maxWidth: 480 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 6 }}>Выставить на рынок</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 16 }}>{girl.name} · {girl.rarity}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginBottom: 8, fontWeight: 700 }}>Цена (❤️):</div>
            <input type="number" value={priceInput} onChange={e => setPriceInput(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,110,180,.25)', borderRadius: 14, padding: '12px 16px', fontSize: 20, fontWeight: 900, color: '#fff', outline: 'none', marginBottom: 16, boxSizing: 'border-box' }} />
            <button onClick={() => { onListMarket(girl.id, Number(priceInput) || 50); setShowModal(false); }}
              style={{ width: '100%', padding: 14, borderRadius: 16, border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 15, background: 'linear-gradient(135deg,#FF6EB4,#9B59D4)', color: '#fff' }}>
              Выставить
            </button>
          </div>
        </div>
      )}

      {/* Карточка */}
      <div style={{ ...cardStyle, position: 'relative', userSelect: 'none' }}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>

        {/* Свайп-хинты */}
        {swipeX > 40 && <div style={{ position: 'absolute', top: '38%', left: 16, zIndex: 10, fontSize: 48, opacity: Math.min(swipeX / 90, 1), transition: 'opacity .1s' }}>❤️</div>}
        {swipeX < -40 && <div style={{ position: 'absolute', top: '38%', right: 16, zIndex: 10, fontSize: 48, opacity: Math.min(-swipeX / 90, 1), transition: 'opacity .1s' }}>💨</div>}

        <div style={{ borderRadius: 24, overflow: 'hidden', border: `2px solid ${rc.border}`, background: 'rgba(255,255,255,.03)', boxShadow: `0 24px 64px rgba(0,0,0,.7), 0 0 50px ${rc.glow}`, position: 'relative' }}>
          {/* Badges */}
          <div style={{ position: 'absolute', top: 12, left: 14, zIndex: 5, fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,.8)', background: 'rgba(0,0,0,.45)', borderRadius: 8, padding: '3px 8px' }}>LVL {girl.level}</div>
          <div style={{ position: 'absolute', top: 12, right: 14, zIndex: 5, fontSize: 11, fontWeight: 900, color: rc.text, background: rc.bg, border: `1px solid ${rc.border}`, borderRadius: 8, padding: '3px 8px', letterSpacing: 1 }}>{girl.rarity}</div>
          {girl.onMarket && <div style={{ position: 'absolute', top: 42, right: 14, zIndex: 5, fontSize: 10, fontWeight: 900, color: '#FBBF24', background: 'rgba(251,191,36,.15)', border: '1px solid rgba(251,191,36,.35)', borderRadius: 8, padding: '3px 8px' }}>🛒 НА РЫНКЕ</div>}

          {/* Оверлей свидания */}
          {girl.onDate && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 8, background: 'rgba(10,4,22,.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <span style={{ fontSize: 64, animation: 'pulse 1.5s ease-in-out infinite' }}>💕</span>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#FF6EB4' }}>НА СВИДАНИИ</div>
              {countdown && <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: 3, fontVariantNumeric: 'tabular-nums' }}>{countdown}</div>}
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>Вернётся скоро...</div>
            </div>
          )}

          <img src={girl.img} alt={girl.name} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />

          {/* Love bar */}
          {!girl.onDate && (
            <div style={{ position: 'absolute', bottom: 54, left: 14, right: 14, zIndex: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.75)' }}>❤️ Любовь</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#FF6EB4' }}>{lovePct}%</span>
              </div>
              <div style={{ height: 9, background: 'rgba(0,0,0,.4)', borderRadius: 99, overflow: 'hidden', border: '1px solid rgba(255,110,180,.2)' }}>
                <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#FF6EB4,#9B59D4)', width: `${lovePct}%`, transition: 'width .5s cubic-bezier(.34,1.56,.64,1)' }} />
              </div>
              {lovePct >= 90 && <div style={{ textAlign: 'center', fontSize: 11, color: '#FF6EB4', fontWeight: 900, marginTop: 4 }}>💕 Ещё одно нажатие → свидание!</div>}
            </div>
          )}

          {/* Name plate */}
          <div style={{ background: 'rgba(255,255,255,.95)', padding: '10px 14px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#1a0835', letterSpacing: .5 }}>{girl.name}</div>
            <div style={{ fontSize: 10, color: '#888', fontWeight: 700, marginTop: 1 }}>{girl.subname}</div>
          </div>
        </div>
      </div>

      {/* Dots */}
      {girls.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          {girls.map((_, i) => (
            <div key={i} onClick={() => animateTo(i > cardIdx ? 'left' : 'right', i)}
              style={{ width: i === cardIdx ? 20 : 6, height: 6, borderRadius: 3, background: i === cardIdx ? '#FF6EB4' : 'rgba(255,255,255,.2)', cursor: 'pointer', transition: 'all .3s' }} />
          ))}
        </div>
      )}

      {/* Actions */}
      {!girl.onDate && (
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button onClick={() => onAddLove(girl.id)}
            style={{ flex: 2, padding: 14, borderRadius: 18, border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 15, background: 'linear-gradient(135deg,#FF6EB4,#e91e8c)', color: '#fff', boxShadow: '0 4px 20px rgba(255,110,180,.4)', transition: 'transform .15s' }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(.96)')} onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}>
            ❤️ +Любовь ({lovePct}%)
          </button>
          {!girl.onMarket
            ? <button onClick={() => setShowModal(true)} style={{ flex: 1, padding: 14, borderRadius: 18, border: '1px solid rgba(255,255,255,.12)', cursor: 'pointer', fontWeight: 900, fontSize: 13, background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.7)' }}>🛒 Рынок</button>
            : <button onClick={() => onRemoveMarket(girl.id)} style={{ flex: 1, padding: 14, borderRadius: 18, border: '1px solid rgba(251,191,36,.3)', cursor: 'pointer', fontWeight: 900, fontSize: 11, background: 'rgba(251,191,36,.06)', color: '#FBBF24' }}>❌ Снять</button>
          }
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}`}</style>
    </div>
  );
}

/* ══════════ MARKET ══════════ */
function MarketTab({ state, marketGirls, onBuy, onListMarket, onRemoveMarket, onNotify }: {
  state: GameState; marketGirls: Girl[]; onBuy: (g: Girl) => void;
  onListMarket: (id: number, price: number) => void; onRemoveMarket: (id: number) => void; onNotify: (m: string) => void;
}) {
  const [sub, setSub] = useState<'buy' | 'sell'>('buy');
  const forSale = [...marketGirls, ...state.girls.filter(g => g.onMarket && g.owner !== state.username)];
  const mine    = state.girls.filter(g => g.onMarket);

  return (
    <div style={{ padding: '12px 16px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, background: 'linear-gradient(135deg,#FF6EB4,#ff9cee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 4px' }}>Рынок</h2>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', margin: '0 0 14px' }}>Покупай и выставляй девочек</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['buy','sell'] as const).map(t => (
          <button key={t} onClick={() => setSub(t)} style={{ flex: 1, padding: 9, borderRadius: 14, border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 13, background: sub === t ? 'linear-gradient(135deg,#FF6EB4,#9B59D4)' : 'rgba(255,255,255,.06)', color: sub === t ? '#fff' : 'rgba(255,255,255,.4)', transition: 'all .2s' }}>
            {t === 'buy' ? '🛒 Купить' : '💰 Мои лоты'}
          </button>
        ))}
      </div>
      {sub === 'buy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {forSale.length === 0 && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: 14, padding: 40 }}>Пусто на рынке 🌸</div>}
          {forSale.map(girl => {
            const rc = RC[girl.rarity]; const isMine = girl.owner === state.username;
            return (
              <div key={girl.id} style={{ display: 'flex', gap: 12, background: 'rgba(255,255,255,.04)', border: `1px solid ${rc.border}`, borderRadius: 20, overflow: 'hidden' }}>
                <img src={girl.img} alt="" style={{ width: 80, height: 100, objectFit: 'cover', objectPosition: 'top', flexShrink: 0 }} />
                <div style={{ flex: 1, padding: '12px 12px 12px 0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: rc.text, letterSpacing: 1 }}>{girl.rarity} · LVL {girl.level}</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', marginTop: 2 }}>{girl.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>от {girl.owner}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#f472b6' }}>❤️ {girl.marketPrice}</div>
                    {isMine
                      ? <button onClick={() => onRemoveMarket(girl.id)} style={{ padding: '7px 12px', borderRadius: 12, border: '1px solid rgba(251,191,36,.3)', background: 'rgba(251,191,36,.06)', cursor: 'pointer', fontWeight: 900, fontSize: 11, color: '#FBBF24' }}>Снять</button>
                      : <button onClick={() => onBuy(girl)} style={{ padding: '7px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 13, background: 'linear-gradient(135deg,#FF6EB4,#9B59D4)', color: '#fff' }}>Купить</button>
                    }
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {sub === 'sell' && (
        <div>
          {mine.length === 0 && (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.3)', padding: '30px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🌸</div>
              Нет активных лотов<br/><span style={{ fontSize: 12 }}>Выставь с главного экрана</span>
            </div>
          )}
          {mine.map(girl => {
            const rc = RC[girl.rarity];
            return (
              <div key={girl.id} style={{ display: 'flex', gap: 12, background: 'rgba(255,255,255,.04)', border: `1px solid ${rc.border}`, borderRadius: 20, overflow: 'hidden', marginBottom: 10 }}>
                <img src={girl.img} alt="" style={{ width: 72, height: 88, objectFit: 'cover', objectPosition: 'top', flexShrink: 0 }} />
                <div style={{ flex: 1, padding: '12px 12px 12px 0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: rc.text, letterSpacing: 1 }}>{girl.rarity} · LVL {girl.level}</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', marginTop: 2 }}>{girl.name}</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#f472b6', marginTop: 4 }}>❤️ {girl.marketPrice}</div>
                  </div>
                  <button onClick={() => onRemoveMarket(girl.id)} style={{ padding: '7px 14px', borderRadius: 12, border: '1px solid rgba(251,191,36,.3)', background: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 12, color: '#FBBF24', alignSelf: 'flex-start' }}>
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

/* ══════════ TOYS (MERGE) ══════════ */
function ToysTab({ state, onMerge, onNotify }: { state: GameState; onMerge: (a: number, b: number) => boolean; onNotify: (m: string) => void }) {
  const [slotA, setSlotA] = useState<Toy | null>(null);
  const [slotB, setSlotB] = useState<Toy | null>(null);
  const [mergeAnim, setMergeAnim] = useState(false);
  const [resultToy, setResultToy] = useState<Omit<Toy,'count'> | null>(null);

  const selectToy = (toy: Toy) => {
    if (!slotA) { setSlotA(toy); return; }
    if (slotA.id === toy.id) { setSlotA(null); return; }
    if (!slotB) { setSlotB(toy); return; }
    setSlotB(toy);
  };

  const doMerge = () => {
    if (!slotA || !slotB) { onNotify('⚠️ Выбери 2 предмета!'); return; }
    const recipe = RECIPES.find(([a,b]) => (a===slotA.id&&b===slotB.id)||(a===slotB.id&&b===slotA.id));
    if (!recipe) { onNotify('❌ Эти предметы не скрещиваются!'); return; }
    const res = ALL_TOYS.find(t => t.id === recipe[2]);
    if (!res) return;

    setMergeAnim(true);
    setTimeout(() => {
      const ok = onMerge(slotA.id, slotB.id);
      if (ok) { setResultToy(res); onNotify(`✨ Получено: ${res.emoji} ${res.name}!`); }
      setSlotA(null); setSlotB(null); setMergeAnim(false);
    }, 700);
  };

  const canMerge = slotA && slotB && RECIPES.some(([a,b]) => (a===slotA.id&&b===slotB.id)||(a===slotB.id&&b===slotA.id));
  const rc = (r: string) => RC[r] || RC.COMMON;

  return (
    <div style={{ padding: '12px 16px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, background: 'linear-gradient(135deg,#67E8F9,#C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 2px' }}>Игрушки</h2>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', margin: '0 0 16px' }}>Скрещивай предметы → получай редкие</p>

      {/* Merge arena */}
      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 22, padding: '18px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>

          {/* Slot A */}
          <div onClick={() => slotA && setSlotA(null)}
            style={{ width: 80, height: 80, borderRadius: 20, border: `2px dashed ${slotA ? rc(slotA.rarity).border : 'rgba(255,255,255,.15)'}`, background: slotA ? rc(slotA.rarity).bg : 'rgba(255,255,255,.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: slotA ? 'pointer' : 'default', transition: 'all .25s', boxShadow: slotA ? `0 0 20px ${rc(slotA.rarity).glow}` : 'none' }}>
            {slotA ? (
              <><span style={{ fontSize: 36 }}>{slotA.emoji}</span><span style={{ fontSize: 9, color: 'rgba(255,255,255,.5)', fontWeight: 800 }}>{slotA.name}</span></>
            ) : <span style={{ fontSize: 28, opacity: .3 }}>?</span>}
          </div>

          {/* Plus / result */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 22, color: canMerge ? '#FF6EB4' : 'rgba(255,255,255,.2)', transition: 'color .3s' }}>✕</div>
            {resultToy && <div style={{ fontSize: 11, color: '#FF6EB4', fontWeight: 800, textAlign: 'center', animation: 'fadeUp .4s ease' }}>{resultToy.emoji}<br/>{resultToy.name}</div>}
          </div>

          {/* Slot B */}
          <div onClick={() => slotB && setSlotB(null)}
            style={{ width: 80, height: 80, borderRadius: 20, border: `2px dashed ${slotB ? rc(slotB.rarity).border : 'rgba(255,255,255,.15)'}`, background: slotB ? rc(slotB.rarity).bg : 'rgba(255,255,255,.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: slotB ? 'pointer' : 'default', transition: 'all .25s', boxShadow: slotB ? `0 0 20px ${rc(slotB.rarity).glow}` : 'none' }}>
            {slotB ? (
              <><span style={{ fontSize: 36 }}>{slotB.emoji}</span><span style={{ fontSize: 9, color: 'rgba(255,255,255,.5)', fontWeight: 800 }}>{slotB.name}</span></>
            ) : <span style={{ fontSize: 28, opacity: .3 }}>?</span>}
          </div>
        </div>

        <button onClick={doMerge} disabled={!canMerge}
          style={{ width: '100%', padding: '13px', borderRadius: 16, border: 'none', cursor: canMerge ? 'pointer' : 'not-allowed', fontWeight: 900, fontSize: 15, background: canMerge ? 'linear-gradient(135deg,#FF6EB4,#9B59D4)' : 'rgba(255,255,255,.06)', color: canMerge ? '#fff' : 'rgba(255,255,255,.25)', transition: 'all .25s', transform: mergeAnim ? 'scale(1.05)' : 'scale(1)', boxShadow: canMerge ? '0 4px 20px rgba(255,110,180,.35)' : 'none' }}>
          {mergeAnim ? '✨ Скрещивание...' : canMerge ? '🔀 Скрестить!' : 'Выбери 2 предмета ниже'}
        </button>
        {!canMerge && slotA && slotB && <div style={{ textAlign: 'center', fontSize: 11, color: '#F87171', marginTop: 6, fontWeight: 700 }}>Нет рецепта для этих предметов</div>}
      </div>

      {/* Инвентарь */}
      <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,.4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Мои предметы · {state.toys.length} видов</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {state.toys.map(toy => {
          const r = rc(toy.rarity);
          const selected = slotA?.id === toy.id || slotB?.id === toy.id;
          return (
            <div key={toy.id} onClick={() => selectToy(toy)}
              style={{ background: selected ? r.bg : 'rgba(255,255,255,.04)', border: `2px solid ${selected ? r.border : 'rgba(255,255,255,.08)'}`, borderRadius: 16, padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', transition: 'all .2s', boxShadow: selected ? `0 0 16px ${r.glow}` : 'none', position: 'relative' }}>
              <span style={{ fontSize: 32 }}>{toy.emoji}</span>
              <span style={{ fontSize: 10, fontWeight: 900, color: '#fff', textAlign: 'center', lineHeight: 1.2 }}>{toy.name}</span>
              <span style={{ fontSize: 9, fontWeight: 800, color: r.text }}>{toy.rarity}</span>
              <div style={{ position: 'absolute', top: 6, right: 8, fontSize: 10, fontWeight: 900, color: '#fff', background: 'rgba(255,110,180,.5)', borderRadius: 8, padding: '1px 5px' }}>×{toy.count}</div>
              {selected && <div style={{ position: 'absolute', bottom: 4, fontSize: 12 }}>✓</div>}
            </div>
          );
        })}
        {state.toys.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'rgba(255,255,255,.3)', padding: 30, fontSize: 14 }}>🧸 Нет предметов</div>}
      </div>

      {/* Рецепты-подсказки */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,.4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Рецепты скрещивания</div>
        {RECIPES.map(([a,b,res]) => {
          const ta = ALL_TOYS.find(t=>t.id===a); const tb = ALL_TOYS.find(t=>t.id===b); const tr = ALL_TOYS.find(t=>t.id===res);
          if (!ta||!tb||!tr) return null;
          const haveA = state.toys.some(t=>t.id===a); const haveB = state.toys.some(t=>t.id===b);
          return (
            <div key={`${a}${b}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(255,255,255,.03)', borderRadius: 12, marginBottom: 6, opacity: (haveA&&haveB) ? 1 : 0.45 }}>
              <span style={{ fontSize: 20 }}>{ta.emoji}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>+</span>
              <span style={{ fontSize: 20 }}>{tb.emoji}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>→</span>
              <span style={{ fontSize: 20 }}>{tr.emoji}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', fontWeight: 700 }}>{tr.name}</span>
              <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 800, color: RC[tr.rarity].text }}>{tr.rarity}</span>
            </div>
          );
        })}
      </div>

      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

/* ══════════ QUESTS ══════════ */
function QuestsTab({ completedQuests, mergeCount, toyCount, uniqueToyCount }: { completedQuests: number[]; mergeCount: number; toyCount: number; uniqueToyCount: number }) {
  return (
    <div style={{ padding: '12px 16px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: '#FBBF24', margin: '0 0 4px' }}>Задания</h2>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', margin: '0 0 16px' }}>Скрещивай игрушки → получай девочек</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {MERGE_QUESTS.map(q => {
          const done = completedQuests.includes(q.id);
          return (
            <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: done ? 'rgba(255,215,0,.06)' : 'rgba(255,255,255,.04)', border: `1px solid ${done ? 'rgba(255,215,0,.25)' : 'rgba(255,255,255,.08)'}`, borderRadius: 18, padding: '14px 16px', opacity: done ? .6 : 1 }}>
              <span style={{ fontSize: 32 }}>{done ? '✅' : q.girlReward ? '🎀' : '🧸'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{q.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>{q.desc}</div>
                <div style={{ fontSize: 12, fontWeight: 800, marginTop: 4, color: q.girlReward ? '#FF6EB4' : '#FBBF24' }}>
                  {q.girlReward ? '🌸 Награда: новая девочка!' : `❤️ +${q.amount} сердец`}
                </div>
              </div>
              {!done && (
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', fontWeight: 800, textAlign: 'right', minWidth: 44 }}>
                  {q.req === 'any' && `${Math.min(mergeCount,q.count)}/${q.count}`}
                  {q.req === 'collect' && `${Math.min(uniqueToyCount,q.count)}/${q.count}`}
                  {(Array.isArray(q.req)||q.req==='legendary') && 'авто'}
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
function GalleryTab({ items, likedItems, onLike }: { items: typeof GALLERY; likedItems: number[]; onLike: (id: number) => void }) {
  return (
    <div style={{ padding: '12px 16px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, background: 'linear-gradient(135deg,#FF6EB4,#ff9cee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 4px' }}>Галерея</h2>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', margin: '0 0 16px' }}>Аниме-артефакты сообщества</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {items.map(item => (
          <div key={item.id} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ height: 100, background: 'linear-gradient(135deg,rgba(255,110,180,.1),rgba(155,89,212,.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>{item.emoji}</div>
            <div style={{ padding: '8px 10px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,.3)' }}>{item.likes + (likedItems.includes(item.id) ? 1 : 0)} лайков</span>
                <button onClick={() => onLike(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, transition: 'transform .15s', transform: likedItems.includes(item.id) ? 'scale(1.2)' : 'scale(1)' }}>
                  {likedItems.includes(item.id) ? '💖' : '🤍'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}