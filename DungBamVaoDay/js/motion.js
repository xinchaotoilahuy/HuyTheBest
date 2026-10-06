/* Camera/motion primitives. No CDN, no animation framework. */
(() => {
  'use strict';
  const tracks = new Set();
  let enabled = true;
  const FILM_MS=3500;
  const EASE = { focusOut: 'cubic-bezier(.42,0,.58,1)', focusIn: 'cubic-bezier(.18,.55,.24,1)', velocity: 'cubic-bezier(.88,0,.12,1)', settle: 'cubic-bezier(.08,.92,.16,1)', exit: 'cubic-bezier(.7,0,1,.4)' };
  const reviewMeta=document.querySelector('meta[name="preview-film-frame"]');
  const reviewFrame=reviewMeta?Math.max(0,Math.min(FILM_MS-10,Number(reviewMeta.content)||0)):null;
  const mobile = () => matchMedia('(max-width: 760px)').matches;
  const light = () => document.body.classList.contains('performance');
  const active = () => enabled && typeof Element.prototype.animate === 'function';
  const blur = value => `blur(${light() ? Math.min(2,value*.2) : mobile() ? Math.min(9,value*.6) : value}px)`;

  function play(el, frames, options = {}) {
    if (!el || !active()) return Promise.resolve();
    const { hold = false, atTime = null, ...timing } = options;
    let animation;
    try { animation = el.animate(frames, {duration:600, easing:'linear', fill:'both', ...timing}); }
    catch (_) { return Promise.resolve(); }
    if(atTime!==null){animation.pause();animation.currentTime=atTime;}
    return new Promise(resolve => {
      const item = {el, animation, finish:null, timer:0};
      let settled = false;
      item.finish = () => {
        if (settled) return;
        settled=true; clearTimeout(item.timer);
        if (!hold) { tracks.delete(item); try { animation.cancel(); } catch (_) {} }
        resolve();
      };
      tracks.add(item);
      animation.finished.then(item.finish,item.finish);
      item.timer=setTimeout(item.finish, (timing.duration || 600)+(timing.delay || 0)+120);
    });
  }
  function cancelWithin(root,{selfOnly=false}={}) {
    [...tracks].filter(x=>!root || x.el===root || (!selfOnly&&root.contains(x.el))).forEach(item=>{
      try {item.animation.cancel();}catch(_){}
      item.finish(); tracks.delete(item);
    });
  }
  function reveal(el, {delay=0,duration=700,x=0,y=28,scale=.94,rotate=0,zoom=true}={}) {
    const factor=mobile()?.45:1;
    const transform=`translate3d(${x*factor}px,${y*factor}px,0) rotate(${rotate*factor}deg)${zoom?` scale(${scale})`:''}`;
    return play(el,[
      {opacity:0,transform,filter:blur(8),offset:0,easing:EASE.velocity},
      {opacity:.9,transform:`translate3d(${x*.13*factor}px,${y*.15*factor}px,0)${zoom?' scale(1.015)':''}`,filter:blur(3),offset:.55,easing:EASE.settle},
      {opacity:1,transform:`translate3d(0,-1px,0)${zoom?' scale(1.002)':''}`,filter:blur(0),offset:.8,easing:EASE.settle},
      {opacity:1,transform:'none',filter:blur(0),offset:1}
    ],{delay,duration});
  }
  function focus(el,{delay=0,duration=620,amount=12,hold=false}={}) {
    return play(el,[
      {opacity:0,filter:blur(amount),offset:0,easing:EASE.focusIn},
      {opacity:.7,filter:blur(amount*.3),offset:.5,easing:EASE.focusIn},
      {opacity:1,filter:blur(0),offset:1}
    ],{delay,duration,hold});
  }
  function enter(root,{zoom=true,still=false}={}) {
    if (!root) return Promise.resolve();
    if (!active()) {root.style.visibility='';return Promise.resolve();}
    const jobs=[];
    const design=entrances[root.dataset.scene]||entrances.school;
    root.querySelectorAll('[data-enter]').forEach((el,i)=>{
      const delay=Number(el.dataset.enter)||i*75;
      const dir=Number(el.dataset.dir)||0;
      const feature=el.matches('.case-object,.case-art');
      jobs.push(still?focus(el,{delay:Math.min(delay,200),duration:650}):reveal(el,{delay,duration:el.dataset.duration?Number(el.dataset.duration):feature?design.duration:640,x:feature?design.x:dir*24,y:feature?design.y:22,scale:feature?design.scale:.975,rotate:feature?design.rotate:0,zoom}));
    });
    root.querySelectorAll('[data-object-enter]').forEach((el,i)=>jobs.push(still?focus(el,{delay:180+i*55,duration:580}):reveal(el,{delay:330+i*80,duration:610,x:i%2?18:-18,y:15,scale:.92,zoom})));
    jobs.push(study(root,root.dataset.scene,{zoom,still}));
    root.style.visibility='';
    return Promise.all(jobs);
  }

  const entrances={
    school:{x:115,y:12,scale:.78,rotate:-3,duration:900},
    score:{x:0,y:62,scale:1.13,rotate:0,duration:790},
    subjects:{x:-100,y:25,scale:.73,rotate:9,duration:940},
    chat:{x:130,y:-16,scale:.91,rotate:-5,duration:850},
    math:{x:0,y:6,scale:.65,rotate:0,duration:980},
    planner:{x:150,y:0,scale:.85,rotate:2,duration:830},
    poster:{x:-24,y:30,scale:.94,rotate:-7,duration:930},
    source:{x:0,y:-55,scale:1.055,rotate:0,duration:870},
    writer:{x:-28,y:25,scale:.86,rotate:4,duration:1050}
  };
  function study(root,kind,{zoom=true,still=false}={}){
    if(!root||!active())return Promise.resolve();
    const pieces=[...root.querySelectorAll('[data-diagram-piece]')],jobs=[];
    pieces.forEach((el,i)=>{
      if(el.closest('.depth-rig')){
        const base=getComputedStyle(el).transform;
        const pose=base==='none'?'':base+' ';
        jobs.push(still?focus(el,{delay:Math.min(80+i*45,250),duration:500,amount:8}):play(el,[
          {opacity:0,transform:pose+'translateZ(-42px) rotateX(12deg)',easing:EASE.velocity},
          {opacity:1,transform:pose+'translateZ(9px) rotateX(-2deg)',offset:.7,easing:EASE.settle},
          {opacity:1,transform:base}
        ],{delay:90+i*70,duration:760}));
        return;
      }
      const side=i%2?1:-1;
      const pose={school:[side*70,15,.8,-3*side],score:[0,70,.8,0],subjects:[side*100,0,.6,side*12],chat:[0,-65,1.2,-4],math:[0,0,.45,0],planner:[0,40,.9,0],poster:[0,60,.7,side*5],source:[0,-45,1.12,0],writer:[side*100,0,.8,0]}[kind]||[0,30,.8,0];
      jobs.push(still?focus(el,{delay:Math.min(80+i*45,250),duration:500,amount:8}):reveal(el,{delay:200+i*75,duration:650,x:pose[0],y:pose[1],scale:pose[2],rotate:pose[3],zoom}));
    });
    const curve=root.querySelector('.math-graph .curve');
    if(curve)jobs.push(play(curve,[{strokeDashoffset:700},{strokeDashoffset:0}],{delay:100,duration:850,easing:EASE.focusIn}));
    root.querySelectorAll('.data-bars i,.time-window').forEach((el,i)=>jobs.push(play(el,[{transform:'scaleX(.06)'},{transform:'scaleX(1)'}],{delay:140+i*65,duration:650,easing:EASE.focusIn})));
    root.querySelectorAll('.quota-chart i').forEach((el,i)=>jobs.push(play(el,[{transform:'scaleY(.03)',easing:EASE.velocity},{transform:'scaleY(1.03)',offset:.78,easing:EASE.settle},{transform:'scaleY(1)'}],{delay:180+i*95,duration:900})));
    const ring=root.querySelector('.ring-track');
    if(ring)jobs.push(play(ring,[{strokeDashoffset:584,filter:blur(3),easing:EASE.velocity},{strokeDashoffset:0,filter:blur(0)}],{delay:220,duration:900}));
    const connector=root.querySelector('.fact-link,.source-route,.authorship>i');
    if(connector){
      const base=getComputedStyle(connector).transform;
      const pose=base==='none'?'':base+' ';
      jobs.push(play(connector,[{transform:pose+(kind==='writer'?'scaleX(0)':'scaleY(0)'),opacity:0,easing:EASE.velocity},{transform:base,opacity:1}],{delay:400,duration:600}));
    }
    return Promise.all(jobs);
  }
  function artImpulse(root,kind){
    if(!root||!active())return;
    if(root.classList.contains('sculpture'))return window.Sculpture?.impulse();
    const el=root.querySelector('.depth-rig')||root.querySelector('.art-camera');
    cancelWithin(el);
    if(el.classList.contains('depth-rig')){
      const base=getComputedStyle(el).transform;
      const pose=base==='none'?'':base+' ';
      const angles={school:[-5,9],score:[6,-10],subjects:[-8,8],chat:[-6,-8],math:[4,10],planner:[-8,12],poster:[-6,-7],source:[5,9],writer:[-4,8]}[kind]||[-5,8];
      return Promise.all([study(root,kind),play(el,[
        {transform:base,easing:EASE.velocity},
        {transform:pose+`translateZ(25px) rotateX(${angles[0]}deg) rotateY(${angles[1]}deg)`,offset:.32,easing:EASE.settle},
        {transform:pose+`translateZ(-5px) rotateY(${-angles[1]*.18}deg)`,offset:.76,easing:EASE.settle},
        {transform:base}
      ],{duration:1250})]);
    }
    return Promise.all([study(root,kind),play(el,[{transform:'none',filter:blur(0),easing:EASE.velocity},{transform:'perspective(1000px) rotateY(5deg) scale(1.06)',filter:blur(2),offset:.35,easing:EASE.settle},{transform:'scale(.99)',filter:blur(0),offset:.76,easing:EASE.settle},{transform:'none',filter:blur(0)}],{duration:1000})]);
  }

  const dissolves={
    school:{out:340,in:680,amount:16,hinge:.46,clear:.46,order:['heading','brief','art','object','answer'],gap:45},
    score:{out:280,in:640,amount:18,hinge:.62,clear:.36,order:['heading','object','art','brief','answer'],gap:40},
    subjects:{out:360,in:780,amount:16,hinge:.42,clear:.55,order:['heading','art','brief','answer','object'],gap:55},
    chat:{out:240,in:560,amount:12,hinge:.55,clear:.33,order:['heading','object','brief','answer','art'],gap:30},
    math:{out:290,in:600,amount:14,hinge:.6,clear:.4,order:['heading','object','art','brief','answer'],gap:35},
    planner:{out:420,in:790,amount:16,hinge:.38,clear:.58,order:['heading','brief','object','art','answer'],gap:50},
    poster:{out:360,in:760,amount:18,hinge:.5,clear:.52,order:['heading','object','art','brief','answer'],gap:55},
    source:{out:330,in:810,amount:20,hinge:.58,clear:.62,order:['heading','art','brief','object','answer'],gap:50},
    writer:{out:430,in:850,amount:18,hinge:.4,clear:.56,order:['art','heading','brief','object','answer'],gap:55}
  };
  const sceneParts={heading:'.case-heading',brief:'.case-brief',art:'.case-art',object:'.case-object',answer:'.ai-answer'};
  function sceneFocus(root,profile){
    if(!root||!active())return Promise.resolve();
    const pace=light()?.78:1;
    return Promise.all(profile.order.map((part,index)=>{
      const el=root.querySelector(sceneParts[part]);
      return focus(el,{delay:index*profile.gap*pace,duration:Math.max(300,(profile.in-index*profile.gap)*pace),amount:part==='heading'?5:8});
    }));
  }

  /* Each scene has its own optical dissolve; the page stays in place. */
  async function refocus(main,sheet,update,{kind='school'}={}) {
    if (!active()) {await update();return;}
    const profile=dissolves[kind]||dissolves.school,pace=light()?.78:1;
    const outTime=Math.round(profile.out*pace),inTime=Math.round(profile.in*pace);
    cancelWithin(main);
    sheet.dataset.transition=kind;
    sheet.hidden=false;
    try {
      await Promise.all([
        play(main,[
          {opacity:1,filter:blur(0),offset:0,easing:EASE.focusOut},
          {opacity:.72,filter:blur(profile.amount*.28),offset:profile.hinge,easing:EASE.exit},
          {opacity:0,filter:blur(profile.amount),offset:1}
        ],{duration:outTime,hold:true}),
        play(sheet,[{opacity:0},{opacity:1}],{duration:outTime,easing:EASE.focusOut,hold:true})
      ]);
      await update();
      cancelWithin(main,{selfOnly:true});
      if (!active()) return;
      await Promise.all([
        play(main,[
          {opacity:0,filter:blur(profile.amount),offset:0,easing:EASE.settle},
          {opacity:.82,filter:blur(profile.amount*.18),offset:profile.clear,easing:EASE.focusIn},
          {opacity:1,filter:blur(0),offset:1}
        ],{duration:inTime,hold:true}),
        sceneFocus(main.firstElementChild,profile),
        play(sheet,[
          {opacity:1,offset:0,easing:EASE.focusIn},
          {opacity:.38,offset:profile.clear,easing:EASE.focusIn},
          {opacity:0,offset:1}
        ],{duration:inTime,hold:true}),
        play(sheet.querySelector('.focus-from'),[{opacity:1},{opacity:0}],{duration:inTime*.65,easing:EASE.focusIn,hold:true}),
        play(sheet.querySelector('.focus-to'),[{opacity:0},{opacity:1,offset:.32,easing:EASE.focusIn},{opacity:.3}],{duration:inTime,hold:true})
      ]);
    } finally {
      sheet.hidden=true;
      cancelWithin(sheet);
      cancelWithin(main,{selfOnly:true});
    }
  }
  function ripple(button,event) {
    if(!active())return;
    const rect=button.getBoundingClientRect(),wave=document.createElement('i');wave.className='ripple';
    const x=event?.clientX?event.clientX-rect.left:rect.width/2,y=event?.clientY?event.clientY-rect.top:rect.height/2;
    wave.style.left=(x-11)+'px';wave.style.top=(y-11)+'px';button.append(wave);
    play(wave,[{transform:'scale(0)',opacity:.6,easing:EASE.settle},{transform:'scale(17)',opacity:0}],{duration:650}).then(()=>wave.remove());
    play(button,[{transform:'scale(1)'},{transform:'scale(.96)',offset:.2,easing:EASE.settle},{transform:'scale(1.018)',offset:.65,easing:EASE.settle},{transform:'none'}],{duration:360});
  }

  /* Letter-level acceleration and blur, played as one 3.5-second sequence. */
  function film(opening) {
    const duration=FILM_MS,scoreDuration=7000;
    const frame=(target,stops)=>{
      const nodes=typeof target==='string'?(target==='#opening'?[opening]:opening.querySelectorAll(target)):[target];
      nodes.forEach(el=>{
        const frames=stops.map(([time,properties])=>({...properties,offset:time/scoreDuration}));
        if(frames[0].offset>0)frames.unshift({...frames[0],offset:0});
        if(frames.at(-1).offset<1)frames.push({...frames.at(-1),offset:1});
        play(el,frames,{duration,hold:true,atTime:reviewFrame});
      });
    };
    const pose=(opacity,y=0,scale=1,amount=0,easing=EASE.settle)=>({opacity,transform:`translateY(${y}px) scale(${scale})`,filter:blur(amount),easing});
    frame('.cut-author',[[0,{opacity:1}],[2170,{opacity:1}],[2310,{opacity:0}]]);
    frame('.cut-class',[[0,{opacity:0}],[2060,{opacity:0}],[2090,{opacity:1}],[3790,{opacity:1}],[3910,{opacity:0}]]);
    frame('.cut-teacher',[[0,{opacity:0}],[3660,{opacity:0}],[3700,{opacity:1}],[6950,{opacity:1}],[7000,{opacity:0}]]);
    const letters=(selector,start,leave)=>{
      opening.querySelectorAll(selector+' .credit-letter').forEach((letter,i)=>{
        const enter=start+i*48,exit=leave+i*36;
        frame(letter.querySelector('.glyph-front'),[
          [0,pose(0,60,1.28,20)],[enter,pose(0,60,1.28,20)],
          [enter+210,pose(1,-7,1.045,.8)],[enter+430,pose(1)],
          [exit,pose(1,0,1,0,EASE.exit)],[exit+140,pose(.8,-7,1.03,3,EASE.exit)],
          [exit+360,pose(0,-30,1.12,18)]
        ]);
        frame(letter.querySelector('.glyph-echo'),[
          [0,pose(0,100,1.36,9)],[enter,pose(0,100,1.36,9)],
          [enter+95,pose(.22,21,1.12,5)],[enter+360,pose(0,-14,1.02,7)],
          [exit,pose(0)],[exit+90,pose(.15,12,1.06,4,EASE.exit)],
          [exit+340,pose(0,-20,1.14,12)]
        ]);
      });
    };
    letters('.cut-author',150,1820);
    letters('.cut-teacher',3830,6430);
    const overline=(selector,start,leave)=>frame(selector,[
      [0,pose(0,-14,1,12)],[start,pose(0,-14,1,12)],[start+350,pose(1)],
      [leave,pose(1,0,1,0,EASE.exit)],[leave+280,pose(0,-10,1,12)]
    ]);
    overline('.cut-author .credit-overline',80,1800);
    overline('.cut-teacher .credit-overline',3720,6410);
    opening.querySelectorAll('.cut-class p>span').forEach((digit,i)=>{
      const enter=2160+i*48,exit=3510+i*36;
      frame(digit,[[0,pose(0,i%2?-40:52,1.25,18)],[enter,pose(0,i%2?-40:52,1.25,18)],
        [enter+210,pose(1,i%2?5:-6,1.025,1)],[enter+420,pose(1)],
        [exit,pose(1,0,1,0,EASE.exit)],[exit+280,pose(0,-18,1.08,16)]]);
    });
    frame('.director-halo',[[0,{opacity:.5}],[650,{opacity:1}],[1780,{opacity:.65}],[2260,{opacity:1}],[3300,{opacity:.65}],[4020,{opacity:1}],[6250,{opacity:.8}],[7000,{opacity:.3}]]);
    frame('.glass-one',[[0,pose(0,0,.82)],[650,pose(.75,0,1.015)],[970,pose(.7)],[2000,pose(.48)],[2400,pose(.8,0,1.025)],[2900,pose(.65)],[3960,pose(.8,0,1.02)],[4620,pose(.65)],[7000,pose(.35)]]);
    frame('.glass-two',[[0,pose(0,0,1.16)],[840,pose(.55,0,.985)],[1220,pose(.5)],[2190,pose(.7,0,1.03)],[2940,pose(.45)],[4220,pose(.6,0,.985)],[4780,pose(.5)],[7000,pose(.25)]]);
    frame('.director-flare',[[0,{opacity:0}],[300,{opacity:.6}],[900,{opacity:0}],[1980,{opacity:0}],[2280,{opacity:.7}],[2830,{opacity:0}],[3690,{opacity:0}],[4080,{opacity:.65}],[4750,{opacity:0}],[7000,{opacity:0}]]);
    frame('.cut-progress>span',[[0,{transform:'scaleX(0)'}],[7000,{transform:'scaleX(1)'}]]);
    frame('#opening',[[0,{opacity:1}],[6630,{opacity:1,easing:EASE.focusOut}],[7000,{opacity:0}]]);
    return duration;
  }
  window.Motion={FILM_MS,play,reveal,focus,enter,artImpulse,study,reviewFrame,refocus,ripple,film,cancelWithin,active,mobile,blur,
    get enabled(){return enabled;},set enabled(value){enabled=!!value;if(!enabled)cancelWithin();document.body.classList.toggle('motion-off',!enabled);document.body.classList.toggle('motion-enabled',enabled);},EASE};
})();
