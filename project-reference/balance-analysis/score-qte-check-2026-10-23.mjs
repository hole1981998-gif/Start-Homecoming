import fs from 'node:fs';
const vehicles={motorcycle:[8,14,20,2,.6],motorbike:[9,18.5,28,2,.6],car4:[8,16,24,4,.8],car7:[8,15,22,7,.95],tricycle:[6,11.5,17,4,.75],truck:[6,13,20,3,1.1],bus:[6,12.5,19,25,1.15],container:[5,11.5,18,2,1.3]};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function multiplier(v,min,cruise,max){
 if(v<=min)return 0;
 if(v<=cruise)return clamp((v-min)/Math.max(.001,cruise-min),0,1)**1.2;
 return 1+.5*clamp((v-cruise)/Math.max(.001,max-cruise),0,1);
}
const examples=[8,10,12,16,20,24,31.2].map(v=>({speed:v,multiplier:multiplier(v,8,16,24),pointsPerKm:1000*.65*multiplier(v,8,16,24),pointsPerMinute:60*v*.65*multiplier(v,8,16,24)}));
let checks=0,minClose=Infinity;
const qte=[];
for(const [kind,[min,cruise,max,capacity,lead]] of Object.entries(vehicles)){
 let previous=-1;
 for(let v=0;v<=max*1.7;v+=.05){const m=multiplier(v,min,cruise,max);if(!Number.isFinite(m)||m<previous-1e-10||m<0||m>1.5+1e-10)throw Error('Score invariant');previous=m;checks++;}
 for(let ref=8;ref<=60;ref+=.1){const oldOpen=2.4*ref,oldClose=Math.max(9,lead*ref),newOpen=2*ref,newClose=oldClose-.4*ref;if(Math.abs((oldOpen-oldClose)-(newOpen-newClose))>1e-8||newClose<3-1e-8||newClose<=2)throw Error('QTE invariant');minClose=Math.min(minClose,newClose);checks++;}
 const ref=14,oldOpen=33.6,oldClose=Math.max(9,lead*ref);
 qte.push({kind,referenceSpeed:ref,oldOpen,oldClose,newOpen:28,newClose:oldClose-5.6,seconds:(oldOpen-oldClose)/ref});
}
const result={scope:'Numerical formula checks only, no game simulation or manual UI check',checks,minClose,maximumPointsPerMetre:.65*1.5*1.08,examples,qte};
fs.writeFileSync(new URL('score-qte-check-2026-10-23.json',import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
