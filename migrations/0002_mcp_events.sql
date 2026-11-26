CREATE TABLE mcp_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  day TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  client_name TEXT,
  client_version TEXT,
  client_token TEXT,
  protocol_version TEXT,
  method TEXT NOT NULL,
  tool_name TEXT,
  entry_id TEXT,
  section TEXT,
  category TEXT,
  query TEXT,
  question TEXT,
  result_count INTEGER,
  is_error INTEGER NOT NULL DEFAULT 0 CHECK (is_error IN (0, 1))
);

CREATE INDEX mcp_events_timestamp ON mcp_events(timestamp);
CREATE INDEX mcp_events_visitor_day ON mcp_events(visitor_id, day);
CREATE INDEX mcp_events_day ON mcp_events(day);
CREATE INDEX mcp_events_client ON mcp_events(client_name, client_token);
CREATE INDEX mcp_events_tool ON mcp_events(tool_name, timestamp);
CREATE INDEX mcp_events_query ON mcp_events(query, timestamp);
CREATE INDEX mcp_events_entry ON mcp_events(entry_id, section, timestamp);
