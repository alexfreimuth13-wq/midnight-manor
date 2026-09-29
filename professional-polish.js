const stage=document.querySelector('.stage'),status=document.querySelector('#status'),banner=document.querySelector('#winBanner'),modal=document.querySelector('#modal');
if(stage){
 const vignette=document.createElement('div');vignette.className='mm-vignette';stage.append(vignette);
 const particles=document.createElement('div');particles.className='mm-particles';stage.append(particles);
 const stinger=document.createElement('div');stinger.className='mm-stinger';stage.append(stinger);
 const burst=(count=18)=>{const box=stage.getBoundingClientRect();for(let i=0;i<count;i++){const p=document.createElement('i');p.className='mm-particle';p.style.left=(42+Math.random()*18)+'%';p.style.top=(45+Math.random()*12)+'%';p.style.setProperty('--x',((Math.random()-.5)*box.width*.55)+'px');p.style.setProperty('--y',((-40-Math.random()*box.height*.32))+'px');p.style.setProperty('--d',(650+Math.random()*650)+'ms');particles.append(p);setTimeout(()=>p.remove(),1400)}};
 const hit=()=>{stage.classList.remove('mm-hit');void stage.offsetWidth;stage.classList.add('mm-hit');setTimeout(()=>stage.classList.remove('mm-hit'),430)};
 const show=(txt,big=false)=>{stinger.textContent=txt;stinger.classList.remove('show');void stinger.offsetWidth;stinger.classList.add('show');if(big){stage.classList.add('mm-bigwin');burst(30);setTimeout(()=>stage.classList.remove('mm-bigwin'),1200)}else burst(14)};
 new MutationObserver(()=>{const t=status.textContent||'';const spinning=/spinning/i.test(t);stage.classList.toggle('mm-spinning',spinning);if(/You won/i.test(t)){const raw=parseFloat((t.match(/[\d,.]+/)||['0'])[0].replace(/,/g,''));hit();show(raw>=20?'MONSTER WIN':raw>=8?'HUGE WIN':raw>=3?'BIG WIN':'WIN',raw>=3)}if(/Bonus win/i.test(t)){hit();show('FORTUNE REVEALED',true)}}).observe(status,{childList:true,subtree:true,characterData:true});
 new MutationObserver(()=>{if(modal.open){show('FORTUNE TENT',false)}}).observe(modal,{attributes:true,attributeFilter:['open']});
 document.querySelectorAll('.cell').forEach(c=>new MutationObserver(()=>{if(c.classList.contains('winner'))hit()}).observe(c,{attributes:true,attributeFilter:['class']}));
}
