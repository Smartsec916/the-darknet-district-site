"""Local-only integration fixture. No cloud credentials, external writes or on-disk drafts."""
import os
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
from flask import Flask
from test_content_drafts import DB, transactional
import void_runner_api as vr

if __name__ == '__main__':
    os.environ.update(VOID_ADMIN_UIDS='owner',VOID_CONTENT_EDITOR_UID='owner',VOID_CONTENT_DRAFTS_ENABLED='true')
    def verify(token,**kwargs):
        if token not in ['owner','outsider']:raise ValueError('invalid')
        return {'uid':token}
    db=DB()
    app=Flask(__name__,static_folder=str(Path(__file__).resolve().parents[1]),static_url_path='')
    app.register_blueprint(vr.api)
    with patch.object(vr,'services',return_value=(db,SimpleNamespace(verify_id_token=verify),None)), patch('firebase_admin.firestore.transactional',transactional):
        app.run(host='127.0.0.1',port=5196,debug=False)
