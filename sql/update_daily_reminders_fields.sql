-- ============================================================
-- 更新 daily_reminders 表结构，添加周期性提醒所需的字段
-- 执行方式：登录 Supabase 控制台 → SQL Editor → 粘贴本文件 → Run。
-- ============================================================

-- 添加新字段到 daily_reminders 表
alter table public.daily_reminders add column if not exists recurrence_interval integer default 1;
alter table public.daily_reminders add column if not exists custom_weekday integer default 1;
alter table public.daily_reminders add column if not exists custom_monthday integer default 1;
alter table public.daily_reminders add column if not exists deadline text;
alter table public.daily_reminders add column if not exists category text;
alter table public.daily_reminders add column if not exists customer text;
alter table public.daily_reminders add column if not exists model text;
alter table public.daily_reminders add column if not exists last_triggered_at timestamptz;

-- 更新字段注释
comment on column public.daily_reminders.recurrence_interval is '重复间隔（如每几周、每几月）';
comment on column public.daily_reminders.custom_weekday is '每周的第几天（0-6，周日为0）';
comment on column public.daily_reminders.custom_monthday is '每月的第几日（1-31）';
comment on column public.daily_reminders.deadline is '截止日期';
comment on column public.daily_reminders.category is '分类';
comment on column public.daily_reminders.customer is '关联客户';
comment on column public.daily_reminders.model is '关联机型';
comment on column public.daily_reminders.last_triggered_at is '上次触发时间';

-- 同时更新 todo_remind_logs 表，将 date 字段重命名为 remind_date（如果需要）
-- 注意：如果 date 字段已存在且有数据，需要谨慎处理
-- alter table public.todo_remind_logs rename column date to remind_date;
