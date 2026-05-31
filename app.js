const MARKET_OPEN_HOUR = 9;
const MARKET_HOURS = 10;
const PROFILE_KEY = 'humanStockProfile';
const LISTING_PRICE = 15000;
const MIN_PRICE = 30;

function priceFromChange(chg) {
  return Math.round(LISTING_PRICE * (1 + chg / 100));
}


let tvChart = null;
let candleSeries = null;
let fvSeries = null;
let eventMarkers = [];

const state = {
  cash: 10000000,
  crew: '바이브 크루',
  selected: 0,
  portfolio: 1248000,
  commentTag: '응원',
  latestDisclosure: null,
  latestVerification: null,
  ammSide: 'buy'
};

const baseStocks = [
  {
    name: '승화',
    ticker: 'SHWA',
    goal: '창업 프로젝트',
    intro: 'AI 창업 프로젝트를 매일 진척시키는 사람',
    risk: '균형형',
    price: priceFromChange(8.6),
    fv: priceFromChange(10.1),
    chg: 8.6,
    emoji: '🚀',
    color: '#3182f6',
    proofsToday: 2,
    strikes: 0,
    riseChance: 74,
    signal: 'buy',
    reason: '실행 난이도 높고 목표 정렬도가 매우 높아 AI 적정가가 시장가보다 높게 산정됐어.',
    proofLog: ['09:20 PRD 핵심 플로우 정리', '18:40 MVP 기능명세 v5 확정'],
    fvHistory: [-1.4, 0.2, 1.4, 3.0, 5.8, 7.1, 8.6],
    comments: [
      { tag: '매수중', name: '다원', text: '오늘 인증 퀄리티 좋다. 나 mock 매수 들어감.' },
      { tag: '응원', name: '민준', text: '창업 섹터 대장주 느낌 🚀' }
    ]
  },
  {
    name: '민준',
    ticker: 'MJUN',
    goal: '운동 루틴',
    intro: '꾸준히 운동 루틴을 쌓는 종목',
    risk: '안정형',
    price: priceFromChange(-3.2),
    fv: priceFromChange(-4.8),
    chg: -3.2,
    emoji: '🏋️',
    color: '#16a34a',
    proofsToday: 0,
    strikes: 2,
    riseChance: 38,
    signal: 'risk',
    reason: '최근 인증 공백이 있어 FV가 점진 감쇠 중이야. 3-strike 중 2개가 쌓여 위험 신호가 켜졌어.',
    proofLog: ['오늘 인증 없음 · 2일 연속 공백'],
    fvHistory: [0.3, -0.4, -1.1, -1.8, -2.4, -2.9, -3.2],
    comments: [{ tag: '주의', name: '승화', text: '오늘은 짧게라도 인증하면 상폐 리스크 줄 듯.' }]
  },
  {
    name: '다원',
    ticker: 'DAWN',
    goal: '디자인 포트폴리오',
    intro: '디자인 산출물을 꾸준히 만드는 종목',
    risk: '공격형',
    price: priceFromChange(5.1),
    fv: priceFromChange(6.0),
    chg: 5.1,
    emoji: '🎨',
    color: '#7c3aed',
    proofsToday: 1,
    strikes: 0,
    riseChance: 68,
    signal: 'buy',
    reason: '연속 작업 인증과 크루 평가가 좋아 시장가와 FV가 함께 상승 중이야.',
    proofLog: ['16:10 랜딩페이지 시안 3장 업로드'],
    fvHistory: [-0.6, 0.4, 1.0, 2.2, 3.4, 4.3, 5.1],
    comments: [{ tag: '응원', name: '지후', text: '시안 발전 속도 미쳤다.' }]
  },
  {
    name: '지후',
    ticker: 'JHOO',
    goal: '시험 공부',
    intro: '시험 대비 학습량을 주가로 만드는 종목',
    risk: '균형형',
    price: priceFromChange(1.4),
    fv: priceFromChange(2.6),
    chg: 1.4,
    emoji: '📚',
    color: '#f59e0b',
    proofsToday: 1,
    strikes: 1,
    riseChance: 57,
    signal: 'watch',
    reason: '목표 정렬도는 높지만 난이도 자기신고와 AI 기준선 차이가 있어 일부 보류됐어.',
    proofLog: ['21:00 수학 오답노트 12문제'],
    fvHistory: [-0.8, -0.2, 0.3, 0.1, 0.8, 1.1, 1.4],
    comments: [{ tag: '응원', name: '승화', text: '오답노트면 FV 오를 만하지.' }]
  },
  {
    name: '서윤',
    ticker: 'SYUN',
    goal: '콘텐츠 업로드',
    intro: '콘텐츠 업로드 루틴을 시장이 평가하는 종목',
    risk: '공격형',
    price: priceFromChange(-5.8),
    fv: priceFromChange(-6.8),
    chg: -5.8,
    emoji: '🎬',
    color: '#0ea5e9',
    proofsToday: 0,
    strikes: 1,
    riseChance: 31,
    signal: 'risk',
    reason: '업로드 예고 후 결과 인증이 없어 시장 신뢰가 약해졌어. 오늘 인증 없으면 strike가 추가될 수 있어.',
    proofLog: ['오늘 인증 없음 · 예고 공시만 존재'],
    fvHistory: [-1.1, -1.8, -2.5, -3.3, -4.2, -5.0, -5.8],
    comments: [{ tag: '주의', name: '다원', text: '예고보다 결과물이 필요해 보여.' }]
  }
];

const stocks = baseStocks.map(seedStock);

let news = [
  {
    type: 'good',
    title: '[공시] 승화, 기능명세 v5 확정',
    body: '창업 프로젝트 섹터에 강한 호재. AI는 목표 정렬도 96점을 부여했다. 예상 FV +6.4%'
  },
  {
    type: 'bad',
    title: '[속보] 민준, 이틀 연속 운동 인증 누락',
    body: '체력 섹터 신뢰도 약화. 폭락 대신 감쇠 룰이 적용된다. 예상 FV -2.8%'
  },
  { type: 'good', title: '[속보] 작성자 쾌변 성공', body: '체내 잉여 리스크 해소로 펀더멘털 강화. 위장 건강 섹터 전반 호재.' },
  { type: 'bad', title: '[속보] 점심 마라탕 후루룩', body: '위장 건강 적신호. 오후 생산성 리스크 확대. 단기 변동성 주의.' }
];

