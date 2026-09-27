-- Keep the certificate the signature was checked against, so anyone can check
-- it again later without trusting this service's word for it.
ALTER TABLE signature ADD COLUMN cert_pem text;
ALTER TABLE signature ADD COLUMN signed_payload text NOT NULL DEFAULT '';
ALTER TABLE signature ADD COLUMN dept_id text NOT NULL DEFAULT '';
