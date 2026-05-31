const MARKET_OPEN_HOUR=9;
const MARKET_HOURS=10;
const PROFILE_KEY='humanStockProfile';
let tvChart=null;let candleSeries=null;let fvSeries=null;let eventMarkers=[];
const state={cash:10000000,crew:'바이브 크루',selected:0,portfolio:1248000,commentTag:'응원',latestDisclosure:null};
const baseStocks=[
{name:'승화',ticker:'SHWA',goal:'창업 프로젝트',intro:'AI 창업 프로젝트를 매일 진척시키는 사람',risk:'균형형',price:128,fv:142,chg:8.6,emoji:'🚀',color:'#3182f6',proofsToday:2,strikes:0,riseChance:74,signal:'buy',reason:'실행 난이도 높고 목표 정렬도가 매우 높아 AI 적정가가 시장가보다 높게 산정됐어.',proofLog:['09:20 PRD 핵심 플로우 정리','18:40 MVP 기능명세 v5 확정'],fvHistory:[126,129,131,134,138,140,142],comments:[{tag:'매수중',name:'다원',text:'오늘 인증 퀄리티 좋다. 나 mock 매수 들어감.'},{tag:'응원',name:'민준',text:'창업 섹터 대장주 느낌 🚀'}]},
{name:'민준',ticker:'MJUN',goal:'운동 루틴',intro:'꾸준히 운동 루틴을 쌓는 종목',risk:'안정형',price:94,fv:88,chg:-3.2,emoji:'🏋️',color:'#16a34a',proofsToday:0,strikes:2,riseChance:38,signal:'risk',reason:'최근 인증 공백이 있어 FV가 점진 감쇠 중이야. 3-strike 중 2개가 쌓여 위험 신호가 켜졌어.',proofLog:['오늘 인증 없음 · 2일 연속 공백'],fvHistory:[98,97,95,92,90,89,88],comments:[{tag:'주의',name:'승화',text:'오늘은 짧게라도 인증하면 상폐 리스크 줄 듯.'}]},
{name:'다원',ticker:'DAWN',goal:'디자인 포트폴리오',intro:'디자인 산출물을 꾸준히 만드는 종목',risk:'공격형',price:117,fv:121,chg:5.1,emoji:'🎨',color:'#7c3aed',proofsToday:1,strikes:0,riseChance:68,signal:'buy',reason:'연속 작업 인증과 크루 평가가 좋아 시장가와 FV가 함께 상승 중이야.',proofLog:['16:10 랜딩페이지 시안 3장 업로드'],fvHistory:[109,111,112,116,117,119,121],comments:[{tag:'응원',name:'지후',text:'시안 발전 속도 미쳤다.'}]},
{name:'지후',ticker:'JHOO',goal:'시험 공부',intro:'시험 대비 학습량을 주가로 만드는 종목',risk:'균형형',price:83,fv:97,chg:1.4,emoji:'📚',color:'#f59e0b',proofsToday:1,strikes:1,riseChance:57,signal:'watch',reason:'목표 정렬도는 높지만 난이도 자기신고와 AI 기준선 차이가 있어 일부 보류됐어.',proofLog:['21:00 수학 오답노트 12문제'],fvHistory:[90,91,93,92,95,96,97],comments:[{tag:'응원',name:'승화',text:'오답노트면 FV 오를 만하지.'}]},
{name:'서윤',ticker:'SYUN',goal:'콘텐츠 업로드',intro:'콘텐츠 업로드 루틴을 시장이 평가하는 종목',risk:'공격형',price:76,fv:71,chg:-5.8,emoji:'🎬',color:'#0ea5e9',proofsToday:0,strikes:1,riseChance:31,signal:'risk',reason:'업로드 예고 후 결과 인증이 없어 시장 신뢰가 약해졌어. 오늘 인증 없으면 strike가 추가될 수 있어.',proofLog:['오늘 인증 없음 · 예고 공시만 존재'],fvHistory:[84,82,80,79,75,73,71],comments:[{tag:'주의',name:'다원',text:'예고보다 결과물이 필요해 보여.'}]}
];
const stocks=baseStocks.map(seedStock);
let news=[
{type:'good',title:'[공시] 승화, 기능명세 v5 확정',body:'창업 프로젝트 섹터에 강한 호재. AI는 목표 정렬도 96점을 부여했다. 예상 FV +6.4%'},
{type:'bad',title:'[속보] 민준, 이틀 연속 운동 인증 누락',body:'체력 섹터 신뢰도 약화. 폭락 대신 감쇠 룰이 적용된다. 예상 FV -2.8%'},
{type:'good',title:'[속보] 작성자 쾌변 성공',body:'체내 잉여 리스크 해소로 펀더멘털 강화. 위장 건강 섹터 전반 호재.'},
{type:'bad',title:'[속보] 점심 마라탕 후루룩',body:'위장 건강 적신호. 오후 생산성 리스크 확대. 단기 변동성 주의.'}
];
function seedStock(s){const history=(s.fvHistory||[s.price]).map((v,i)=>({t:i*90,price:Number(v),event:i===0?'open':'tick',label:i===0?'시가':'틱',reason:i===0?'장 시작 가격':'AI 적정가 추적'}));return {...s,openPrice:s.price,prevClose:Math.max(30,s.price/(1+s.chg/100)),priceHistory:history,eventLog:[{time:'장 시작',type:'open',label:'시가',delta:0,price:s.price,reason:'오늘 10시간 시즌장 시작'}]}}
function loadProfile(){try{return JSON.parse(localStorage.getItem(PROFILE_KEY)||'null')}catch{return null}}
function saveProfile(profile){localStorage.setItem(PROFILE_KEY,JSON.stringify(profile))}
function applyProfile(){const p=loadProfile();if(!p)return false;Object.assign(stocks[0],{name:p.name,ticker:p.ticker,goal:p.goal,intro:p.intro,risk:p.risk,price:p.price,fv:p.fv,openPrice:p.openPrice,prevClose:p.prevClose,chg:((p.price-p.prevClose)/p.prevClose)*100});if(p.priceHistory)stocks[0].priceHistory=p.priceHistory;if(p.eventLog)stocks[0].eventLog=p.eventLog;state.crew=p.crew||state.crew;return true}
function hsc(n){return Math.round(n).toLocaleString('ko-KR')+' HSC'}
function pct(n){return `${n>=0?'+':''}${Number(n).toFixed(1)}%`}
function nowLabel(){const d=new Date();return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`}
function marketClock(){const now=new Date();const open=new Date(now);open.setHours(MARKET_OPEN_HOUR,0,0,0);const close=new Date(open);close.setHours(MARKET_OPEN_HOUR+MARKET_HOURS,0,0,0);const isOpen=now>=open&&now<close;const total=MARKET_HOURS*60*60*1000;const progress=Math.max(0,Math.min(1,(now-open)/total));return {isOpen,progress,open,close,text:isOpen?`장 진행 ${(progress*100).toFixed(0)}% · ${MARKET_OPEN_HOUR}:00~${MARKET_OPEN_HOUR+MARKET_HOURS}:00`:`장 마감 · 다음 장 시작가에 성과 갭 반영`}}
function go(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');if(id==='home')renderHome();if(id==='news')renderNews();if(id==='leaderboard')renderRank();if(id==='proof')updateProofPreview();}
function startCrew(){const existing=loadProfile();if(existing){alert('이미 최초 상장이 완료됐어. 시즌 중에는 수정할 수 없어.');applyProfile();go('home');return}const price=Math.max(30,Number(document.getElementById('myInitialPrice').value)||100);const profile={name:document.getElementById('myName').value||'내 종목',ticker:(document.getElementById('myTicker').value||'ME').toUpperCase(),intro:document.getElementById('myIntro').value||'나를 성장시키는 종목',goal:document.getElementById('myGoal').value,price,fv:Math.round(price*1.08),openPrice:price,prevClose:Math.round(price*.98),risk:document.getElementById('myRisk').value,crew:document.getElementById('crewNameInput').value||'바이브 크루',priceHistory:[{t:0,price,event:'open',label:'시가',reason:'최초 상장가'}],eventLog:[{time:nowLabel(),type:'open',label:'상장',delta:0,price,reason:'본인이 최초 1회 직접 설정한 상장가'}]};saveProfile(profile);applyProfile();lockProfileUI();go('home')}
function resetMyStock(){if(confirm('데모 초기화할까? 실제 서비스에서는 시즌 중 수정 불가야.')){localStorage.removeItem(PROFILE_KEY);location.reload()}}
function lockProfileUI(){const p=loadProfile();if(!p)return;['myName','myTicker','myIntro','myGoal','myInitialPrice','myRisk','crewNameInput'].forEach(id=>{const el=document.getElementById(id);if(el){el.disabled=true}});const n=document.getElementById('profileLockNotice');if(n)n.textContent=`${p.ticker} 최초 상장 완료 · 시즌 중 수정 불가`;const btn=document.querySelector('#profileSetupCard .primary');if(btn)btn.textContent='이미 상장 완료됨'}
function persistMine(){const p=loadProfile();if(!p)return;Object.assign(p,{name:stocks[0].name,ticker:stocks[0].ticker,intro:stocks[0].intro,goal:stocks[0].goal,risk:stocks[0].risk,price:stocks[0].price,fv:stocks[0].fv,openPrice:stocks[0].openPrice,prevClose:stocks[0].prevClose,priceHistory:stocks[0].priceHistory,eventLog:stocks[0].eventLog,crew:state.crew});saveProfile(p)}

function aiConfidence(s){return Math.max(.42,Math.min(.94,(s.proofsToday*0.12)+(s.comments.length*0.04)+(100-s.strikes*18)/140 + (s.signal==='buy'?0.12:s.signal==='risk'?-0.06:0)))}
function analysisLogs(s){const conf=aiConfidence(s);const mood=s.signal==='buy'?'호재':s.signal==='risk'?'악재':'중립';const sector=s.goal.includes('운동')?'체력 섹터':s.goal.includes('창업')?'창업 실행 섹터':s.goal.includes('공부')?'학습 섹터':'생활 펀더멘털 섹터';return [
`TF-IDF 생활 텍스트 스캔 완료 · 키워드: ${s.goal}, 인증 ${s.proofsToday}건`,
`Goodhart 방어 모델: 쉬운 인증 반복 여부 ${s.proofsToday>2?'주의':'정상'}`,
`크루 심리 지수: 댓글 ${s.comments.length}건 · ${s.comments.length>1?'매수 심리 우세':'관망 심리'}`,
`AI 판정: ${sector} ${mood} · 확신도 ${conf.toFixed(2)}`
]}
function renderAIAnalyzer(s){const logs=document.getElementById('analysisLogs');if(!logs)return;const conf=aiConfidence(s);const tone=s.signal==='buy'?'good':s.signal==='risk'?'bad':'neutral';document.getElementById('confidenceBadge').textContent=`CONF ${conf.toFixed(2)}`;logs.innerHTML=analysisLogs(s).map((l,i)=>`<p><span>0${i+1}</span>${l}</p>`).join('');document.getElementById('verdictCard').innerHTML=`<span class="tag ${tone}">${tone==='good'?'호재':tone==='bad'?'악재':'중립'}</span><b>${s.name} ${tone==='good'?'펀더멘털 개선':tone==='bad'?'상장폐지 리스크 확대':'추가 공시 대기'}</b><small>${s.reason}</small>`;}
function updateTickerTape(){const tape=document.getElementById('tickerTape');if(!tape)return;const latest=news[0];tape.textContent=`${latest.title} — ${latest.body}`}
function renderOdds(s){const el=document.getElementById('oddsBoard');if(!el)return;const long=Math.max(18,Math.min(82,Math.round(s.riseChance)));const short=100-long;el.innerHTML=`<div><b>${long}%</b><span>LONG · 내일 갓생</span></div><div><b>${short}%</b><span>SHORT · 침대 상장폐지</span></div>`}
function challenge(){const arr=['오늘 날짜 적은 메모와 함께 촬영하기','왼손 엄지척과 결과물을 같이 찍기','타이머 10분 화면과 작업물을 같이 찍기','책/노트/운동기록을 시작-결과 2장으로 인증하기'];return arr[Math.floor(Math.random()*arr.length)]}

function stockButton(s,i,rankLabel=''){return `<button class="stock-item" onclick="openStock(${i})"><div class="avatar" style="background:${s.color}">${rankLabel||s.emoji}</div><div class="stock-main"><b>${s.name} 주식</b><span>${s.ticker} · ${s.goal}</span></div><div class="stock-price"><b>${s.price.toFixed(0)}</b><span class="${s.chg>=0?'up':'down'}">${pct(s.chg)}</span></div></button>`}
function renderHome(){document.getElementById('crewTitle').textContent=state.crew;document.getElementById('cash').textContent=hsc(state.cash);document.getElementById('portfolioValue').textContent=hsc(state.portfolio);const avg=stocks.reduce((a,s)=>a+s.chg,0)/stocks.length;const proofs=stocks.reduce((a,s)=>a+s.proofsToday,0);const risks=stocks.filter(s=>s.strikes>0||s.signal==='risk').length;document.getElementById('avgChange').textContent=pct(avg);document.getElementById('activeProofs').textContent=`${proofs}건`;document.getElementById('riskCount').textContent=`${risks}명`;document.getElementById('marketMood').textContent=avg>=2?'강세장':avg>=0?'혼조세':'약세장';document.getElementById('headline').innerHTML=`${news[0].title}<br><span>${news[0].body}</span>`;updateTickerTape();const byUp=[...stocks].sort((a,b)=>b.chg-a.chg).slice(0,3);const byDown=[...stocks].sort((a,b)=>a.chg-b.chg).slice(0,3);document.getElementById('topGainers').innerHTML=byUp.map((s,r)=>stockButton(s,stocks.indexOf(s),r+1)).join('');document.getElementById('topLosers').innerHTML=byDown.map((s,r)=>stockButton(s,stocks.indexOf(s),r+1)).join('');const danger=byDown[0];document.getElementById('riskSummary').textContent=`${danger.name} ${danger.strikes}/3 strike · 장 마감 후 성과 없으면 다음 장 시작가가 약하게 열릴 수 있어.`;document.getElementById('stockList').innerHTML=stocks.map((s,i)=>stockButton(s,i)).join('')}
function signalText(s){if(s.signal==='buy')return ['buy-signal','매수 추천','AI 적정가가 시장가보다 높고 인증 흐름이 좋아. 단, 실제 돈이 아닌 게임 판단이야.'];if(s.signal==='risk')return ['risk-signal','위험 신호','인증 공백/신뢰도 하락이 감지됐어. 매수보다 회복 인증 확인이 먼저야.'];return ['watch-signal','관망','상승 여지는 있지만 근거가 조금 부족해. 다음 인증 퀄리티를 보고 판단하자.']}
function openStock(i){state.selected=i;const s=stocks[i];document.getElementById('detailName').textContent=s.name+' 주식';document.getElementById('marketPrice').textContent=s.price.toFixed(1);document.getElementById('fvPrice').textContent=s.fv.toFixed(1);const gap=s.fv-s.price;const gapEl=document.getElementById('priceGap');gapEl.classList.toggle('negative',gap<0);gapEl.textContent=gap>=0?`AI 기준 ${gap.toFixed(1)} 저평가 · 매수 관심`:`AI 기준 ${Math.abs(gap).toFixed(1)} 고평가 · 관망 필요`;const clk=marketClock();document.getElementById('marketSessionTitle').textContent=clk.isOpen?'장 진행 중':'장 마감';document.getElementById('marketSessionDesc').textContent=clk.text;const last=s.eventLog[0];document.getElementById('lastMoveLabel').textContent=last?`${last.label} · ${last.reason}`:'이벤트 대기';const [klass,title,desc]=signalText(s);document.getElementById('signalCard').innerHTML=`<span class="signal ${klass}">${title}</span><h3>${s.ticker} AI 투자 의견</h3><p>${desc}</p>`;renderAIAnalyzer(s);renderOdds(s);document.getElementById('aiReason').innerHTML=`<h3>AI 판단 이유</h3><p>${s.reason}</p>`;document.getElementById('riseChance').textContent=`${s.riseChance}%`;document.getElementById('chanceNeedle').style.transform=`rotate(${(s.riseChance-50)*1.8}deg)`;document.getElementById('strikeDots').innerHTML=[0,1,2].map(n=>`<i class="${n<s.strikes?'on':''}"></i>`).join('');document.getElementById('strikeText').textContent=s.strikes>=3?'상장폐지 위험':s.strikes===2?'위험 임박':s.strikes===1?'주의':'안정';document.getElementById('proofCount').textContent=`${s.proofsToday}건`;document.getElementById('todayProofs').innerHTML=s.proofLog.map(p=>`<div><b>${p}</b><span>AI 신뢰도 반영 완료</span></div>`).join('');drawChart(s);renderTimeline();renderComments();document.getElementById('betResult').textContent='';go('detail')}
function makeCandles(s){
  const hist=s.priceHistory.slice(-36);
  return hist.map((h,i)=>{
    const prev=i?hist[i-1].price:(s.openPrice||h.price);
    const spread=Math.max(0.8, Math.abs(h.price-prev)*0.7 + (i%4)*0.22);
    const open=Number(prev.toFixed(2));
    const close=Number(h.price.toFixed(2));
    const high=Number((Math.max(open,close)+spread).toFixed(2));
    const low=Number((Math.min(open,close)-spread*0.82).toFixed(2));
    return {time:i+1,open,high,low,close,event:h.event,label:h.label,reason:h.reason};
  });
}
function markerShape(event){return event==='sell'||event==='bad'?'arrowDown':'arrowUp'}
function markerColor(event){return {buy:'#16a34a',sell:'#ef4444',good:'#2563eb',bad:'#dc2626',proof:'#7c3aed',comment:'#f59e0b',open:'#111827',gap:'#0ea5e9',neutral:'#64748b'}[event]||'#64748b'}
function drawChart(s){
  const el=document.getElementById('tvChart');
  if(!el)return;
  if(!window.LightweightCharts){
    el.innerHTML='<div class="chart-fallback">차트 라이브러리 로딩 중이야. 네트워크가 막히면 기본 차트로 대체돼.</div>';
    return;
  }
  if(!tvChart){
    tvChart=LightweightCharts.createChart(el,{
      width:el.clientWidth||320,height:260,
      layout:{background:{type:'solid',color:'#f8fafc'},textColor:'#334155',fontFamily:'inherit'},
      grid:{vertLines:{color:'#e5e7eb'},horzLines:{color:'#e5e7eb'}},
      rightPriceScale:{borderColor:'#e2e8f0'},timeScale:{borderColor:'#e2e8f0',timeVisible:true,secondsVisible:false},
      crosshair:{mode:LightweightCharts.CrosshairMode.Normal}
    });
    candleSeries=tvChart.addCandlestickSeries({upColor:'#16a34a',downColor:'#ef4444',borderUpColor:'#16a34a',borderDownColor:'#ef4444',wickUpColor:'#16a34a',wickDownColor:'#ef4444'});
    fvSeries=tvChart.addLineSeries({color:'#2563eb',lineWidth:2,lineStyle:LightweightCharts.LineStyle.Dashed,priceLineVisible:false});
    window.addEventListener('resize',()=>tvChart&&tvChart.applyOptions({width:el.clientWidth||320}));
  }
  const candles=makeCandles(s);
  candleSeries.setData(candles.map(({time,open,high,low,close})=>({time,open,high,low,close})));
  fvSeries.setData(candles.map(c=>({time:c.time,value:Number(s.fv.toFixed(2))})));
  eventMarkers=candles.filter(c=>c.event&&c.event!=='tick').map(c=>({
    time:c.time,
    position:(c.event==='sell'||c.event==='bad')?'aboveBar':'belowBar',
    color:markerColor(c.event),
    shape:markerShape(c.event),
    text:c.label
  }));
  candleSeries.setMarkers(eventMarkers);
  tvChart.timeScale().fitContent();
}
function priceImpact(type){const table={buy:[0.006,0.018],sell:[-0.018,-0.006],good:[0.018,0.048],bad:[-0.052,-0.018],neutral:[-0.004,0.006],proof:[0.012,0.04],comment:[0.002,0.01],gap:[0.018,0.09]};const [a,b]=table[type]||table.neutral;return a+(b-a)*Math.random()}
function applyMarketEvent(type,reason,label){const s=stocks[state.selected];const before=s.price;const impact=priceImpact(type);s.price=Math.max(30,s.price*(1+impact));s.chg=((s.price-s.prevClose)/s.prevClose)*100;s.riseChance=Math.max(5,Math.min(95,Math.round(s.riseChance+impact*280)));if(['good','proof','gap'].includes(type))s.fv=Math.max(30,s.fv*(1+Math.abs(impact)*0.65));if(type==='bad')s.fv=Math.max(30,s.fv*(1-Math.abs(impact)*0.4));const evt={time:nowLabel(),type,label,delta:((s.price-before)/before)*100,price:s.price,reason};s.priceHistory.push({t:s.priceHistory.length*30,price:s.price,event:type,label,reason});s.priceHistory=s.priceHistory.slice(-36);s.eventLog.unshift(evt);s.eventLog=s.eventLog.slice(0,12);s.reason=reason;if(type==='good'||type==='proof'||type==='gap')s.signal='buy';if(type==='bad'||type==='sell')s.signal='risk';if(type==='neutral')s.signal='watch';if(state.selected===0)persistMine();openStock(state.selected);renderHome()}
function trade(type){const s=stocks[state.selected];const cost=s.price*10000;if(type==='buy'){state.cash-=cost;state.portfolio+=cost;applyMarketEvent('buy','크루 매수세 유입으로 호가가 위로 밀렸어.','매수')}else{state.cash+=cost;state.portfolio-=cost;applyMarketEvent('sell','차익 실현 매도가 나오면서 단기 가격 압력이 생겼어.','매도')}}
function runAIAnalysis(){const s=stocks[state.selected];const score=s.proofsToday*18+s.comments.length*6+(s.fv-s.price)*0.8-s.strikes*20+Math.random()*28;let type='neutral',txt='중립: TF-IDF 생활 로그상 결정적 성과가 부족해 가격은 거의 유지돼.';if(score>40){type='good';txt='호재: 인증 성과와 크루 반응이 좋아 AI가 다음 장 기대치를 올렸어. 펀더멘털 개선 공시.'}else if(score<8){type='bad';txt='악재: 인증 공백이나 신뢰도 약화가 감지돼 단기 위험 프리미엄이 붙었어. 단, 폭락이 아니라 감쇠 룰 적용.'}document.getElementById('aiEventTone').textContent=type==='good'?'호재':type==='bad'?'악재':'중립';document.getElementById('aiEventText').textContent=txt;applyMarketEvent(type,txt,type==='good'?'호재':type==='bad'?'악재':'중립')}
function simulateNextOpen(){const s=stocks[state.selected];const performance=s.proofsToday*0.025+(s.comments.length>1?0.01:0)-s.strikes*0.018;const type=performance>0?'gap':'neutral';const reason=performance>0?'전날 장 마감 후 주식 주인이 성과를 인증해서 다음 장 시작가가 갭 상승했어.':'전날 성과가 약해 다음 장 시작가는 보합으로 출발했어.';s.prevClose=s.price;s.openPrice=Math.max(30,s.price*(1+Math.max(-0.02,performance)));s.price=s.openPrice;s.chg=((s.price-s.prevClose)/s.prevClose)*100;applyMarketEvent(type,reason,'시가갭')}
function renderTimeline(){const s=stocks[state.selected];document.getElementById('eventTimeline').innerHTML=s.eventLog.map(e=>`<div class="event-row ${e.type}"><b>${e.time} · ${e.label}</b><span>${e.price.toFixed(1)} (${pct(e.delta)})</span><p>${e.reason}</p></div>`).join('')}
function bet(side){const s=stocks[state.selected];document.getElementById('betResult').textContent=`${s.name}의 내일을 ${side==='long'?'LONG':'SHORT'}으로 예측했어. 베팅금 50,000 HSC mock 체결.`}
function selectCommentTag(tag){state.commentTag=tag;document.querySelectorAll('#commentTags button').forEach(b=>b.classList.toggle('active',b.dataset.tag===tag))}
function renderComments(){const s=stocks[state.selected];document.getElementById('commentList').innerHTML=s.comments.map(c=>`<div class="comment"><small>${c.tag}</small><b>${c.name}</b><p>${c.text}</p></div>`).join('')}
function addComment(){const input=document.getElementById('commentInput');const text=input.value.trim();if(!text)return;stocks[state.selected].comments.unshift({tag:state.commentTag,name:'나',text});input.value='';renderComments();applyMarketEvent('comment',`${state.commentTag} 댓글로 시장 심리가 소폭 반영됐어.`,'댓글')}
function scoreRows(diff,imp,auth){return [['난이도',diff],['중요도',imp],['진정성',auth]].map(([name,val])=>`<div class="bar-row"><span>${name}</span><i style="--w:${val*20}%"></i><b>${val}/5</b></div>`).join('')}
function updateProofPreview(){const challengeEl=document.getElementById('challengeText');if(challengeEl&&!challengeEl.dataset.fixed){challengeEl.textContent=challenge();challengeEl.dataset.fixed='1'}const diff=+document.getElementById('difficulty').value;const imp=+document.getElementById('importance').value;const auth=+document.getElementById('authenticity').value;document.getElementById('diffLabel').textContent=diff;document.getElementById('impLabel').textContent=imp;document.getElementById('authLabel').textContent=auth;document.getElementById('scorePreview').innerHTML=scoreRows(diff,imp,auth)}
function submitProof(){const diff=+document.getElementById('difficulty').value;const imp=+document.getElementById('importance').value;const auth=+document.getElementById('authenticity').value;const score=diff*imp+auth*3;const impact=Math.min(14,(score/40*11)).toFixed(1);document.getElementById('proofResult').innerHTML=`<span class="muted">AI REVIEW</span><h3>심사 결과: 호재 +${impact}%</h3><p>난이도 ${diff}/5, 중요도 ${imp}/5, 진정성 ${auth}/5. 목표와 직접 연결된 인증이라 FV 상승률이 높게 잡혔어.</p><div class="score-bars">${scoreRows(diff,imp,auth)}</div>`;state.latestDisclosure={type:'good',title:'[공시] '+stocks[0].name+', 오늘 실적 인증 완료',body:`AI 심사 점수 ${score}/40. 난이도·중요도·진정성 기반 예상 FV +${impact}%.`};stocks[0].proofsToday+=1;stocks[0].proofLog.unshift('방금 제출한 실적 인증 · AI 호재 판정');state.selected=0;applyMarketEvent('proof',`AI 심사 점수 ${score}/40 · 인증 성과가 장중 가격과 FV에 반영됐어.`,'인증')}
function publishLatestNews(){if(!state.latestDisclosure){state.latestDisclosure={type:'neutral',title:'[예고] '+stocks[0].name+', 인증 공시 준비 중',body:'아직 제출된 AI 심사 결과가 없어 예고 공시로 등록됐다.'}}news.unshift(state.latestDisclosure);state.latestDisclosure=null;go('news')}
function renderNews(){document.getElementById('newsFeed').innerHTML=news.map(n=>`<article class="news-card"><span class="tag ${n.type}">${n.type==='good'?'호재':n.type==='bad'?'악재':'중립'}</span><h3>${n.title}</h3><p>${n.body}</p></article>`).join('')}
function renderRank(){const sorted=[...stocks].sort((a,b)=>b.chg-a.chg);document.getElementById('rankList').innerHTML=sorted.map((s,i)=>`<div class="stock-item"><div class="avatar" style="background:${s.color}">${i+1}</div><div class="stock-main"><b>${s.name}</b><span>${s.goal} · ${s.proofsToday} proofs</span></div><div class="stock-price"><b>${s.price.toFixed(0)}</b><span class="${s.chg>=0?'up':'down'}">${pct(s.chg)}</span></div></div>`).join('')}
applyProfile();lockProfileUI();renderHome();updateProofPreview();