function seedStock(s) {
  const listingPrice = LISTING_PRICE;
  const historySeed = s.fvHistory && Math.max(...s.fvHistory.map(Number)) < 1000 ? s.fvHistory : [-1.6, -0.7, 0.8, 1.6, 2.4, 3.2, s.chg || 0];
  const history = historySeed.map((v, i) => ({
    t: i * 90,
    price: Math.round(listingPrice * (1 + Number(v) / 100)),
    event: i === 0 ? 'open' : 'tick',
    label: i === 0 ? '시가' : '틱',
    reason: i === 0 ? '고정 상장가 15,000 PEL' : '등락률 반영 가격 추적'
  }));
  const achievementScore = Math.min(100, 42 + s.proofsToday * 14 - s.strikes * 10 + (s.signal === 'buy' ? 12 : 0));
  const goalBaseline = 55;
  const oracleConfidence = 0.64;
  return {
    ...s,
    listingPrice,
    openPrice: listingPrice,
    prevClose: listingPrice,
    priceHistory: history,
    eventLog: [{ time: '상장', type: 'open', label: '상장가', delta: 0, price: listingPrice, reason: '모든 크루 종목은 15,000 PEL로 동일 상장' }],
    tmiHeat: Math.min(90, 28 + s.comments.length * 9),
    achievementScore,
    goalBaseline,
    streakDays: Math.min(7, 1 + s.proofsToday),
    milestoneStage: Math.floor(achievementScore / 25),
    inactiveHours: Math.max(0, (2 - s.proofsToday) * 6),
    oracleConfidence,
    fvDailyCap: 0.12,
    fvFloorPrice: Math.max(MIN_PRICE, listingPrice * 0.72),
    lastSettlement: null,
    amm: {
      supply: 900 + Math.round(s.price / 10),
      curveBase: Number((Math.max(MIN_PRICE, s.fv * 0.82)).toFixed(2)),
      liquidity: 2400000
    }
  };
}

function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function applyProfile() {
  const p = loadProfile();
  if (!p) return false;
  Object.assign(stocks[0], {
    name: p.name,
    ticker: p.ticker,
    goal: p.goal,
    intro: p.intro,
    risk: p.risk,
    listingPrice: LISTING_PRICE,
    price: priceFromChange(p.chg || 0),
    fv: p.fv && p.fv > 1000 ? p.fv : Math.round(LISTING_PRICE * 1.08),
    openPrice: LISTING_PRICE,
    prevClose: LISTING_PRICE,
    chg: p.chg || 0
  });
  if (p.priceHistory && p.priceHistory.every((row) => row.price > 1000)) stocks[0].priceHistory = p.priceHistory;
  if (p.eventLog && p.eventLog.every((row) => row.price > 1000)) stocks[0].eventLog = p.eventLog;
  if (p.achievementScore) stocks[0].achievementScore = p.achievementScore;
  if (p.goalBaseline) stocks[0].goalBaseline = p.goalBaseline;
  if (p.streakDays) stocks[0].streakDays = p.streakDays;
  if (p.milestoneStage !== undefined) stocks[0].milestoneStage = p.milestoneStage;
  if (p.inactiveHours !== undefined) stocks[0].inactiveHours = p.inactiveHours;
  if (p.oracleConfidence) stocks[0].oracleConfidence = p.oracleConfidence;
  if (p.amm) stocks[0].amm = p.amm;
  state.crew = p.crew || state.crew;
  return true;
}

function pel(n) {
  return `${Math.round(n).toLocaleString('ko-KR')} PEL`;
}

function pct(n) {
  return `${n >= 0 ? '+' : ''}${Number(n).toFixed(1)}%`;
}

function nowLabel() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function marketClock() {
  const now = new Date();
  const open = new Date(now);
  open.setHours(MARKET_OPEN_HOUR, 0, 0, 0);
  const close = new Date(open);
  close.setHours(MARKET_OPEN_HOUR + MARKET_HOURS, 0, 0, 0);
  const isOpen = now >= open && now < close;
  const total = MARKET_HOURS * 60 * 60 * 1000;
  const progress = Math.max(0, Math.min(1, (now - open) / total));
  return {
    isOpen,
    progress,
    open,
    close,
    text: isOpen
      ? `장 진행 ${(progress * 100).toFixed(0)}% · ${MARKET_OPEN_HOUR}:00~${MARKET_OPEN_HOUR + MARKET_HOURS}:00`
      : '장 마감 · 다음 장 시작가에 성과 갭 반영'
  };
}

function go(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'home') renderHome();
  if (id === 'news') renderNews();
  if (id === 'leaderboard') renderRank();
  if (id === 'proof') updateProofPreview();
  if (id === 'my') renderMy();
}

function startCrew() {
  const existing = loadProfile();
  if (existing) {
    alert('이미 최초 상장이 완료됐어. 시즌 중에는 수정할 수 없어.');
    applyProfile();
    go('home');
    return;
  }
  const price = LISTING_PRICE;
  const profile = {
    name: document.getElementById('myName').value || '내 종목',
    ticker: (document.getElementById('myTicker').value || 'ME').toUpperCase(),
    intro: '프로필 설정에서 소개를 입력해요',
    goal: '성장 루틴',
    price,
    fv: Math.round(price * 1.08),
    openPrice: price,
    prevClose: price,
    risk: '균형형',
    crew: '크루 미설정',
    priceHistory: [{ t: 0, price, event: 'open', label: '상장가', reason: '모든 유저 공통 상장가 15,000 PEL' }],
    eventLog: [{ time: nowLabel(), type: 'open', label: '상장', delta: 0, price, reason: '모든 유저는 15,000 PEL로 고정 상장' }],
    achievementScore: 52,
    goalBaseline: 55,
    streakDays: 1,
    milestoneStage: 2,
    inactiveHours: 0,
    oracleConfidence: 0.62,
    fvDailyCap: 0.12,
    fvFloorPrice: Math.max(MIN_PRICE, price * 0.72),
    amm: { supply: 900 + Math.round(price / 10), curveBase: Number((price * 0.9).toFixed(2)), liquidity: 2400000 }
  };
  saveProfile(profile);
  applyProfile();
  lockProfileUI();
  const crewCard = document.getElementById('crewSetupCard');
  if (crewCard) crewCard.hidden = false;
}

