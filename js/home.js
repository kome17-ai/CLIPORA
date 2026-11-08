/* Clipora home page animations */
(function(){
  var CFG=window.CLIPORA_CONFIG||{};
  var $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};

  /* marquee */
  var marq=$('#marq');
  if(marq){
    var words=[['scissors','Trim'],['layers','Split'],['bolt','Speed'],['text','Text'],['sparkle','Captions'],['sliders','Filters'],['music','Music'],['mic','Voiceover'],['smile','Stickers'],['film','Transitions'],['download','Export']];
    var seq='';words.forEach(function(w){seq+='<span><svg class="i"><use href="#i-'+w[0]+'"/></svg>'+w[1]+'</span>'});
    marq.innerHTML=seq+seq+seq+seq;
  }

  /* hero live preview */
  var slides=$$('#slides .slide'), cap=$('#cap'), ph=$('#ph'), tnow=$('#tnow');
  if(slides.length){
    var labels=['Edit.','Create.','Inspire.','Clipora'], LOOP=8000, cur=-1, t0=performance.now();
    var tick=function(){
      var p=((performance.now()-t0)%LOOP)/LOOP, idx=Math.floor(p*slides.length);
      ph.style.left=(p*100)+'%';tnow.textContent='0:0'+Math.floor(p*8);
      if(idx!==cur){cur=idx;slides.forEach(function(s,i){s.classList.toggle('on',i===idx)});cap.textContent=labels[idx];cap.classList.remove('bump');void cap.offsetWidth;cap.classList.add('bump')}
    };
    tick();setInterval(tick,60);
  }

  /* optional hero video */
  var hv=$('#heroVideo');
  if(hv){
    hv.addEventListener('canplay',function(){hv.classList.add('on');var p=hv.play();if(p&&p.catch){p.catch(function(){})}});
    hv.addEventListener('error',function(){hv.remove()});
    hv.src=CFG.heroVideo||'assets/video/hero.mp4';
  }

  /* pointer tilt */
  var tilt=$('#tilt');
  if(tilt&&window.matchMedia('(hover:hover) and (pointer:fine)').matches&&!window.matchMedia('(prefers-reduced-motion:reduce)').matches){
    var stage=$('.stage');
    stage.addEventListener('pointermove',function(e){var r=stage.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;tilt.style.transform='perspective(1100px) rotateY('+(x*14)+'deg) rotateX('+(-y*10)+'deg)'});
    stage.addEventListener('pointerleave',function(){tilt.style.transform=''});
  }

  /* typed line */
  var typed=$('#typed');
  if(typed){
    var lines=['Your story starts here','Add a title in seconds','Make it yours'], li=0, ci=0, del=false;
    var type=function(){
      var s=lines[li];typed.firstChild.nodeValue=s.slice(0,ci);
      if(!del&&ci<s.length){ci++;setTimeout(type,70)}
      else if(!del){del=true;setTimeout(type,1500)}
      else if(ci>0){ci--;setTimeout(type,30)}
      else{del=false;li=(li+1)%lines.length;setTimeout(type,300)}
    };
    typed.textContent='';typed.appendChild(document.createTextNode(''));type();
  }

  /* tool tabs */
  var tabs=$$('#tabs .tab');
  if(tabs.length){
    var TOOLS={
      trim:'<div class="trimbar"><div class="strip g1"></div><div class="strip g5"></div><div class="strip g3"></div></div><div class="acts"><span>Split</span><span>Delete</span><span>Speed</span><span>Reverse</span></div>',
      text:'<div class="chips" style="margin:0 0 3cqw"><span class="on">Bold</span><span>Neon</span><span>Outline</span><span>Typewriter</span></div><div class="acts"><span>Aa Font</span><span>Color</span><span>Animate</span></div>',
      music:'<div class="track"><div class="disc g1"></div><div><b>Night drive</b><small>Electronic</small></div><em>Add</em></div><div class="track"><div class="disc g2"></div><div><b>Golden hour</b><small>Chill</small></div><em>Add</em></div><div class="slider" style="margin:3cqw 1cqw 0"><small><span>Volume</span><span>70</span></small><div></div></div>',
      fx:'<div class="etiles" style="padding:0"><div class="on"><i class="g1"></i>Neon</div><div><i class="g2"></i>Cool</div><div><i class="g4"></i>Warm</div></div><div class="slider" style="margin:3cqw 1cqw 0"><small><span>Intensity</span><span>62</span></small><div></div></div>'
    };
    var panel=$('#dpanel'), dtxt=$('#dtxt'), dprev=$('#dprev'), grads={trim:'g8',text:'g5',music:'g1',fx:'g4'};
    var show=function(k){panel.innerHTML=TOOLS[k];dtxt.style.display=k==='text'?'block':'none';dprev.className='pv big '+grads[k];tabs.forEach(function(t){t.setAttribute('aria-selected',t.getAttribute('data-k')===k)})};
    tabs.forEach(function(t){t.addEventListener('click',function(){show(t.getAttribute('data-k'))})});
    show('trim');
  }

  /* studio carousel arrows */
  var sc=$('#scroller');
  if(sc){
    var step=function(d){sc.scrollBy({left:d*316,behavior:'smooth'})};
    $('#prev').addEventListener('click',function(){step(-1)});
    $('#next').addEventListener('click',function(){step(1)});
  }
})();
