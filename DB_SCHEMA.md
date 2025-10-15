# Estrutura do Banco de Dados

Esta é a estrutura do banco de dados obtida em 2025-06-08.

| table_schema | table_name                | column_name      | data_type                | is_nullable | column_default           |
| ------------ | ------------------------- | ---------------- | ------------------------ | ----------- | ------------------------ |
| public       | clients                   | id               | uuid                     | NO          | gen_random_uuid()        |
| public       | clients                   | name             | text                     | NO          | null                     |
| public       | clients                   | settings         | jsonb                    | YES         | null                     |
| public       | clients                   | created_at       | timestamp with time zone | NO          | now()                    |
| public       | gateways                  | id               | uuid                     | NO          | gen_random_uuid()        |
| public       | gateways                  | client_id        | uuid                     | NO          | null                     |
| public       | gateways                  | type             | text                     | NO          | null                     |
| public       | gateways                  | name             | text                     | NO          | null                     |
| public       | gateways                  | config           | jsonb                    | YES         | null                     |
| public       | gateways                  | is_active        | boolean                  | NO          | true                     |
| public       | gateways                  | created_at       | timestamp with time zone | NO          | now()                    |
| public       | leads                     | id               | uuid                     | NO          | gen_random_uuid()        |
| public       | leads                     | client_id        | uuid                     | NO          | null                     |
| public       | leads                     | offer_id         | uuid                     | YES         | null                     |
| public       | leads                     | email            | text                     | NO          | null                     |
| public       | leads                     | name             | text                     | YES         | null                     |
| public       | leads                     | tags             | jsonb                    | YES         | null                     |
| public       | leads                     | status           | USER-DEFINED             | NO          | 'ativo'::lead_status     |
| public       | leads                     | created_at       | timestamp with time zone | NO          | now()                    |
| public       | log_external_lead_batches | id               | uuid                     | NO          | gen_random_uuid()        |
| public       | log_external_lead_batches | file_upload_id   | uuid                     | NO          | null                     |
| public       | log_external_lead_batches | client_id        | uuid                     | NO          | null                     |
| public       | log_external_lead_batches | offer_name       | text                     | YES         | null                     |
| public       | log_external_lead_batches | success_count    | integer                  | YES         | null                     |
| public       | log_external_lead_batches | fail_count       | integer                  | YES         | null                     |
| public       | log_external_lead_batches | processed_at     | timestamp with time zone | NO          | now()                    |
| public       | log_lead_file_uploads     | id               | uuid                     | NO          | gen_random_uuid()        |
| public       | log_lead_file_uploads     | client_id        | uuid                     | NO          | null                     |
| public       | log_lead_file_uploads     | file_name        | text                     | NO          | null                     |
| public       | log_lead_file_uploads     | status           | text                     | NO          | null                     |
| public       | log_lead_file_uploads     | total_leads      | integer                  | YES         | null                     |
| public       | log_lead_file_uploads     | uploaded_at      | timestamp with time zone | NO          | now()                    |
| public       | log_offer_emails          | id               | uuid                     | NO          | gen_random_uuid()        |
| public       | log_offer_emails          | lead_id          | uuid                     | YES         | null                     |
| public       | log_offer_emails          | client_id        | uuid                     | YES         | null                     |
| public       | log_offer_emails          | email            | text                     | NO          | null                     |
| public       | log_offer_emails          | status           | text                     | NO          | null                     |
| public       | log_offer_emails          | origin           | text                     | NO          | null                     |
| public       | log_offer_emails          | error_message    | text                     | YES         | null                     |
| public       | log_offer_emails          | sent_at          | timestamp with time zone | NO          | now()                    |
| public       | offers                    | id               | uuid                     | NO          | gen_random_uuid()        |
| public       | offers                    | client_id        | uuid                     | NO          | null                     |
| public       | offers                    | name             | text                     | NO          | null                     |
| public       | offers                    | description      | text                     | YES         | null                     |
| public       | offers                    | discount         | text                     | YES         | null                     |
| public       | offers                    | link             | text                     | YES         | null                     |
| public       | offers                    | is_active        | boolean                  | NO          | true                     |
| public       | offers                    | created_at       | timestamp with time zone | NO          | now()                    |
| public       | orders                    | id               | uuid                     | NO          | gen_random_uuid()        |
| public       | orders                    | client_id        | uuid                     | NO          | null                     |
| public       | orders                    | gateway_id       | uuid                     | NO          | null                     |
| public       | orders                    | external_id      | text                     | YES         | null                     |
| public       | orders                    | amount           | integer                  | NO          | null                     |
| public       | orders                    | status           | USER-DEFINED             | NO          | 'created'::order_status  |
| public       | orders                    | customer_name    | text                     | NO          | null                     |
| public       | orders                    | customer_email   | text                     | NO          | null                     |
| public       | orders                    | customer_phone   | text                     | YES         | null                     |
| public       | orders                    | customer_cpf     | text                     | YES         | null                     |
| public       | orders                    | city             | text                     | YES         | null                     |
| public       | orders                    | state            | text                     | YES         | null                     |
| public       | orders                    | tracking_code    | text                     | YES         | null                     |
| public       | orders                    | payment_id       | text                     | YES         | null                     |
| public       | orders                    | payment_status   | USER-DEFINED             | YES         | null                     |
| public       | orders                    | redelivery_count | integer                  | NO          | 0                        |
| public       | orders                    | created_at       | timestamp with time zone | NO          | now()                    |
| public       | orders                    | updated_at       | timestamp with time zone | NO          | now()                    |
| public       | profiles                  | id               | uuid                     | NO          | null                     |
| public       | profiles                  | role             | USER-DEFINED             | NO          | 'gateway_user'::app_role |
| public       | profiles                  | client_id        | uuid                     | YES         | null                     |
| public       | profiles                  | gateway_id       | uuid                     | YES         | null                     |
| public       | profiles                  | full_name        | text                     | YES         | null                     |
| public       | profiles                  | updated_at       | timestamp with time zone | YES         | null                     |