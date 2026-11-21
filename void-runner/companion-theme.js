/* Independent of Firebase so appearance is available even before sign-in. */
(()=>{
 const key='void-companion-theme';
 const root=document.documentElement,button=document.getElementById('companion-theme');
 const meta=document.querySelector('meta[name="theme-color"]');
 let theme='dark';
 try{if(localStorage.getItem(key)==='light')theme='light';}catch{}
 function render(){
  const dark=theme==='dark';
  root.dataset.companionTheme=theme;
  button.setAttribute('aria-pressed',String(dark));
  button.textContent=dark?'Dark mode: On':'Dark mode: Off';
  meta?.setAttribute('content',dark?'#07090d':'#f4f7f8');
 }
 button.addEventListener('click',()=>{
  theme=theme==='dark'?'light':'dark';
  try{localStorage.setItem(key,theme);}catch{}
  render();
 });
 render();
})();
