package com.darknetdistrict.companionstudio;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Toast;

/** Uses a real browser session so Google OAuth, file pickers and IndexedDB remain available. */
public final class StudioActivity extends Activity {
    private static final String STUDIO = "https://thedarknetdistrict.com/vr-companion-studio.html";

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(STUDIO));
        Bundle extras = new Bundle();
        extras.putBinder("android.support.customtabs.extra.SESSION", null);
        extras.putInt("android.support.customtabs.extra.TOOLBAR_COLOR", 0xff081522);
        extras.putBoolean("android.support.customtabs.extra.TITLE_VISIBILITY", true);
        intent.putExtras(extras);
        try {
            startActivity(intent);
        } catch (ActivityNotFoundException exception) {
            Toast.makeText(this, "Install or enable a web browser to open Companion Studio.", Toast.LENGTH_LONG).show();
        }
        finish();
    }
}
