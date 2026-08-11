#!/bin/bash
# ============================================================
# OCP Panel — Mail Stack Kurulum Scripti
# postfix (sanal domainler) + dovecot (IMAP/POP3, passwd-file)
# Amaç: WHM Email Functions modülünün altyapısını kurar.
# Debian 12 (bookworm) üzerinde test edildi — root veya sudo ile çalıştırın
# ============================================================
set -euo pipefail

echo "==> 1/7 postfix + dovecot kuruluyor..."
echo "postfix postfix/main_mailer_type select Internet Site
postfix postfix/mailname string $(hostname).local
postfix postfix/destinations string localhost" | debconf-set-selections
DEBIAN_FRONTEND=noninteractive apt-get install -y postfix dovecot-imapd dovecot-pop3d

echo "==> 2/7 vmail kullanıcısı (uid 5000) oluşturuluyor..."
id -u vmail &>/dev/null || useradd -r -u 5000 -d /var/mail/vhosts -s /usr/sbin/nologin vmail
mkdir -p /var/mail/vhosts
chown vmail:vmail /var/mail/vhosts
chmod 770 /var/mail/vhosts

echo "==> 3/7 postfix sanal domain ayarları..."
postconf -e \
  virtual_mailbox_domains='hash:/etc/postfix/virtual_domains' \
  virtual_mailbox_base='/var/mail/vhosts' \
  virtual_mailbox_maps='hash:/etc/postfix/virtual_mailbox' \
  virtual_alias_maps='hash:/etc/postfix/virtual_alias' \
  virtual_uid_maps='static:5000' \
  virtual_gid_maps='static:5000' \
  virtual_transport='virtual' \
  mydestination='localhost' \
  mailbox_size_limit='0' \
  virtual_mailbox_limit='0' \
  message_size_limit='25600000' \
  smtpd_sasl_type='dovecot' \
  smtpd_sasl_path='private/auth' \
  smtpd_sasl_auth_enable='yes' \
  smtpd_sasl_security_options='noanonymous' \
  smtpd_tls_security_level='may' \
  broken_sasl_auth_clients='yes'

echo "==> 4/7 submission portu (587) — zaten yoksa ekleniyor..."
grep -q '^submission' /etc/postfix/master.cf || cat >> /etc/postfix/master.cf <<'EOF'

# OCP Panel — submission portu (SMTP auth ile, 587)
submission inet n       -       y       -       -       smtpd
  -o syslog_name=postfix/submission
  -o smtpd_tls_security_level=may
  -o smtpd_sasl_auth_enable=yes
  -o smtpd_relay_restrictions=permit_sasl_authenticated,reject
  -o smtpd_recipient_restrictions=permit_sasl_authenticated,reject
EOF

echo "==> 5/7 dovecot yapılandırması..."
# auth: passwd-file öncelikli
sed -i 's/^!include auth-system.conf.ext/#!include auth-system.conf.ext/' /etc/dovecot/conf.d/10-auth.conf
sed -i 's/^#!include auth-passwdfile.conf.ext/!include auth-passwdfile.conf.ext/' /etc/dovecot/conf.d/10-auth.conf

cat > /etc/dovecot/conf.d/auth-passwdfile.conf.ext <<'EOF'
# OCP Panel — passwd-file auth (sanal mail kullanıcıları)
passdb {
  driver = passwd-file
  args = scheme=PLAIN username_format=%u /etc/dovecot/ocp-users
}
userdb {
  driver = passwd-file
  args = username_format=%u /etc/dovecot/ocp-users
  default_fields = uid=vmail gid=vmail home=/var/mail/vhosts/%d/%n
}
EOF

cat > /etc/dovecot/conf.d/99-ocp-mail.conf <<'EOF'
# OCP Panel — maildir + vmail
mail_location = maildir:/var/mail/vhosts/%d/%n
mail_uid = 5000
mail_gid = 5000
first_valid_uid = 5000
last_valid_uid = 5000
EOF

cat > /etc/dovecot/conf.d/99-ocp-master.conf <<'EOF'
# OCP Panel — postfix SMTP auth socket'i
service auth {
  unix_listener /var/spool/postfix/private/auth {
    mode = 0660
    user = postfix
    group = postfix
  }
}
EOF

echo "==> 6/7 boş map + passwd dosyaları..."
touch /etc/postfix/virtual_domains /etc/postfix/virtual_mailbox /etc/postfix/virtual_alias
touch /etc/dovecot/ocp-users
chown vmail:vmail /etc/dovecot/ocp-users
postmap /etc/postfix/virtual_domains /etc/postfix/virtual_mailbox /etc/postfix/virtual_alias

echo "==> 7/7 ACL (root maildir'lerine vmail erişimi) + servis başlatma..."
setfacl -d -m u:vmail:rwx /var/mail/vhosts
setfacl -m u:vmail:rwx /var/mail/vhosts

systemctl enable --now postfix dovecot
systemctl reload postfix
systemctl restart dovecot

echo ""
echo "✅ Mail yığını hazır!"
echo "   SMTP  : 25 (gönderim) · 587 (auth'lu submission)"
echo "   IMAP  : 143 · POP3: 110"
echo "   Hesaplar panelden (WHM → Email Functions) yönetilir."
