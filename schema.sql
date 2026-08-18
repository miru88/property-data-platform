BEGIN;

-- Property Data Platform — Schema DDL
-- Tables created in dependency order (referenced tables before referencing ones)

-- ============================================================
-- state
-- ============================================================
CREATE TABLE state (
	id SERIAL PRIMARY KEY
  , code TEXT NOT NULL UNIQUE
  , name TEXT NOT NULL
);

-- ============================================================
-- municipality
-- ============================================================
CREATE TABLE municipality (
	id SERIAL PRIMARY KEY
  , "stateId" INTEGER NOT NULL REFERENCES state(id)
  , name TEXT NOT NULL
  , "fiscalYear" INTEGER NOT NULL
  , "residentialTaxRate" NUMERIC(10, 4)
  , "commercialTaxRate" NUMERIC(10, 4)
);

-- ============================================================
-- adapter_type
-- ============================================================
CREATE TABLE adapter_type (
	id SERIAL PRIMARY KEY
  , code TEXT NOT NULL UNIQUE  -- e.g. 'MASSGIS_REST', 'PATRIOT_PROPERTIES', 'VGSI'
  , name TEXT NOT NULL
);

-- ============================================================
-- source
-- municipalityId is nullable: NULL means a state-level source
-- covering multiple towns (e.g. MassGIS); set means a single-town
-- source (e.g. a Patriot Properties portal for one specific town).
-- ============================================================
CREATE TABLE source (
	id SERIAL PRIMARY KEY
  , "stateId" INTEGER NOT NULL REFERENCES state(id)
  , "municipalityId" INTEGER REFERENCES municipality(id)
  , "adapterTypeId" INTEGER NOT NULL REFERENCES adapter_type(id)
  , config JSONB NOT NULL DEFAULT '{}'::jsonb
  , "isActive" BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================================
-- source_schedule
-- One row per actual trigger moment (day of month + time of day),
-- rather than packing multiple times into one cron string.
-- ============================================================
CREATE TABLE source_schedule (
	id SERIAL PRIMARY KEY
  , "sourceId" INTEGER NOT NULL REFERENCES source(id)
  , "dayOfMonth" SMALLINT NOT NULL CHECK ("dayOfMonth" BETWEEN 1 AND 31)
  , hour SMALLINT NOT NULL CHECK (hour BETWEEN 0 AND 23)
  , minute SMALLINT NOT NULL DEFAULT 0 CHECK (minute BETWEEN 0 AND 59)
);

-- ============================================================
-- ingestion_run
-- ============================================================
CREATE TYPE ingestion_run_status AS ENUM ('RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL');

CREATE TABLE ingestion_run (
	id SERIAL PRIMARY KEY
  , "sourceId" INTEGER NOT NULL REFERENCES source(id)
  , status ingestion_run_status NOT NULL
  , "startedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
  , "finishedAt" TIMESTAMPTZ
  , "rawSnapshotKey" TEXT
  , "recordsSeen" INTEGER NOT NULL DEFAULT 0
  , "recordsUpserted" INTEGER NOT NULL DEFAULT 0
  , "recordsRejected" INTEGER NOT NULL DEFAULT 0
  , "errorDetail" JSONB
);

-- ============================================================
-- parcel
-- extraAttributes catches any source field with no dedicated
-- column (e.g. Wisconsin's PLSS fields, which have no MA equivalent).
-- ============================================================
CREATE TABLE parcel (
	id SERIAL PRIMARY KEY
  , "municipalityId" INTEGER NOT NULL REFERENCES municipality(id)
  , "sourceParcelId" TEXT NOT NULL
  , "locationId" TEXT
  , "siteAddress" TEXT
  , "stateUseCode" TEXT
  , "lotSizeAcres" NUMERIC(10, 4)
  , "unitCount" SMALLINT
  , "yearBuilt" SMALLINT
  , "extraAttributes" JSONB NOT NULL DEFAULT '{}'::jsonb
  , UNIQUE ("municipalityId", "sourceParcelId")
);

-- ============================================================
-- source_field
-- Self-documenting catalog: every field name ever seen from a
-- source, and whether it currently feeds a real column or is
-- just sitting in parcel.extraAttributes.
-- ============================================================
CREATE TABLE source_field (
	id SERIAL PRIMARY KEY
  , "sourceId" INTEGER NOT NULL REFERENCES source(id)
  , "fieldId" TEXT NOT NULL
  , "isMapped" BOOLEAN NOT NULL DEFAULT FALSE
  , "firstSeenAt" TIMESTAMPTZ NOT NULL DEFAULT now()
  , UNIQUE ("sourceId", "fieldId")
);

-- ============================================================
-- assessment
-- One row per (parcel, fiscal year) — this is what creates the
-- time series as new fiscal years get observed.
-- ============================================================
CREATE TABLE assessment (
	id SERIAL PRIMARY KEY
  , "parcelId" INTEGER NOT NULL REFERENCES parcel(id)
  , "fiscalYear" SMALLINT NOT NULL
  , "assessedTotal" NUMERIC(12, 2)
  , "assessedLand" NUMERIC(12, 2)
  , "assessedBuilding" NUMERIC(12, 2)
  , "ownerName" TEXT
  , "ownerAddress" TEXT
  , "ingestionRunId" INTEGER NOT NULL REFERENCES ingestion_run(id)
  , UNIQUE ("parcelId", "fiscalYear")
);

-- ============================================================
-- sale
-- ============================================================
CREATE TABLE sale (
	id SERIAL PRIMARY KEY
  , "parcelId" INTEGER NOT NULL REFERENCES parcel(id)
  , "saleDate" DATE
  , "salePrice" NUMERIC(12, 2)
  , "bookPage" TEXT
  , UNIQUE ("parcelId", "saleDate", "salePrice")
);

-- ============================================================
-- parcel_reject
-- ============================================================
CREATE TABLE parcel_reject (
	id SERIAL PRIMARY KEY
  , "ingestionRunId" INTEGER NOT NULL REFERENCES ingestion_run(id)
  , "rawRow" JSONB NOT NULL
  , reason TEXT NOT NULL
);



-- ============================================================
-- Schema updates — August 16, 2026
-- ============================================================

-- source_field: replaced isMapped boolean with mappedColumn text.
-- NULL means unmapped, a value names which real column this field
-- maps to. One column doing both jobs — cataloging every field ever
-- seen from a source, and recording where mapped ones actually go.
ALTER TABLE source_field
	DROP COLUMN "isMapped"
  , ADD COLUMN "mappedColumn" TEXT;

-- Decided against extraAttributes on assessment OR parcel.
-- source_field already tracks every field ever seen per source, and
-- whether it's mapped (mappedColumn). The raw source data for any
-- unmapped field is fully reconstructable from R2 at any time —
-- nothing is lost by not also storing it redundantly in Postgres.
-- No concrete feature currently needs to query an unmapped field in
-- SQL; if that need ever arises for a specific field, add it as a
-- real column then, backfilled from R2, rather than storing every
-- unmapped field speculatively now.
ALTER TABLE parcel
	DROP COLUMN "extraAttributes";


-- municipality: dropped fiscalYear, residentialTaxRate, commercialTaxRate.
-- These change annually just like assessment's values do — leaving them
-- on municipality meant every historical tax-burden calculation would
-- use whatever rate is CURRENT, not the rate that was actually in effect
-- for that assessment's fiscal year. Same fix pattern as assessment
-- being split out from parcel originally: versioned data gets its own
-- table, keyed by (municipalityId, fiscalYear).
ALTER TABLE municipality
	DROP COLUMN "fiscalYear"
  , DROP COLUMN "residentialTaxRate"
  , DROP COLUMN "commercialTaxRate";
 
CREATE TABLE municipality_tax_data (
	id SERIAL PRIMARY KEY
  , "municipalityId" INTEGER NOT NULL REFERENCES municipality(id)
  , "fiscalYear" SMALLINT NOT NULL
  , "residentialTaxRate" NUMERIC(10, 4)
  , "commercialTaxRate" NUMERIC(10, 4)
  , UNIQUE ("municipalityId", "fiscalYear")
);

COMMIT;