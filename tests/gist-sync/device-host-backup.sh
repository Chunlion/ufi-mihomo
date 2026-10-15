set -e
umask 077
app=/data/data/com.minikano.f50_sms
backup=$(cat /data/local/tmp/maomao-rc4-backup.path)
case "$backup" in /data/local/tmp/maomao-rc4-backup-*) ;; *) exit 1;; esac
find "$app/files" "$app/shared_prefs" -maxdepth 3 -type f \( -name '*.xml' -o -name '*.json' -o -name '*.html' -o -name '*.js' -o -name '*.txt' \) -exec grep -l 'F50_COMPAT_VERSION' '{}' + > "$backup/plugin-setting-files.txt"
count=0
while IFS= read -r path; do
 case "$path" in "$app/files/"*|"$app/shared_prefs/"*) ;; *) exit 1;; esac
 rel=${path#"$app/"}
 mkdir -p "$backup/host-settings/$(dirname "$rel")"
 cp -p "$path" "$backup/host-settings/$rel"
 [ "$(sha256sum "$path" | awk '{print $1}')" = "$(sha256sum "$backup/host-settings/$rel" | awk '{print $1}')" ] || exit 1
 count=$((count+1))
done < "$backup/plugin-setting-files.txt"
[ "$count" -gt 0 ] || { echo HOST_PLUGIN_SETTINGS_NOT_LOCATED=1; exit 1; }
echo HOST_SETTING_BACKUP_COUNT=$count
echo HOST_SETTING_BACKUP_VERIFIED=1
