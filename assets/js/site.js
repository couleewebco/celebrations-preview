(function(){
  var B=document.documentElement.getAttribute('data-base')||'';
  var d=document,$=function(s,r){return (r||d).querySelector(s)},$$=function(s,r){return [].slice.call((r||d).querySelectorAll(s))};
  // header: scrolled state + mobile menu
  var onS=function(){d.body.classList.toggle('scrolled',window.scrollY>60)};onS();window.addEventListener('scroll',onS,{passive:true});
  var mb=$('.menu-btn'),nav=$('#nav');
  if(mb)mb.addEventListener('click',function(){var o=nav.classList.toggle('open');mb.setAttribute('aria-expanded',o)});
  $$('.sub-toggle').forEach(function(b){b.addEventListener('click',function(){var li=b.parentNode,o=li.classList.toggle('open');b.setAttribute('aria-expanded',o)})});
  // YouTube facade
  $$('.yt').forEach(function(y){y.addEventListener('click',function(){var f=d.createElement('iframe');f.src='https://www.youtube-nocookie.com/embed/'+y.dataset.yt+'?autoplay=1&rel=0';f.allow='autoplay; encrypted-media; picture-in-picture';f.allowFullscreen=true;f.title='Video';y.innerHTML='';y.appendChild(f)})});
  // lightbox
  var lb=$('#lb'),li=$('img',lb),cap=$('.lb-c',lb),set=[],ix=0;
  function full(s){return s.replace('/media/_t/','/media/')}
  function show(i){ix=(i+set.length)%set.length;var im=set[ix];li.src=full(im.currentSrc||im.src);li.alt=im.alt||'';cap.textContent=im.alt||''}
  function open(i){lb.hidden=false;d.body.style.overflow='hidden';show(i)}
  function close(){lb.hidden=true;d.body.style.overflow='';li.src=''}
  d.addEventListener('click',function(e){var im=e.target;if(!im||im.tagName!=='IMG'||im.closest('.lb')||!im.closest('.prose,.gallery'))return;
    var a=im.closest('a');if(a&&!/\.(jpe?g|png|webp)(\?|$)/i.test(a.getAttribute('href')||''))return;
    e.preventDefault();set=$$('.prose img,.gallery img').filter(function(x){var a=x.closest('a');return !a||/\.(jpe?g|png|webp)(\?|$)/i.test(a.getAttribute('href')||'')});open(set.indexOf(im))});
  $('.lb-x',lb).onclick=close;$('.lb-p',lb).onclick=function(){show(ix-1)};$('.lb-n',lb).onclick=function(){show(ix+1)};
  lb.addEventListener('click',function(e){if(e.target===lb)close()});
  d.addEventListener('keydown',function(e){if(lb.hidden)return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')show(ix-1);if(e.key==='ArrowRight')show(ix+1)});
  var sx=0;lb.addEventListener('touchstart',function(e){sx=e.touches[0].clientX},{passive:true});lb.addEventListener('touchend',function(e){var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>50)show(ix+(dx<0?1:-1))});
  // forms
  $$('form.gform').forEach(function(f){f.addEventListener('submit',function(e){
    e.preventDefault();var msg=$('.form-msg',f);
    if(!f.checkValidity()){f.reportValidity();return}
    var ep=f.dataset.endpoint;msg.hidden=false;
    if(!ep){msg.innerHTML='This preview form is not connected yet. Please call <a href="tel:+16087833335">(608) 783-3335</a>, email <a href="mailto:events@celebrationslacrosse.com">events@celebrationslacrosse.com</a>'+(f.dataset.original?', or use the <a href="'+f.dataset.original+'" target="_blank" rel="noopener">current website form</a>.':'.');return}
    msg.textContent='Sending…';
    fetch(ep,{method:'POST',body:new FormData(f),headers:{Accept:'application/json'}}).then(function(r){if(!r.ok)throw 0;f.reset();msg.textContent="Thanks for Contacting Us! We'll Be In Touch Soon! Typically in just a few hours, but no longer than 24 hours. We look forward to serving you!"}).catch(function(){msg.innerHTML='Sorry, that did not send. Please call <a href="tel:+16087833335">(608) 783-3335</a>.'})
  })});
})();
