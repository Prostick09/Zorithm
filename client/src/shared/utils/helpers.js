/**
 * Generate a local unique ID for messages before server response
 */
export const generateLocalId = () =>
  `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

/**
 * Format a timestamp for display
 * @param {string} iso - ISO date string
 */
export const formatTime = (iso) => {
  const date = new Date(iso)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * Format a date for sidebar display
 * @param {string} iso
 */
export const formatRelativeDate = (iso) => {
  const now = new Date()
  const date = new Date(iso)
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

/**
 * Get complexity color based on Big O notation
 * @param {string} complexity - e.g. "O(n log n)"
 */
export const getComplexityColor = (complexity) => {
  if (!complexity) return 'neutral'
  const c = complexity.toLowerCase().replace(/\s/g, '')
  if (c === 'o(1)') return 'green'
  if (c === 'o(logn)') return 'green'
  if (c === 'o(n)') return 'blue'
  if (c === 'o(nlogn)') return 'yellow'
  if (c.includes('n²') || c.includes('n^2') || c.includes('n2')) return 'orange'
  if (c.includes('n³') || c.includes('2^n') || c.includes('n!')) return 'red'
  return 'purple'
}

/**
 * Truncate text to a max length
 */
export const truncate = (str, max = 60) =>
  str && str.length > max ? str.substring(0, max) + '…' : str
