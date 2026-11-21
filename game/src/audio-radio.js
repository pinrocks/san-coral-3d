/* Procedural Web Audio Engine & 3-Station Synth Radio */

const midi=(n) => 440*(2 ** ((n - 69) / 12));
export const RADIO_STATIONS=[
{ id:'costa',name:'FM 98.5 COSTA TROPICAL',bpm:112,wave:'triangle',bass:[33,33,36,38,35,35,38,40],lead:[69,72,76,74,72,76,79,76] },
{ id:'neon',name:'FM 102.1 NEON WAVE',bpm:124,wave:'sawtooth',bass:[36,36,39,41,34,34,39,43],lead:[72,75,79,84,82,79,75,79] },
{ id:'ritmo',name:'FM 106.7 SOL RITMO',bpm:105,wave:'square',bass:[31,36,34,38,31,36,41,38],lead:[67,71,74,79,76,74,71,74] }
];

export function createAudioEngine() {
let ctx=null,master=null,nBuf=null,eOscA,eOscB,eFilt,eGain,dFilt,dGain,sFilt,sGain,sirOsc,sirGain;
let muted=false,stIdx=0,stepAcc=0,stepN=0,sirPh=0,surfPh=0,prevGear=1;
function init() {
 if (ctx) return ctx;
 const AC=window.AudioContext||window.webkitAudioContext;
 if (!AC) return null;
 try { ctx=new AC();} catch { return null;}
 master=ctx.createGain();master.gain.value=muted?0:0.34;master.connect(ctx.destination);
 const len=ctx.sampleRate*2;nBuf=ctx.createBuffer(1,len,ctx.sampleRate);
 const ch=nBuf.getChannelData(0);
 for (let i=0,s=918273;i < len;i++) { s=(s*1664525+1013904223) >>> 0;ch[i]=(s / 2147483648) - 1;}
 eFilt=ctx.createBiquadFilter();eFilt.type='lowpass';eFilt.frequency.value=220;
 eGain=ctx.createGain();eGain.gain.value=0.0001;
 eOscA=ctx.createOscillator();eOscA.type='sawtooth';eOscB=ctx.createOscillator();eOscB.type='triangle';
 eOscA.connect(eFilt);eOscB.connect(eFilt);eFilt.connect(eGain);eGain.connect(master);eOscA.start();eOscB.start();
 const loop=(type,freq,q,g0)=>{
  const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
  s.buffer=nBuf;s.loop=true;f.type=type;f.frequency.value=freq;f.Q.value=q;g.gain.value=g0;
  s.connect(f);f.connect(g);g.connect(master);s.start();return [f,g];
 };
 [dFilt,dGain]=loop('bandpass',1350,3.2,0.0001);[sFilt,sGain]=loop('lowpass',420,1,0.018);
 sirOsc=ctx.createOscillator();sirOsc.type='triangle';sirOsc.frequency.value=660;
 sirGain=ctx.createGain();sirGain.gain.value=0.0001;sirOsc.connect(sirGain);sirGain.connect(master);sirOsc.start();
 return ctx;
}
const unlock=()=>{ const c=init();if (c?.state==='suspended') c.resume().catch(()=>{});};
const ok=()=>Boolean(ctx&&ctx.state==='running'&&!muted);
function burst(dur,freq,q,gain,type='bandpass') {
 if (!ok()||!nBuf) return;
 const t=ctx.currentTime,s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
 s.buffer=nBuf;f.type=type;f.frequency.setValueAtTime(freq,t);f.Q.value=q;
 g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(0.0008,t+dur);
 s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+dur+0.02);
}
function tone(f0,f1,dur,type,gain) {
 if (!ok()) return;
 const t=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();
 o.type=type;o.frequency.setValueAtTime(f0,t);
 if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(24,f1),t+dur);
 g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(0.0008,t+dur);
 o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+0.02);
}

const fire=(w='carbine') => {
 const k=String(w).toLowerCase();
 if (k.includes('fist')) return tone(150,58,0.09,'sine',0.16);
 if (k.includes('launcher')) { burst(0.32,520,1.2,0.24,'lowpass');return tone(190,52,0.28,'sawtooth',0.22);}
 burst(0.085,1650,1.4,0.22);
 tone(k.includes('pistol') ? 260 :k.includes('smg') ? 310 :225,68,0.09,'sawtooth',0.2);
};
const boom=(i=1) => { const s=Math.max(0.4,Math.min(1.6,Number(i) || 1));burst(0.65*s,260,0.9,0.38*s,'lowpass');tone(115,28,0.55*s,'sine',0.36*s);};
const hit=(h=false) => { burst(h ? 0.18 :0.09,h ? 620 :1100,1.8,h ? 0.2 :0.11);tone(h ? 130 :210,55,0.11,'triangle',h ? 0.18 :0.1);};
const chime=() => { tone(523.3,523.3,0.14,'triangle',0.15);setTimeout(() => tone(659.3,784,0.24,'triangle',0.16),95);};

