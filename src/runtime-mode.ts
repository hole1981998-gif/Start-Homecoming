export type RuntimeMode = 'force' | 'noforce';

// The former main build is kept at an explicit backup URL. Every other game
// entry point, including / and /index.html, runs the integrated physics.
export function runtimeMode(pathname: string): RuntimeMode {
  return pathname.endsWith('/ver.noforce.html') ? 'noforce' : 'force';
}
