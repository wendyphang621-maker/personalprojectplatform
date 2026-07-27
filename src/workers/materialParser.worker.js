const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.ico', '.tiff', '.tif', '.svg', '.heic', '.heif']

function isValidImageFile(fileInfo) {
  if (!fileInfo || !fileInfo.name) {
    return false
  }
  
  const fileName = fileInfo.name.toLowerCase()
  
  const hasImageExtension = IMAGE_EXTENSIONS.some(ext => fileName.endsWith(ext.toLowerCase()))
  
  if (fileInfo.type) {
    const isImageType = fileInfo.type.startsWith('image/')
    if (isImageType || hasImageExtension) {
      return true
    }
  } else {
    if (hasImageExtension) {
      return true
    }
  }
  
  return false
}

function extractModelKeyword(folderName) {
  if (!folderName) return ''
  
  let keyword = folderName.trim()
  
  const doubleDashIndex = keyword.indexOf('--')
  if (doubleDashIndex > -1) {
    keyword = keyword.substring(0, doubleDashIndex).trim()
  } else {
    const singleDashIndex = keyword.indexOf('-')
    if (singleDashIndex > -1) {
      keyword = keyword.substring(0, singleDashIndex).trim()
    } else {
      const spaceIndex = keyword.indexOf(' ')
      if (spaceIndex > -1) {
        keyword = keyword.substring(0, spaceIndex).trim()
      }
    }
  }
  
  return keyword
}

function hasSeparator(folderName) {
  if (!folderName) return false
  return folderName.includes('--') || folderName.includes('-') || folderName.includes(' ')
}

function findRootModelFolder(relativePath) {
  if (!relativePath) return null
  
  const pathParts = relativePath.split('/')
  pathParts.pop()
  
  for (let i = pathParts.length - 1; i >= 0; i--) {
    const folder = pathParts[i]
    if (hasSeparator(folder)) {
      return folder
    }
  }
  
  return null
}

function findMatchingModel(keyword, productModels) {
  if (!keyword) return null
  const keywordLower = keyword.toLowerCase()
  for (const model of productModels) {
    if (model.name.toLowerCase() === keywordLower) {
      return model.name
    }
  }
  return null
}

self.onmessage = function(e) {
  const { type, payload } = e.data
  
  if (type === 'parse') {
    const { files, productModels, rootFolderName } = payload
    const totalFiles = files.length
    let processedCount = 0
    let validImageCount = 0
    let filteredCount = 0
    
    const results = []
    const unclassifiedList = []
    
    self.postMessage({
      type: 'log',
      payload: {
        level: 'debug',
        message: `[素材匹配] 📂 本次选中根文件夹名称: ${rootFolderName || '无'}`
      }
    })
    
    let rootFolderKeyword = ''
    let rootFolderMatchedModel = null
    
    if (rootFolderName && hasSeparator(rootFolderName)) {
      rootFolderKeyword = extractModelKeyword(rootFolderName)
      if (rootFolderKeyword) {
        rootFolderMatchedModel = findMatchingModel(rootFolderKeyword, productModels)
      }
    }
    
    for (const fileInfo of files) {
      if (!isValidImageFile(fileInfo)) {
        filteredCount++
        processedCount++
        continue
      }
      
      validImageCount++
      
      const fullRelativePath = fileInfo.webkitRelativePath || ''
      
      let keyword = ''
      let matchedModelName = null
      let matchedRootFolder = ''
      
      if (rootFolderMatchedModel) {
        keyword = rootFolderKeyword
        matchedModelName = rootFolderMatchedModel
        matchedRootFolder = rootFolderName
      } else {
        const internalRootFolder = findRootModelFolder(fullRelativePath)
        if (internalRootFolder) {
          keyword = extractModelKeyword(internalRootFolder)
          matchedModelName = findMatchingModel(keyword, productModels)
          matchedRootFolder = internalRootFolder
        }
      }
      
      const targetModelName = matchedModelName || '未归类素材'
      
      self.postMessage({
        type: 'log',
        payload: {
          level: 'debug',
          message: `[素材匹配] 文件: ${fileInfo.name} | 原始路径: ${fullRelativePath} | 追溯根目录: ${matchedRootFolder || '无'} | 解析关键字: ${keyword || '无'} | 匹配结果: ${targetModelName}`
        }
      })
      
      const resultItem = {
        name: fileInfo.name,
        webkitRelativePath: fullRelativePath,
        size: fileInfo.size,
        type: fileInfo.type,
        rootModelFolderName: matchedRootFolder || '',
        fullRelativePath: fullRelativePath,
        targetModelName: targetModelName,
        matchedKeyword: keyword || ''
      }
      
      results.push(resultItem)
      
      if (targetModelName === '未归类素材') {
        unclassifiedList.push({
          name: fileInfo.name,
          fullRelativePath: fullRelativePath,
          rootModelFolderName: matchedRootFolder || ''
        })
      }
      
      processedCount++
      
      if (processedCount % 50 === 0 || processedCount === totalFiles) {
        self.postMessage({
          type: 'progress',
          payload: {
            phase: 'traversal',
            current: processedCount,
            total: totalFiles,
            message: `正在遍历目录 (${processedCount}/${totalFiles})...`
          }
        })
      }
    }
    
    const classifiedCount = results.length - unclassifiedList.length
    
    self.postMessage({
      type: 'complete',
      payload: {
        results,
        totalCount: results.length,
        stats: {
          totalFiles: totalFiles,
          filteredCount: filteredCount,
          validImageCount: validImageCount,
          classifiedCount: classifiedCount,
          unclassifiedCount: unclassifiedList.length
        },
        unclassifiedList: unclassifiedList
      }
    })
  }
}
