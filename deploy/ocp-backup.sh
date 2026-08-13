#!/bin/bash
# OCP Panel otomatik yedekleme — panel tarafından yönetilir
# Kaynaklar: /home/dursun/ocp-panel
# Hedef    : /home/dursun/backups
set -e
mkdir -p "${dir}"
NAME="backup-auto-$(date +%Y-%m-%d-%H%M%S).tar.gz"
tar -czf "${dir}/${NAME}" -C "\"/home/dursun\"" "ocp-panel"
echo "OK: ${dir}/${NAME}"
