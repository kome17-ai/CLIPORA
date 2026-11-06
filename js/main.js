/* Clipora site script. Settings live in js/config.js */
var CFG = window.CLIPORA_CONFIG || {};

(function(){
  var $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};

  /* nav */
  var nav=$('#nav'), burger=$('#burger'), drawer=$('#drawer');
  function onScroll(){nav.classList.toggle('solid',window.scrollY>24)}
  onScroll();window.addEventListener('scroll',onScroll,{passive:true});
  burger.addEventListener('click',function(){var o=drawer.classList.toggle('open');burger.setAttribute('aria-expanded',o)});
  $$('#drawer a').forEach(function(a){a.addEventListener('click',function(){drawer.classList.remove('open');burger.setAttribute('aria-expanded',false)})});

  /* waveforms */
  function fillWave(el,n){var h='';for(var i=0;i<n;i++){var v=18+Math.abs(Math.sin(i*1.7)*60)+((i*37)%23);h+='<s style="height:'+Math.min(100,v)+'%"></s>'}el.innerHTML=h}
  $$('[data-wave]').forEach(function(el){fillWave(el,+el.dataset.wave)});
  $$('[data-eq]').forEach(function(el){var n=+el.dataset.eq,h='';for(var i=0;i<n;i++){var v=25+Math.abs(Math.sin(i*1.3)*75);h+='<s style="height:'+v+'%;animation-delay:'+(i*60)+'ms"></s>'}el.innerHTML=h});

  /* marquee */
  var words=[['scissors','Trim'],['layers','Split'],['bolt','Speed'],['text','Text'],['sparkle','Captions'],['sliders','Filters'],['music','Music'],['mic','Voiceover'],['smile','Stickers'],['film','Transitions'],['download','Export']];
  var seq='';words.forEach(function(w){seq+='<span><svg class="i"><use href="#i-'+w[0]+'"/></svg>'+w[1]+'</span>'});
  $('#marq').innerHTML=seq+seq+seq+seq;

  /* hero live preview: slides, caption, playhead and clock stay in sync */
  var slides=$$('#slides .slide'), cap=$('#cap'), ph=$('#ph'), tnow=$('#tnow');
  var labels=['Edit.','Create.','Inspire.','Clipora'], LOOP=8000, cur=-1, t0=performance.now();
  function tick(){
    var p=((performance.now()-t0)%LOOP)/LOOP, idx=Math.floor(p*slides.length);
    ph.style.left=(p*100)+'%';
    tnow.textContent='0:0'+Math.floor(p*8);
    if(idx!==cur){
      cur=idx;
      slides.forEach(function(s,i){s.classList.toggle('on',i===idx)});
      cap.textContent=labels[idx];cap.classList.remove('bump');void cap.offsetWidth;cap.classList.add('bump');
    }
  }
  tick();setInterval(tick,60);


  /* optional hero video: if assets/video/hero.mp4 exists it plays inside the phone */
  var hv=$('#heroVideo');
  if(hv){
    hv.addEventListener('canplay',function(){hv.classList.add('on');var p=hv.play();if(p&&p.catch){p.catch(function(){})}});
    hv.addEventListener('error',function(){hv.remove()});
    hv.src=CFG.heroVideo||'assets/video/hero.mp4';
  }

  /* pointer tilt (desktop only) */
  var tilt=$('#tilt');
  if(window.matchMedia('(hover:hover) and (pointer:fine)').matches && !window.matchMedia('(prefers-reduced-motion:reduce)').matches){
    var stage=$('.stage');
    stage.addEventListener('pointermove',function(e){var r=stage.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;tilt.style.transform='perspective(1100px) rotateY('+(x*14)+'deg) rotateX('+(-y*10)+'deg)'});
    stage.addEventListener('pointerleave',function(){tilt.style.transform=''});
  }

  /* typed line in the captions tile */
  var typed=$('#typed'), lines=['Your story starts here','Add a title in seconds','Make it yours'], li=0, ci=0, del=false;
  function type(){
    var s=lines[li];
    typed.firstChild.nodeValue=s.slice(0,ci);
    if(!del&&ci<s.length){ci++;setTimeout(type,70)}
    else if(!del){del=true;setTimeout(type,1500)}
    else if(ci>0){ci--;setTimeout(type,30)}
    else{del=false;li=(li+1)%lines.length;setTimeout(type,300)}
  }
  typed.textContent='';typed.appendChild(document.createTextNode(''));type();

  /* tool tabs */
  var TOOLS={
    trim:'<div class="trimbar"><div class="strip g1"></div><div class="strip g5"></div><div class="strip g3"></div></div><div class="acts"><span>Split</span><span>Delete</span><span>Speed</span><span>Reverse</span></div>',
    text:'<div class="chips" style="margin:0 0 3cqw"><span class="on">Bold</span><span>Neon</span><span>Outline</span><span>Typewriter</span></div><div class="acts"><span>Aa Font</span><span>Color</span><span>Animate</span></div>',
    music:'<div class="track"><div class="disc g1"></div><div><b>Night drive</b><small>Electronic</small></div><em>Add</em></div><div class="track"><div class="disc g2"></div><div><b>Golden hour</b><small>Chill</small></div><em>Add</em></div><div class="slider" style="margin:3cqw 1cqw 0"><small><span>Volume</span><span>70</span></small><div></div></div>',
    fx:'<div class="etiles" style="padding:0"><div class="on"><i class="g1"></i>Neon</div><div><i class="g2"></i>Cool</div><div><i class="g4"></i>Warm</div></div><div class="slider" style="margin:3cqw 1cqw 0"><small><span>Intensity</span><span>62</span></small><div></div></div>'
  };
  var panel=$('#dpanel'), dtxt=$('#dtxt'), dprev=$('#dprev'), grads={trim:'g8',text:'g5',music:'g1',fx:'g4'};
  function show(k){
    panel.innerHTML=TOOLS[k];
    dtxt.style.display=k==='text'?'block':'none';
    dprev.className='pv big '+grads[k];
    $$('#tabs .tab').forEach(function(t){t.setAttribute('aria-selected',t.dataset.k===k)});
  }
  $$('#tabs .tab').forEach(function(t){t.addEventListener('click',function(){show(t.dataset.k)})});
  show('trim');

  /* waitlist */
  var form=$('#form'), email=$('#email'), msg=$('#msg');
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var v=email.value.trim();
    if(!/^\S+@\S+\.\S+$/.test(v)){msg.className='msg err';msg.textContent='Enter a valid email address, like name@example.com.';email.focus();return}
    var btn=form.querySelector('button');btn.disabled=true;
    var done=function(){
      try{var l=JSON.parse(localStorage.getItem('clipora_waitlist')||'[]');l.push({email:v,at:Date.now()});localStorage.setItem('clipora_waitlist',JSON.stringify(l))}catch(x){}
      msg.className='msg ok';msg.textContent='You are on the list. We will email you when Clipora opens.';form.reset();btn.disabled=false;
    };
    var payload={email:v,source:'clipora-site',at:new Date().toISOString()};
    var fail=function(){msg.className='msg err';msg.textContent='Could not join the waitlist. Check your connection and try again.';btn.disabled=false};
    var url=CFG.firebaseDbUrl?CFG.firebaseDbUrl.replace(/\/$/,'')+'/waitlist.json':CFG.waitlistEndpoint;
    if(url){
      fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
        .then(function(r){if(!r.ok){throw new Error(r.status)}done()})
        .catch(fail);
    }else{done()}
  });
})();
