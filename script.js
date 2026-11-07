(() => {
  'use strict';
  const levels = [
    { title:'تجميع الصاروخ', icon:'🧩', badge:'مهمة سهلة', instruction:'اسحب أجزاء الصاروخ إلى أماكنها الصحيحة!', hint:'💡 ابدأ بالكبسولة من أعلى الصاروخ.', fact:'عشان نطلع للفضاء، محتاجين محركات قوية جداً تتغلب على حاجة اسمها (الجاذبية الأرضية) اللي بتشدنا لتحت!' },
    { title:'القمر الصناعي', icon:'🛰️', badge:'اختبر توقيتك', instruction:'اضغط زر إطلاق القمر الصناعي عندما يدخل الصاروخ المنطقة الخضراء!', hint:'💡 تابع الصاروخ بعينيك واضغط في اللحظة المناسبة.', fact:'الأقمار الصناعية بتلف في المدار عشان تشغل لنا الإنترنت، التليفزيون، وتعرفنا حالة الطقس!' },
    { title:'هبوط على القمر', icon:'🌙', badge:'تحكّم بحذر', instruction:'اضغط باستمرار على زر الدفع لتبطّئ المركبة وتهبط بأمان!', hint:'💡 اضغط نبضات قصيرة قرب سطح القمر.', fact:'جاذبية القمر ضعيفة جداً! لو وزنك على الأرض 30 كيلو، على القمر هيكون 5 كيلو بس!' },
    { title:'حزام الكويكبات', icon:'☄️', badge:'تجنّب الاصطدام', instruction:'حرّك سفينتك يميناً ويساراً لتفادي خمسة كويكبات!', hint:'💡 استخدم الأسهم أو الزرين، ويمكنك أيضاً لمس الشاشة يميناً ويساراً.', fact:'بين كوكب المريخ والمشترى في ملايين الصخور الفضائية اسمها (الكويكبات)!' },
    { title:'هبوط على المريخ', icon:'🔴', badge:'مهمة أخيرة', instruction:'اختر الكوكب الأحمر، المريخ، لتهبط عليه بالمركبة الجوالة!', hint:'💡 أي كوكب لونه أحمر؟ اضغط عليه!', fact:'المريخ لونه أحمر عشان ترابه مليان حديد مصدي! والمشترى هو أكبر كوكب.' }
  ];
  const $ = s => document.querySelector(s);
  const playfield = $('#playfield');
  let current = 0, cleanup = () => {}, audioOn = true, audioCtx;
  const digits = n => String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  const setText = (id, value) => { $(id).textContent = value; };
  function beep(freq=660,duration=.09){ if(!audioOn)return; try { audioCtx ||= new (window.AudioContext||window.webkitAudioContext)(); const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);o.frequency.value=freq;g.gain.setValueAtTime(.07,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.start();o.stop(audioCtx.currentTime+duration); } catch(_){} }
  function dots(){ $('#levelDots').innerHTML=levels.map((_,i)=>`<span class="${i<current?'done':i===current?'current':''}"></span>`).join(''); }
  function loadLevel(index){
    cleanup(); cleanup=()=>{}; current=index; const l=levels[index];
    $('#homeScreen').classList.remove('active'); $('#gameScreen').classList.add('active');
    setText('#levelKicker',`المهمة ${digits(index+1)} من ${digits(5)}`); setText('#levelTitle',l.title); setText('#progressText',`${digits(index+1)} / ${digits(5)}`);
    $('#progressFill').style.width=`${(index+1)*20}%`; setText('#missionIcon',l.icon);setText('#instruction',l.instruction);setText('#hintText',l.hint);setText('#missionBadge',l.badge);dots();
    playfield.innerHTML='';
    [levelAssembly,levelOrbit,levelMoon,levelAsteroids,levelMars][index]();
  }
  function win(){cleanup();cleanup=()=>{};beep(880,.18);setText('#modalSubtitle',`أتممت مهمة ${levels[current].title} بنجاح!`);setText('#factText',levels[current].fact);$('#modalEmoji').textContent=['🚀','🛰️','🌙','☄️','🔴'][current];$('#nextButton').innerHTML=current===4?'إنهاء الرحلة <span>✦</span>':'المهمة التالية <span>←</span>';$('#successModal').hidden=false;}
  function showHome(){cleanup();cleanup=()=>{};$('#successModal').hidden=true;$('#completeModal').hidden=true;$('#gameScreen').classList.remove('active');$('#homeScreen').classList.add('active');}
  function levelAssembly(){
    playfield.innerHTML=`<div class="assembly-area"><div class="rocket-slots"><div class="slot capsule" data-part="capsule"><span>الكبسولة</span></div><div class="slot tank" data-part="tank"><span>خزان الوقود</span></div><div class="slot engine" data-part="engine"><span>المحرك</span></div></div></div><div class="part-tray"><div class="part-card" data-part="engine"><span class="part-art">🔥</span><small>المحرك</small></div><div class="part-card" data-part="capsule"><span class="part-art">🧑‍🚀</span><small>الكبسولة</small></div><div class="part-card" data-part="tank"><span class="part-art">🛢️</span><small>خزان الوقود</small></div></div>`;
    let count=0; const cards=[...playfield.querySelectorAll('.part-card')];
    cards.forEach(card=>card.addEventListener('pointerdown',e=>{if(card.dataset.done)return;e.preventDefault();const field=playfield.getBoundingClientRect(),r=card.getBoundingClientRect();card.classList.add('dragging');card.style.position='absolute';card.style.zIndex='5';card.style.width=`${r.width}px`;card.style.left=`${r.left-field.left}px`;card.style.top=`${r.top-field.top}px`;card.style.margin='0';const ox=e.clientX-r.left,oy=e.clientY-r.top;card.setPointerCapture(e.pointerId);
      const move=ev=>{card.style.left=`${ev.clientX-field.left-ox}px`;card.style.top=`${ev.clientY-field.top-oy}px`;};
      const up=ev=>{card.removeEventListener('pointermove',move);card.removeEventListener('pointerup',up);card.classList.remove('dragging');const slot=[...playfield.querySelectorAll('.slot')].find(s=>s.dataset.part===card.dataset.part);const sr=slot.getBoundingClientRect(),cr=card.getBoundingClientRect();if(Math.abs((sr.left+sr.width/2)-(cr.left+cr.width/2))<100&&Math.abs((sr.top+sr.height/2)-(cr.top+cr.height/2))<90){slot.classList.add('filled');slot.innerHTML=`<span>${card.dataset.part==='capsule'?'🧑‍🚀':card.dataset.part==='tank'?'🛢️':'🔥'}</span>`;card.dataset.done='1';card.style.display='none';count++;beep(550+count*100,.08);if(count===3)setTimeout(win,450);}else{card.style.cssText='';}};
      card.addEventListener('pointermove',move);card.addEventListener('pointerup',up);}));
  }
  function levelOrbit(){
    playfield.innerHTML=`<div class="launch-scene"><div class="launch-track"></div><div class="orbit-zone">🟢 المدار — اضغط هنا!</div><div class="launch-rocket">🚀</div><div class="launch-status">استعد لإطلاق القمر الصناعي</div><button class="deploy-button">إطلاق القمر 🛰️</button></div>`;
    const rocket=$('.launch-rocket'),button=$('.deploy-button'),status=$('.launch-status');let start=performance.now(),active=true,raf;
    const tick=t=>{if(!active)return;const dur=9000,phase=((t-start)%dur)/dur;rocket.style.bottom=`${29+phase*230}px`;raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);
    button.addEventListener('click',()=>{if(!active)return;const r=rocket.getBoundingClientRect(),z=$('.orbit-zone').getBoundingClientRect(),center=r.top+r.height/2;if(center>z.top-25&&center<z.bottom+25){active=false;button.disabled=true;status.textContent='رائع! القمر الصناعي دخل مداره!';rocket.textContent='🛰️';beep(900,.2);setTimeout(win,650);}else{status.textContent=center>z.bottom?'لسه بدري! انتظر حتى يصل للمنطقة الخضراء.':'فاتتك اللحظة! حاول مرة أخرى.';beep(230,.12);}});
    cleanup=()=>{active=false;cancelAnimationFrame(raf);};
  }
  function levelMoon(){
    playfield.innerHTML=`<div class="moon-scene"><div class="altitude-label">ارتفاع المركبة <b id="altNum">١٠٠</b>%</div><div class="altitude-bar"><div class="altitude-fill"></div></div><div class="lander">🛸</div><div class="landing-zone"></div><div class="moon-surface"><div class="crater c1"></div><div class="crater c2"></div></div><button class="thruster-button">🔥 اضغط باستمرار للدفع</button></div>`;
    let altitude=100,done=false,raf,last=performance.now(),holding=false;const lander=$('.lander'),fill=$('.altitude-fill'),btn=$('.thruster-button'),label=$('#altNum');
    const down=e=>{e.preventDefault();holding=true;btn.classList.add('active');};const up=()=>{holding=false;btn.classList.remove('active');};btn.addEventListener('pointerdown',down);window.addEventListener('pointerup',up);btn.addEventListener('pointerleave',up);
    const tick=t=>{if(done)return;const dt=Math.min((t-last)/1000,.06);last=t;altitude-=dt*(holding?5:12);if(altitude<=0){altitude=0;done=true;lander.style.top='';lander.textContent='💥';setText('#hintText','💫 ارتطمت المركبة! أعد المحاولة مع الدفع لفترة أطول.');setTimeout(()=>{if(current===2&&!$('#successModal').hidden)return;loadLevel(2);},1300);return;}label.textContent=digits(Math.ceil(altitude));fill.style.width=`${altitude}%`;lander.style.top=`${37+(100-altitude)*1.8}px`;if(altitude<13){done=true;lander.textContent='🛸';lander.style.top='';beep(780,.18);setTimeout(win,500);return;}raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);
    cleanup=()=>{done=true;cancelAnimationFrame(raf);window.removeEventListener('pointerup',up);};
  }
  function levelAsteroids(){
    playfield.innerHTML=`<div class="asteroid-scene"><div class="lane-mark"></div><div class="asteroid-counter">الكويكبات: <b>٠ / ٥</b></div><div class="ship">🚀</div><div class="dodge-controls"><button data-dir="-1" aria-label="تحرك يساراً">←</button><button data-dir="1" aria-label="تحرك يميناً">→</button></div></div>`;
    const scene=$('.asteroid-scene'),ship=$('.ship'),counter=$('.asteroid-counter b');let lane=1,hit=0,live=true,objs=[],raf,last=performance.now(),spawn=0;
    const positions=[20,50,80];function shift(d){lane=Math.max(0,Math.min(2,lane+d));ship.style.left=`${positions[lane]}%`;}
    playfield.querySelectorAll('[data-dir]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();shift(+b.dataset.dir);});});
    scene.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;const r=scene.getBoundingClientRect();shift(e.clientX<r.left+r.width/2?-1:1);});
    const key=e=>{if(e.key==='ArrowLeft'||e.key==='a')shift(-1);if(e.key==='ArrowRight'||e.key==='d')shift(1);};window.addEventListener('keydown',key);
    const makeRock=()=>{const el=document.createElement('div');el.className='asteroid';el.textContent=['☄️','🪨','☄️'][Math.floor(Math.random()*3)];const laneAt=Math.floor(Math.random()*3);el.dataset.lane=laneAt;el.style.left=`${positions[laneAt]}%`;scene.appendChild(el);objs.push({el,lane:laneAt,y:-48});};
    const tick=t=>{if(!live)return;const dt=Math.min((t-last)/1000,.06);last=t;spawn+=dt;if(spawn>1.22&&hit<5){spawn=0;makeRock();}objs=objs.filter(o=>{o.y+=dt*180;o.el.style.top=`${o.y}px`;if(o.y>scene.clientHeight-102&&o.y<scene.clientHeight-38&&o.lane===lane){live=false;o.el.textContent='💥';setText('#hintText','اصطدمت بكويكب! حاول تفاديه في المرة القادمة.');setTimeout(()=>{if(current===3&&!$('#successModal').hidden)return;loadLevel(3);},1100);return true;}if(o.y>scene.clientHeight){o.el.remove();hit++;counter.textContent=`${digits(hit)} / ${digits(5)}`;beep(500+hit*50,.07);if(hit>=5){live=false;setTimeout(win,350);}return false;}return true;});if(live)raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);
    cleanup=()=>{live=false;cancelAnimationFrame(raf);window.removeEventListener('keydown',key);};
  }
  function levelMars(){
    playfield.innerHTML=`<div class="mars-scene"><div class="planet-caption">أيّ كوكب هو المريخ؟</div><div class="mars-ground"></div><button class="planet-choice" data-answer="mars" aria-label="الكوكب الأحمر: المريخ"><span class="planet-ball red"></span><span>المريخ</span></button><button class="planet-choice" data-answer="blue" aria-label="كوكب أزرق"><span class="planet-ball blue"></span><span>نبتون</span></button><button class="planet-choice" data-answer="ring" aria-label="كوكب ذو حلقات"><span class="planet-ball ringed"></span><span>زحل</span></button><div class="rover">🚙</div></div>`;
    playfield.querySelectorAll('.planet-choice').forEach(btn=>btn.addEventListener('click',()=>{if(btn.dataset.answer==='mars'){btn.classList.add('selected');$('.rover').style.display='block';setText('#hintText','اختيار رائع! هبطت المركبة الجوالة على المريخ!');beep(880,.18);setTimeout(win,800);}else{setText('#hintText','جرّب مرة أخرى! ابحث عن الكوكب الأحمر.');btn.animate([{transform:'translateX(0)'},{transform:'translateX(-8px)'},{transform:'translateX(8px)'},{transform:'translateX(0)'}],{duration:260});beep(240,.1);}}));
  }
  $('#playButton').addEventListener('click',()=>{beep();loadLevel(0);});$('#homeButton').addEventListener('click',showHome);
  $('#nextButton').addEventListener('click',()=>{ $('#successModal').hidden=true;if(current===4){$('#completeModal').hidden=false;}else loadLevel(current+1); });
  $('#replayButton').addEventListener('click',()=>{$('#successModal').hidden=true;loadLevel(current);});
  $('#restartButton').addEventListener('click',()=>{$('#completeModal').hidden=true;loadLevel(0);});$('#finishHomeButton').addEventListener('click',showHome);
  $('#soundToggle').addEventListener('click',e=>{audioOn=!audioOn;e.currentTarget.textContent=audioOn?'♫':'♪';e.currentTarget.setAttribute('aria-label',audioOn?'إيقاف الصوت':'تشغيل الصوت');if(audioOn)beep();});
})();
