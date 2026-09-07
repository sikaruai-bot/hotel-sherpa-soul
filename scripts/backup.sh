#!/bin/bash
# =======================================================
#    HOTEL SHERPA SOUL - LINUX / CPANEL CRON BACKUP SCRIPT
# =======================================================

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${PROJECT_DIR}/backups/backup_${TIMESTAMP}"

mkdir -p "${BACKUP_DIR}/images"

echo "[*] Starting Hotel Sherpa Soul backup at ${TIMESTAMP}..."

# 1. Backup SQLite Database
if [ -f "${PROJECT_DIR}/prisma/dev.db" ]; then
    cp "${PROJECT_DIR}/prisma/dev.db" "${BACKUP_DIR}/dev.db"
    echo "[OK] Database backed up."
fi

# 2. Backup Environment Config
if [ -f "${PROJECT_DIR}/.env" ]; then
    cp "${PROJECT_DIR}/.env" "${BACKUP_DIR}/.env"
    echo "[OK] .env backed up."
fi

# 3. Backup Media Assets
if [ -d "${PROJECT_DIR}/public/images" ]; then
    cp -r "${PROJECT_DIR}/public/images/"* "${BACKUP_DIR}/images/"
    echo "[OK] Media assets backed up."
fi

# 4. Optional archive compression
cd "${PROJECT_DIR}/backups"
tar -czf "backup_${TIMESTAMP}.tar.gz" "backup_${TIMESTAMP}"
rm -rf "backup_${TIMESTAMP}"

echo "[SUCCESS] Compressed backup created: ${PROJECT_DIR}/backups/backup_${TIMESTAMP}.tar.gz"

# Retain only last 14 daily backups
find "${PROJECT_DIR}/backups" -name "backup_*.tar.gz" -mtime +14 -delete
