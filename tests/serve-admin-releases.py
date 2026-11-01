"""Local Stage 3C fixture; in-memory database and fake identity, never production grants."""
import os
import runpy
from pathlib import Path
os.environ.update(VOID_CONTENT_RELEASES_ENABLED='true', VOID_CONTENT_PUBLISHER_UID='owner')
runpy.run_path(str(Path(__file__).with_name('serve-admin-drafts.py')), run_name='__main__')