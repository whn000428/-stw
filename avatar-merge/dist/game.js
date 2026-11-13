(() => {
 'use strict';
 const {MergeWorld,RADII}=AvatarPhysics;
 const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
 const W=420,H=640,LINE=94,atlas=new Image(),sprites=[];
 const colors=['#c2d8b2','#e3ccad','#b5d5cb','#dbc9dd','#ecd98e','#a9cba4','#e5bfa1','#b5c3df','#becf90','#e6bf68','#8fb57d'];
 let world,deck=[],score=0,best=0,current=0,next=0,aim=210,readyAt=0,now=0,paused=false,over=false,won=false,loaded=false,particles=[],rings=[],danger=0,peak=0,dropCount=0,lastTime=0,acc=0,mode='',priorPaused=false,downPointer=null;
 try{best=Number(localStorage.getItem('avatar-garden-best'))||0;}catch{}
 $('best').textContent=best;
 function randomLevel(){const r=Math.random();return r<.32?0:r<.60?1:r<.82?2:r<.96?3:4;}
 function paintPortrait(el,id){const p=AVATAR_DATA.coords[id];el.style.backgroundImage=`url("${AVATAR_DATA.image}")`;el.style.backgroundSize=`${510/72*100}% ${690/72*100}%`;el.style.backgroundPosition=`${p[0]/(510-72)*100}% ${p[1]/(690-72)*100}%`;}
 function updateUI(){
  $('score').textContent=score;$('best').textContent=best;$('progress').textContent=`${peak+1} / 11`;paintPortrait($('next-avatar'),deck[next]);
  for(const el of $('ladder').children){const level=Number(el.dataset.level);el.classList.toggle('reached',level<=peak);el.classList.toggle('current',level===peak);}
 }
 function saveBest(){if(score>best){best=score;try{localStorage.setItem('avatar-garden-best',String(best));}catch{}}}
 function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('show'),2000);}
 function burst(b){
  const count=window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:16;
  for(let i=0;i<count;i++){const t=Math.random()*Math.PI*2,s=55+Math.random()*100;particles.push({x:b.x,y:b.y,vx:Math.cos(t)*s,vy:Math.sin(t)*s-40,life:.6,max:.6,color:colors[b.level],size:2+Math.random()*3});}
  rings.push({x:b.x,y:b.y,r:b.r,life:.45,color:colors[b.level]});
 }
 function merge(b){score+=Math.pow(2,b.level)*5;saveBest();burst(b);if(b.level>peak){peak=b.level;if(b.level>=5&&b.level<10)toast(`漂亮！合成第 ${b.level+1} 级`);}updateUI();
  if(b.level===10&&!won){won=true;showModal('win');}
 }
 function newGame(){
  const pool=Array.from({length:19},(_,i)=>i+1);for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  deck=pool.slice(0,10).concat(0);world=new MergeWorld(merge);score=0;peak=0;dropCount=0;danger=0;over=false;won=false;paused=false;current=randomLevel();next=randomLevel();aim=W/2;readyAt=0;now=0;particles=[];rings=[];acc=0;
  $('overlay').hidden=true;$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','暂停游戏');$('status').textContent='准备好，就落下吧';
  $('ladder').replaceChildren();deck.forEach((id,i)=>{const level=document.createElement('div');level.className='level';level.dataset.level=i;const img=document.createElement('span');img.className='portrait';img.setAttribute('role','img');img.setAttribute('aria-label',`第${i+1}级头像`);paintPortrait(img,id);const num=document.createElement('span');num.className='rank';num.textContent=String(i+1).padStart(2,'0');level.append(img,num);$('ladder').append(level);});updateUI();
 }
 function showModal(kind){
  priorPaused=paused;mode=kind;paused=true;$('overlay').hidden=false;$('secondary').hidden=kind!=='restart';
  const content={pause:['◒','暂停一下','头像们在等你回来。','继续游戏'],restart:['↻','重新开始？','本局进度将清空，头像阵容也会刷新。','开始新的一局'],gameover:['◌','差一点点！',`本局获得 ${score} 分\n最高合成第 ${peak+1} 级，再试一次吧。`,'再来一局'],win:['✦','合成这片绿！',`终极头像达成，获得 ${score} 分。\n还可以继续合成，挑战更高纪录。`,'继续挑战']}[kind];
  $('modal-icon').textContent=content[0];$('modal-title').textContent=content[1];$('modal-text').textContent=content[2];$('primary').textContent=content[3];$('primary').focus();
 }
 function resume(){paused=false;$('overlay').hidden=true;acc=0;lastTime=performance.now();$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','暂停游戏');canvas.focus({preventScroll:true});}
 $('primary').addEventListener('click',()=>{if(mode==='restart'||mode==='gameover'){newGame();canvas.focus({preventScroll:true});}else resume();});
 $('secondary').addEventListener('click',()=>{if(priorPaused){showModal('pause');}else resume();});
 $('restart').addEventListener('click',()=>{if(!loaded)return;if(!dropCount)newGame();else showModal('restart');});
 $('pause').addEventListener('click',()=>{if(!loaded||over)return;if(paused){if(mode==='pause')resume();}else showModal('pause');});
 function drop(){if(!loaded||paused||over||now<readyAt)return;const r=RADII[current];world.add(current,Math.max(r+8,Math.min(W-r-8,aim)),43,{x:0,y:20});dropCount++;peak=Math.max(peak,current);current=next;next=randomLevel();readyAt=now+.53;aim=Math.max(RADII[current]+8,Math.min(W-RADII[current]-8,aim));$('status').textContent='相同头像，碰面升级';updateUI();}
 function move(clientX){const rect=canvas.getBoundingClientRect(),r=RADII[current];aim=Math.max(r+8,Math.min(W-r-8,(clientX-rect.left)*W/rect.width));}
 canvas.addEventListener('pointerdown',e=>{if(!loaded||paused||over)return;e.preventDefault();canvas.focus({preventScroll:true});downPointer=e.pointerId;canvas.setPointerCapture(e.pointerId);move(e.clientX);});
 canvas.addEventListener('pointermove',e=>{if(!paused&&!over)move(e.clientX);});
 canvas.addEventListener('pointerup',e=>{if(e.pointerId!==downPointer)return;move(e.clientX);downPointer=null;drop();});
 canvas.addEventListener('pointercancel',()=>{downPointer=null;});
 canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight',' ','Enter'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')aim=Math.max(RADII[current]+8,aim-15);else if(e.key==='ArrowRight')aim=Math.min(W-RADII[current]-8,aim+15);else if(!e.repeat)drop();}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&loaded&&!paused&&!over)showModal('pause');});
 function avatar(id,x,y,r,alpha=1,angle=0){
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.rotate(angle);ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.clip();ctx.drawImage(sprites[id],-r,-r,r*2,r*2);ctx.restore();
 }
 function draw(){
  ctx.clearRect(0,0,W,H);const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#fbf7e8');bg.addColorStop(1,'#ece9cd');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#69875b13';for(let x=18;x<W;x+=28)for(let y=18;y<H;y+=28){ctx.beginPath();ctx.arc(x,y,1,0,Math.PI*2);ctx.fill();}
  const d=danger>0;ctx.save();ctx.strokeStyle=d?'#cf785f':'#b6bda0';ctx.lineWidth=1.3;ctx.setLineDash([5,6]);ctx.beginPath();ctx.moveTo(14,LINE);ctx.lineTo(W-14,LINE);ctx.stroke();ctx.restore();ctx.font='10px system-ui';ctx.textAlign='right';ctx.fillStyle=d?'#bc634c':'#9aa387';ctx.fillText(d?'注意，快要满了':'警戒线',W-16,LINE-9);
  if(d){ctx.fillStyle=`rgba(209,119,87,${Math.min(.13,danger*.04)})`;ctx.fillRect(0,0,W,LINE);}
  if(!loaded)return;
  if(!over){const r=RADII[current];ctx.save();ctx.setLineDash([3,7]);ctx.strokeStyle='#6f965845';ctx.beginPath();ctx.moveTo(aim,43+r+6);ctx.lineTo(aim,H-8);ctx.stroke();ctx.restore();avatar(deck[current],aim,43,r,now>=readyAt? .92:.3);ctx.beginPath();ctx.arc(aim,43,r+3,0,Math.PI*2);ctx.strokeStyle='#708a5b55';ctx.lineWidth=1;ctx.stroke();}
  for(const b of world.balls){const scale=Math.min(1,b.age/.13),r=b.r*(.80+.20*scale);ctx.save();ctx.shadowColor='#293b2428';ctx.shadowBlur=5;ctx.shadowOffsetY=3;ctx.fillStyle=colors[b.level];ctx.beginPath();ctx.arc(b.x,b.y,r,0,Math.PI*2);ctx.fill();ctx.restore();avatar(deck[b.level],b.x,b.y,r-2,1,b.angle);ctx.beginPath();ctx.arc(b.x,b.y,r-1,0,Math.PI*2);ctx.strokeStyle=colors[b.level];ctx.lineWidth=3;ctx.stroke();if(b.level===10){ctx.beginPath();ctx.arc(b.x,b.y,r+2,0,Math.PI*2);ctx.strokeStyle='#d4ac56';ctx.lineWidth=3;ctx.stroke();}}
  for(const p of particles){ctx.globalAlpha=p.life/p.max;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
  for(const r of rings){ctx.globalAlpha=r.life/.45;ctx.strokeStyle=r.color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(r.x,r.y,r.r+(1-r.life/.45)*22,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;
 }
 function tick(time){const elapsed=Math.min(.05,(time-lastTime)/1000||0);lastTime=time;if(loaded&&!paused&&!over){acc+=elapsed;while(acc>=1/120){now+=1/120;world.step(1/120);acc-=1/120;if(paused){acc=0;break;}}for(const p of particles){p.life-=elapsed;p.x+=p.vx*elapsed;p.y+=p.vy*elapsed;p.vy+=160*elapsed;}particles=particles.filter(p=>p.life>0);for(const r of rings)r.life-=elapsed;rings=rings.filter(r=>r.life>0);
  const overflowing=world.balls.some(b=>b.age>2&&b.y-b.r<LINE&&b.y>0);danger=overflowing?danger+elapsed:Math.max(0,danger-elapsed*3);if(danger>2){over=true;saveBest();showModal('gameover');}
 }draw();requestAnimationFrame(tick);}
 function resize(){const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
 window.addEventListener('resize',resize);resize();
 atlas.onload=()=>{for(const [x,y]of AVATAR_DATA.coords){const c=document.createElement('canvas');c.width=72;c.height=72;c.getContext('2d').drawImage(atlas,x,y,72,72,0,0,72,72);sprites.push(c);}paintPortrait($('goal-avatar'),0);loaded=true;newGame();};
 atlas.onerror=()=>{$('status').textContent='头像未能加载，请刷新页面';};atlas.src=AVATAR_DATA.image;requestAnimationFrame(tick);
})();
