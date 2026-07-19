/**
 * Brand splash (Moxt-splash.png) is shown only for the cold-start auth restore.
 * After the first auth resolution in this page lifetime, all other loads use a spinner.
 */

let bootSplashConsumed = false

export function shouldShowBootSplash() {
  return !bootSplashConsumed
}

export function markBootSplashConsumed() {
  bootSplashConsumed = true
}

export function __resetBootSplashForTests() {
  bootSplashConsumed = false
}
