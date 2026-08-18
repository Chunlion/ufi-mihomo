#!/usr/bin/env python3
"""Package an Android arm64 sing-box eBPF runtime for the F50 plugin."""

from __future__ import annotations

import argparse
import os
import stat
import tempfile
import zipfile
from pathlib import Path


REQUIRED = ("sing-box", "config.json", "source", "zashboard")


def require_runtime(source: Path) -> None:
    for name in REQUIRED:
        path = source / name
        if not path.exists():
            raise FileNotFoundError(f"missing required runtime entry: {path}")
    if not (source / "sing-box").is_file():
        raise ValueError("sing-box must be a regular file")
    if not (source / "config.json").is_file():
        raise ValueError("config.json must be a regular file")
    if any(path.is_symlink() for path in source.rglob("*")):
        raise ValueError("runtime package must not contain symbolic links")

def package(source: Path, output: Path) -> int:
    require_runtime(source)
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=output.parent, suffix=".zip", delete=False) as handle:
        temporary = Path(handle.name)
    try:
        with zipfile.ZipFile(temporary, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
            for path in sorted(source.rglob("*")):
                if not path.is_file():
                    continue
                relative = path.relative_to(source).as_posix()
                info = zipfile.ZipInfo(f"sing-box/{relative}")
                info.create_system = 3
                mode = 0o755 if relative == "sing-box" else 0o644
                info.external_attr = (stat.S_IFREG | mode) << 16
                info.compress_type = zipfile.ZIP_DEFLATED
                archive.writestr(info, path.read_bytes())
        os.replace(temporary, output)
    except BaseException:
        temporary.unlink(missing_ok=True)
        raise
    return output.stat().st_size


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    size = package(args.source.resolve(), args.output.resolve())
    print(f"built {args.output} ({size} bytes)")


if __name__ == "__main__":
    main()
