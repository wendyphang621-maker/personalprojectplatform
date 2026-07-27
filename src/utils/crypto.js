const ENCRYPTION_KEY = 'project_workbench_secure_key_2024'

function generateKey() {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32))
  return window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-CBC' },
    false,
    ['encrypt', 'decrypt']
  )
}

function generateIv() {
  return window.crypto.getRandomValues(new Uint8Array(16))
}

export async function encrypt(text) {
  try {
    const key = await generateKey()
    const iv = generateIv()
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-CBC', iv: iv },
      key,
      data
    )
    
    const encryptedArray = Array.from(new Uint8Array(encryptedBuffer))
    const ivArray = Array.from(iv)
    
    return JSON.stringify({ iv: ivArray, data: encryptedArray })
  } catch (e) {
    console.error('[加密] 加密失败:', e)
    return text
  }
}

export async function decrypt(encryptedText) {
  try {
    if (!encryptedText || typeof encryptedText !== 'string') {
      return encryptedText || ''
    }
    
    const parsed = JSON.parse(encryptedText)
    if (!parsed.iv || !parsed.data) {
      return encryptedText
    }
    
    const key = await generateKey()
    const iv = new Uint8Array(parsed.iv)
    const encryptedData = new Uint8Array(parsed.data)
    
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: iv },
      key,
      encryptedData
    )
    
    const decoder = new TextDecoder()
    return decoder.decode(decryptedBuffer)
  } catch (e) {
    console.error('[加密] 解密失败:', e)
    return encryptedText || ''
  }
}

export function isIncognitoMode() {
  if (typeof window !== 'undefined') {
    try {
      const fs = window.RequestFileSystem || window.webkitRequestFileSystem
      if (fs) {
        fs(window.TEMPORARY, 100, () => {}, () => {
          return true
        })
      }
    } catch (e) {
      return true
    }
    
    if (window.crypto && window.crypto.storage && typeof window.crypto.storage.persisted === 'function') {
      return !window.crypto.storage.persisted()
    }
  }
  return false
}

export function isLocalhost() {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
  }
  return false
}

export function isOnlineDeployment() {
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol
    const hostname = window.location.hostname
    return protocol === 'https:' || hostname.includes('github.io') || hostname.includes('netlify.app') || hostname.includes('vercel.app')
  }
  return false
}