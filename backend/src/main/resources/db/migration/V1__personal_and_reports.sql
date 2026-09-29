CREATE TABLE saved_places (
    account_id VARCHAR(64) NOT NULL,
    place_id VARCHAR(128) NOT NULL,
    saved BOOLEAN NOT NULL,
    version BIGINT NOT NULL CHECK (version > 0),
    updated_at VARCHAR(35) NOT NULL,
    store_epoch VARCHAR(36) NOT NULL,
    place_json TEXT NOT NULL,
    PRIMARY KEY (account_id, place_id)
);
CREATE INDEX saved_places_account_saved ON saved_places (account_id, saved, updated_at, place_id);

CREATE TABLE correction_reports (
    report_id VARCHAR(36) PRIMARY KEY,
    place_id VARCHAR(128) NOT NULL,
    issue_category VARCHAR(32) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    reporter_email VARCHAR(254),
    received_at VARCHAR(35) NOT NULL,
    status VARCHAR(32) NOT NULL
);
CREATE INDEX correction_reports_status_received ON correction_reports (status, received_at);
