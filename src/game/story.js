import { characterFor } from './characters.js';

const chapter = (title, intro, ending, color, sky) => ({ title, intro, ending, color, sky });

// One adventure passes from Nova's star to Pip's seed to Bop's city heart.
export const JOURNEYS = Object.freeze({
  nova: {
    id: 'nova', name: 'Starfall Islands', quest: 'Bring a little star home.',
    token: 'stardrop', tokens: 'stardrops', relics: 'star maps',
    sheet: 'novaWorld', sceneSheet: 'novaScenes', horizontalScale: 1,
    ending: 'The star sends a wish seed to Pip. A new adventure is growing!',
    chapters: [
      chapter('Moon Landing', 'Nova found a little star far from home.', 'The little star remembers a trail of rings.', '#ffe19a', '#263e66'),
      chapter('Ring Ruins', 'Ride the old rings. Follow the glow!', 'A purple sparkle points into the caves.', '#94edf7', '#194659'),
      chapter('Crystal Caves', 'The star’s trail leads underground.', 'The star is cold. Let’s find some sunshine!', '#d4b3ff', '#3c285b'),
      chapter('Sunforge', 'Warm the sleepy star in the Sunforge.', 'Warm and bright! Now, above the clouds.', '#ffd190', '#603d42'),
      chapter('Aurora Sea', 'Carry its light across the cloud sea.', 'There it is. The star’s home!', '#adf2ef', '#215368'),
      chapter('Star Observatory', 'One last flight. Send the little star home.', 'The star sends a wish seed down to Pip!', '#fff0a8', '#22315a'),
    ],
  },
  pip: {
    id: 'pip', name: 'Bloomwild Forest', quest: 'Wake the Heart Tree.',
    token: 'dewdrop', tokens: 'dewdrops', relics: 'wish seeds',
    sheet: 'pipWorld', sceneSheet: 'pipScenes', horizontalScale: -1,
    ending: 'The Heart Tree gives Bop a glowing heart. Let’s wake the city!',
    chapters: [
      chapter('Fern Hollow', 'Nova’s star sent Pip a wish seed. Tail jumps will carry it home!', 'The mushrooms know where this seed belongs.', '#c7f5a7', '#254b46'),
      chapter('Mushroom Grove', 'Hop through the mushrooms. They know the way!', 'A little root is pointing underground.', '#ffd4ac', '#51423d'),
      chapter('Root Tunnels', 'Keep the seed safe beneath the roots.', 'The seed is thirsty. Follow the bees!', '#e8be8c', '#49382f'),
      chapter('Honey Cliffs', 'The bees will help us reach the rain.', 'A drop of rain. A tiny new leaf!', '#ffe497', '#625044'),
      chapter('Cloud Canopy', 'Let the cloud flowers carry you higher.', 'The Heart Tree is waiting just ahead.', '#e6c1ff', '#355f69'),
      chapter('Heart Tree', 'One mighty tail leap. Wake the Heart Tree!', 'The tree has a glowing gift for Bop!', '#dafa9b', '#23574a'),
    ],
  },
  bop: {
    id: 'bop', name: 'Clockwork Cove', quest: 'Light up the sleeping city.',
    token: 'spark', tokens: 'sparks', relics: 'heart gears',
    sheet: 'bopWorld', sceneSheet: 'bopScenes', horizontalScale: 1, alternatingRoute: true,
    ending: 'A shining sky, a blooming forest, a happy city. You did it, together!',
    chapters: [
      chapter('Bolt Beach', 'Pip brought Bop a glowing heart. Hook the gears and bring it home!', 'The heart needs a little bubble bath.', '#9ef0eb', '#234b5e'),
      chapter('Bubble Pipes', 'Ride the bubbles to the workshop.', 'All clean! Let’s wake up the gears.', '#b4eefa', '#245765'),
      chapter('Gearworks', 'The gears can mend the sleepy heart.', 'Fixed! A rocket will take us to the sky.', '#ffd199', '#554438'),
      chapter('Rocket Orchard', 'Borrow a rocket. Up we go!', 'The heart is humming. Follow the magnets!', '#ffcca1', '#5c3d52'),
      chapter('Magnet Sky', 'Float along the magnetic trail.', 'Look at all those sleepy little houses.', '#bcc6ff', '#33365b'),
      chapter('Lantern City', 'Plug in the heart. Hello, city!', 'Every little window is glowing!', '#ffe5a7', '#303958'),
    ],
  },
});

export const journeyFor = id => JOURNEYS[characterFor(id).id];
export const chapterFor = (id, index = 0) => journeyFor(id).chapters[Math.max(0, Math.min(5, Math.floor(index)))];
