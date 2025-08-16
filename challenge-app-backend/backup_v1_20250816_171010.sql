--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13 (Debian 15.13-1.pgdg130+1)
-- Dumped by pg_dump version 15.13 (Debian 15.13-1.pgdg130+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: challengeapp
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO challengeapp;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: challengeapp
--

COMMENT ON SCHEMA public IS '';


--
-- Name: CheckInType; Type: TYPE; Schema: public; Owner: challengeapp
--

CREATE TYPE public."CheckInType" AS ENUM (
    'TEXT',
    'IMAGE',
    'CHECKMARK'
);


ALTER TYPE public."CheckInType" OWNER TO challengeapp;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: challengeapp
--

CREATE TYPE public."Role" AS ENUM (
    'CREATOR',
    'PLAYER',
    'AUDIENCE'
);


ALTER TYPE public."Role" OWNER TO challengeapp;

--
-- Name: Status; Type: TYPE; Schema: public; Owner: challengeapp
--

CREATE TYPE public."Status" AS ENUM (
    'ACTIVE',
    'ELIMINATED'
);


ALTER TYPE public."Status" OWNER TO challengeapp;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: challengeapp
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO challengeapp;

--
-- Name: check_ins; Type: TABLE; Schema: public; Owner: challengeapp
--

CREATE TABLE public.check_ins (
    id text NOT NULL,
    "playerId" text NOT NULL,
    "levelId" text NOT NULL,
    type public."CheckInType" DEFAULT 'TEXT'::public."CheckInType" NOT NULL,
    content text,
    "imagePixelUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.check_ins OWNER TO challengeapp;

--
-- Name: keep_notes; Type: TABLE; Schema: public; Owner: challengeapp
--

CREATE TABLE public.keep_notes (
    id text NOT NULL,
    "playerId" text NOT NULL,
    content text NOT NULL,
    tags text[] DEFAULT ARRAY[]::text[],
    color text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.keep_notes OWNER TO challengeapp;

--
-- Name: level_members; Type: TABLE; Schema: public; Owner: challengeapp
--

CREATE TABLE public.level_members (
    id text NOT NULL,
    "playerId" text NOT NULL,
    "levelId" text NOT NULL,
    role public."Role" DEFAULT 'PLAYER'::public."Role" NOT NULL,
    status public."Status" DEFAULT 'ACTIVE'::public."Status" NOT NULL,
    "missedDays" integer DEFAULT 0 NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.level_members OWNER TO challengeapp;

--
-- Name: levels; Type: TABLE; Schema: public; Owner: challengeapp
--

CREATE TABLE public.levels (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "inviteCode" text NOT NULL,
    "ownerId" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "startDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    rules jsonb DEFAULT '{"endTime": "23:00", "startTime": "05:00", "maxMissedDays": 3}'::jsonb NOT NULL,
    settings jsonb DEFAULT '{"checkinContentVisibility": "public"}'::jsonb NOT NULL
);


ALTER TABLE public.levels OWNER TO challengeapp;

--
-- Name: users; Type: TABLE; Schema: public; Owner: challengeapp
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    "avatarUrl" text,
    "googleId" text,
    language text DEFAULT 'zh-TW'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO challengeapp;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: challengeapp
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
9b68e670-38c3-486e-83a4-3f38a3ae843f	a31a5256ce89a7febc0469c06e3d4d9333e9669d9d8067d9bdd53c096f085474	2025-08-13 14:33:50.413747+00	20250813143350_init	\N	\N	2025-08-13 14:33:50.377052+00	1
\.


--
-- Data for Name: check_ins; Type: TABLE DATA; Schema: public; Owner: challengeapp
--

COPY public.check_ins (id, "playerId", "levelId", type, content, "imagePixelUrl", "createdAt") FROM stdin;
\.


--
-- Data for Name: keep_notes; Type: TABLE DATA; Schema: public; Owner: challengeapp
--

COPY public.keep_notes (id, "playerId", content, tags, color, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: level_members; Type: TABLE DATA; Schema: public; Owner: challengeapp
--

COPY public.level_members (id, "playerId", "levelId", role, status, "missedDays", "joinedAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: levels; Type: TABLE DATA; Schema: public; Owner: challengeapp
--

COPY public.levels (id, name, description, "inviteCode", "ownerId", "isActive", "startDate", "endDate", "createdAt", "updatedAt", rules, settings) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: challengeapp
--

COPY public.users (id, email, name, "avatarUrl", "googleId", language, "createdAt", "updatedAt") FROM stdin;
cmedpxd8j0000rlh4gnt8o3mt	structures0124@gmail.com	貝貝	https://lh3.googleusercontent.com/a/ACg8ocJ4uauI_32wTDa9hgQgIRwXDytaweDIwqdzONcJu6LN9cc_jw=s96-c	108840199068284364512	zh-TW	2025-08-16 03:49:30.307	2025-08-16 04:19:21.607
cmedpzrz50001rlh41ay4fafy	gigilai1688@gmail.com	賴文琪	https://lh3.googleusercontent.com/a/ACg8ocKiM3dAvlvTV3BSB5vcHfa-wmvMebkWLyeF9e4VWZfgU6Ny8w=s96-c	117122361726214603964	zh-TW	2025-08-16 03:51:22.721	2025-08-16 04:20:20.192
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: challengeapp
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: check_ins check_ins_pkey; Type: CONSTRAINT; Schema: public; Owner: challengeapp
--

ALTER TABLE ONLY public.check_ins
    ADD CONSTRAINT check_ins_pkey PRIMARY KEY (id);


--
-- Name: keep_notes keep_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: challengeapp
--

ALTER TABLE ONLY public.keep_notes
    ADD CONSTRAINT keep_notes_pkey PRIMARY KEY (id);


--
-- Name: level_members level_members_pkey; Type: CONSTRAINT; Schema: public; Owner: challengeapp
--

ALTER TABLE ONLY public.level_members
    ADD CONSTRAINT level_members_pkey PRIMARY KEY (id);


--
-- Name: levels levels_pkey; Type: CONSTRAINT; Schema: public; Owner: challengeapp
--

ALTER TABLE ONLY public.levels
    ADD CONSTRAINT levels_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: challengeapp
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: check_ins_playerId_levelId_createdAt_key; Type: INDEX; Schema: public; Owner: challengeapp
--

CREATE UNIQUE INDEX "check_ins_playerId_levelId_createdAt_key" ON public.check_ins USING btree ("playerId", "levelId", "createdAt");


--
-- Name: level_members_playerId_levelId_key; Type: INDEX; Schema: public; Owner: challengeapp
--

CREATE UNIQUE INDEX "level_members_playerId_levelId_key" ON public.level_members USING btree ("playerId", "levelId");


--
-- Name: levels_inviteCode_key; Type: INDEX; Schema: public; Owner: challengeapp
--

CREATE UNIQUE INDEX "levels_inviteCode_key" ON public.levels USING btree ("inviteCode");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: challengeapp
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_googleId_key; Type: INDEX; Schema: public; Owner: challengeapp
--

CREATE UNIQUE INDEX "users_googleId_key" ON public.users USING btree ("googleId");


--
-- Name: check_ins check_ins_levelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: challengeapp
--

ALTER TABLE ONLY public.check_ins
    ADD CONSTRAINT "check_ins_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES public.levels(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: check_ins check_ins_playerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: challengeapp
--

ALTER TABLE ONLY public.check_ins
    ADD CONSTRAINT "check_ins_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: keep_notes keep_notes_playerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: challengeapp
--

ALTER TABLE ONLY public.keep_notes
    ADD CONSTRAINT "keep_notes_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: level_members level_members_levelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: challengeapp
--

ALTER TABLE ONLY public.level_members
    ADD CONSTRAINT "level_members_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES public.levels(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: level_members level_members_playerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: challengeapp
--

ALTER TABLE ONLY public.level_members
    ADD CONSTRAINT "level_members_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: levels levels_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: challengeapp
--

ALTER TABLE ONLY public.levels
    ADD CONSTRAINT "levels_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: challengeapp
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

