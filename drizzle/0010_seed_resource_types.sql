-- resource_types is a fixed lookup table (Lectures, Tutorials, Practicals,
-- Past papers, Summaries, Videos), the same class of data as
-- product_categories: needed by every environment, not test data, previously
-- only ever inserted by the dev-only seed script — which meant a fresh
-- production database had an empty dropdown and every resource save failed
-- validation silently (no valid resource_type_id to submit).
INSERT INTO "resource_types" ("key", "label_en", "label_fr", "label_ar", "is_system", "position") VALUES
	('cours', 'Lectures', 'Cours', 'دروس', true, 1),
	('td', 'Tutorials', 'TD', 'أعمال موجهة', true, 2),
	('tp', 'Practicals', 'TP', 'أعمال تطبيقية', true, 3),
	('exam', 'Past papers', 'Examens', 'امتحانات', true, 4),
	('resume', 'Summaries', 'Résumés', 'ملخصات', true, 5),
	('video', 'Videos', 'Vidéos', 'فيديوهات', true, 6)
ON CONFLICT (key) DO NOTHING;
