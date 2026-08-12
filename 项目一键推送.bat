@echo off
chcp 65001 >nul
cd /d "E:\项目管理"
git add .
git commit -m "auto update"
git push
pause