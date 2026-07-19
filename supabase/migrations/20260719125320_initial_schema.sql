


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


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
    and role = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."favorites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "igdb_game_id" integer NOT NULL,
    "game_name" "text" NOT NULL,
    "cover_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."favorites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."game_translations" (
    "igdb_game_id" integer NOT NULL,
    "summary_fr" "text",
    "storyline_fr" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."game_translations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."glossary_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "short_description" "text" NOT NULL,
    "detailed_description" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "reviewed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "published_at" timestamp with time zone,
    CONSTRAINT "glossary_entries_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'published'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."glossary_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."glossary_entry_games" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "glossary_entry_id" "uuid" NOT NULL,
    "igdb_game_id" bigint NOT NULL,
    "game_name" "text" NOT NULL,
    "cover_url" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."glossary_entry_games" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."glossary_entry_sources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "glossary_entry_id" "uuid" NOT NULL,
    "label" "text",
    "url" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "glossary_entry_sources_url_format" CHECK (("url" ~* '^https://'::"text"))
);


ALTER TABLE "public"."glossary_entry_sources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "href" "text",
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['glossary_published'::"text", 'glossary_rejected'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "user_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "username" "text" NOT NULL,
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "avatar_url" "text",
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_user_game_unique" UNIQUE ("user_id", "igdb_game_id");



ALTER TABLE ONLY "public"."game_translations"
    ADD CONSTRAINT "game_translations_pkey" PRIMARY KEY ("igdb_game_id");



ALTER TABLE ONLY "public"."glossary_entries"
    ADD CONSTRAINT "glossary_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."glossary_entries"
    ADD CONSTRAINT "glossary_entries_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."glossary_entry_games"
    ADD CONSTRAINT "glossary_entry_games_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."glossary_entry_games"
    ADD CONSTRAINT "glossary_entry_games_unique" UNIQUE ("glossary_entry_id", "igdb_game_id");



ALTER TABLE ONLY "public"."glossary_entry_sources"
    ADD CONSTRAINT "glossary_entry_sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."glossary_entry_sources"
    ADD CONSTRAINT "glossary_entry_sources_unique" UNIQUE ("glossary_entry_id", "url");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



CREATE INDEX "glossary_entries_author_id_idx" ON "public"."glossary_entries" USING "btree" ("author_id");



CREATE INDEX "glossary_entries_slug_idx" ON "public"."glossary_entries" USING "btree" ("slug");



CREATE INDEX "glossary_entries_status_idx" ON "public"."glossary_entries" USING "btree" ("status");



CREATE INDEX "glossary_entry_games_entry_id_idx" ON "public"."glossary_entry_games" USING "btree" ("glossary_entry_id");



CREATE INDEX "glossary_entry_games_igdb_game_id_idx" ON "public"."glossary_entry_games" USING "btree" ("igdb_game_id");



CREATE INDEX "notifications_user_created_idx" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC);



CREATE OR REPLACE TRIGGER "glossary_entries_set_updated_at" BEFORE UPDATE ON "public"."glossary_entries" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."glossary_entries"
    ADD CONSTRAINT "glossary_entries_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."glossary_entries"
    ADD CONSTRAINT "glossary_entries_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("user_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."glossary_entry_games"
    ADD CONSTRAINT "glossary_entry_games_glossary_entry_id_fkey" FOREIGN KEY ("glossary_entry_id") REFERENCES "public"."glossary_entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."glossary_entry_sources"
    ADD CONSTRAINT "glossary_entry_sources_glossary_entry_id_fkey" FOREIGN KEY ("glossary_entry_id") REFERENCES "public"."glossary_entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete all glossary entries" ON "public"."glossary_entries" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admins can manage all glossary entry games" ON "public"."glossary_entry_games" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can read all glossary entries" ON "public"."glossary_entries" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admins can read all glossary entry games" ON "public"."glossary_entry_games" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admins can update all glossary entries" ON "public"."glossary_entries" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Authenticated users can read profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authors can delete games for their pending glossary entries" ON "public"."glossary_entry_games" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."glossary_entries" "entry"
  WHERE (("entry"."id" = "glossary_entry_games"."glossary_entry_id") AND ("entry"."author_id" = "auth"."uid"()) AND ("entry"."status" = 'pending'::"text")))));



