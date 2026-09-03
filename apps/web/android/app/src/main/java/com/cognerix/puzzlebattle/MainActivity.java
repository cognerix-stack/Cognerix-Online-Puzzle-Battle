package com.cognerix.puzzlebattle;

import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.DisplayCutout;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        hideSystemUI();
        getWindow().getDecorView().postDelayed(() -> {
            float density = getResources().getDisplayMetrics().density;
            int statusBarResId = getResources().getIdentifier("status_bar_height", "dimen", "android");
            int statusBarHeight = statusBarResId > 0 ? getResources().getDimensionPixelSize(statusBarResId) : (int)(24 * density);
            float dp = statusBarHeight / density;
            getBridge().getWebView().evaluateJavascript(
                "document.documentElement.style.setProperty('--safe-top', '" + dp + "px')", null
            );
        }, 500);
        getWindow().getDecorView().setOnApplyWindowInsetsListener((v, insets) -> {
            int cutoutHeight = 0;
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
                DisplayCutout cutout = insets.getDisplayCutout();
                if (cutout != null) {
                    cutoutHeight = cutout.getSafeInsetTop();
                }
            }
            int statusBarHeight = 0;
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                statusBarHeight = insets.getInsets(WindowInsets.Type.statusBars()).top;
            }
            int safeTop = Math.max(cutoutHeight, statusBarHeight);
            final int finalCutout = safeTop;
            getBridge().getWebView().post(() ->
                getBridge().getWebView().evaluateJavascript(
                    "document.documentElement.style.setProperty('--safe-top', '" + finalCutout + "px')", null
                )
            );
            return insets;
        });
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
