-- =============================================
-- 修复云数据库长ID脚本
-- 执行前请先备份数据
-- =============================================

DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN

    -- 1. 修复 product_models 长ID
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'product_models' AND table_schema = 'public'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM product_models WHERE length(id::text) > 15;
    END IF;

    -- 2. 修复 customers 长ID
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'customers' AND table_schema = 'public'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM customers WHERE length(id::text) > 15;
    END IF;

    -- 3. 修复 sales_orders 长ID
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'sales_orders' AND table_schema = 'public'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM sales_orders WHERE length(id::text) > 15;
    END IF;

    -- 4. 修复 daily_todos 长ID
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'daily_todos' AND table_schema = 'public'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM daily_todos WHERE length(id::text) > 15;
    END IF;

    -- 5. 修复 todo_configs 长ID
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'todo_configs' AND table_schema = 'public'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM todo_configs WHERE length(id::text) > 15;
    END IF;

    -- 6. 修复 activation_configs 长ID
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'activation_configs' AND table_schema = 'public'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM activation_configs WHERE length(id::text) > 15;
    END IF;

    -- 7. 修复 cert_matrix_cells 长ID
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'cert_matrix_cells' AND table_schema = 'public'
    ) INTO table_exists;
    IF table_exists THEN
        DELETE FROM cert_matrix_cells WHERE length(id::text) > 15;
    END IF;

END $$;

SELECT '云端长ID数据已清理完毕，请刷新页面' as result;
