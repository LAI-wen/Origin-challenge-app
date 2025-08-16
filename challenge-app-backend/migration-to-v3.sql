-- 8-Bit Habits Database Migration: V1.0 → V3.0
-- 此腳本將現有數據遷移至新的 V3.0 結構

BEGIN;

-- ========================================
-- 1. 備份現有數據
-- ========================================

-- 創建備份表
CREATE TABLE users_backup AS SELECT * FROM users;
CREATE TABLE levels_backup AS SELECT * FROM levels;
CREATE TABLE level_members_backup AS SELECT * FROM level_members;
CREATE TABLE check_ins_backup AS SELECT * FROM check_ins;
CREATE TABLE keep_notes_backup AS SELECT * FROM keep_notes;

-- ========================================
-- 2. 創建新的枚舉類型
-- ========================================

-- 新增 MemberStatus 枚舉 (增加 GHOST 狀態)
ALTER TYPE "Status" RENAME TO "MemberStatus";
ALTER TYPE "MemberStatus" ADD VALUE 'GHOST';

-- 新增社交系統枚舉
CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'BLOCKED');

-- ========================================
-- 3. 重命名和更新現有表
-- ========================================

-- 重命名 users → players
ALTER TABLE users RENAME TO players;

-- 更新 players 表結構
ALTER TABLE players 
  ALTER COLUMN id TYPE UUID USING id::UUID,
  ADD COLUMN pixel_abode_state JSONB DEFAULT '{"scene":"default_room","items":[],"layout":{}}',
  DROP COLUMN IF EXISTS google_id,
  ADD COLUMN google_id VARCHAR UNIQUE;

-- 更新 levels 表結構
ALTER TABLE levels 
  ALTER COLUMN id TYPE UUID USING id::UUID,
  ALTER COLUMN owner_id TYPE UUID USING owner_id::UUID,
  ALTER COLUMN invite_code TYPE VARCHAR(8),
  RENAME COLUMN rule TO rule,
  ALTER COLUMN rule TYPE JSONB USING rule::JSONB;

-- 更新 level_members 表結構
ALTER TABLE level_members 
  ALTER COLUMN id TYPE UUID USING id::UUID,
  ALTER COLUMN player_id TYPE UUID USING player_id::UUID,
  ALTER COLUMN level_id TYPE UUID USING level_id::UUID,
  ALTER COLUMN status TYPE "MemberStatus" USING status::"MemberStatus",
  RENAME COLUMN missed_days TO missed_days;

-- 更新 check_ins 表結構
ALTER TABLE check_ins 
  ALTER COLUMN id TYPE UUID USING id::UUID,
  DROP COLUMN player_id,
  DROP COLUMN level_id,
  ADD COLUMN level_member_id UUID,
  ADD COLUMN metadata JSONB DEFAULT '{}',
  RENAME COLUMN image_pixel_url TO image_pixel_url;

-- 更新 keep_notes 表結構  
ALTER TABLE keep_notes 
  ALTER COLUMN id TYPE UUID USING id::UUID,
  ALTER COLUMN player_id TYPE UUID USING player_id::UUID;

-- ========================================
-- 4. 創建新的系統表
-- ========================================

-- 成就系統
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT NOT NULL,
  icon_name VARCHAR NOT NULL,
  trigger_rule JSONB DEFAULT '{"type":"manual"}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE player_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  level_id UUID REFERENCES levels(id),
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, achievement_id)
);

-- 測驗系統
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID UNIQUE NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB DEFAULT '[]',
  correct_answer VARCHAR NOT NULL,
  "order" INTEGER DEFAULT 0
);

CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_member_id UUID NOT NULL REFERENCES level_members(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  answers JSONB DEFAULT '{}',
  completed_at TIMESTAMPTZ DEFAULT now()
);

-- 社交系統
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL,
  addressee_id UUID NOT NULL,
  status "FriendshipStatus" DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL,
  type VARCHAR NOT NULL,
  content JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- 5. 數據遷移和關聯修復
-- ========================================

-- 遷移現有的 Google 用戶資料
UPDATE players SET 
  google_id = (SELECT google_id FROM users_backup WHERE users_backup.id::UUID = players.id),
  pixel_abode_state = '{"scene":"default_room","items":[],"layout":{}}'
WHERE EXISTS (SELECT 1 FROM users_backup WHERE users_backup.id::UUID = players.id);

-- 為 check_ins 建立 level_member_id 關聯
-- 注意：此步驟需要確保 check_ins_backup 中的記錄能正確關聯到 level_members
UPDATE check_ins SET level_member_id = (
  SELECT lm.id 
  FROM level_members lm 
  JOIN check_ins_backup cb ON cb.player_id::UUID = lm.player_id AND cb.level_id::UUID = lm.level_id
  WHERE cb.id::UUID = check_ins.id
  LIMIT 1
);

-- 清理無效的 check_ins (如果無法關聯到 level_member)
DELETE FROM check_ins WHERE level_member_id IS NULL;

-- ========================================
-- 6. 添加約束和索引
-- ========================================

-- 重新添加 NOT NULL 約束
ALTER TABLE check_ins ALTER COLUMN level_member_id SET NOT NULL;

-- 創建必要的索引
CREATE INDEX idx_players_email ON players(email);
CREATE INDEX idx_players_google_id ON players(google_id);
CREATE INDEX idx_levels_invite_code ON levels(invite_code);
CREATE INDEX idx_levels_owner_id ON levels(owner_id);
CREATE INDEX idx_level_members_player_level ON level_members(player_id, level_id);
CREATE INDEX idx_check_ins_level_member_created ON check_ins(level_member_id, created_at);
CREATE INDEX idx_player_achievements_player ON player_achievements(player_id);
CREATE INDEX idx_quiz_attempts_level_member ON quiz_attempts(level_member_id);

-- ========================================
-- 7. 插入初始成就數據
-- ========================================

INSERT INTO achievements (name, description, icon_name, trigger_rule) VALUES
  ('初心者', '完成第一次打卡', 'pixel_star', '{"type":"first_checkin"}'),
  ('堅持者', '連續打卡7天', 'pixel_trophy', '{"type":"consecutive_days","count":7}'),
  ('完美主義者', '在一個賽季中零漏打卡', 'pixel_crown', '{"type":"perfect_season"}'),
  ('社交達人', '加入5個不同的挑戰', 'pixel_heart', '{"type":"join_levels","count":5}'),
  ('領袖', '創建第一個挑戰關卡', 'pixel_flag', '{"type":"create_first_level"}');

-- ========================================
-- 8. 清理備份表 (可選)
-- ========================================

-- 註釋掉這些行，在確認遷移成功後再執行
-- DROP TABLE users_backup;
-- DROP TABLE levels_backup;
-- DROP TABLE level_members_backup;
-- DROP TABLE check_ins_backup;
-- DROP TABLE keep_notes_backup;

COMMIT;

-- ========================================
-- 9. 驗證遷移結果
-- ========================================

-- 檢查數據完整性
SELECT 
  'players' as table_name, count(*) as record_count 
FROM players
UNION ALL
SELECT 'levels', count(*) FROM levels
UNION ALL  
SELECT 'level_members', count(*) FROM level_members
UNION ALL
SELECT 'check_ins', count(*) FROM check_ins
UNION ALL
SELECT 'keep_notes', count(*) FROM keep_notes
UNION ALL
SELECT 'achievements', count(*) FROM achievements;

-- 檢查約束完整性
SELECT 
  table_name,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
AND table_name IN ('players', 'levels', 'level_members', 'check_ins', 'achievements')
ORDER BY table_name, constraint_type;