// Pixel anchors describe the painted landing span inside each trimmed frame.
// Match that span to the collider, rather than lining up transparent crop edges.
export function platformArtwork(platform, frame, surface) {
  const [, , sourceWidth, sourceHeight] = frame;
  const [left, top, right] = surface;
  const scaleX = platform.w / (right - left);
  const width = sourceWidth * scaleX, height = platform.w * .30;
  return {
    x: platform.x - platform.w / 2 + (sourceWidth / 2 - left) * scaleX,
    y: platform.y - height * (1 - top / sourceHeight),
    width, height,
  };
}

export function collapseShake(platform, elapsed, reducedMotion = false) {
  if(reducedMotion || platform.type!=='fragile' || platform.broken || platform.crumble<=0)return 0;
  const urgency=1-Math.min(1,platform.crumble/.7);
  return Math.sin(elapsed*79+platform.id*2.3)*(1.2+urgency*2.1);
}
