@echo off
chcp 65001 >nul
echo ==============================================
echo          项目工作台 - 迁移助手
echo ==============================================
echo.
echo 本脚本用于帮助您将项目迁移到新电脑
echo.
echo 迁移步骤：
echo 1. 将整个「项目管理」文件夹复制到新电脑
echo 2. 在新电脑上安装 Node.js (https://nodejs.org/)
echo 3. 双击运行「启动项目.bat」即可启动
echo.
echo 数据同步：
echo - 业务数据（客户、订单、彩盒、样机等）存储在云端 Supabase
echo - 首次启动后在「设置」页面配置 Supabase 连接即可同步所有数据
echo - 本地素材库缓存需要重新选择文件夹加载
echo.
echo ==============================================
echo          新电脑环境检测
echo ==============================================
echo.

cd /d "%~dp0"

echo [1] 检查 Node.js 环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未安装 Node.js
    echo    请访问 https://nodejs.org/ 下载安装
) else (
    node --version
    echo ✅ Node.js 环境正常
)

echo.
echo [2] 检查项目文件完整性...
if exist "package.json" (
    echo ✅ package.json 存在
) else (
    echo ❌ package.json 缺失
)

if exist "src\main.js" (
    echo ✅ 源代码目录存在
) else (
    echo ❌ 源代码目录缺失
)

if exist "启动项目.bat" (
    echo ✅ 启动脚本存在
) else (
    echo ❌ 启动脚本缺失
)

echo.
echo [3] 检查依赖安装情况...
if exist "node_modules" (
    echo ✅ 依赖目录已存在
    echo    如果需要更新依赖，请运行：npm install
) else (
    echo ⚠️ 依赖目录不存在
    echo    请运行：npm install
)

echo.
echo ==============================================
echo          迁移完成验证
echo ==============================================
echo.
echo 请按以下步骤验证：
echo 1. 双击「启动项目.bat」启动开发服务器
echo 2. 打开浏览器访问 http://localhost:8080/
echo 3. 进入「设置」页面配置 Supabase 连接
echo 4. 验证各业务页面数据是否正常加载
echo.
echo 如果遇到问题，请查看目录下的「迁移问题排查.txt」
echo.
pause