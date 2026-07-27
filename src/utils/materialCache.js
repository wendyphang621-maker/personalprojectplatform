const DB_VERSION = 3
const STORE_NAME = 'materials'
const RETRY_COUNT = 2
const RETRY_DELAY = 100

let db = null

function getDBName() {
  const domain = typeof window !== 'undefined' ? window.location.hostname : 'local'
  const account = typeof window !== 'undefined' ? localStorage.getItem('user') : 'anonymous'
  return `MaterialCacheDB_${domain}_${account}`
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function openDB(retry = RETRY_COUNT) {
  const DB_NAME = getDBName()
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => {
      if (retry > 0) {
        delay(RETRY_DELAY).then(() => {
          openDB(retry - 1).then(resolve).catch(reject)
        })
      } else {
        reject(request.error)
      }
    }
    
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result
      if (database.objectStoreNames.contains(STORE_NAME)) {
        database.deleteObjectStore(STORE_NAME)
      }
      const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' })
      store.createIndex('targetModelName', 'targetModelName', { unique: false })
      store.createIndex('rootModelFolderName', 'rootModelFolderName', { unique: false })
      store.createIndex('rootFolderName', 'rootFolderName', { unique: false })
      store.createIndex('schemaVersion', 'schemaVersion', { unique: false })
    }
  })
}

function isOldFormatCache(material) {
  if (!material) return false
  if (material.localDataUrl && material.localDataUrl.startsWith('data:image')) {
    return true
  }
  if (material.size && typeof material.size === 'number' && material.size > 10000) {
    return true
  }
  if (!material.schemaVersion) {
    return true
  }
  return false
}

export async function validateAndCleanCache() {
  try {
    await openDB()
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()
      
      request.onsuccess = async () => {
        const results = request.result
        const hasOldFormat = results.some(isOldFormatCache)
        
        if (hasOldFormat) {
          console.log('[缓存] 检测到旧格式缓存，正在自动清理...')
          await clearAllCache()
          resolve({ cleaned: true, count: results.length })
        } else {
          resolve({ cleaned: false, count: results.length })
        }
      }
      
      request.onerror = () => {
        resolve({ cleaned: false, count: 0 })
      }
    })
  } catch (error) {
    console.error('[缓存] 验证缓存格式失败:', error)
    return { cleaned: false, count: 0 }
  }
}

export async function getCacheRootFolder() {
  try {
    await openDB()
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()
      
      request.onsuccess = () => {
        const results = request.result
        if (results.length > 0) {
          resolve(results[0].rootFolderName || '')
        } else {
          resolve('')
        }
      }
      
      request.onerror = () => {
        resolve('')
      }
    })
  } catch (error) {
    console.error('[缓存] 获取根目录失败:', error)
    return ''
  }
}

export async function getAllCachedMaterials() {
  try {
    await openDB()
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()
      
      request.onsuccess = () => {
        const results = request.result
        const validResults = results.filter(r => !isOldFormatCache(r))
        if (validResults.length !== results.length) {
          console.log('[缓存] 过滤了', results.length - validResults.length, '条旧格式缓存')
        }
        resolve(validResults)
      }
      
      request.onerror = () => {
        resolve([])
      }
    })
  } catch (error) {
    console.error('[缓存] 获取所有素材失败:', error)
    try {
      await clearAllCache()
      console.log('[缓存] 读取异常，已自动清空缓存')
    } catch (clearError) {
      console.error('[缓存] 清空缓存失败:', clearError)
    }
    return []
  }
}

export async function addMaterialsToCache(materials, rootFolderName) {
  try {
    await openDB()
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      let completed = 0
      const total = materials.length
      
      materials.forEach((material) => {
        const cacheItem = {
          id: material.id,
          name: material.name,
          webkitRelativePath: material.webkitRelativePath || '',
          rootFolderName: rootFolderName,
          rootModelFolderName: material.rootModelFolderName || '',
          targetModelName: material.targetModelName || '未归类素材',
          matchedKeyword: material.matchedKeyword || '',
          schemaVersion: DB_VERSION
        }
        
        const request = store.put(cacheItem)
        request.onsuccess = () => {
          completed++
          if (completed === total) {
            resolve()
          }
        }
        request.onerror = () => {
          completed++
          if (completed === total) {
            resolve()
          }
        }
      })
      
      if (total === 0) {
        resolve()
      }
    })
  } catch (error) {
    console.error('[缓存] 添加素材失败:', error)
  }
}

export async function deleteMaterialFromCache(id) {
  try {
    await openDB()
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)
      
      request.onsuccess = () => {
        resolve()
      }
      request.onerror = () => {
        resolve()
      }
    })
  } catch (error) {
    console.error('[缓存] 删除素材失败:', error)
  }
}

export async function batchDeleteMaterialsFromCache(ids) {
  try {
    await openDB()
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      let completed = 0
      const total = ids.length
      
      ids.forEach((id) => {
        const request = store.delete(id)
        request.onsuccess = () => {
          completed++
          if (completed === total) {
            resolve()
          }
        }
        request.onerror = () => {
          completed++
          if (completed === total) {
            resolve()
          }
        }
      })
      
      if (total === 0) {
        resolve()
      }
    })
  } catch (error) {
    console.error('[缓存] 批量删除素材失败:', error)
  }
}

export async function clearAllCache() {
  try {
    await openDB()
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()
      
      request.onsuccess = () => {
        resolve()
      }
      request.onerror = () => {
        resolve()
      }
    })
  } catch (error) {
    console.error('[缓存] 清空所有缓存失败:', error)
  }
}

export async function getCacheCount() {
  try {
    await openDB()
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.count()
      
      request.onsuccess = () => {
        resolve(request.result)
      }
      request.onerror = () => {
        resolve(0)
      }
    })
  } catch (error) {
    console.error('[缓存] 获取缓存数量失败:', error)
    return 0
  }
}