function createCrew() {
  const p = loadProfile();
  if (!p) {
    alert('먼저 내 종목을 만들어줘.');
    return;
  }
  p.intro = document.getElementById('myIntro').value || '나를 성장시키는 종목';
  p.crew = document.getElementById('crewNameInput').value || '바이브 크루';
  saveProfile(p);
  applyProfile();
  go('home');
}

function resetMyStock() {
  if (confirm('데모 초기화할까? 실제 서비스에서는 시즌 중 수정 불가야.')) {
    localStorage.removeItem(PROFILE_KEY);
    location.reload();
  }
}

function lockProfileUI() {
  const p = loadProfile();
  if (!p) return;
  ['myName', 'myTicker'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = true;
  });
  const n = document.getElementById('profileLockNotice');
  if (n) n.textContent = `${p.ticker} 최초 상장 완료 · 시즌 중 수정 불가`;
  const btn = document.querySelector('#profileSetupCard .primary');
  if (btn) btn.textContent = '내 종목 생성 완료';
  const crewCard = document.getElementById('crewSetupCard');
  if (crewCard) crewCard.hidden = false;
}

function renderMy() {
  const p = loadProfile();
  if (!p) {
    go('onboarding');
    return;
  }
  const mine = stocks[0];
  const gapRate = ((mine.fv - mine.price) / Math.max(1, mine.price)) * 100;
  const [, signalLabel] = signalText(mine);
  document.getElementById('myStockName').textContent = `${p.name} 주식`;
  document.getElementById('myStockTicker').textContent = p.ticker;
  document.getElementById('myCurrentPrice').textContent = pel(mine.price);
  document.getElementById('myChangeRate').textContent = pct(mine.chg);
  document.getElementById('myChangeRate').className = mine.chg >= 0 ? 'up' : 'down';
  document.getElementById('myFairValue').textContent = pel(mine.fv);
  document.getElementById('myGapRate').textContent = pct(gapRate);
  document.getElementById('myCashBalance').textContent = pel(state.cash);
  document.getElementById('mySignalText').textContent = signalLabel;
  document.getElementById('myGoalText').textContent = mine.goal;
  document.getElementById('myProofText').textContent = `${mine.proofsToday}건 · streak ${mine.streakDays}일`;
  document.getElementById('myCrewText').textContent = p.crew || state.crew || '바이브 크루';
  document.getElementById('myProfileIntro').value = p.intro || '';
  document.getElementById('myCrewName').value = p.crew || state.crew || '바이브 크루';
  document.getElementById('myCrewMembers').textContent = `${Math.max(3, Math.min(30, stocks.length))}명`;
  document.getElementById('myInviteCode').textContent = `${(p.ticker || 'CREW').slice(0, 4)}-${String((p.name || '나').length * 37).padStart(3, '0')}`.toUpperCase();
}

function saveMyProfile() {
  const p = loadProfile();
  if (!p) return;
  p.intro = document.getElementById('myProfileIntro').value || '나를 성장시키는 종목';
  saveProfile(p);
  applyProfile();
  alert('프로필 소개를 저장했어.');
}

function saveCrewSettings() {
  const p = loadProfile();
  if (!p) return;
  p.crew = document.getElementById('myCrewName').value || '바이브 크루';
  state.crew = p.crew;
  saveProfile(p);
  renderHome();
  alert('크루 설정을 저장했어.');
}

function copyInviteCode() {
  const code = document.getElementById('myInviteCode').textContent;
  if (navigator.clipboard) navigator.clipboard.writeText(code);
  alert(`초대 코드 ${code}를 복사했어.`);
}

function persistMine() {
  const p = loadProfile();
  if (!p) return;
  Object.assign(p, {
    name: stocks[0].name,
    ticker: stocks[0].ticker,
    intro: stocks[0].intro,
    goal: stocks[0].goal,
    risk: stocks[0].risk,
    price: stocks[0].price,
    fv: stocks[0].fv,
    openPrice: stocks[0].openPrice,
    prevClose: stocks[0].prevClose,
    priceHistory: stocks[0].priceHistory,
    eventLog: stocks[0].eventLog,
    crew: state.crew,
    achievementScore: stocks[0].achievementScore,
    goalBaseline: stocks[0].goalBaseline,
    streakDays: stocks[0].streakDays,
    milestoneStage: stocks[0].milestoneStage,
    inactiveHours: stocks[0].inactiveHours,
    oracleConfidence: stocks[0].oracleConfidence,
    fvDailyCap: stocks[0].fvDailyCap,
    fvFloorPrice: stocks[0].fvFloorPrice,
    amm: stocks[0].amm
  });
  saveProfile(p);
}

function aiConfidence(s) {
  return Math.max(
    0.42,
    Math.min(
      0.96,
      s.oracleConfidence * 0.62 + (s.achievementScore / 100) * 0.38 + (s.signal === 'buy' ? 0.05 : s.signal === 'risk' ? -0.05 : 0)
    )
  );
}

function analysisLogs(s) {
  const conf = aiConfidence(s);
  const mood = s.signal === 'buy' ? '호재' : s.signal === 'risk' ? '악재' : '중립';
  const sector = s.goal.includes('운동')
    ? '체력 섹터'
    : s.goal.includes('창업')
      ? '창업 실행 섹터'
      : s.goal.includes('공부')
        ? '학습 섹터'
        : '생활 펀더멘털 섹터';
  return [
    `Achievement score ${Math.round(s.achievementScore)} / baseline ${Math.round(s.goalBaseline)} 정산 완료`,
    `FV 엔진: streak ${s.streakDays}일 · inactivity ${s.inactiveHours}h · oracle ${s.oracleConfidence.toFixed(2)}`,
    `TMI heat ${Math.round(s.tmiHeat)}는 시장가만 반영 (FV 영향 없음)`,
    `AI 판정: ${sector} ${mood} · 확신도 ${conf.toFixed(2)}`
  ];
}

