BEGIN;

INSERT INTO state (code, name)
VALUES ('MA', 'Massachusetts');

INSERT INTO municipality ("stateId", name)
VALUES
	(1, 'Everett')
  , (1, 'Malden')
  , (1, 'Chelsea')
  , (1, 'Revere');

INSERT INTO adapter_type (code, name)
VALUES ('MASSGIS_REST', 'MassGIS ArcGIS REST API');

INSERT INTO source ("stateId", "adapterTypeId", config)
VALUES (1, 1, '{"fieldMap": {"TOTAL_VAL": "assessedTotal", "OWNER1": "ownerName", "SITE_ADDR": "siteAddress", "LOT_SIZE": "lotSizeAcres", "YEAR_BUILT": "yearBuilt", "USE_CODE": "stateUseCode", "LOC_ID": "locationId"}}'::jsonb);

COMMIT;