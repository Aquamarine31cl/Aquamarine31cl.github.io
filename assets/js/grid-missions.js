(() => {
  'use strict';
  const root = document.querySelector('[data-grid-mission]');
  if (!root) return;
  const board = root.querySelector('.mission-grid');
  const status = root.querySelector('.mission-status');
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
  const {read, save} = StarArcadeProgress;
  const progress = read(mode);
  const jump = root.querySelector('.mission-jump');
  const jumpInput = jump.querySelector('input');
  const record = root.querySelector('.mission-record');
  const flagMode = root.querySelector('[data-flag]');
  const hintStatus = root.querySelector('[data-hint-status]');
  let hintTile = -1;
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
  let level = progress.stage, width, height, terrain, state, history, cursor, cells, marking = false;

  function neighbor(index, direction) {
    const [dx,dy] = directions[direction];
    const x=index%width+dx, y=Math.floor(index/width)+dy;
    return x>=0&&x<width&&y>=0&&y<height ? y*width+x : -1;
  }
  function rotate(mask) { return ((mask<<1)&15)|(mask>>3); }
  function randomSource(seed) {
    return () => {seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  }
  function reset(resume=false) {
    hintTile=-1;
    if(hintStatus)hintStatus.textContent='';
    select.value=String(level);
    jumpInput.value=String(level+1);
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
    if(resume)restoreDraft();
    board.style.setProperty('--columns',width);
    cells=Array.from({length:width*height},(_,i)=>{
      const button=document.createElement('button');
      button.type='button';
      button.addEventListener('click',()=>{cursor=i;activate(i,marking);});
      button.addEventListener('contextmenu',event=>{
        if(mode!=='survey')return;
        event.preventDefault();cursor=i;activate(i,true);
      });
      return button;
    });
    board.replaceChildren(...cells);
    render();
  }
  const draftKey='star-arcade.draft.v1.'+mode;
  function storeDraft() {
    try {
      if(state.turn===0)localStorage.removeItem(draftKey);
      else localStorage.setItem(draftKey,JSON.stringify({level,state,history:history.slice(-32)}));
    } catch {}
  }
  function restoreDraft() {
    try {
      const draft=JSON.parse(localStorage.getItem(draftKey));
      if(draft?.level!==level)return;
      const tile=i=>Number.isInteger(i)&&i>=0&&i<width*height;
      const indexList=list=>Array.isArray(list)&&list.length<=width*height&&list.every(tile);
      const valid=boardState=>boardState&&Number.isInteger(boardState.turn)&&boardState.turn>=0&&
        ['', 'won', 'lost'].includes(boardState.result)&&typeof boardState.key==='boolean'&&
        (maps[mode]?tile(boardState.player):boardState.player===-1)&&
        indexList(boardState.crates)&&indexList(boardState.revealed)&&indexList(boardState.flags)&&indexList(boardState.mines)&&
        Array.isArray(boardState.pipes)&&boardState.pipes.length===(mode==='circuit'?width*height:0)&&
        boardState.pipes.every(mask=>Number.isInteger(mask)&&mask>=1&&mask<=15);
      if(!valid(draft.state))return;
      state=draft.state;
      history=Array.isArray(draft.history)?draft.history.slice(-32).filter(valid):[];
      cursor=Math.max(0,state.player);
    } catch {}
  }
  function checkpoint() {
    hintTile=-1;
    if(hintStatus)hintStatus.textContent='';
    history.push(structuredClone(state));
    state.turn++;
  }
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
  function guard(turn=state.turn) {
    const route=patrols[level],phase=turn%route.length;
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
  function move(direction,focusBoard=true) {
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
    storeDraft();render();if(focusBoard)cells[cursor].focus({preventScroll:true});
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
    if(!flag&&state.revealed.includes(tile)){
      const around=adjacent(tile);
      if(around.filter(i=>state.flags.includes(i)).length!==countMines(tile)||around.every(i=>state.flags.includes(i)||state.revealed.includes(i)))return;
    }
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
    const previousTurn=state.turn;
    if(mode==='survey')survey(tile,flag);
    if(mode==='circuit'){
      checkpoint();state.pipes[tile]=rotate(state.pipes[tile]);
      const {seen,leaks}=energized();
      if(seen.size===cells.length&&!leaks)state.result='won';
    }
    if(state.turn!==previousTurn)storeDraft();
    render();
  }
  function render() {
    const circuit=mode==='circuit'?energized():null, patrol=mode==='stealth'?guard():null;
    const nextDanger=patrol&&guard(state.turn+1).danger;
    if(state.result==='won'&&(!progress.best[level]||state.turn<progress.best[level])){
      progress.best[level]=state.turn;
      save(mode,progress);
    }
    record.textContent=Object.keys(progress.best).length+' / '+stageCount+' cleared'+(progress.best[level]?' · Best: '+progress.best[level]+' turns':'');
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
        label=state.flags.includes(i)?'Flagged hazard':revealed?countMines(i)+' adjacent hazards':String(symbol||'Unscanned');
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
      cell.toggleAttribute('data-mission-hint',i===hintTile);
      cell.toggleAttribute('data-next-danger', Boolean(nextDanger?.has(i)));
      if(nextDanger?.has(i))label+=', danger next turn';
      cell.tabIndex=i===cursor?0:-1;
      cell.setAttribute('aria-label',`Row ${Math.floor(i/width)+1}, column ${i%width+1}: ${label}`);
    }
    const detail=circuit?` · Powered ${circuit.seen.size}/${cells.length} · Open connections ${circuit.leaks}`
      :mode==='survey'?` · Flags ${state.flags.length}/${mineCount(level)}`
      :mode==='stealth'?(state.key?' · Key acquired':' · Find the key')
      :mode==='cargo'?' · Bays filled '+state.crates.filter(i=>terrain[i]==='.').length+'/'+state.crates.length:'';
    const cornered=mode==='cargo'&&state.crates.some(i=>terrain[i]!=='.'&&directions.some((_,d)=>{
      const wall=direction=>{const n=neighbor(i,direction);return n<0||terrain[n]==='#';};
      return wall(d)&&wall((d+1)%4);
    }));
    status.textContent=`Stage ${level+1}/${stageCount} · ${stars(level)} (${difficulty(level)}/5) · Turns ${state.turn}${detail}`+
      (state.result==='won'?(level===stageCount-1?' · Final stage complete.':' · Stage complete.'):state.result==='lost'?' · Mission failed. Undo or restart.':cornered?' · Crate trapped in a corner. Undo the push.':'');
    next.hidden=state.result!=='won'||level===stageCount-1;
    for(const button of directionPad?.querySelectorAll('button')??[])button.disabled=Boolean(state.result);
    undo.disabled=!history.length;
    if(flagMode){flagMode.textContent='Flag Mode: '+(marking?'On':'Off');flagMode.setAttribute('aria-pressed',String(marking));}
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
    }else if(key==='f'&&mode==='survey'){
      event.preventDefault();
      const tile=cells.indexOf(event.target);
      if(tile>=0){cursor=tile;activate(tile,true);}
    }
    else if(key===' '&&mode==='stealth'){event.preventDefault();move(-1);}
  });
  root.addEventListener('keydown',event=>{
    if(event.target!==select&&event.key.toLowerCase()==='z'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.repeat)undo.click();
  });
  function openStage(stage) {
    if(!Number.isInteger(stage)||stage<0||stage>=stageCount||stage===level)return;
    level=stage;
    progress.stage=stage;
    save(mode,progress);
    reset();
    storeDraft();
  }
  select.addEventListener('change',()=>openStage(Number(select.value)));
  jump.addEventListener('submit',event=>{
    event.preventDefault();
    openStage(jumpInput.valueAsNumber-1);
    cells[cursor].focus({preventScroll:true});
  });
  undo.addEventListener('click',()=>{if(history.length){state=history.pop();hintTile=-1;if(hintStatus)hintStatus.textContent='';if(maps[mode])cursor=state.player;storeDraft();render();cells[cursor].focus();}});
  next.addEventListener('click',()=>{if(state.result!=='won'||level>=stageCount-1)return;openStage(level+1);cells[cursor].focus();});
  root.querySelector('[data-reset]').addEventListener('click',()=>{reset();storeDraft();cells[cursor].focus();});
  root.querySelector('[data-wait]')?.addEventListener('click',()=>move(-1));
  flagMode?.addEventListener('click',()=>{marking=!marking;render();});
  function surveyClue(){
    const clues=state.revealed.flatMap(tile=>{
      const neighbors=adjacent(tile);
      const unknown=neighbors.filter(i=>!state.revealed.includes(i)&&!state.flags.includes(i));
      const mines=countMines(tile)-neighbors.filter(i=>state.flags.includes(i)).length;
      return unknown.length&&mines>=0&&mines<=unknown.length?[{unknown,mines}]:[];
    });
    const settled=clue=>clue.mines===0||clue.mines===clue.unknown.length;
    const direct=clues.find(settled);
    if(direct)return direct;
    // Subtract a fully contained clue to determine the remaining neighbors.
    for(const small of clues)for(const large of clues){
      if(small.unknown.length>=large.unknown.length||!small.unknown.every(tile=>large.unknown.includes(tile)))continue;
      const difference={unknown:large.unknown.filter(tile=>!small.unknown.includes(tile)),mines:large.mines-small.mines};
      if(settled(difference))return difference;
    }
    return null;
  }
  root.querySelector('[data-survey-hint]')?.addEventListener('click',()=>{
    if(state.result)return;
    const clue=surveyClue();
    hintTile=clue?.unknown[0]??-1;
    if(hintTile>=0){
      cursor=hintTile;
      const row=Math.floor(hintTile/width)+1,column=hintTile%width+1;
      hintStatus.textContent='Row '+row+', column '+column+(clue.mines?' should be flagged.':' should be safe.')+' This assumes your flags are correct.';
    }else{
      hintStatus.textContent=state.revealed.length?'No certain tile from nearby clues. Check your flags.':'Scan a tile to begin. The first scan is safe.';
    }
    render();
    if(hintTile>=0)cells[hintTile].focus({preventScroll:true});
  });
  const directionPad=root.querySelector('.mission-directions');
  if(directionPad){
    directionPad.hidden=false;
    for(const button of directionPad.querySelectorAll('[data-move]')){
      button.addEventListener('click',()=>move(Number(button.dataset.move),false));
    }
  }
  reset(true);
})();

