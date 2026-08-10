-- ============================================================
-- 付款记录 ID 标准化清理脚本
-- 作用：清理 customer_payments 表中非 CPAY- 前缀的旧数据
-- 执行位置：Supabase Dashboard → SQL Editor
-- 注意：执行前请确认已备份，此操作会删除非标准 ID 的记录
-- ============================================================

-- 1. 查看当前非标准 ID 的付款记录（仅查询，不修改）
SELECT id, customer_name, order_no, payment_amount, created_at
FROM customer_payments
WHERE id IS NULL
   OR id::text NOT LIKE 'CPAY-%'
   OR length(id::text) < 10
ORDER BY created_at DESC;

-- 2. 删除非标准 ID 的付款记录（云端的脏数据）
--    标准格式：CPAY-xxxxxxxxxxxx（CPAY- + 12位字母数字）
DELETE FROM customer_payments
WHERE id IS NULL
   OR id::text NOT LIKE 'CPAY-%'
   OR length(id::text) < 10
   OR length(id::text) > 20;

-- 3. 验证清理结果：剩余记录应全部为 CPAY- 前缀
SELECT id, customer_name, order_no
FROM customer_payments
ORDER BY created_at DESC
LIMIT 20;

-- 4. 确认表结构（id 应为 TEXT 主键）
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'customer_payments'
ORDER BY ordinal_position;
