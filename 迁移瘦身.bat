@echo off
chcp 65001 >nul
echo ==============================================
echo          项目工作台 - 迁移瘦身工具
echo ==============================================
echo.
echo 本工具用于在迁移前清理项目体积
echo 删除内容：
echo - node_modules 目录（依赖包，可通过 npm install 重建）
echo - dist 目录（构建产物，可通过 npm run build 重建）
echo.
echo 保留内容：
echo - src/ 源代码目录
echo - package.json 依赖配置
echo - 所有配置文件和脚本
echo.
echo 业务数据说明：
echo - 客户、订单、彩盒、样机等业务数据存储在云端 Supabase
echo - 首次启动后在「设置」页面配置连接即可同步所有数据
echo - 本地素材库缓存需要在新电脑上重新选择文件夹加载
echo.

set "confirm="
set /p confirm=确定要执行瘦身清理吗？(y/n): 
if /i not "%confirm%"=="y" (
    echo 已取消操作
    pause
    exit /b 0
)

echo.
echo [1/2] 正在删除 node_modules 目录...
if exist "node_modules" (
    rmdir /s /q "node_modules"
    if %errorlevel% equ 0 (
        echo ✅ node_modules 删除成功
    ) else (
        echo ❌ node_modules 删除失败，请手动删除
    )
) else (
    echo ⏭️ node_modules 不存在，跳过
)

echo.
echo [2/2] 正在删除 dist 目录...
if exist "dist" (
    rmdir /s /q "dist"
    if %errorlevel% equ 0 (
        echo ✅ dist 删除成功
    ) else (
        echo ❌ dist 删除失败，请手动删除
    )
) else (
    echo ⏭️ dist 不存在，跳过
)

echo.
echo ==============================================
echo          瘦身完成！
echo ==============================================
echo.
echo 当前项目体积已大幅减小，可直接复制到新电脑
echo.
echo 新电脑启动步骤：
echo 1. 安装 Node.js (https://nodejs.org/)
echo 2. 双击「启动项目.bat」自动安装依赖并启动
echo 3. 在「设置」页面配置 Supabase 连接
echo 4. 所有业务数据自动从云端同步
echo.
pause