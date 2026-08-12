-- ============================================================
-- 更新 daily_reminders 表结构，添加周期性提醒所需的字段
-- 执行方式：登录 Supabase 控制台 → SQL Editor → 粘贴本文件 → Run。
-- ============================================================

-- 添加新字段到 daily_reminders 表
alter table public.daily_reminders add column if not exists recurrence_interval integer default 1;
alter table public.daily_reminders add column if not exists custom_weekdays text default '[1]';
alter table public.daily_reminders add column if not exists custom_monthday integer default 1;
alter table public.daily_reminders add column if not exists deadline text;
alter table public.daily_reminders add column if not exists category text;
alter table public.daily_reminders add column if not exists customer text;
alter table public.daily_reminders add column if not exists model text;
alter table public.daily_reminders add column if not exists last_triggered_at timestamptz;

-- 如果存在旧的 custom_weekday 字段，迁移数据到 custom_weekdays
-- 注意：如果旧字段不存在，此步会失败，可以跳过
-- alter table public.daily_reminders add column if not exists custom_weekdays text;
-- update public.daily_reminders set custom_weekdays = json_build_array(custom_weekday)::text where custom_weekdays is null;

-- 更新字段注释
comment on column public.daily_reminders.recurrence_interval is '重复间隔（如每几周、每几月）';
comment on column public.daily_reminders.custom_weekdays is '每周的第几天数组，JSON格式如[1,3,5]，周日为0';
comment on column public.daily_reminders.custom_monthday is '每月的第几日（1-31）';
comment on column public.daily_reminders.deadline is '截止日期';
comment on column public.daily_reminders.category is '分类';
comment on column public.daily_reminders.customer is '关联客户';
comment on column public.daily_reminders.model is '关联机型';
comment on column public.daily_reminders.last_triggered_at is '上次触发时间';
