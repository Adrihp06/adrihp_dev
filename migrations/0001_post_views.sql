CREATE TABLE post_views (
  slug TEXT PRIMARY KEY,
  views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0)
);

-- Random session hashes, not names, cookies or IP addresses.
CREATE TABLE view_sessions (
  slug TEXT NOT NULL,
  session_hash TEXT NOT NULL,
  visitor_bucket TEXT,
  bucket_expires INTEGER,
  PRIMARY KEY (slug, session_hash)
);
CREATE TABLE view_limits (
  bucket TEXT PRIMARY KEY,
  views INTEGER NOT NULL,
  expires INTEGER NOT NULL
);
CREATE INDEX view_limits_expiry ON view_limits(expires);

-- One atomic insertion owns both the public count and the abuse budget.
CREATE TRIGGER count_post_view AFTER INSERT ON view_sessions
BEGIN
  INSERT INTO post_views (slug, views) VALUES (NEW.slug, 1)
    ON CONFLICT(slug) DO UPDATE SET views = views + 1;
  INSERT INTO view_limits (bucket, views, expires)
    VALUES (NEW.visitor_bucket, 1, NEW.bucket_expires)
    ON CONFLICT(bucket) DO UPDATE SET views = views + 1;
  UPDATE view_sessions SET visitor_bucket = NULL, bucket_expires = NULL
    WHERE slug = NEW.slug AND session_hash = NEW.session_hash;
END;
