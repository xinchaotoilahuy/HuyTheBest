/* Original stereo score. Playback state reflects the browser's actual audio context. */
(() => {
  'use strict';
  const AudioContext=window.AudioContext||window.webkitAudioContext;
  const files={intro:'intro',click:'glass',transition:'sweep',evidence:'evidence'};
  const levels={intro:.92,click:.62,transition:.86,evidence:.83};
  const buffers=new Map(),loads=new Map(),voices=new Set(),lastCue=new Map();
  let context=null,master=null,wanted=true,volume=.82,introPending=false,introStart=null;
  let introVoice=null,failed=false;
  const seconds=window.Motion.FILM_MS/1000;
  const running=()=>context?.state==='running';
  const audible=()=>wanted&&volume>0&&running()&&!document.hidden;
  function status(){
    if(!wanted||volume===0)return 'muted';
    if(!AudioContext||failed)return 'error';
    if(!buffers.has('intro'))return 'loading';
    return running()?'playing':'blocked';
  }
  function update(){
    document.dispatchEvent(new CustomEvent('soundchange',{detail:{
      enabled:audible(),wanted,volume,state:status(),cue:introVoice?'intro':[...voices].find(v=>!v.stopped)?.key||'idle'
    }}));
  }
  function smooth(param,value,duration=.06){
    if(!context)return;
    const now=context.currentTime;
    if(param.cancelAndHoldAtTime)param.cancelAndHoldAtTime(now);
    else{const previous=param.value;param.cancelScheduledValues(now);param.setValueAtTime(previous,now);}
    param.linearRampToValueAtTime(value,now+duration);
  }
  function createContext(){
    if(context)return context;
    if(!AudioContext)return null;
    try{
      context=new AudioContext({latencyHint:'interactive'});
      master=context.createGain();master.gain.value=wanted?volume:0;
      const limiter=context.createDynamicsCompressor();
      limiter.threshold.value=-6;limiter.knee.value=6;limiter.ratio.value=8;
      limiter.attack.value=.003;limiter.release.value=.12;
      master.connect(limiter);limiter.connect(context.destination);
      context.addEventListener('statechange',()=>{
        if(running()&&wanted&&introStart!==null)alignIntro();
        update();
      });
    }catch(_){failed=true;}
    update();return context;
  }
  function load(key){
    if(buffers.has(key))return Promise.resolve(buffers.get(key));
    if(loads.has(key))return loads.get(key);
    const ctx=createContext();if(!ctx)return Promise.resolve(null);
    const task=(async()=>{
      try{
        const encoded=window.SITE_AUDIO[key];
        if(!encoded)throw new Error('Audio unavailable');
        const bytes=Uint8Array.from(atob(encoded),character=>character.charCodeAt(0)).buffer;
        const buffer=await ctx.decodeAudioData(bytes);
        buffers.set(key,buffer);if(key==='intro')failed=false;
        if(key==='intro')alignIntro();
        update();return buffer;
      }catch(_){if(key==='intro')failed=true;loads.delete(key);update();return null;}
    })();
    loads.set(key,task);return task;
  }
  function prepare(){
    const intro=load('intro');
    for(const key of ['click','transition','evidence'])void load(key);
    return intro;
  }
  function waitForRunning(timeout){
    if(running())return Promise.resolve(true);
    if(!context)return Promise.resolve(false);
    return new Promise(resolve=>{
      let timer;
      const finish=value=>{clearTimeout(timer);context.removeEventListener('statechange',changed);resolve(value);};
      const changed=()=>{if(running())finish(true);};
      context.addEventListener('statechange',changed);
      timer=setTimeout(()=>finish(running()),timeout);
    });
  }
  function requestResume(){
    const ctx=createContext();if(!ctx)return;
    // Resume within the trusted event, before any await. Blocked requests can stay pending.
    if(ctx.state!=='running')try{ctx.resume().then(update).catch(update);}catch(_){update();}
  }
  async function unlock(){
    if(!wanted)return false;
    requestResume();
    const [ready,active]=await Promise.all([prepare(),waitForRunning(1200)]);
    if(ready&&active&&wanted&&introStart!==null)alignIntro();
    update();return !!ready&&active&&wanted;
  }
  async function tryAutoplay(){
    if(!wanted)return false;
    requestResume();
    const [ready,active]=await Promise.all([prepare(),waitForRunning(220)]);
    if(ready&&active&&wanted&&introStart!==null)alignIntro();
    update();return !!ready&&active&&wanted;
  }
  function stopVoice(voice,fade=.045){
    if(!voice||voice.stopped)return;
    voice.stopped=true;smooth(voice.gain.gain,0,fade);
    try{voice.source.stop(context.currentTime+fade+.005);}catch(_){}
    if(voice===introVoice)introVoice=null;
  }
  function play(key,{offset=0,rate=1}={}){
    const buffer=buffers.get(key);if(!audible()||!buffer||offset>=buffer.duration)return null;
    const source=context.createBufferSource(),gain=context.createGain();
    source.buffer=buffer;source.loop=false;source.playbackRate.value=rate;
    gain.gain.value=0;source.connect(gain);gain.connect(master);
    gain.gain.linearRampToValueAtTime(levels[key],context.currentTime+.009);
    const voice={key,source,gain,stopped:false};voices.add(voice);
    source.onended=()=>{
      voices.delete(voice);source.disconnect();gain.disconnect();
      if(voice===introVoice)introVoice=null;
      update();
    };
    source.start(0,offset);return voice;
  }
  function effect(key,variant=0){
    if(!files[key]||key==='intro'||!audible()||introPending)return;
    const requested=performance.now(),minimum=key==='click'?55:180;
    if(requested-(lastCue.get(key)||-Infinity)<minimum)return;
    lastCue.set(key,requested);
    const emit=()=>{
      if(performance.now()-requested>220||!audible()||introPending)return;
      const same=[...voices].filter(v=>v.key===key&&!v.stopped);
      if(same.length>=(key==='click'?3:1))stopVoice(same[0],.02);
      const rate=key==='transition'?[.98,1.01,.96,1.03,1,.97,1.04,.95,1.02][Math.abs(variant)%9]:1;
      play(key,{rate});update();
    };
    if(buffers.has(key))emit();else void load(key).then(emit);
  }
  function reserveIntro(){stop();introPending=true;introStart=null;update();}
  function startIntro(time){
    introPending=true;introStart=time;stopVoice(introVoice);
    alignIntro();if(!introVoice)void load('intro').then(alignIntro);update();
  }
  function alignIntro(){
    if(!introPending||introStart===null||introVoice||!audible())return;
    const elapsed=(performance.now()-introStart)/1000;
    if(elapsed>=seconds)return;
    introVoice=play('intro');
    if(introVoice){
      introStart=performance.now();
      document.dispatchEvent(new CustomEvent('introstart',{detail:{startedAt:introStart}}));
    }
    update();
  }
  function stopIntro(){introPending=false;introStart=null;stopVoice(introVoice);update();}
  function stop(){for(const voice of voices)stopVoice(voice);update();}
  const gestureUnlock=event=>{
    if(!event.target.closest('#sound-button,#sound-setting,#sound-volume'))void unlock();
  };
  document.addEventListener('pointerdown',gestureUnlock,{capture:true});
  document.addEventListener('click',gestureUnlock,{capture:true});
  document.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key))gestureUnlock(event);},{capture:true});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)stop();else if(wanted){requestResume();if(introStart!==null)alignIntro();}
    update();
  });
  window.Sound={
    prepare,tryAutoplay,unlock,effect,reserveIntro,startIntro,stopIntro,alignIntro,stop,
    get enabled(){return wanted;},get unlocked(){return running()&&buffers.has('intro');},
    get state(){return status();},get volume(){return volume;},
    set volume(value){
      volume=Math.max(0,Math.min(1,Number(value)||0));
      if(master)smooth(master.gain,wanted?volume:0,.08);
      if(volume>0&&wanted&&introStart!==null)alignIntro();update();
    },
    set enabled(value){
      wanted=!!value;if(master)smooth(master.gain,wanted?volume:0,.06);
      if(wanted)void unlock();else stop();update();
    }
  };
  // Decode the embedded score before the 3D bundle and page composition load.
  void prepare();
})();
