export type NotifyVariant = 'success' | 'error' | 'info'

export function notify(message: string, variant: NotifyVariant = 'info') {
  if (typeof window === 'undefined') return
  const containerId = 'athlink-toast-container'
  let container = document.getElementById(containerId)
  if (!container) {
    container = document.createElement('div')
    container.id = containerId
    container.style.position = 'fixed'
    container.style.top = '16px'
    container.style.right = '16px'
    container.style.zIndex = '9999'
    container.style.display = 'flex'
    container.style.flexDirection = 'column'
    container.style.gap = '8px'
    document.body.appendChild(container)
  }
  const toast = document.createElement('div')
  toast.textContent = message
  toast.style.padding = '10px 12px'
  toast.style.borderRadius = '8px'
  toast.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)'
  toast.style.fontSize = '12px'
  toast.style.color = variant === 'error' ? '#991B1B' : variant === 'success' ? '#065F46' : '#0F172A'
  toast.style.background = variant === 'error' ? '#FEE2E2' : variant === 'success' ? '#D1FAE5' : '#F1F5F9'
  toast.style.border = '1px solid ' + (variant === 'error' ? '#FCA5A5' : variant === 'success' ? '#A7F3D0' : '#E2E8F0')
  toast.style.opacity = '0'
  toast.style.transform = 'translateY(-6px)'
  toast.style.transition = 'opacity 120ms ease, transform 120ms ease'
  container.appendChild(toast)
  requestAnimationFrame(() => {
    toast.style.opacity = '1'
    toast.style.transform = 'translateY(0)'
  })
  const timeout = window.setTimeout(() => {
    toast.style.opacity = '0'
    toast.style.transform = 'translateY(-6px)'
    window.setTimeout(() => toast.remove(), 200)
  }, 2000)
  toast.addEventListener('click', () => {
    window.clearTimeout(timeout)
    toast.remove()
  })
}
