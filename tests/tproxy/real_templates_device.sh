#!/system/bin/sh
set -u
BASE=/data/local/tmp/maomao-upstream-overwrite-20261104
YQ=/data/clash/Tools/yq_linux_arm64
export PATH=/data/kano_tproxy_tools/bin:/system/bin:/system/xbin:$PATH
PASS=0
FAIL=0
CORE_PASS=0
for id in 01 02 03 04 05 06 07 08 09 10 11 12; do
  for phase in raw upstream processed; do
    asset="$BASE/cases/$id/$phase"
    root="$asset/runtime"
    mkdir -p "$root/Proxy" "$root/Tools" "$root/Policy" "$root/Scripts" "$root/operation"
    ln -sf "$YQ" "$root/Tools/yq_linux_arm64"
    ln -sf /data/clash/Scripts/clashctl_arm64 "$root/Scripts/clashctl_arm64"
    printf 'mm_overwrite_review\n' > "$root/operation/owner"
    printf 'traffic_mode=tproxy\nipv6=off\ndns_hijack=on\n' > "$root/Policy/options.conf"
    printf 'secret: existing-fixture-key\nproxies: []\n' > "$root/Proxy/config.yaml"
    printf 'KANO_CONFIG_SOURCE=uploaded_config\n' > "$root/Tools/config_source.conf"
    if [ -d "$asset/fixtures" ]; then mkdir -p "$root/Proxy/fixtures"; cp -R "$asset/fixtures/." "$root/Proxy/fixtures/"; fi
    for n in GeoIP.dat GeoSite.dat; do ln -sf "/data/clash/Proxy/$n" "$root/Proxy/$n"; done
    for n in Country.mmdb ASN.mmdb; do ln -sf "$BASE/resources/$n" "$root/Proxy/$n"; done
    ok=1
    # Sort JSON after resolving YAML; sorting shared anchors can change merge precedence.
    "$YQ" e --yaml-fix-merge-anchor-to-spec -o=json -I=0 '.' "$asset/input.yaml" > "$root/reference.json" 2>"$root/parse.log" || ok=0
    "$YQ" e -p=json -o=json -I=0 '.secret = "existing-fixture-key" | sort_keys(..)' "$root/reference.json" > "$root/expected.json" 2>>"$root/parse.log" || ok=0
    for round in 1 2; do
      cp "$asset/input.yaml" "$root/Proxy/stage.yaml"
      CLASH_ROOT="$root" KANO_TPROXY_TASK=mm_overwrite_review F50_OPERATION_LOCK="$root/operation" F50_YQ_RUNTIME="$root/yq-runtime" TARGET="$root/Proxy/config.yaml" STAGE="$root/Proxy/stage.yaml" SOURCE_FILE="$root/Tools/config_source.conf" SOURCE_VALUE=uploaded_config WITH_SOURCE=1 SOURCE_STAGE= SOURCE_DELETE=0 PROTECT_SECRET=1 BACKUP_REQUESTED=0 BACKUP_TAG=review YQ="$YQ" sh "$BASE/component/Scripts/Clash.ConfigCommit" > "$root/commit-$round.log" 2>&1 || ok=0
      "$YQ" e -o=json -I=0 'sort_keys(..)' "$root/Proxy/config.yaml" > "$root/actual.json" 2>>"$root/parse.log" || ok=0
      cmp -s "$root/expected.json" "$root/actual.json" || ok=0
      if [ "$round" = 1 ]; then cp "$root/Proxy/config.yaml" "$root/first.yaml"; else cmp -s "$root/first.yaml" "$root/Proxy/config.yaml" || ok=0; fi
    done
    CLASH_ROOT="$root" sh /data/clash/Scripts/Clash.Service snapshot > "$root/snapshot.out" 2>&1 || ok=0
    sed -n 's/^F50_SNAPSHOT=//p' "$root/snapshot.out" > "$root/snapshot.json"
    "$YQ" e -p=json -e '.configReadStatus == "present" and .secret == "existing-fixture-key"' "$root/snapshot.json" >/dev/null 2>&1 || ok=0
    if [ "$phase" != raw ]; then
      if /data/clash/Proxy/Clash.Core -t -d "$root/Proxy" -f "$root/Proxy/config.yaml" > "$root/core.log" 2>&1; then CORE_PASS=$((CORE_PASS+1)); else ok=0; fi
    fi
    if [ "$ok" = 1 ]; then PASS=$((PASS+1)); printf 'PASS id=%s phase=%s rounds=2 fields=equal snapshot=readable\n' "$id" "$phase"; else FAIL=$((FAIL+1)); printf 'FAIL id=%s phase=%s\n' "$id" "$phase"; fi
  done
done
printf 'SUMMARY pass=%s fail=%s core_pass=%s core_total=24 commits=72\n' "$PASS" "$FAIL" "$CORE_PASS"
if [ "$FAIL" = 0 ] && [ "$PASS" = 36 ] && [ "$CORE_PASS" = 24 ]; then printf 'PASS\n' > "$BASE/result.status"; else printf 'FAIL\n' > "$BASE/result.status"; fi
