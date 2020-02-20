-- DROP TABLE IF EXISTS location;
CREATE TABLE city(
  ID serial PRIMARY KEY,
  search_query VARCHAR(255),
  formatted_query VARCHAR(255),
  latitude VARCHAR(255),
  longitude VARCHAR(255)
);