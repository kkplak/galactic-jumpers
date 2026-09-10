// The friends enter in story order, each bringing a different traversal tool.
export const CHARACTERS = Object.freeze([
  Object.freeze({ id: 'nova', name: 'Nova', sheet: 'explorer', color: '#ffdc7d', ability:'jetpack', abilityName:'Jetpack', action:'FLY', icon:'boost', meter:'Jetpack fuel', guide:'Hold to fly', instruction:'Land to fill your jetpack.' }),
  Object.freeze({ id: 'pip', name: 'Pip', sheet: 'pip', color: '#ffba95', ability:'tail', abilityName:'Tail jump', action:'TAIL', icon:'tail', meter:'Tail jump ready', guide:'Tap for a big leap', instruction:'Tap your tail button from the ground. Land to recharge.' }),
  Object.freeze({ id: 'bop', name: 'Bop', sheet: 'bop', color: '#9ee8ce', ability:'hook', abilityName:'Grappling hook', action:'HOOK', icon:'hook', meter:'Hook ready', guide:'Hold to hook', instruction:'Hold near a glowing gear. Release to let go. Land to reset.' }),
]);
export const characterFor = id => CHARACTERS.find(character => character.id === id) ?? CHARACTERS[0];
