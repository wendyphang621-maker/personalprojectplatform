# GitHub Pages 部署脚本
# 在项目根目录执行：powershell -File deploy-gh-pages.ps1

param(
    [string]$RepoUrl = "https://github.com/wendyphang621-maker/personalprojectplatform.git"
)

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "========== GitHub Pages 部署 ==========" -ForegroundColor Cyan
Write-Host "项目目录: $ProjectDir" -ForegroundColor Gray

Set-Location $ProjectDir

# 1. 确保在 main 分支
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host "切换到 main 分支..." -ForegroundColor Yellow
    git checkout main
}

# 2. 构建项目
Write-Host "构建项目..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "构建失败！" -ForegroundColor Red
    exit 1
}
Write-Host "构建完成" -ForegroundColor Green

# 3. 删除旧 gh-pages 分支（如果存在）
$ghPagesExists = git branch -l gh-pages
if ($ghPagesExists) {
    Write-Host "删除旧 gh-pages 分支..." -ForegroundColor Yellow
    git branch -D gh-pages
}

# 4. 从 dist 创建新 gh-pages 分支
Write-Host "创建 gh-pages 分支..." -ForegroundColor Yellow
git subtree split --prefix dist -b gh-pages
if ($LASTEXITCODE -ne 0) {
    Write-Host "子树分割失败，使用替代方案..." -ForegroundColor Yellow
    
    # 替代方案：手动创建
    git checkout --orphan gh-pages
    git rm -rf . 2>$null
    Copy-Item -Path dist\index.html -Destination . -Force
    Copy-Item -Path dist\assets -Destination . -Recurse -Force
    # 创建 .nojekyll 防止 GitHub Pages 使用 Jekyll 处理
    New-Item -ItemType File -Path ".nojekyll" -Force | Out-Null
    git add -A
    git commit -m "deploy: 更新构建产物"
    git checkout main
}

# 5. 推送 gh-pages 分支
Write-Host "推送 gh-pages 分支到 GitHub..." -ForegroundColor Yellow
git push origin gh-pages --force
if ($LASTEXITCODE -ne 0) {
    Write-Host "推送失败，请检查网络或认证" -ForegroundColor Red
    exit 1
}

# 6. 推送 main 分支（含工作流）
Write-Host "推送 main 分支到 GitHub..." -ForegroundColor Yellow
git add -A
git commit -m "chore: 添加 GitHub Actions 自动部署工作流" --allow-empty
git push origin main

Write-Host ""
Write-Host "========== 部署完成 ==========" -ForegroundColor Green
Write-Host ""
Write-Host "接下来请在 GitHub 仓库设置中：" -ForegroundColor Cyan
Write-Host "1. Settings → Pages" -ForegroundColor White
Write-Host "2. Source 选择 'gh-pages' 分支，Folder 选择 '/ (root)'" -ForegroundColor White
Write-Host "3. 保存后等待 1-2 分钟即可访问" -ForegroundColor White
Write-Host ""
Write-Host "或者使用 GitHub Actions 自动部署：" -ForegroundColor Cyan
Write-Host "1. Settings → Pages → Source 选择 'GitHub Actions'" -ForegroundColor White
Write-Host "2. Settings → Actions → General → Workflow permissions 选 'Read and write'" -ForegroundColor White
Write-Host "3. 推送代码后会自动构建部署" -ForegroundColor White
