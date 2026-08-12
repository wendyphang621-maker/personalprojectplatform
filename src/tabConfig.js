import { reactive, watch } from 'vue'
import { store } from './store.js'

// ===== Tab 配置系统 =====
// key: 系统内部唯一标识，永久固定，禁止修改
// title: 前端展示用 Tab 名称，管理员可随时编辑修改
// pageId: 绑定 Trae 原有页面 ID，禁止更换

const STORAGE_KEY = 'tab_custom_configs'

// 出厂默认 Tab 配置
const DEFAULT_TAB_CONFIGS = [
  {
    key: 'gb_cert',
    title: 'GB认证进度报表',
    pageId: 'gb-cert',
    description: 'GB认证项目进度跟踪与报表'
  },
  {
    key: 'box_iter',
    title: '彩盒设计迭代管理',
    pageId: 'box-iter',
    description: '彩盒/Logo/3D Render/KSP/PDP 多轮客户迭代记录'
  },
  {
    key: 'sample_log',
    title: '样机寄送跟进台账',
    pageId: 'sample-log',
    description: '样机寄送与彩盒审核跟进记录'
  }
]

// 从 localStorage 加载自定义标题
function loadCustomTitles() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed && typeof parsed === 'object') {
        return parsed
      }
    }
  } catch (e) {
    console.warn('[TabConfig] 加载自定义标题失败:', e)
  }
  return {}
}

// 合并默认配置与自定义标题
function mergeConfigs() {
  const customTitles = loadCustomTitles()
  return DEFAULT_TAB_CONFIGS.map(cfg => ({
    ...cfg,
    title: customTitles[cfg.key] || cfg.title
  }))
}

// 响应式 Tab 配置
export const tabConfigs = reactive(mergeConfigs())

// 保存自定义标题到 localStorage
function saveCustomTitles() {
  const customTitles = {}
  tabConfigs.forEach(cfg => {
    // 只保存与默认值不同的标题
    const defaultCfg = DEFAULT_TAB_CONFIGS.find(d => d.key === cfg.key)
    if (defaultCfg && cfg.title !== defaultCfg.title) {
      customTitles[cfg.key] = cfg.title
    }
  })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customTitles))
}

// 获取 Tab 标题（业务逻辑中通过 key 获取 title）
export function getTabTitle(key) {
  const cfg = tabConfigs.find(c => c.key === key)
  return cfg ? cfg.title : key
}

// 获取 Tab 配置（通过 key）
export function getTabConfig(key) {
  return tabConfigs.find(c => c.key === key) || null
}

// 更新 Tab 标题（仅管理员可调用）
export function updateTabTitle(key, newTitle) {
  if (!store.user || store.user.role !== 'admin') {
    console.warn('[TabConfig] 非管理员，无权修改 Tab 标题')
    return false
  }
  const cfg = tabConfigs.find(c => c.key === key)
  if (!cfg) {
    console.warn(`[TabConfig] 未找到 key=${key} 的配置`)
    return false
  }
  const trimmed = (newTitle || '').trim()
  if (!trimmed) {
    console.warn('[TabConfig] 标题不能为空')
    return false
  }
  cfg.title = trimmed
  saveCustomTitles()
  console.log(`[TabConfig] Tab 标题已更新: ${key} → ${trimmed}`)
  return true
}

// 重置单个 Tab 标题为默认值
export function resetTabTitle(key) {
  if (!store.user || store.user.role !== 'admin') {
    console.warn('[TabConfig] 非管理员，无权重置 Tab 标题')
    return false
  }
  const cfg = tabConfigs.find(c => c.key === key)
  const defaultCfg = DEFAULT_TAB_CONFIGS.find(d => d.key === key)
  if (cfg && defaultCfg) {
    cfg.title = defaultCfg.title
    saveCustomTitles()
    return true
  }
  return false
}

// 重置所有 Tab 标题
export function resetAllTabTitles() {
  if (!store.user || store.user.role !== 'admin') {
    console.warn('[TabConfig] 非管理员，无权重置 Tab 标题')
    return false
  }
  DEFAULT_TAB_CONFIGS.forEach(defaultCfg => {
    const cfg = tabConfigs.find(c => c.key === defaultCfg.key)
    if (cfg) cfg.title = defaultCfg.title
  })
  localStorage.removeItem(STORAGE_KEY)
  return true
}

// 是否为管理员
export function isAdmin() {
  return store.user && store.user.role === 'admin'
}

// 获取所有 Tab 配置（只读副本）
export function getAllTabConfigs() {
  return tabConfigs.map(c => ({ ...c }))
}

// 默认配置（只读）
export const DEFAULT_CONFIGS = Object.freeze(DEFAULT_TAB_CONFIGS.map(c => ({ ...c })))
