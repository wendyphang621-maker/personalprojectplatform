@echo off
chcp 65001 >nul
echo ==============================================
echo          项目工作台 - 一键启动脚本
echo ==============================================
echo.

cd /d "%~dp0"

echo [1/4] 正在检查 Node.js 环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：未安装 Node.js，请先安装 Node.js
    echo      下载地址：https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js 环境正常

echo.
echo [2/4] 正在检查项目依赖...
if not exist "node_modules" (
    echo ⚠️ 依赖目录不存在，正在安装依赖...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败，请检查网络连接后重试
        pause
        exit /b 1
    )
    echo ✅ 依赖安装成功
) else (
    echo ✅ 依赖已安装
)

echo.
echo [3/4] 正在启动开发服务器...
start /min cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo [4/4] 正在等待服务器启动...
timeout /t 3 /nobreak >nul

echo.
echo ✅ 开发服务器已启动！
echo.
echo 📡 访问地址：http://localhost:8080/
echo.
echo 正在打开浏览器...
start http://localhost:8080/

echo.
echo ==============================================
echo          项目工作台启动完成！
echo ==============================================
echo.
echo 按任意键关闭此窗口...
pause >nul