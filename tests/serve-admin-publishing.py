"""Local-only, explicit fake publisher for end-to-end tests. No production credentials."""
import os
import runpy
from pathlib import Path
os.environ.update(VOID_CONTENT_RELEASES_ENABLED='true',VOID_CONTENT_PUBLISHER_UID='owner',
                  VOID_CONTENT_PUBLISHING_ENABLED='true',VOID_CONTENT_SERVING_ENABLED='true',VOID_ADMIN_TEST_PORT='5198')
runpy.run_path(str(Path(__file__).with_name('serve-admin-drafts.py')),run_name='__main__')