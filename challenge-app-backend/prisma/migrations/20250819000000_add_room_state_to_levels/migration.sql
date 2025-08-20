-- AlterTable
ALTER TABLE "levels" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "roomState" JSONB NOT NULL DEFAULT '{"scene":"default_room","theme":"classic","items":[],"progress":0,"locked":true}';

-- Update existing levels with default roomState
UPDATE "levels" SET "roomState" = '{"scene":"default_room","theme":"classic","items":[],"progress":0,"locked":true,"escapeCondition":{"type":"daily_checkin","target":30,"current":0}}' WHERE "roomState" = '{}' OR "roomState" IS NULL;