-- Rename column password to password_hash and enforce max 70 chars
ALTER TABLE "user" RENAME COLUMN "password" TO "password_hash";
ALTER TABLE "user" ALTER COLUMN "password_hash" TYPE VARCHAR(70);
