(() => {
  'use strict';
  const root = document.querySelector('[data-grid-mission]');
  if (!root) return;
  const board = root.querySelector('.mission-grid');
  const status = root.querySelector('[role=status]');
  const next = root.querySelector('[data-next]');
  const undo = root.querySelector('[data-undo]');
  const mode = root.dataset.gridMission;
  const maps = {
    cargo: [
      ['########','#      #','# .  . #','# $$   #','#  @   #','########'],
      ['########','# . #  #','#   $ .#','# $$   #','# @  . #','########'],
      ['#########','# . . . #','# # #   #','# $$$   #','#   # @ #','#########'],
      ["#########","# . . . #","#  #    #","# $$ $  #","#    #@ #","#       #","#########"],
      ["##########","# .  . . #","#   #    #","# $$  $  #","#        #","#   @    #","##########"],
      ["##########","# . . .. #","#  #   # #","# $$ $ $ #","#    #   #","# #  @   #","##########"]
    ],
    stealth: [
      ['#########','#@  #  E#','#   #   #','#   K   #','#  ###  #','#       #','#########'],
      ['#########','#@    #E#','# ##  # #','#  K    #','#   ##  #','#       #','#########'],
      ['##########','#@       #','# ## ## E#','#  K  #  #','#  #     #','#        #','##########'],
      ["##########","#@ #    E#","#  # ##  #","#  K     #","# ## #   #","#        #","##########"],
      ["###########","#@   #   E#","# ## # #  #","#    K    #","# # ## #  #","#         #","###########"],
      ["###########","#@  #    E#","#   # ##  #","#  K      #","# ## ###  #","#         #","###########"]
    ]
  };
  const patrols = [
    [[1,5],[2,5],[3,5],[4,5],[5,5],[6,5],[7,5],[7,4],[7,3],[7,4],[7,5],[6,5],[5,5],[4,5],[3,5],[2,5]],
    [[5,1],[5,2],[5,3],[6,3],[7,3],[7,4],[7,5],[7,4],[7,3],[6,3],[5,3],[5,2]],
    [[5,1],[6,1],[7,1],[8,1],[8,2],[8,3],[8,4],[8,3],[8,2],[8,1],[7,1],[6,1]],
      [[6,3],[7,3],[8,3],[8,2],[8,1],[8,2],[8,3],[7,3]],
      [[6,3],[7,3],[8,3],[9,3],[9,2],[9,1],[9,2],[9,3],[8,3],[7,3]],
      [[5,3],[6,3],[7,3],[8,3],[9,3],[9,2],[9,1],[9,2],[9,3],[8,3],[7,3],[6,3]]
  ];
  const extra = globalThis.ArcadeMissionStages;
  maps.cargo.push(...extra.cargo);
  maps.stealth.push(...extra.stealth);
  patrols.push(...extra.patrols);
  const stageCount = 500;
  const select = root.querySelector('[data-stage-select]');
  const difficulty = stage => Math.floor((stage % 100) / 20) + 1;
  const stars = stage => '★'.repeat(difficulty(stage)) + '☆'.repeat(5 - difficulty(stage));
  const boardSize = stage => [6, 7, 8, 10, 12][difficulty(stage) - 1];
  const mineCount = stage => [6, 9, 13, 21, 33][difficulty(stage) - 1];
  let chapter;
  for (let stage = 0; stage < stageCount; stage++) {
    if (stage % 50 === 0) {
      chapter = document.createElement('optgroup');
      chapter.label = 'Stages ' + (stage + 1) + '–' + (stage + 50);
      select.append(chapter);
    }
    const option = document.createElement('option');
    option.value = String(stage);
    option.textContent = 'Stage ' + (stage + 1) + ' · ' + stars(stage);
    chapter.append(option);
  }
  const directions = [[0,-1],[1,0],[0,1],[-1,0]];
  const arrows = {ArrowUp:0,ArrowRight:1,ArrowDown:2,ArrowLeft:3,w:0,d:1,s:2,a:3};
  const glyphs = ['','╵','╶','└','╷','│','┌','├','╴','┘','─','┴','┐','┤','┬','┼'];
  let level = 0, width, height, terrain, state, history, cursor, cells;

  function neighbor(index, direction) {
    const [dx,dy] = directions[direction];
    const x=index%width+dx, y=Math.floor(index/width)+dy;
    return x>=0&&x<width&&y>=0&&y<height ? y*width+x : -1;
  }
  function rotate(mask) { return ((mask<<1)&15)|(mask>>3); }
  function randomSource(seed) {
    return () => {seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  }
  function reset() {
    select.value=String(level);
    const map=maps[mode]?.[level];
    width=map?.[0].length ?? boardSize(level);
    height=map?.length ?? boardSize(level);
    terrain=map?.join('') ?? '';
    state={turn:0,result:'',player:terrain.indexOf('@'),key:false,
      crates:[...terrain].flatMap((tile,i)=>tile==='$'?[i]:[]),
      pipes:[],revealed:[],flags:[],mines:[]};
    history=[];cursor=Math.max(0,state.player);
    if(mode==='circuit'){
      const random=randomSource(83+level);
      const pipes=Array(width*height).fill(0),visited=new Set([0]),stack=[0];
      while(stack.length){
        const tile=stack.at(-1);
        const choices=directions.map((_,d)=>d).filter(d=>{const n=neighbor(tile,d);return n>=0&&!visited.has(n);});
        if(!choices.length){stack.pop();continue;}
        const d=choices[Math.floor(random()*choices.length)],n=neighbor(tile,d);
        pipes[tile]|=1<<d;pipes[n]|=1<<((d+2)%4);
        visited.add(n);stack.push(n);
      }
      state.pipes=pipes.map(mask=>{
        const count=1+Math.floor(random()*3);
        for(let i=0;i<count;i++)mask=rotate(mask);
        return mask;
      });
    }
    board.style.setProperty('--columns',width);
    cells=Array.from({length:width*height},(_,i)=>{
      const button=document.createElement('button');
      button.type='button';
      button.addEventListener('click',()=>{cursor=i;activate(i);});
      button.addEventListener('contextmenu',event=>{
        if(mode!=='survey')return;
        event.preventDefault();cursor=i;activate(i,true);
      });
      return button;
    });
    board.replaceChildren(...cells);
    render();
  }
  function checkpoint() { history.push(structuredClone(state));state.turn++; }
  function energized() {
    const seen=new Set([0]),queue=[0];
    let leaks=0;
    for(const tile of queue){
      for(let d=0;d<4;d++){
        if(!(state.pipes[tile]&(1<<d)))continue;
        const n=neighbor(tile,d);
        if(n<0||!(state.pipes[n]&(1<<((d+2)%4)))){leaks++;continue;}
        if(!seen.has(n)){seen.add(n);queue.push(n);}
      }
    }
    return {seen,leaks};
  }
  function guard() {
    const route=patrols[level],phase=state.turn%route.length;
    const [x,y]=route[phase],[nextX,nextY]=route[(phase+1)%route.length];
    const direction=directions.findIndex(([dx,dy])=>dx===nextX-x&&dy===nextY-y);
    const tile=y*width+x, danger=new Set([tile]);
    let index=tile;
    for(let step=0;step<3&&direction>=0;step++){
      index=neighbor(index,direction);
      if(index<0||terrain[index]==='#')break;
      danger.add(index);
    }
    return {tile,danger,direction};
  }
  function move(direction) {
    if(state.result)return;
    const target=direction===-1?state.player:neighbor(state.player,direction);
    if(target<0||terrain[target]==='#')return;
    const crate=state.crates.indexOf(target);
    const beyond=crate>=0?neighbor(target,direction):-1;
    if(crate>=0&&(beyond<0||terrain[beyond]==='#'||state.crates.includes(beyond)))return;
    checkpoint();
    if(crate>=0)state.crates[crate]=beyond;
    state.player=target;cursor=target;
    if(mode==='cargo'&&state.crates.every(i=>terrain[i]==='.'))state.result='won';
    if(mode==='stealth'){
      if(guard().danger.has(target))state.result='lost';
      else if(terrain[target]==='K')state.key=true;
      else if(terrain[target]==='E'&&state.key)state.result='won';
    }
    render();cells[cursor].focus({preventScroll:true});
  }
  function adjacent(tile) {
    const x=tile%width,y=Math.floor(tile/width),out=[];
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if((dx||dy)&&x+dx>=0&&x+dx<width&&y+dy>=0&&y+dy<height)out.push((y+dy)*width+x+dx);
    }
    return out;
  }
  const countMines=tile=>adjacent(tile).filter(i=>state.mines.includes(i)).length;
  function survey(tile, flag) {
    if(flag&&state.revealed.includes(tile))return;
    if(!flag&&state.flags.includes(tile))return;
    checkpoint();
    if(flag){
      state.flags=state.flags.includes(tile)?state.flags.filter(i=>i!==tile):[...state.flags,tile];
      return;
    }
    if(!state.mines.length){
      const safe=new Set([tile,...adjacent(tile)]),random=randomSource(421+level);
      const candidates=cells.map((_,i)=>i).filter(i=>!safe.has(i));
      while(state.mines.length<mineCount(level)){
        state.mines.push(candidates.splice(Math.floor(random()*candidates.length),1)[0]);
      }
    }
    const around=adjacent(tile);
    const queue=state.revealed.includes(tile)
      ? (around.filter(i=>state.flags.includes(i)).length===countMines(tile)?around:[]) : [tile];
    const revealed=new Set(state.revealed);
    for(const i of queue){
      if(revealed.has(i)||state.flags.includes(i))continue;
      if(state.mines.includes(i)){state.result='lost';break;}
      revealed.add(i);
      if(!countMines(i))queue.push(...adjacent(i));
    }
    state.revealed=[...revealed];
    if(!state.result&&revealed.size===cells.length-state.mines.length)state.result='won';
  }
  function activate(tile,flag=false) {
    if(state.result)return;
    if(maps[mode]){
      const direction=directions.findIndex((_,d)=>neighbor(state.player,d)===tile);
      if(direction>=0)move(direction);
      return;
    }
    if(mode==='survey')survey(tile,flag);
    if(mode==='circuit'){
      checkpoint();state.pipes[tile]=rotate(state.pipes[tile]);
      const {seen,leaks}=energized();
      if(seen.size===cells.length&&!leaks)state.result='won';
    }
    render();
  }
  function render() {
    const circuit=mode==='circuit'?energized():null, patrol=mode==='stealth'?guard():null;
    for(const [i,cell] of cells.entries()){
      let symbol='',kind='',label='';
      if(circuit){
        symbol=glyphs[state.pipes[i]];
        kind=circuit.seen.has(i)?'lit':'';
        label=(i===0?'Power source, ':'')+directions.flatMap((_,d)=>state.pipes[i]&(1<<d)?[['north','east','south','west'][d]]:[]).join(' ');
      }else if(mode==='survey'){
        const revealed=state.revealed.includes(i),mine=state.mines.includes(i);
        symbol=state.result==='lost'&&mine?'✹':state.flags.includes(i)?'⚑':revealed?(countMines(i)||'·'):'';
        kind=revealed?'lit':'';
        label=String(symbol||'Unscanned');
      }else{
        const tile=terrain[i];
        symbol=tile==='#'?'▦':tile==='.'?'·':tile==='K'&&!state.key?'◆':tile==='E'?'⇥':'';
        kind=tile==='#'?'wall':patrol?.danger.has(i)?'danger':tile==='.'?'goal':'';
        label=tile==='#'?'Wall':tile==='.'?'Cargo bay':tile==='E'?'Exit':tile==='K'&&!state.key?'Access key':'Floor';
        if(state.crates.includes(i)){symbol='■';label='Cargo crate';}
        if(patrol?.tile===i){symbol=['▲','▶','▼','◀'][patrol.direction]||'▲';label='Guard';}
        if(state.player===i){symbol='✦';label='Pilot';}
      }
      cell.textContent=symbol;
      cell.dataset.kind=kind;
      cell.tabIndex=i===cursor?0:-1;
      cell.setAttribute('aria-label',`Row ${Math.floor(i/width)+1}, column ${i%width+1}: ${label}`);
    }
    const progress=circuit?` · Powered ${circuit.seen.size}/${cells.length} · Open connections ${circuit.leaks}`
      :mode==='survey'?` · Flags ${state.flags.length}/${mineCount(level)}`
      :mode==='stealth'?(state.key?' · Key acquired':' · Find the key'):'';
    status.textContent=`Stage ${level+1}/${stageCount} · ${stars(level)} (${difficulty(level)}/5) · Turns ${state.turn}${progress}`+
      (state.result==='won'?(level===stageCount-1?' · Final stage complete.':' · Stage complete.'):state.result==='lost'?' · Mission failed. Undo or restart.':'');
    next.hidden=state.result!=='won'||level===stageCount-1;
    undo.disabled=!history.length;
  }
  board.addEventListener('keydown',event=>{
    if(event.ctrlKey||event.metaKey||event.altKey)return;
    const key=event.key.toLowerCase(),direction=arrows[event.key]??arrows[key];
    if(direction!==undefined){
      event.preventDefault();
      if(maps[mode])move(direction);
      else{
        const target=neighbor(cursor,direction);
        if(target>=0){cursor=target;render();cells[cursor].focus();}
      }
    }else if(key==='f'&&mode==='survey'){event.preventDefault();activate(cursor,true);}
    else if(key===' '&&mode==='stealth'){event.preventDefault();move(-1);}
  });
  root.addEventListener('keydown',event=>{
    if(event.target!==select&&event.key.toLowerCase()==='z'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.repeat)undo.click();
  });
  select.addEventListener('change',()=>{level=Number(select.value);reset();});
  undo.addEventListener('click',()=>{if(history.length){state=history.pop();render();cells[cursor].focus();}});
  next.addEventListener('click',()=>{if(state.result!=='won'||level>=stageCount-1)return;level++;reset();cells[cursor].focus();});
  root.querySelector('[data-reset]').addEventListener('click',()=>{reset();cells[cursor].focus();});
  root.querySelector('[data-wait]')?.addEventListener('click',()=>move(-1));
  root.querySelector('[data-flag]')?.addEventListener('click',()=>{activate(cursor,true);cells[cursor].focus();});
  reset();
})();

