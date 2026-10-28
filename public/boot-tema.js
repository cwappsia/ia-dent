try {
  document.documentElement.dataset.tema = localStorage.getItem('dentia-tema') || 'escuro'
} catch (e) {
  document.documentElement.dataset.tema = 'escuro'
}