function renderAIAnalyzer(s) {
  const logs = document.getElementById('analysisLogs');
  if (!logs) return;
  const conf = aiConfidence(s);
  const tone = s.signal === 'buy' ? 'good' : s.signal === 'risk' ? 'bad' : 'neutral';
  document.getElementById('confidenceBadge').textContent = `CONF ${conf.toFixed(2)}`;
  logs.innerHTML = analysisLogs(s)
    .map((l, i) => `<p><span>0${i + 1}</span>${l}</p>`)
    .join('');
  document.getElementById('verdictCard').innerHTML = `<span class="tag ${tone}">${
    tone === 'good' ? '호재' : tone === 'bad' ? '악재' : '중립'
  }</span><b>${s.name} ${tone === 'good' ? '펀더멘털 개선' : tone === 'bad' ? '단기 리스크 확대' : '추가 공시 대기'}</b><small>${s.reason}</small>`;
}

function computeFVSettlement(s) {
  const achievement = Math.max(20, Math.min(100, s.achievementScore));
  const baseline = Math.max(35, Math.min(90, s.goalBaseline));
  const baselineDiff = achievement - baseline;
  const streakBonus = Math.min(6, s.streakDays * 0.8);
  const milestoneJump = achievement >= 90 ? 4.5 : achievement >= 75 ? 2.2 : achievement >= 60 ? 0.8 : 0;
  const inactivityDecay = -Math.min(8, s.inactiveHours * 0.3 + s.strikes * 1.1);
  const oracleConfidence = Math.max(0.42, Math.min(0.96, s.oracleConfidence));
  const rawMove = baselineDiff * 0.22 + streakBonus + milestoneJump + inactivityDecay;
  const confidenceAdjusted = rawMove * oracleConfidence;
  const dailyCap = s.fvDailyCap || 0.12;
  const cappedMove = Math.max(-dailyCap * 100, Math.min(dailyCap * 100, confidenceAdjusted));
  const floorPrice = s.fvFloorPrice || Math.max(MIN_PRICE, s.price * 0.7);
  const preFloorFV = s.fv * (1 + cappedMove / 100);
  const finalFV = Math.max(floorPrice, preFloorFV);
  const finalMove = ((finalFV - s.fv) / s.fv) * 100;
  return {
    achievement,
    baseline,
    baselineDiff,
    streakBonus,
    milestoneJump,
    inactivityDecay,
    oracleConfidence,
    dailyCap,
    floorPrice,
    finalFV,
    finalMove
  };
}

function applyFVSettlement(s, reason) {
  const settlement = computeFVSettlement(s);
  s.lastSettlement = settlement;
  s.fv = Number(settlement.finalFV.toFixed(2));
  s.reason = reason || `FV 정산 반영 ${pct(settlement.finalMove)} · Achievement 중심 재평가 완료`;
  if (settlement.finalMove > 0.6) s.signal = 'buy';
  if (settlement.finalMove < -0.6) s.signal = 'risk';
}

