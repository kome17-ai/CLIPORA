/* Clipora site: shared script (menus, forms, filters, reveal). Settings live in js/config.js */
var CFG = window.CLIPORA_CONFIG || {};
(function(){
  var $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};

  /* nav */
  var nav=$('#nav'), burger=$('#burger'), drawer=$('#drawer');
  function onScroll(){if(nav)nav.classList.toggle('solid',window.scrollY>24||nav.hasAttribute('data-solid'))}
  if(nav){if(nav.classList.contains('solid'))nav.setAttribute('data-solid','');onScroll();window.addEventListener('scroll',onScroll,{passive:true})}
  if(burger){burger.addEventListener('click',function(){var o=drawer.classList.toggle('open');burger.setAttribute('aria-expanded',o)})}
  $$('#drawer a').forEach(function(a){a.addEventListener('click',function(){drawer.classList.remove('open')})});

  /* dropdowns (click for touch, hover is CSS) */
  var dds=$$('.dd');
  dds.forEach(function(d){
    var b=$('.ddb',d);
    b.addEventListener('click',function(e){e.stopPropagation();var o=!d.classList.contains('open');dds.forEach(function(x){x.classList.remove('open');$('.ddb',x).setAttribute('aria-expanded',false)});d.classList.toggle('open',o);b.setAttribute('aria-expanded',o)});
  });
  document.addEventListener('click',function(){dds.forEach(function(x){x.classList.remove('open');$('.ddb',x).setAttribute('aria-expanded',false)})});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){dds.forEach(function(x){x.classList.remove('open')});if(drawer)drawer.classList.remove('open')}});

  /* footer accordions (mobile) */
  $$('.fh').forEach(function(h){h.addEventListener('click',function(){if(window.innerWidth>760)return;var c=h.parentNode,o=c.classList.toggle('open');h.setAttribute('aria-expanded',o)})});

  /* waveforms */
  function fillWave(el,n){var h='';for(var i=0;i<n;i++){var v=18+Math.abs(Math.sin(i*1.7)*60)+((i*37)%23);h+='<s style="height:'+Math.min(100,v)+'%"></s>'}el.innerHTML=h}
  $$('[data-wave]').forEach(function(el){fillWave(el,+el.getAttribute('data-wave'))});
  $$('.voicewave').forEach(function(el){$$('s',el).forEach(function(s,i){s.style.animationDelay=(i*50)+'ms'})});
  $$('[data-eq]').forEach(function(el){var n=+el.getAttribute('data-eq'),h='';for(var i=0;i<n;i++){var v=25+Math.abs(Math.sin(i*1.3)*75);h+='<s style="height:'+v+'%;animation-delay:'+(i*60)+'ms"></s>'}el.innerHTML=h});

  /* reveal on scroll */
  var rv=$$('.rv');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    rv.forEach(function(el,i){el.style.transitionDelay=((i%4)*70)+'ms';io.observe(el)});
  }else{rv.forEach(function(el){el.classList.add('in')})}

  /* sticky get bar hides near forms */
  var bar=$('#getbar'), wl=$$('.js-wait');
  if(bar&&wl.length&&'IntersectionObserver' in window){
    var vis=0,io2=new IntersectionObserver(function(es){es.forEach(function(e){vis+=e.isIntersecting?1:-1});bar.classList.toggle('hide',vis>0)},{threshold:.2});
    wl.forEach(function(f){io2.observe(f)});
  }

  /* waitlist forms */
  $$('.js-wait').forEach(function(form){
    var email=$('input',form), msg=form.nextElementSibling;
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var v=email.value.trim();
      if(!/^\S+@\S+\.\S+$/.test(v)){msg.className='msg err';msg.textContent='Enter a valid email address, like name@example.com.';email.focus();return}
      var btn=$('button',form);btn.disabled=true;
      var done=function(){
        try{var l=JSON.parse(localStorage.getItem('clipora_waitlist')||'[]');l.push({email:v,at:Date.now()});localStorage.setItem('clipora_waitlist',JSON.stringify(l))}catch(x){}
        msg.className='msg ok';msg.textContent='You are on the list. We will email you when Clipora opens.';form.reset();btn.disabled=false;
      };
      var payload={email:v,source:form.getAttribute('data-source')||'clipora-site',at:new Date().toISOString()};
      var fail=function(){msg.className='msg err';msg.textContent='Could not join the waitlist. Check your connection and try again.';btn.disabled=false};
      var url=CFG.firebaseDbUrl?CFG.firebaseDbUrl.replace(/\/$/,'')+'/waitlist.json':CFG.waitlistEndpoint;
      if(url){fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(function(r){if(!r.ok){throw new Error(r.status)}done()}).catch(fail)}else{done()}
    });
  });

  /* filters + search on tools and templates */
  var grid=$('#grid'), chips=$$('#chips .fchip'), q=$('#q'), empty=$('#empty');
  if(grid){
    var items=$$('#grid > *'), cur='all';
    var apply=function(){
      var t=q?q.value.trim().toLowerCase():'',n=0;
      items.forEach(function(it){
        var okc=cur==='all'||it.getAttribute('data-cat')===cur;
        var oks=!t||(it.getAttribute('data-search')||'').indexOf(t)>-1;
        var show=okc&&oks;it.hidden=!show;if(show)n++;
      });
      if(empty)empty.hidden=n>0;
    };
    chips.forEach(function(c){c.addEventListener('click',function(){cur=c.getAttribute('data-f');chips.forEach(function(x){x.classList.toggle('on',x===c)});apply()})});
    if(q)q.addEventListener('input',apply);
    var m=/[?&]c=(\w+)/.exec(location.search);
    if(m){var c=chips.filter(function(x){return x.getAttribute('data-f')===m[1]})[0];if(c)c.click()}
  }

  /* help center search */
  var hq=$('#hq');
  if(hq){
    var hs=$$('.hq'), hg=$$('.hgroup'), he=$('#hempty');
    hq.addEventListener('input',function(){
      var t=hq.value.trim().toLowerCase(),n=0;
      hs.forEach(function(d){var s=!t||d.getAttribute('data-t').indexOf(t)>-1;d.hidden=!s;if(s)n++;if(t&&s)d.open=true});
      hg.forEach(function(g){g.hidden=!$$('.hq:not([hidden])',g).length});
      he.hidden=n>0;
    });
  }

  /* contact form opens the visitor's mail app */
  var cf=$('#cform');
  if(cf){
    cf.addEventListener('submit',function(e){
      e.preventDefault();var f=cf.elements,m=$('#cmsg');
      if(!f.name.value.trim()||!/^\S+@\S+\.\S+$/.test(f.email.value.trim())||!f.msg.value.trim()){m.className='msg err';m.textContent='Please fill in your name, a valid email and a message.';return}
      var body=f.msg.value+'\n\n'+f.name.value+' ('+f.email.value+')';
      location.href='mailto:rejoicejentalia@gmail.com?subject='+encodeURIComponent('Clipora website message from '+f.name.value)+'&body='+encodeURIComponent(body);
      m.className='msg ok';m.textContent='Your mail app should open with the message ready to send.';
    });
  }
})();
