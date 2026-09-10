// Vite replaces BASE_URL at build time; pure Node tests use the root fallback.
export const assetUrl = name => `${import.meta.env?.BASE_URL ?? '/'}assets/${name}`;
export const ATLAS_FILES = Object.freeze({
  explorer:'explorer-atlas', objects:'objects-atlas', pip:'pip-atlas', bop:'bop-atlas', friends:'friends-atlas',
  novaWorld:'nova-world', pipWorld:'pip-world', bopWorld:'bop-world',
  novaScenes:'nova-scenes', pipScenes:'pip-scenes', bopScenes:'bop-scenes',
});
export const ATLAS_COUNTS = Object.freeze({explorer:8,objects:8,pip:8,bop:8,friends:16,novaWorld:24,pipWorld:24,bopWorld:24,novaScenes:6,pipScenes:6,bopScenes:6});
export const IMAGE_COUNT = 1 + Object.keys(ATLAS_FILES).length;
