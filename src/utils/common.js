export function hasChinese(fileName) {
  if (!fileName) return false
  return /[\u4e00-\u9fa5]/.test(fileName)
}

export function hasFullWidthChars(fileName) {
  if (!fileName) return false
  return /[\uFF00-\uFFEF]/.test(fileName)
}

export function hasIllegalChars(fileName) {
  if (!fileName) return false
  return /[:*?"<>|\\/]/.test(fileName)
}

export function hasBrackets(fileName) {
  if (!fileName) return false
  return /[\(\)\[\]\{\}【】]/.test(fileName)
}

export function hasSpaces(fileName) {
  if (!fileName) return false
  return /\s/.test(fileName)
}

export function isFileNameTooLong(fileName, maxLength = 100) {
  if (!fileName) return false
  return fileName.length > maxLength
}

export function isPathTooLong(fullPath, maxLength = 255) {
  if (!fullPath) return false
  return fullPath.length > maxLength
}

export function sanitizeFileName(fileName) {
  if (!fileName) return 'file'

  const lastDot = fileName.lastIndexOf('.')
  const ext = lastDot > -1 ? fileName.substring(lastDot).toLowerCase() : ''
  const base = lastDot > -1 ? fileName.substring(0, lastDot) : fileName

  let sanitizedBase = base
    .replace(/[\u4e00-\u9fa5]/g, '_')
    .replace(/[\uFF00-\uFFEF]/g, '_')
    .replace(/[\(\)\[\]\{\}【】]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/[:*?"<>|\\/]/g, '_')
    .replace(/[~!@#$%^&*+=`|;:'",<>/?-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')

  sanitizedBase = sanitizedBase.substring(0, 50)

  return (sanitizedBase + ext) || 'file'
}

export function sanitizePathSegment(segment) {
  if (!segment) return ''
  return segment
    .replace(/[\u4e00-\u9fa5]/g, '_')
    .replace(/[\uFF00-\uFFEF]/g, '_')
    .replace(/[\\/]/g, '_')
    .replace(/[:*?"<>|]/g, '_')
    .replace(/[\(\)\[\]\{\}【】]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/[~!@#$%^&*+=`|;:'",<>/?-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 30)
}

export function generateMinimalFileName(fileName) {
  const lastDot = fileName.lastIndexOf('.')
  const ext = lastDot > -1 ? fileName.substring(lastDot).toLowerCase() : ''

  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)

  return `${timestamp}_${random}${ext}`
}

export function validateCleanedFileName(sanitizedName) {
  try {
    if (!sanitizedName || sanitizedName === 'file') return false

    const lastDot = sanitizedName.lastIndexOf('.')
    const base = lastDot > -1 ? sanitizedName.substring(0, lastDot) : sanitizedName

    if (!base || base.trim() === '') return false

    const containsIllegal = typeof hasIllegalChars === 'function' ? hasIllegalChars(sanitizedName) : false
    const containsChinese = typeof hasChinese === 'function' ? hasChinese(sanitizedName) : false
    const containsFullWidth = typeof hasFullWidthChars === 'function' ? hasFullWidthChars(sanitizedName) : false

    return !containsIllegal && !containsChinese && !containsFullWidth
  } catch (e) {
    console.error('validateCleanedFileName exception:', e)
    return false
  }
}

export function cleanAndValidateFileName(fileName) {
  try {
    if (!fileName) {
      return {
        storageFileName: generateMinimalFileName(''),
        needsMinimal: true,
        ext: ''
      }
    }

    const lastDot = fileName.lastIndexOf('.')
    const ext = lastDot > -1 ? fileName.substring(lastDot).toLowerCase() : ''
    
    const storageFileName = sanitizeFileName(fileName)

    if (validateCleanedFileName(storageFileName)) {
      return {
        storageFileName,
        needsMinimal: false,
        ext
      }
    }

    return {
      storageFileName: generateMinimalFileName(fileName),
      needsMinimal: true,
      ext
    }
  } catch (e) {
    console.error('cleanAndValidateFileName exception:', e)
    return {
      storageFileName: generateMinimalFileName(fileName),
      needsMinimal: true,
      ext: ''
    }
  }
}

export function generateId(prefix = '') {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 9)
  return `${prefix}${timestamp}${random}`
}