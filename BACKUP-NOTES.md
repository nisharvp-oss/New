# WanderSync project source backup

This archive contains application source, bundled assets, package lockfile, configuration, database schema definitions and migration SQL. It is NOT a full restorable Cloud backup.

## Not included
- Current database rows and user accounts/password hashes.
- Files uploaded to Cloud storage (traveler documents, boarding passes, sponsor media).
- Secrets, environment variables, sign-in provider settings and API keys.
- Git metadata, installed dependencies and generated build output.

## Complete the backup
1. In Lovable, open More → Database → Manage → Settings.
2. Under Export project data, click Export data.
3. In the Database card click Export, then Start export.
4. Download the export from the emailed link or More → Storage.
   This export includes the entire database schema and data, including user accounts with password hashes.
5. Download storage files separately from More → Storage; neither the database export nor daily snapshots include those files.
6. Keep secrets and sign-in provider/API configuration separately in a secure password manager.

Export limits: database up to 15 GB, export file up to 5 GB, one export every 24 hours. A paused backend must be resumed before export. This project currently has one backend shared by preview and publication.

To restore outside Lovable Cloud, use a separate Supabase project you own, restore the database export, reconfigure sign-in providers/API keys and test sign-in. The Lovable Database export page does not import data. Schema migration files in this ZIP are not a substitute for the database export.
