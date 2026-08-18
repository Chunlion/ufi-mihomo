#!/usr/bin/env python3
"""Build the Android/Linux helper variants and refresh their package entries."""

from __future__ import annotations

import argparse
import os
import stat
import subprocess
import tempfile
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HELPER_DIR = ROOT / "binary-helper"
DIST_DIR = ROOT / "dist"
PACKAGE = ROOT / "tproxy-yq.zip"
TARGETS = {
    "arm64": ("arm64", None, "kano-f50-helper-linux-arm64", "Tools/kano-f50-helper-bundled"),
}
PACKAGE_HELPER_ENTRIES = {
    "Tools/kano-f50-helper-bundled",
    "Tools/kano-f50-helper-bundled-armv7",
}


def build_helpers() -> dict[str, Path]:
    DIST_DIR.mkdir(exist_ok=True)
    outputs: dict[str, Path] = {}
    for name, (goarch, goarm, filename, _) in TARGETS.items():
        output = DIST_DIR / filename
        env = os.environ.copy()
        env.update({"CGO_ENABLED": "0", "GOOS": "linux", "GOARCH": goarch})
        if goarm:
            env["GOARM"] = goarm
        else:
            env.pop("GOARM", None)
        subprocess.run(
            ["go", "build", "-trimpath", "-ldflags=-s -w", "-o", str(output), "."],
            cwd=HELPER_DIR,
            env=env,
            check=True,
        )
        outputs[name] = output
    return outputs


def refresh_package(outputs: dict[str, Path]) -> None:
    if not PACKAGE.is_file():
        raise FileNotFoundError(f"installation package is missing: {PACKAGE}")
    replacements = {TARGETS[name][3]: output for name, output in outputs.items()}
    with tempfile.NamedTemporaryFile(dir=PACKAGE.parent, suffix=".zip", delete=False) as tmp_file:
        temporary = Path(tmp_file.name)
    try:
        with zipfile.ZipFile(PACKAGE, "r") as source, zipfile.ZipFile(temporary, "w") as target:
            target.comment = source.comment
            for info in source.infolist():
                if info.filename not in PACKAGE_HELPER_ENTRIES:
                    target.writestr(info, source.read(info.filename))
            for archive_name, output in replacements.items():
                info = zipfile.ZipInfo(archive_name)
                info.create_system = 3
                info.external_attr = (stat.S_IFREG | 0o755) << 16
                info.compress_type = zipfile.ZIP_DEFLATED
                target.writestr(info, output.read_bytes())
        os.replace(temporary, PACKAGE)
    except BaseException:
        temporary.unlink(missing_ok=True)
        raise


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-package", action="store_true")
    args = parser.parse_args()
    outputs = build_helpers()
    if not args.skip_package:
        refresh_package(outputs)
    print("built " + ", ".join(str(path.relative_to(ROOT)) for path in outputs.values()))


if __name__ == "__main__":
    main()
