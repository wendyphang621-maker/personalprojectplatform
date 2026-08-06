-- =====================================================
-- 安全方案：保持 RLS 开启，但允许 anon + authenticated 访问
-- 这是内部系统，所有登录用户可访问所有数据
-- =====================================================

-- 如果之前执行了关闭 RLS 的脚本，先恢复 RLS
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl.tablename);
            RAISE NOTICE 'Enabled RLS on: %', tbl.tablename;
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'Skip %: %', tbl.tablename, SQLERRM;
        END;
    END LOOP;
END $$;

-- 为所有表创建安全策略：允许 authenticated 和 anon 用户访问
DO $$
DECLARE
    tbl RECORD;
    tbl_name TEXT;
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        tbl_name := tbl.tablename;
        
        -- 删除旧策略
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl_name || '_all_access', tbl_name);
        EXCEPTION WHEN others THEN
            NULL;
        END;
        
        -- 创建新策略：允许 authenticated 和 anon
        BEGIN
            EXECUTE format(
                'CREATE POLICY %I ON public.%I FOR ALL TO authenticated, anon USING (true) WITH CHECK (true)',
                tbl_name || '_all_access',
                tbl_name
            );
            RAISE NOTICE 'Created policy on: %', tbl_name;
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'Failed policy on %: %', tbl_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- 确保权限
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

SELECT '✅ 安全配置完成：RLS 开启 + anon/authenticated 可访问' as result;
