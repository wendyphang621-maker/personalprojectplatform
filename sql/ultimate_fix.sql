-- =====================================================
-- 最简单方案：一键关闭所有表的 RLS
-- 如果之前的脚本都不行，用这个
-- =====================================================

DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', tbl.tablename);
            RAISE NOTICE 'Disabled RLS on: %', tbl.tablename;
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'Failed on %: %', tbl.tablename, SQLERRM;
        END;
    END LOOP;
END $$;

-- 额外：确保 authenticated 和 anon 有所有权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;

SELECT '✅ 已禁用所有表的 RLS，请刷新页面重新登录' as result;
