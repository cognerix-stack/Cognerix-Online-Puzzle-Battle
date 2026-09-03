package com.cognerix.puzzlebattle;

import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        int statusBarResId = getResources().getIdentifier("status_bar_height", "dimen", "android");
        float density = getResources().getDisplayMetrics().density;
        int statusBarPx = statusBarResId > 0 ? getResources().getDimensionPixelSize(statusBarResId) : (int)(24 * density);
        final float[] safeTopDp = { statusBarPx / density };

        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
                android.view.DisplayCutout cutout = getWindow().getDecorView().getRootWindowInsets() != null ?
                    getWindow().getDecorView().getRootWindowInsets().getDisplayCutout() : null;
                if (cutout != null && cutout.getSafeInsetTop() > 0) {
                    safeTopDp[0] = cutout.getSafeInsetTop() / density;
                }
            }
            hideSystemUI();
            getBridge().getWebView().post(() -> getBridge().getWebView().evaluateJavascript(
                "document.documentElement.style.setProperty('--safe-top', '" + safeTopDp[0] + "px')", null
            ));
        }, 800);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemUI();
    }

    private void hideSystemUI() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            );
        }
    }
}
