# Hotel Sherpa Soul — Backup & Disaster Recovery Manual

---

## 1. What Needs to Be Backed Up
1. **Database:** SQLite database file `prisma/dev.db` (or PostgreSQL backup dump).
2. **Environment Configuration:** `.env` file containing secrets and credentials.
3. **Uploaded Media:** `public/images/` directory containing hotel photos and logos.
4. **Source Code:** Complete Git repository.

---

## 2. Creating an Instant Backup
Run the backup command from the project root:
```bash
# Backup SQLite database
copy prisma\dev.db backups\sherpasoul_db_backup_%date%.db

# Backup uploaded assets
xcopy /E /I public\images backups\images_backup
```

---

## 3. Restoring the Application
1. Clone or extract the source code repository.
2. Run `npm install` to restore dependencies.
3. Copy your backup database file to `prisma/dev.db`.
4. Run `npx prisma db push` to verify schema integrity.
5. Run `npm run build` and `npm run start` to bring the website back online.
