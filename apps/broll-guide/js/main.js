/* Theme toggle */
(function(){
  var t=document.getElementById('themeToggle');
  if(!t)return;
  var h=document.documentElement;
  t.addEventListener('click',function(){
    var isLight=h.getAttribute('data-theme')==='light';
    if(isLight){h.removeAttribute('data-theme');try{localStorage.setItem('rl-theme','dark')}catch(e){}}
    else{h.setAttribute('data-theme','light');try{localStorage.setItem('rl-theme','light')}catch(e){}}
  });
})();

/* Sidebar hamburger + active link tracking */
(function(){
  var ham=document.getElementById('hamburger');
  var sb=document.getElementById('sidebar');
  var ov=document.getElementById('sidebar-overlay');
  if(!ham||!sb||!ov)return;
  ham.addEventListener('click',function(){ham.classList.toggle('open');sb.classList.toggle('open');ov.classList.toggle('open')});
  ov.addEventListener('click',function(){ham.classList.remove('open');sb.classList.remove('open');ov.classList.remove('open')});
  sb.querySelectorAll('.toc-link').forEach(function(l){l.addEventListener('click',function(){if(window.innerWidth<=900){ham.classList.remove('open');sb.classList.remove('open');ov.classList.remove('open')}})});

  /* Highlight current page group */
  var page=document.body.getAttribute('data-page');
  if(page){
    var groups=sb.querySelectorAll('.toc-group');
    groups.forEach(function(g){
      var links=g.querySelectorAll('.toc-link');
      links.forEach(function(l){
        var href=l.getAttribute('href')||'';
        if(href.indexOf(page)===0||href===page){
          g.classList.add('current');
        }
      });
    });
  }

  /* IntersectionObserver for same-page sections */
  var secs=document.querySelectorAll('section[id]');
  var links=document.querySelectorAll('.toc-link');
  if(secs.length>0){
    var obs=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){links.forEach(function(l){l.classList.remove('active')});var active=sb.querySelector('a[href$="#'+entry.target.id+'"]');if(active)active.classList.add('active')}})},{rootMargin:'-20% 0px -70% 0px'});
    secs.forEach(function(s){obs.observe(s)});
  }
})();

/* Duration calculator slider */
(function(){
  var slider=document.getElementById('durSlider');
  if(!slider)return;
  function update(){
    var m=parseInt(slider.value,10);
    document.getElementById('durVal').textContent=m;
    var bLo=Math.round(m*5),bHi=Math.round(m*6);
    var sLo=Math.round(m*3.7),sHi=Math.round(m*4.5);
    var cLo=Math.max(1,Math.round(m*0.07)),cHi=Math.min(Math.max(1,Math.round(m*0.2)),5);
    if(cLo>cHi)cLo=cHi;
    var aLo=Math.max(1,Math.round(m*0.27)),aHi=Math.max(1,Math.round(m*0.4));
    if(aLo>aHi)aLo=aHi;
    var totalLo=bLo+sLo+cLo+aLo,totalHi=bHi+sHi+cHi+aHi;
    document.getElementById('calcBroll').textContent=bLo+' \u2013 '+bHi;
    document.getElementById('calcStills').textContent=sLo+' \u2013 '+sHi;
    document.getElementById('calcCustom').textContent=cLo+(cLo===cHi?'':' \u2013 '+cHi);
    document.getElementById('calcAudio').textContent=aLo+(aLo===aHi?'':' \u2013 '+aHi);
    document.getElementById('calcTotal').textContent='~'+Math.round((totalLo+totalHi)/2);
  }
  slider.addEventListener('input',update);
  update();
})();
