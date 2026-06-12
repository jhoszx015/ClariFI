;(function () {
  try {
    var k = 'clarifi-theme'
    var t = localStorage.getItem(k) || 'system'
    var r =
      t === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : t
    var d = document.documentElement
    if (r === 'dark') {
      d.classList.add('dark')
    } else {
      d.classList.remove('dark')
    }
    d.style.colorScheme = r
  } catch (e) {
    /* ignore */
  }
})()
