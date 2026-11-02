(() => {
  'use strict';
  const panel = document.querySelector('.wish-panel');
  if (!panel) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = panel.querySelector('.wish-motion');
  let paused = reduced.matches;
  const animations = new Set();
  function stopShakes() { animations.forEach(a => a.cancel()); animations.clear(); }
  function sync() {
    panel.toggleAttribute('data-paused', paused || reduced.matches);
    toggle.setAttribute('aria-pressed', String(paused || reduced.matches));
    toggle.setAttribute('aria-label', paused || reduced.matches ? 'Play Bottle Animations' : 'Pause Bottle Animations');
    toggle.textContent = paused || reduced.matches ? '▷' : 'Ⅱ';
  }
  toggle.addEventListener('click', () => { paused = !paused; stopShakes(); sync(); });
  reduced.addEventListener('change', () => { paused = reduced.matches; stopShakes(); sync(); });
  document.addEventListener('visibilitychange', () => {
    panel.toggleAttribute('data-hidden', document.hidden);
    if (document.hidden) stopShakes();
  });
  // Integrate the star silhouette so liquid area, rather than bounding-box height, matches capacity.
  const outline = panel.querySelector('.wish-glass');
  const length = outline.getTotalLength();
  const p = Array.from({length:600}, (_,i) => { const q=outline.getPointAtLength(length*i/600); return [q.x,q.y]; });
  const rows = [];
  for (let y=28; y<165; y+=.2) {
    const xs=[];
    for (let i=0,j=p.length-1;i<p.length;j=i++) {
      const a=p[i],b=p[j];
      if ((a[1]>y)!=(b[1]>y)) xs.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));
    }
    xs.sort((a,b)=>a-b);
    let width=0; for(let i=0;i<xs.length;i+=2) width+=xs[i+1]-xs[i];
    rows.push({y,width});
  }
  const total=rows.reduce((s,r)=>s+r.width,0);
  panel.querySelectorAll('.wish-bottle').forEach(button => {
    const ratio=Math.min(1, Math.max(0,Number(button.dataset.value)/Number(button.dataset.capacity)));
    let sum=0,level=165;
    for (const row of rows.slice().reverse()) { sum+=row.width; if(sum>=ratio*total){level=row.y;break;} }
    button.querySelector('.wish-fill').setAttribute('transform','translate(0 '+level.toFixed(2)+')');
    let shake;
    button.addEventListener('click', () => {
      if (reduced.matches || paused) return;
      if(shake) {shake.cancel();animations.delete(shake);}
      shake=button.querySelector('.wish-vessel').animate([
        {transform:'rotate(0deg)'},{transform:'rotate(-8deg)',offset:.14},
        {transform:'rotate(7deg)',offset:.3},{transform:'rotate(-5deg)',offset:.46},
        {transform:'rotate(3deg)',offset:.63},{transform:'rotate(-1deg)',offset:.8},
        {transform:'rotate(0deg)'}
      ],{duration:950,easing:'ease-in-out'});
      animations.add(shake);
      shake.onfinish=()=>animations.delete(shake);
    });
  });
  sync();
})();