CREATE POLICY "Authors can delete their pending glossary entries" ON "public"."glossary_entries" FOR DELETE TO "authenticated" USING ((("author_id" = "auth"."uid"()) AND ("status" = 'pending'::"text")));



CREATE POLICY "Authors can insert games for their pending glossary entries" ON "public"."glossary_entry_games" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."glossary_entries" "entry"
  WHERE (("entry"."id" = "glossary_entry_games"."glossary_entry_id") AND ("entry"."author_id" = "auth"."uid"()) AND ("entry"."status" = 'pending'::"text")))));



CREATE POLICY "Authors can read games for their own glossary entries" ON "public"."glossary_entry_games" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."glossary_entries" "entry"
  WHERE (("entry"."id" = "glossary_entry_games"."glossary_entry_id") AND ("entry"."author_id" = "auth"."uid"())))));



CREATE POLICY "Authors can read their own glossary entries" ON "public"."glossary_entries" FOR SELECT TO "authenticated" USING (("author_id" = "auth"."uid"()));



CREATE POLICY "Authors can update games for their pending glossary entries" ON "public"."glossary_entry_games" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."glossary_entries" "entry"
  WHERE (("entry"."id" = "glossary_entry_games"."glossary_entry_id") AND ("entry"."author_id" = "auth"."uid"()) AND ("entry"."status" = 'pending'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."glossary_entries" "entry"
  WHERE (("entry"."id" = "glossary_entry_games"."glossary_entry_id") AND ("entry"."author_id" = "auth"."uid"()) AND ("entry"."status" = 'pending'::"text")))));



CREATE POLICY "Authors can update their pending glossary entries" ON "public"."glossary_entries" FOR UPDATE TO "authenticated" USING ((("author_id" = "auth"."uid"()) AND ("status" = 'pending'::"text"))) WITH CHECK ((("author_id" = "auth"."uid"()) AND ("status" = 'pending'::"text")));



CREATE POLICY "Public can read games for published glossary entries" ON "public"."glossary_entry_games" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."glossary_entries" "entry"
  WHERE (("entry"."id" = "glossary_entry_games"."glossary_entry_id") AND ("entry"."status" = 'published'::"text")))));



CREATE POLICY "Public can read published glossary entries" ON "public"."glossary_entries" FOR SELECT TO "authenticated", "anon" USING (("status" = 'published'::"text"));



CREATE POLICY "Users can create pending glossary entries" ON "public"."glossary_entries" FOR INSERT TO "authenticated" WITH CHECK ((("author_id" = "auth"."uid"()) AND ("status" = 'pending'::"text")));



CREATE POLICY "Users can delete their own favorites" ON "public"."favorites" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own profile" ON "public"."profiles" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own favorites" ON "public"."favorites" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read their own favorites" ON "public"."favorites" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read their own notifications" ON "public"."notifications" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."favorites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."game_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."glossary_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."glossary_entry_games" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."glossary_entry_sources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";


















GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."favorites" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."favorites" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."favorites" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."game_translations" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."game_translations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."game_translations" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."glossary_entries" TO "anon";
GRANT ALL ON TABLE "public"."glossary_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."glossary_entries" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."glossary_entry_games" TO "anon";
GRANT ALL ON TABLE "public"."glossary_entry_games" TO "authenticated";
GRANT ALL ON TABLE "public"."glossary_entry_games" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."glossary_entry_sources" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."glossary_entry_sources" TO "authenticated";
GRANT ALL ON TABLE "public"."glossary_entry_sources" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."notifications" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profiles" TO "anon";
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."profiles" TO "authenticated";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "service_role";



































drop extension if exists "pg_net";

drop policy "Public can read published glossary entries" on "public"."glossary_entries";

drop policy "Public can read games for published glossary entries" on "public"."glossary_entry_games";


  create policy "Public can read published glossary entries"
  on "public"."glossary_entries"
  as permissive
  for select
  to anon, authenticated
using ((status = 'published'::text));



  create policy "Public can read games for published glossary entries"
  on "public"."glossary_entry_games"
  as permissive
  for select
  to anon, authenticated
using ((EXISTS ( SELECT 1
   FROM public.glossary_entries entry
  WHERE ((entry.id = glossary_entry_games.glossary_entry_id) AND (entry.status = 'published'::text)))));



  create policy "Avatar files are publicly readable"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "Users can update own avatar"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)))
with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can upload own avatar"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