const ramp=(param,val,tc=0.06) => param.setTargetAtTime(val,ctx.currentTime,tc);

function update(dt,st={}) {
 if (!ok()) return;
 const v=st.vehicle,wl=Number(st.wantedLevel) || 0;
 const coast=st.playerX !== undefined ? Math.max(0,Math.min(1,(st.playerX - 240) / 180)) :0.35;
 const sw=0.5+0.5*Math.sin(surfPh += dt*0.55);
 ramp(sFilt.frequency,300+coast*380*sw,0.08);
 ramp(sGain.gain,0.01+coast*0.03*sw,0.08);

 if (v && !v.destroyed) {
   const spd=Math.abs(v.speedKmh || 0),r0=Number(v.rpm) || 0;
   const rpm=Math.max(0.18,Math.min(1,r0 > 10 ? (r0 - 800) / 6200 :(r0 || 0.35)));
   if ((v.gear || 1) !== prevGear) { prevGear=v.gear || 1;burst(0.05,1900,2.2,0.05);}
   const hz=v.isBoat ? 46+rpm*92 :52+rpm*138+(v.boosting ? 28 :0);
   ramp(eOscA.frequency,hz,0.05);ramp(eOscB.frequency,hz*(v.isBoat ? 1.5 :2.01),0.05);
   ramp(eFilt.frequency,220+rpm*980+(v.boosting ? 420 :0));
   ramp(eGain.gain,0.055+rpm*0.065);
   ramp(dFilt.frequency,v.isBoat ? 780 :1420,0.05);
   ramp(dGain.gain,v.drifting && spd > 22 ? Math.min(0.11,spd / 900) :(v.isBoat && spd > 18 ? 0.04 :0.0001),0.05);
   if (!v.isPolice) {
     const rs=RADIO_STATIONS[stIdx],dur=30 / rs.bpm;
     if ((stepAcc += dt) >= dur) {
       stepAcc -= dur;const i=stepN++ % 8,bf=midi(rs.bass[i]);
       tone(bf,bf*0.99,dur*0.85,'triangle',0.075);
       if (i % 2 === 0 || rs.id === 'neon') tone(midi(rs.lead[i]),midi(rs.lead[i]),dur*0.55,rs.wave,0.042);
     }
   }
 } else { ramp(eGain.gain,0.0001,0.08);ramp(dGain.gain,0.0001);}

 if (wl >= 2 || st.sirenActive) {
   sirPh += dt*(wl >= 4 ? 3.8 :2.6);
   ramp(sirOsc.frequency,Math.sin(sirPh*Math.PI) > 0 ? 780 :585,0.03);
   ramp(sirGain.gain,0.026+Math.min(0.03,wl*0.006));
 } else ramp(sirGain.gain,0.0001,0.08);
}

const setMuted=(f) => { muted=Boolean(f);if (master && ctx) master.gain.setTargetAtTime(muted ? 0 :0.34,ctx.currentTime,0.04);return muted;};
const cycleStation=() => { unlock();stIdx=(stIdx+1) % 3;tone(680,880,0.045,'sine',0.08);return RADIO_STATIONS[stIdx];};
const api={
 stations:RADIO_STATIONS,unlock,resume:unlock,setMuted,
 toggleMute:() => { unlock();return setMuted(!muted);},isMuted:() => muted,
 cycleStation,nextStation:cycleStation,setStation:(i) => RADIO_STATIONS[stIdx=((i % 3)+3) % 3],
 getStation:() => RADIO_STATIONS[stIdx],getStationName:() => RADIO_STATIONS[stIdx].name,
 playWeaponFire:fire,playShot:fire,playGunshot:fire,playExplosion:boom,playImpact:hit,
 playMissionChime:chime,playPickup:chime,playUiClick:() => tone(680,880,0.045,'sine',0.08),update
};
return new Proxy(api,{ get:(t,p) => p in t ? t[p] :(typeof p === 'string' && /^(play|sfx|set|update)/.test(p) ? () => {} :undefined) });
}