function renderFVSettlement(s) {
  const box = document.getElementById('fvSettlementGrid');
  if (!box) return;
  const settlement = s.lastSettlement || computeFVSettlement(s);
  s.lastSettlement = settlement;
  const rows = [
    ['achievement score', `${Math.round(settlement.achievement)}점`],
    ['baseline comparison', `${settlement.baselineDiff >= 0 ? '+' : ''}${settlement.baselineDiff.toFixed(1)}점`],
    ['streak bonus', `${settlement.streakBonus >= 0 ? '+' : ''}${settlement.streakBonus.toFixed(1)}%p`],
    ['milestone jump', `${settlement.milestoneJump >= 0 ? '+' : ''}${settlement.milestoneJump.toFixed(1)}%p`],
    ['inactivity decay', `${settlement.inactivityDecay.toFixed(1)}%p`],
    ['oracle confidence', settlement.oracleConfidence.toFixed(2)],
    ['daily cap', `±${(settlement.dailyCap * 100).toFixed(1)}%`],
    ['floor price', `${settlement.floorPrice.toFixed(1)} PEL`],
    ['final FV move', `${pct(settlement.finalMove)} → FV ${settlement.finalFV.toFixed(1)}`]
  ];
  box.innerHTML = rows
    .map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`)
    .join('');
}

function renderDivergenceCard(s) {
  const gap = s.price - s.fv;
  const ratio = s.fv === 0 ? 0 : (gap / s.fv) * 100;
  const summary = document.getElementById('divergenceSummary');
  const tags = document.getElementById('divergenceTags');
  if (!summary || !tags) return;

  let valuation = '적정권';
  if (ratio > 8) valuation = '고평가';
  else if (ratio < -8) valuation = '저평가';

  const memePremium = Math.max(0, (s.tmiHeat - 45) * 0.17 + (s.comments.length - 1) * 0.8);
  const tagList = [];
  if (ratio > 8) tagList.push(`<span class="bad">overvalued ${ratio.toFixed(1)}%</span>`);
  if (ratio < -8) tagList.push(`<span class="good">undervalued ${Math.abs(ratio).toFixed(1)}%</span>`);
  tagList.push(`<span class="neutral">meme premium +${memePremium.toFixed(1)}%</span>`);

  summary.innerHTML = `<b>${valuation}</b><p>시장가 ${s.price.toFixed(1)} vs FV ${s.fv.toFixed(1)} · 괴리 ${pct(ratio)}</p>`;
  tags.innerHTML = tagList.join('');
}

function updateTickerTape() {
  const tape = document.getElementById('tickerTape');
  if (!tape) return;
  const latest = news[0];
  tape.textContent = `${latest.title} — ${latest.body}`;
}

function renderOdds(s) {
  const el = document.getElementById('oddsBoard');
  if (!el) return;
  const long = Math.max(18, Math.min(82, Math.round(s.riseChance)));
  const short = 100 - long;
  el.innerHTML = `<div><b>${long}%</b><span>LONG · 내일 성장</span></div><div><b>${short}%</b><span>SHORT · 컨디션 조정</span></div>`;
}

function challenge() {
  const arr = [
    '오늘 날짜 적은 메모와 함께 촬영하기',
    '왼손 엄지척과 결과물을 같이 찍기',
    '타이머 10분 화면과 작업물을 같이 찍기',
    '책/노트/운동기록을 시작-결과 2장으로 인증하기'
  ];
  return arr[Math.floor(Math.random() * arr.length)];
}

function stockButton(s, i, rankLabel = '') {
  return `<button class="stock-item" onclick="openStock(${i})"><div class="avatar" style="background:${s.color}">${rankLabel || s.emoji}</div><div class="stock-main"><b>${s.name} 주식</b><span>${s.ticker} · 상장가 15,000 PEL · ${s.goal}</span></div><div class="stock-price"><b>${s.price.toFixed(0)}</b><span class="${s.chg >= 0 ? 'up' : 'down'}">${pct(s.chg)}</span></div></button>`;
}

function renderHome() {
  document.getElementById('crewTitle').textContent = state.crew;
  document.getElementById('cash').textContent = pel(state.cash);
  document.getElementById('portfolioValue').textContent = pel(state.portfolio);
  const avg = stocks.reduce((a, s) => a + s.chg, 0) / stocks.length;
  const proofs = stocks.reduce((a, s) => a + s.proofsToday, 0);
  const risks = stocks.filter((s) => s.strikes > 0 || s.signal === 'risk').length;
  document.getElementById('avgChange').textContent = pct(avg);
  document.getElementById('activeProofs').textContent = `${proofs}건`;
  document.getElementById('riskCount').textContent = `${risks}명`;
  document.getElementById('marketMood').textContent = avg >= 2 ? '강세장' : avg >= 0 ? '혼조세' : '약세장';
  document.getElementById('headline').innerHTML = `${news[0].title}<br><span>${news[0].body}</span>`;
  updateTickerTape();
  const byUp = [...stocks].sort((a, b) => b.chg - a.chg).slice(0, 3);
  const byDown = [...stocks].sort((a, b) => a.chg - b.chg).slice(0, 3);
  document.getElementById('topGainers').innerHTML = byUp.map((s, r) => stockButton(s, stocks.indexOf(s), r + 1)).join('');
  document.getElementById('topLosers').innerHTML = byDown.map((s, r) => stockButton(s, stocks.indexOf(s), r + 1)).join('');
  const danger = byDown[0];
  document.getElementById('riskSummary').textContent = `${danger.name} ${danger.strikes}/3 strike · 장 마감 후 성과 없으면 다음 장 시작가가 약하게 열릴 수 있어.`;
  document.getElementById('stockList').innerHTML = stocks.map((s, i) => stockButton(s, i)).join('');
}

function signalText(s) {
  if (s.signal === 'buy') {
    return ['buy-signal', '매수 추천', 'Achievement 정산 기준 FV가 시장가보다 높아. TMI는 시장 변동만 키우고 FV는 안 건드려.'];
  }
  if (s.signal === 'risk') {
    return ['risk-signal', '위험 신호', '인증 공백/검증 리스크로 FV 감쇠가 발생했어. TMI 소음보다 성과 복구가 먼저야.'];
  }
  return ['watch-signal', '관망', '시장 반응은 있지만 Achievement 근거가 부족해. 다음 인증 검증 결과를 보자.'];
}

function openStock(i) {
  state.selected = i;
  const s = stocks[i];
  document.getElementById('detailName').textContent = `${s.name} 주식`;
  document.getElementById('marketPrice').textContent = s.price.toFixed(1);
  document.getElementById('fvPrice').textContent = s.fv.toFixed(1);

  const gap = s.fv - s.price;
  const gapEl = document.getElementById('priceGap');
  gapEl.classList.toggle('negative', gap < 0);
  gapEl.textContent =
    gap >= 0 ? `AI 기준 ${gap.toFixed(1)} 저평가 · 매수 관심` : `AI 기준 ${Math.abs(gap).toFixed(1)} 고평가 · 관망 필요`;

  const clk = marketClock();
  document.getElementById('marketSessionTitle').textContent = clk.isOpen ? '장 진행 중' : '장 마감';
  document.getElementById('marketSessionDesc').textContent = clk.text;

  const last = s.eventLog[0];
  document.getElementById('lastMoveLabel').textContent = last ? `${last.label} · ${last.reason}` : '이벤트 대기';

  const [klass, title, desc] = signalText(s);
  document.getElementById('signalCard').innerHTML = `<span class="signal ${klass}">${title}</span><h3>${s.ticker} AI 투자 의견</h3><p>${desc}</p>`;
  renderAIAnalyzer(s);
  renderOdds(s);
  renderFVSettlement(s);
  renderDivergenceCard(s);
  renderAMMCard(s);

  document.getElementById('aiReason').innerHTML = `<h3>AI 판단 이유</h3><p>${s.reason}</p>`;
  document.getElementById('riseChance').textContent = `${s.riseChance}%`;
  document.getElementById('chanceNeedle').style.transform = `rotate(${(s.riseChance - 50) * 1.8}deg)`;

  document.getElementById('strikeDots').innerHTML = [0, 1, 2].map((n) => `<i class="${n < s.strikes ? 'on' : ''}"></i>`).join('');
  document.getElementById('strikeText').textContent =
    s.strikes >= 3 ? '고위험' : s.strikes === 2 ? '주의 강화' : s.strikes === 1 ? '주의' : '안정';

  document.getElementById('proofCount').textContent = `${s.proofsToday}건`;
  document.getElementById('todayProofs').innerHTML = s.proofLog
    .map((p) => `<div><b>${p}</b><span>AI 신뢰도 반영 완료</span></div>`)
    .join('');

  drawChart(s);
  renderTimeline();
  renderComments();
  document.getElementById('betResult').textContent = '';
  go('detail');
}

function makeCandles(s) {
  const hist = s.priceHistory.slice(-36);
  return hist.map((h, i) => {
    const prev = i ? hist[i - 1].price : s.openPrice || h.price;
    const spread = Math.max(0.8, Math.abs(h.price - prev) * 0.7 + (i % 4) * 0.22);
    const open = Number(prev.toFixed(2));
    const close = Number(h.price.toFixed(2));
    const high = Number((Math.max(open, close) + spread).toFixed(2));
    const low = Number((Math.min(open, close) - spread * 0.82).toFixed(2));
    return { time: i + 1, open, high, low, close, event: h.event, label: h.label, reason: h.reason };
  });
}

function markerShape(event) {
  return event === 'sell' || event === 'bad' ? 'arrowDown' : 'arrowUp';
}

function markerColor(event) {
  return {
    buy: '#16a34a',
    sell: '#ef4444',
    good: '#2563eb',
    bad: '#dc2626',
    proof: '#3b82f6',
    comment: '#f59e0b',
    open: '#1e3a8a',
    gap: '#0284c7',
    neutral: '#64748b',
    amm: '#0ea5e9'
  }[event] || '#64748b';
}

function drawChart(s) {
  const el = document.getElementById('tvChart');
  if (!el) return;

  if (!window.LightweightCharts) {
    el.innerHTML = '<div class="chart-fallback">차트 라이브러리 로딩 중이야. 네트워크가 막히면 기본 차트로 대체돼.</div>';
    return;
  }

  if (!tvChart) {
    tvChart = LightweightCharts.createChart(el, {
      width: el.clientWidth || 320,
      height: 260,
      layout: { background: { type: 'solid', color: '#f7faff' }, textColor: '#4b607f', fontFamily: 'inherit' },
      grid: { vertLines: { color: '#e4edfb' }, horzLines: { color: '#e4edfb' } },
      rightPriceScale: { borderColor: '#c5d8f8' },
      timeScale: { borderColor: '#c5d8f8', timeVisible: true, secondsVisible: false },
      crosshair: { mode: LightweightCharts.CrosshairMode.Normal }
    });
    candleSeries = tvChart.addCandlestickSeries({
      upColor: '#16a34a',
      downColor: '#ef4444',
      borderUpColor: '#16a34a',
      borderDownColor: '#ef4444',
      wickUpColor: '#16a34a',
      wickDownColor: '#ef4444'
    });
    fvSeries = tvChart.addLineSeries({ color: '#2563eb', lineWidth: 2, lineStyle: LightweightCharts.LineStyle.Dashed, priceLineVisible: false });
    window.addEventListener('resize', () => tvChart && tvChart.applyOptions({ width: el.clientWidth || 320 }));
  }

  const candles = makeCandles(s);
  candleSeries.setData(candles.map(({ time, open, high, low, close }) => ({ time, open, high, low, close })));
  fvSeries.setData(candles.map((c) => ({ time: c.time, value: Number(s.fv.toFixed(2)) })));

  eventMarkers = candles
    .filter((c) => c.event && c.event !== 'tick')
    .map((c) => ({
      time: c.time,
      position: c.event === 'sell' || c.event === 'bad' ? 'aboveBar' : 'belowBar',
      color: markerColor(c.event),
      shape: markerShape(c.event),
      text: c.label
    }));

  candleSeries.setMarkers(eventMarkers);
  tvChart.timeScale().fitContent();
}

function priceImpact(type) {
  const table = {
    buy: [0.006, 0.018],
    sell: [-0.018, -0.006],
    good: [0.018, 0.048],
    bad: [-0.052, -0.018],
    neutral: [-0.004, 0.006],
    proof: [0.012, 0.04],
    comment: [0.002, 0.01],
    gap: [0.018, 0.09],
    amm: [0.006, 0.024]
  };
  const [a, b] = table[type] || table.neutral;
  return a + (b - a) * Math.random();
}

function applyMarketEvent(type, reason, label, options = {}) {
  const s = stocks[state.selected];
  const before = s.price;
  const impact = options.priceImpactOverride !== undefined ? options.priceImpactOverride : priceImpact(type);

  s.price = Math.max(MIN_PRICE, s.price * (1 + impact));
  s.chg = ((s.price - s.listingPrice) / s.listingPrice) * 100;
  s.riseChance = Math.max(5, Math.min(95, Math.round(s.riseChance + impact * 280)));

  if (type === 'comment') {
    s.tmiHeat = Math.min(100, s.tmiHeat + 4 + s.comments.length * 0.25);
  } else if (type === 'proof' || type === 'good' || type === 'gap') {
    s.tmiHeat = Math.max(8, s.tmiHeat - 2.5);
  }

  if (options.applyFVSettlement) {
    applyFVSettlement(s, reason);
  }

  const evt = { time: nowLabel(), type, label, delta: ((s.price - before) / before) * 100, price: s.price, reason };
  s.priceHistory.push({ t: s.priceHistory.length * 30, price: s.price, event: type, label, reason });
  s.priceHistory = s.priceHistory.slice(-36);
  s.eventLog.unshift(evt);
  s.eventLog = s.eventLog.slice(0, 12);

  if (type === 'good' || type === 'proof' || type === 'gap') s.signal = 'buy';
  if (type === 'bad' || type === 'sell') s.signal = 'risk';
  if (type === 'neutral' || type === 'comment') s.signal = 'watch';

  if (state.selected === 0) persistMine();
  openStock(state.selected);
  renderHome();
}

function trade(type) {
  const s = stocks[state.selected];
  const cost = s.price * 10000;
  if (type === 'buy') {
    state.cash -= cost;
    state.portfolio += cost;
    applyMarketEvent('buy', '크루 매수세 유입으로 호가가 위로 밀렸어.', '매수');
  } else {
    state.cash += cost;
    state.portfolio -= cost;
    applyMarketEvent('sell', '차익 실현 매도가 나오면서 단기 가격 압력이 생겼어.', '매도');
  }
}

function runAIAnalysis() {
  const s = stocks[state.selected];
  const settlement = computeFVSettlement(s);
  const score = settlement.baselineDiff * 1.8 + settlement.streakBonus * 3 + settlement.inactivityDecay * 1.2 + Math.random() * 8;

  let type = 'neutral';
  let txt = '중립: Achievement 정산이 보합권이라 가격은 단기 박스권.';
  if (score > 18) {
    type = 'good';
    txt = '호재: Achievement 누적과 검증 신뢰도가 높아 FV 상향 정산이 반영됐어.';
  } else if (score < -8) {
    type = 'bad';
    txt = '악재: inactivity decay와 검증 신뢰도 저하로 FV 하향 압력이 커졌어.';
  }

  document.getElementById('aiEventTone').textContent = type === 'good' ? '호재' : type === 'bad' ? '악재' : '중립';
  document.getElementById('aiEventText').textContent = txt;
  applyMarketEvent(type, txt, type === 'good' ? '호재' : type === 'bad' ? '악재' : '중립', { applyFVSettlement: true });
}

function simulateNextOpen() {
  const s = stocks[state.selected];
  const settlement = computeFVSettlement(s);
  const performance = settlement.finalMove / 100;
  const type = performance > 0 ? 'gap' : 'neutral';
  const reason =
    performance > 0
      ? '전날 Achievement 정산이 플러스라 다음 장 시작가가 갭 상승했어.'
      : '전날 Achievement 정산이 약해 다음 장 시작가는 보합/약보합이야.';

  s.openPrice = Math.max(MIN_PRICE, s.price * (1 + Math.max(-0.02, performance)));
  s.price = s.openPrice;
  s.chg = ((s.price - s.listingPrice) / s.listingPrice) * 100;

  applyMarketEvent(type, reason, '시가갭', { applyFVSettlement: true });
}

function renderTimeline() {
  const s = stocks[state.selected];
  document.getElementById('eventTimeline').innerHTML = s.eventLog
    .map((e) => `<div class="event-row ${e.type}"><b>${e.time} · ${e.label}</b><span>${e.price.toFixed(1)} (${pct(e.delta)})</span><p>${e.reason}</p></div>`)
    .join('');
}

function bet(side) {
  const s = stocks[state.selected];
  document.getElementById('betResult').textContent = `${s.name}의 내일을 ${side === 'long' ? 'LONG' : 'SHORT'}으로 예측했어. 베팅금 50,000 PEL mock 체결.`;
}

function selectCommentTag(tag) {
  state.commentTag = tag;
  document.querySelectorAll('#commentTags button').forEach((b) => b.classList.toggle('active', b.dataset.tag === tag));
}

function renderComments() {
  const s = stocks[state.selected];
  document.getElementById('commentList').innerHTML = s.comments.map((c) => `<div class="comment"><small>${c.tag}</small><b>${c.name}</b><p>${c.text}</p></div>`).join('');
}

function addComment() {
  const input = document.getElementById('commentInput');
  const text = input.value.trim();
  if (!text) return;
  const s = stocks[state.selected];
  s.comments.unshift({ tag: state.commentTag, name: '나', text });
  input.value = '';
  renderComments();
  applyMarketEvent('comment', `${state.commentTag} TMI 댓글이 시장가 단기 심리에만 반영됐어. FV는 유지.`, '댓글');
}

function scoreRows(diff, imp, auth) {
  return [
    ['난이도', diff],
    ['중요도', imp],
    ['진정성', auth]
  ]
    .map(([name, val]) => `<div class="bar-row"><span>${name}</span><i style="--w:${val * 20}%"></i><b>${val}/5</b></div>`)
    .join('');
}

function renderVerification(ver) {
  const card = document.getElementById('photoVerificationCard');
  const list = document.getElementById('verificationList');
  if (!card || !list) return;
  if (!ver) {
    list.innerHTML = '';
    return;
  }

  const rows = [
    ['real-time capture', ver.realtime],
    ['duplicate check', ver.duplicate],
    ['AI-generated suspicion', `${ver.aiSuspicion}%`],
    ['goal relevance', `${ver.goalRelevance}%`],
    ['EXIF / timestamp', ver.exif],
    ['confidence', `${ver.confidence}%`],
    ['verdict', ver.verdict]
  ];

  list.innerHTML = rows.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
  card.querySelector('h3').textContent = `검증 결과: ${ver.verdict}`;
  card.querySelector('p').textContent = `촬영시각 ${ver.timestamp} · 중복 ${ver.duplicate} · AI생성 의심 ${ver.aiSuspicion}%`;
}

function updateProofPreview() {
  const challengeEl = document.getElementById('challengeText');
  if (challengeEl && !challengeEl.dataset.fixed) {
    challengeEl.textContent = challenge();
    challengeEl.dataset.fixed = '1';
  }
  const diff = Number(document.getElementById('difficulty').value);
  const imp = Number(document.getElementById('importance').value);
  const auth = Number(document.getElementById('authenticity').value);
  document.getElementById('diffLabel').textContent = diff;
  document.getElementById('impLabel').textContent = imp;
  document.getElementById('authLabel').textContent = auth;
  document.getElementById('scorePreview').innerHTML = scoreRows(diff, imp, auth);
  renderVerification(state.latestVerification);
}

function submitProof() {
  const diff = Number(document.getElementById('difficulty').value);
  const imp = Number(document.getElementById('importance').value);
  const auth = Number(document.getElementById('authenticity').value);
  const score = diff * imp + auth * 3;
  const impact = Math.min(14, (score / 40) * 11).toFixed(1);

  const realtime = Math.random() > 0.14 ? 'PASS' : 'WARN';
  const duplicate = Math.random() > 0.78 ? 'WARN' : 'PASS';
  const aiSuspicion = Math.max(2, Math.round(28 - auth * 4 + Math.random() * 12));
  const goalRelevance = Math.max(42, Math.round(58 + imp * 7 + Math.random() * 14));
  const confidence = Math.max(45, Math.min(98, Math.round((goalRelevance + (100 - aiSuspicion) + auth * 10) / 3)));
  const verdict = confidence >= 72 && duplicate === 'PASS' && realtime === 'PASS' ? 'APPROVED' : confidence >= 58 ? 'REVIEW' : 'REJECT';

  const ver = {
    realtime,
    duplicate,
    aiSuspicion,
    goalRelevance,
    exif: realtime === 'PASS' ? 'OK' : 'MISSING',
    timestamp: `${new Date().toLocaleDateString('ko-KR')} ${nowLabel()}`,
    confidence,
    verdict
  };
  state.latestVerification = ver;

  document.getElementById('proofResult').innerHTML = `<span class="muted">AI REVIEW</span><h3>심사 결과: 호재 +${impact}%</h3><p>난이도 ${diff}/5, 중요도 ${imp}/5, 진정성 ${auth}/5. Achievement 중심 점수라 FV 엔진에 직접 반영돼.</p><div class="score-bars">${scoreRows(diff, imp, auth)}</div>`;
  renderVerification(ver);

  const mine = stocks[0];
  mine.proofsToday += 1;
  mine.streakDays = Math.min(14, mine.streakDays + 1);
  mine.inactiveHours = 0;
  mine.achievementScore = Math.min(100, mine.achievementScore + diff * 2.1 + imp * 2.5 + auth * 1.9 + (verdict === 'APPROVED' ? 6 : 2));
  mine.goalBaseline = Math.max(40, Math.min(95, mine.goalBaseline + (imp >= 4 ? 0.4 : -0.6)));
  mine.oracleConfidence = Math.max(0.42, Math.min(0.96, mine.oracleConfidence + (confidence - 65) / 420));
  mine.fvFloorPrice = Math.max(30, mine.fvFloorPrice * 0.996 + mine.price * 0.012);
  mine.proofLog.unshift(`방금 제출한 실적 인증 · ${verdict} · confidence ${confidence}%`);

  const fvSnapshot = computeFVSettlement(mine);
  state.latestDisclosure = {
    type: verdict === 'REJECT' ? 'neutral' : 'good',
    title: `[공시] ${mine.name}, 오늘 실적 인증 ${verdict}`,
    body: `사진 검증 confidence ${confidence}%, Achievement 점수 ${Math.round(fvSnapshot.achievement)}점. 예상 FV ${pct(fvSnapshot.finalMove)}.`
  };

  state.selected = 0;
  applyMarketEvent('proof', `사진 검증 ${verdict} · Achievement 기반 FV 정산이 적용됐어.`, '인증', { applyFVSettlement: true });
}

function publishLatestNews() {
  if (!state.latestDisclosure) {
    state.latestDisclosure = {
      type: 'neutral',
      title: `[예고] ${stocks[0].name}, 인증 공시 준비 중`,
      body: '아직 제출된 AI 심사 결과가 없어 예고 공시로 등록됐다.'
    };
  }
  news.unshift(state.latestDisclosure);
  state.latestDisclosure = null;
  go('news');
}

function renderNews() {
  document.getElementById('newsFeed').innerHTML = news
    .map((n) => `<article class="news-card"><span class="tag ${n.type}">${n.type === 'good' ? '호재' : n.type === 'bad' ? '악재' : '중립'}</span><h3>${n.title}</h3><p>${n.body}</p></article>`)
    .join('');
}

function renderRank() {
  const sorted = [...stocks].sort((a, b) => b.chg - a.chg);
  document.getElementById('rankList').innerHTML = sorted
    .map(
      (s, i) =>
        `<div class="stock-item"><div class="avatar" style="background:${s.color}">${i + 1}</div><div class="stock-main"><b>${s.name}</b><span>${s.goal} · 오늘 인증 ${s.proofsToday}건</span></div><div class="stock-price"><b>${s.price.toFixed(0)}</b><span class="${s.chg >= 0 ? 'up' : 'down'}">${pct(s.chg)}</span></div></div>`
    )
    .join('');
}

function renderAMMCard(s) {
  const amountEl = document.getElementById('ammAmount');
  if (!amountEl) return;
  if (!amountEl.dataset.bound) {
    amountEl.addEventListener('input', updateAMMPreview);
    amountEl.dataset.bound = '1';
  }
  document.getElementById('ammSupply').textContent = `${Math.round(s.amm.supply).toLocaleString('ko-KR')} share`;
  document.getElementById('ammCurveBase').textContent = `${s.amm.curveBase.toFixed(2)} PEL`;
  document.getElementById('ammLiquidity').textContent = `${pel(s.amm.liquidity)} virtual pool · always liquidity`;
  updateAMMPreview();
}

function calcAMMTrade(s, side, amount) {
  const k = 0.00024;
  const startSupply = s.amm.supply;
  const endSupply = Math.max(120, side === 'buy' ? startSupply + amount : startSupply - amount);
  const avgSupply = (startSupply + endSupply) / 2;
  const curvePx = s.amm.curveBase * (1 + k * avgSupply);
  const notional = curvePx * amount;
  const marketImpact = (curvePx - s.price) / s.price;
  return {
    startSupply,
    endSupply,
    curvePx,
    notional,
    marketImpact
  };
}

function updateAMMPreview() {
  const s = stocks[state.selected];
  if (!s || !s.amm) return;
  const amount = Number(document.getElementById('ammAmount')?.value || 1);
  const side = state.ammSide || 'buy';
  const trade = calcAMMTrade(s, side, amount);
  const txt =
    `${side === 'buy' ? 'BUY' : 'SELL'} ${amount}주 · 체결가 ${trade.curvePx.toFixed(2)} PEL · ` +
    `예상 시장 충격 ${pct(trade.marketImpact * 100)} · 체결대금 ${pel(trade.notional)}`;
  const preview = document.getElementById('ammPreview');
  if (preview) preview.textContent = txt;

  const buyBtn = document.getElementById('ammBuyBtn');
  const sellBtn = document.getElementById('ammSellBtn');
  if (buyBtn) buyBtn.classList.toggle('active-amm', side === 'buy');
  if (sellBtn) sellBtn.classList.toggle('active-amm', side === 'sell');
}

function executeAMM(side) {
  state.ammSide = side;
  const s = stocks[state.selected];
  const amount = Number(document.getElementById('ammAmount')?.value || 1);
  const trade = calcAMMTrade(s, side, amount);

  s.amm.supply = trade.endSupply;
  s.amm.curveBase = Number((s.amm.curveBase * (1 + (side === 'buy' ? 0.0009 : -0.0009))).toFixed(4));
  s.amm.liquidity = Math.max(1500000, s.amm.liquidity + (side === 'buy' ? trade.notional * 0.5 : -trade.notional * 0.3));

  const signedImpact = side === 'buy' ? Math.abs(trade.marketImpact) : -Math.abs(trade.marketImpact);
  applyMarketEvent('amm', `Bonding curve ${side.toUpperCase()} ${amount}주 체결 · always liquidity 풀에서 즉시 매칭`, `AMM ${side.toUpperCase()}`, {
    priceImpactOverride: Math.max(-0.04, Math.min(0.04, signedImpact * 0.55))
  });
}

applyProfile();
lockProfileUI();
renderHome();
updateProofPreview();
