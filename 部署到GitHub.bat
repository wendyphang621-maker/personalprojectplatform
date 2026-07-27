@echo off
chcp 65001 >nul
echo ==============================================
echo          项目工作台 - 一键部署脚本
echo ==============================================
echo.
echo 本脚本将：
echo 1. 构建项目
echo 2. 打开dist文件夹
echo 3. 自动打开GitHub上传页面
echo.

setlocal

echo [1/3] 正在构建项目...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 构建失败！
    pause
    exit /b 1
)
echo ✅ 构建成功！

echo.
echo [2/3] 正在打开dist文件夹...
start "" "E:\项目管理\dist"
echo ✅ dist文件夹已打开

echo.
echo [3/3] 正在打开GitHub上传页面...
start "" "https://github.com/wendyphang621-maker/personalprojectplatform/upload/gh-pages"
echo ✅ GitHub上传页面已打开

echo.
echo ==============================================
echo          部署准备完成！
echo ==============================================
echo.
echo 请按照以下步骤操作：
echo 1. 在打开的dist文件夹中，选中 index.html 和 assets 文件夹
echo 2. 将它们拖拽到GitHub上传页面
echo 3. 点击 "Commit changes"
echo 4. 等待几分钟后访问：https://wendyphang621-maker.github.io/personalprojectplatform/
echo.
echo 如果页面未更新，按 Ctrl+F5 强制刷新
echo.
pause