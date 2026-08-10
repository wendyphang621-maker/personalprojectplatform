@echo off
cd d E项目管理
set p msg=填写本次改动备注：
git add .
git commit -m %msg%
git push origin main
echo 推送完成！按任意键关闭窗口
pausenul