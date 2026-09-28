export function mountPortfolio(motionPreference) {
const motionEase='cubic-bezier(.22,1,.36,1)';
// Keep visible content opaque during entrances to avoid a bright–dim–bright flash.
// Measure parallax from the unmoving parent, not the transformed image.
// Give the work history a continuous reading rhythm and reveal the product image.
const jobs=document.querySelector('.jobs'),projectImage=document.querySelector('.travel figure');let scrollPending=false;
function scrollMotion(){scrollPending=false;if(motionPreference.matches)return;const r=jobs?.getBoundingClientRect(),amount=Math.max(0,Math.min(1,r?(innerHeight*.72-r.top)/r.height:0));jobs?.style.setProperty('--career-progress',amount);if(projectImage){const p=projectImage.parentElement.getBoundingClientRect(),progress=Math.max(-1,Math.min(1,(innerHeight*.5-p.top)/innerHeight));projectImage.style.transform='translateY('+(-progress*16)+'px)'}}
addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(scrollMotion)}},{passive:true});
const entrances=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;const el=entry.target;el.classList.add('is-read');if(!motionPreference.matches){if(el.matches('.job'))el.querySelector('div').animate([{transform:'translateX(12px)'},{transform:'translateX(0)'}],{duration:650,easing:motionEase});else if(el.matches('.travel'))el.querySelector('img').animate([{transform:'translateX(12px)'},{transform:'translateX(0)'}],{duration:1000,easing:motionEase});else if(el.matches('.footer'))el.querySelector('h2').animate([{transform:'translateY(8px)'},{transform:'translateY(0)'}],{duration:750,easing:motionEase})}entrances.unobserve(el)})},{threshold:.18});document.querySelectorAll('#home-view .job,#home-view .travel,.portfolio-footer .footer').forEach(el=>entrances.observe(el));
if(!motionPreference.matches)document.querySelectorAll('.hero h1,.hero-role').forEach((el,i)=>el.animate([{transform:'translateY(10px)'},{transform:'translateY(0)'}],{duration:800,delay:i*100,fill:'backwards',easing:motionEase}));

motionPreference.addEventListener('change',()=>{if(motionPreference.matches){document.getAnimations().forEach(a=>a.cancel());if(projectImage)projectImage.style.transform='none';}scrollMotion();});
scrollMotion();
 document.querySelectorAll('[data-notes-direction]').forEach(button=>button.addEventListener('click',()=>{const rail=document.getElementById('notes-carousel');rail?.scrollBy({left:Number(button.getAttribute('data-notes-direction'))*rail.clientWidth*.85,behavior:motionPreference.matches?'instant':'smooth'});}));
}
