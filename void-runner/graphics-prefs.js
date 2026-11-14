/* Graphics preference rules (pure: browser and Node tests). Which quality preset the game starts on, and what a saved value means.
   - New players start on MEDIUM.
   - A preset the player chose in Settings is kept (it is saved with chosen:true, version 2) and is never raised or lowered by the game.
   - Nothing here measures the computer or adapts quality: there is no automatic Ultra (or any other automatic change). The old weak-hardware "auto" Low (auto:true) and the
     unchosen High default that 12 Nov 2026 (c3c9213) introduced are NOT treated as choices.
   Saved value: localStorage 'void-runner-graphics-v1' = {renderer, quality, lookSensitivity, v:2, chosen}. Older saves have no v. */
(function(root){
 'use strict';
 const DEFAULT='medium',VERSION=2;
 /* stored: the parsed saved object (or null). presets: the preset names that exist. Returns {quality, chosen, migrated, reason}. */
 function resolve(stored,presets){
  const known=q=>typeof q==='string'&&presets.includes(q);
  if(!stored||typeof stored!=='object'||!known(stored.quality))return {quality:DEFAULT,chosen:false,migrated:false,reason:'default'};
  if(stored.auto===true)return {quality:DEFAULT,chosen:false,migrated:true,reason:'old automatic setting ignored'};   // written by the removed weak-hardware check, never a choice
  if(stored.v>=VERSION)return stored.chosen===true?{quality:stored.quality,chosen:true,migrated:false,reason:'chosen'}:{quality:DEFAULT,chosen:false,migrated:false,reason:'not chosen'};
  // saves from before version 2: Low, Medium and Ultra could only be picked in Settings, so they stay. High was the unchosen default from 12 Nov (and was written into the save
  // whenever look sensitivity changed), so it cannot be told apart from a choice: it moves to Medium once. Choosing High again in Settings keeps it for good.
  if(stored.quality==='high')return {quality:DEFAULT,chosen:false,migrated:true,reason:'legacy High (the unchosen default) moved to Medium'};
  return {quality:stored.quality,chosen:true,migrated:false,reason:'legacy choice kept'};
 }
 const serialize=g=>({renderer:g.renderer,quality:g.quality,lookSensitivity:g.lookSensitivity,v:VERSION,chosen:!!g.chosen});
 const api={DEFAULT,VERSION,resolve,serialize};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidGraphicsPrefs=api;
})(typeof globalThis!=='undefined'?globalThis:this);
