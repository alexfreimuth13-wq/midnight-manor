const $ = s => document.querySelector(s);
const grid = $('#grid');
const symbols = [
  {img:'assets/pumpkin.webp',name:'Jack-o’-lantern',pays:[0,0,3,8,20]},
  {img:'assets/orb.webp',name:'Spirit orb',pays:[0,0,4,10,25]},
  {img:'assets/tarot.webp',name:'Moon tarot',pays:[0,0,5,12,30]},
  {img:'assets/skull.webp',name:'Jester skull',pays:[0,0,6,15,40]},
  {img:'assets/ticket.webp',name:'Admission ticket',pays:[0,0,8,20,50]},
  {img:'assets/wild.webp',name:'Ringmaster wild',pays:[0,0,12,35,80]}
];
const weights=[24,22,20,16,12,6];
const lines=[
  [0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14],
  [0,6,12,8,4],[10,6,2,8,14]
];
const bets=[.25,.5,1,2,5,10];
let betIndex=2,balance=1000,lastWin=0,busy=false,gridVals=[];
let audioOn=false,audioCtx=null;
const ringFrames=['assets/ringmaster-0.webp','assets/ringmaster-1.webp','assets/ringmaster-2.webp','assets/ringmaster-3.webp'];
let ringMode='idle',ringTimer=null,ringStep=0,ringToken=0;
ringFrames.forEach(src=>{const img=new Image();img.src=src});
const ringSequences={
  // Mostly still, then one deliberate hat-tip. This is sprite animation, not a looping video panel.
  idle:[{f:0,d:3200},{f:1,d:150},{f:2,d:150},{f:3,d:320},{f:2,d:150},{f:1,d:150},{f:0,d:2600}],
  spin:[{f:0,d:420},{f:1,d:180},{f:2,d:500},{f:3,d:700},{f:2,d:260},{f:1,d:220}],
  win:[{f:1,d:140},{f:2,d:160},{f:3,d:520},{f:2,d:170},{f:1,d:160},{f:0,d:850}]
};
function runRingmaster(mode=ringMode){
  ringMode=mode;ringStep=0;ringToken++;const token=ringToken;
  clearTimeout(ringTimer);
  const box=$('.ringmaster-anim'),img=$('#ringmasterFrame');
  if(!box||!img)return;
  box.classList.toggle('spin-mode',mode==='spin');box.classList.toggle('win-mode',mode==='win');
  const tick=()=>{
    if(token!==ringToken)return;
    const seq=ringSequences[ringMode]||ringSequences.idle,step=seq[ringStep%seq.length];
    img.src=ringFrames[step.f];
    box.classList.toggle('tip',step.f>=2);
    ringStep=(ringStep+1)%seq.length;
    ringTimer=setTimeout(tick,step.d);
  };
  tick();
}

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function money(n){return n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
function choose(){let r=Math.random()*weights.reduce((a,b)=>a+b,0);for(let i=0;i<weights.length;i++){r-=weights[i];if(r<0)return i}return 0}
function draw(){return Array.from({length:15},choose)}
function setup(){
  grid.innerHTML='';
  for(let i=0;i<15;i++){
    const c=document.createElement('div');c.className='cell';
    c.innerHTML='<img class="symbol-img" alt="" draggable="false">';grid.append(c)
  }
  gridVals=[0,1,2,3,4,2,3,5,0,1,4,0,1,4,5];render()
}
function render(){
  [...grid.children].forEach((c,i)=>{
    const s=symbols[gridVals[i]],img=c.querySelector('.symbol-img');img.src=s.img;img.alt=s.name;
    c.setAttribute('aria-label',`Row ${Math.floor(i/5)+1}, reel ${i%5+1}: ${s.name}`)
  });
  $('#balance').textContent=money(balance);$('#lastWin').textContent=money(lastWin);$('#bet').textContent=money(bets[betIndex])
}
function evalWins(vals,bet){
  let total=0,winners=new Set();
  for(const line of lines){
    const arr=line.map(i=>vals[i]);let target=arr.find(v=>v!==5);if(target===undefined)target=5;
    let count=0;for(const v of arr){if(v===target||v===5)count++;else break}
    if(count>=3){const win=symbols[target].pays[count]*bet;total+=win;line.slice(0,count).forEach(i=>winners.add(i))}
  }
  const scatters=vals.filter(v=>v===2).length;
  return {total,winners,bonus:scatters>=3}
}
function host(text,mode='idle'){
  $('#host-caption').textContent=text;
  runRingmaster(mode);
  if(mode==='win')setTimeout(()=>{if(!busy)runRingmaster('idle')},1900)
}
function tone(freq=440,duration=.08,vol=.035,type='sine'){
  if(!audioOn)return;
  audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
  if(audioCtx.state==='suspended')audioCtx.resume();
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;o.connect(g);g.connect(audioCtx.destination);g.gain.setValueAtTime(vol,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+duration);o.start();o.stop(audioCtx.currentTime+duration)
}
function flourish(){[520,660,820].forEach((f,i)=>setTimeout(()=>tone(f,.18,.045,'triangle'),i*95))}
async function spin(){
  if(busy)return;const bet=bets[betIndex];
  if(balance<bet){$('#status').textContent='Not enough play credits — reset credits to continue.';return}
  busy=true;$('#spin').disabled=true;$('#spin').classList.add('spinning');balance-=bet;lastWin=0;render();host('Let the show begin.','spin');$('#status').textContent='The reels are spinning…';
  const cells=[...grid.children];cells.forEach(c=>c.classList.remove('winner'));
  const final=draw();
  for(let col=0;col<5;col++){
    [col,col+5,col+10].forEach(i=>cells[i].classList.add('rolling'));
    for(let n=0;n<8;n++){
      await sleep(48+n*2);
      [col,col+5,col+10].forEach(i=>gridVals[i]=choose());render();
    }
    [col,col+5,col+10].forEach(i=>{gridVals[i]=final[i];cells[i].classList.remove('rolling')});render();tone(165+col*46,.055,.028,'square')
  }
  const r=evalWins(gridVals,bet);lastWin=r.total;balance+=r.total;
  if(r.total>0){
    r.winners.forEach(i=>cells[i].classList.add('winner'));host('A splendid performance!','win');$('#status').textContent=`You won ${money(r.total)} play credits.`;
    const b=$('#winBanner');b.textContent=`+${money(r.total)}`;b.classList.remove('show');void b.offsetWidth;b.classList.add('show');flourish()
  }else{host('The curtain falls.','idle');$('#status').textContent='No line win this spin.'}
  render();busy=false;$('#spin').disabled=false;$('#spin').classList.remove('spinning');
  if(r.bonus)setTimeout(()=>bonus(false),500)
}
function bonus(preview=true){
  const modal=$('#modal'),body=$('#modalBody');host('Your fortune awaits…','win');
  body.innerHTML=`<h2>Fortune Tent Bonus</h2><p>Pick one card to reveal a carnival prize${preview?' preview':''}.</p><div class="cards"><button class="fortune" aria-label="Fortune card one">🌙</button><button class="fortune" aria-label="Fortune card two">👁️</button><button class="fortune" aria-label="Fortune card three">⭐</button></div>`;
  modal.showModal();
  body.querySelectorAll('.fortune').forEach(btn=>btn.onclick=()=>{
    const mult=[3,5,8,12][Math.floor(Math.random()*4)],amt=bets[betIndex]*mult;btn.textContent=`${mult}×`;
    body.querySelectorAll('.fortune').forEach(b=>b.disabled=true);
    if(!preview){balance+=amt;lastWin=amt;render()}
    $('#status').textContent=preview?`Bonus preview: ${mult}× bet.`:`Bonus win: ${money(amt)} play credits.`;flourish()
  })
}
function paytable(){
  const rows=symbols.map((s,i)=>`<div class="pay-row"><img src="${s.img}" alt="${s.name}"><span>${s.name}<br><small>3 / 4 / 5 matching</small></span><b>${s.pays[2]}× / ${s.pays[3]}× / ${s.pays[4]}×</b></div>`).join('');
  $('#modalBody').innerHTML=`<h2>How to play</h2><p>Five reels, three rows and five fixed paylines. Matching symbols pay from left to right. The Ringmaster is wild. Three or more Moon Tarot symbols anywhere on the reels open the Fortune Tent bonus.</p><div class="paytable">${rows}</div><p><small>All awards are multiplied by your selected play-credit bet. This is a non-cash playable concept.</small></p>`;$('#modal').showModal()
}
$('#spin').onclick=spin;window.addEventListener('keydown',e=>{if((e.code==='Space'||e.code==='Enter')&&!e.repeat&&!$('#modal').open){e.preventDefault();spin()}});
$('#minus').onclick=()=>{if(!busy){betIndex=Math.max(0,betIndex-1);render()}};$('#plus').onclick=()=>{if(!busy){betIndex=Math.min(bets.length-1,betIndex+1);render()}};
$('#resetBtn').onclick=()=>{if(!busy){balance=1000;lastWin=0;$('#status').textContent='Credits reset. Welcome back to the carnival.';host('Welcome back to the show.','idle');render()}};
$('#bonusBtn').onclick=()=>bonus(true);$('#paytableBtn').onclick=paytable;
$('#closeModal').onclick=()=>$('#modal').close();$('#modal').addEventListener('click',e=>{if(e.target===$('#modal'))$('#modal').close()});
$('#soundBtn').onclick=()=>{audioOn=!audioOn;$('#soundBtn').textContent=audioOn?'Sound on':'Sound off';if(audioOn)tone(330,.08,.035,'triangle')};
setup();
runRingmaster('idle');
