package com.crafti.craftcroustycar

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import org.json.JSONObject
import java.io.File
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

/** Application Android, interface embarquée et rendu 3D hors ligne dans WebView. */
class MainActivity : Activity() {

    private lateinit var browser: WebView
    private val executor = Executors.newSingleThreadExecutor()

    companion object {
        private const val CATALOG_URL =
            "https://raw.githubusercontent.com/Savage3D/car-makes-models-data/master/car-makes.json"
        private const val CACHE_FILE = "car_models_source_2019.json"
        private const val MAX_DOWNLOAD_BYTES = 2_000_000L
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.setStatusBarColor(Color.rgb(7, 19, 32))
        window.setNavigationBarColor(Color.rgb(7, 19, 32))

        browser = WebView(this)
        browser.setBackgroundColor(Color.rgb(7, 17, 29))
        browser.settings.setJavaScriptEnabled(true)
        browser.settings.setDomStorageEnabled(true)
        browser.settings.setAllowFileAccess(true)
        browser.settings.setAllowContentAccess(false)
        // No broad file:// -> remote cross-origin privileges.
        browser.settings.setAllowFileAccessFromFileURLs(false)
        browser.settings.setAllowUniversalAccessFromFileURLs(false)
        browser.settings.setSupportZoom(false)
        browser.addJavascriptInterface(AndroidBridge(), "Native")
        browser.setWebChromeClient(WebChromeClient())
        browser.setWebViewClient(object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url ?: return false
                if (url.scheme == "https" || url.scheme == "http") {
                    openUrl(url.toString())
                    return true
                }
                return !url.toString().startsWith("file:///android_asset/")
            }
        })
        setContentView(browser)
        browser.loadUrl("file:///android_asset/index.html")
    }

    inner class AndroidBridge {
        @JavascriptInterface
        fun requestCatalog() {
            executor.execute {
                // Immediately use the previous successful download when offline.
                val cached = File(filesDir, CACHE_FILE)
                if (cached.isFile) {
                    try { deliver(cached.readText(Charsets.UTF_8), "cache") }
                    catch (_: Exception) { /* fallback catalogue remains available */ }
                }
                try {
                    val connection = (URL(CATALOG_URL).openConnection() as HttpURLConnection).apply {
                        connectTimeout = 8_000
                        readTimeout = 12_000
                        requestMethod = "GET"
                        setRequestProperty("User-Agent", "CraftCroustyCar/1.0 (Android; Crafti)")
                        instanceFollowRedirects = true
                    }
                    try {
                        if (connection.responseCode != 200) return@execute
                        val length = connection.contentLengthLong
                        if (length > MAX_DOWNLOAD_BYTES) return@execute
                        val text = InputStreamReader(connection.inputStream, Charsets.UTF_8).use { reader ->
                            val data = StringBuilder()
                            val block = CharArray(8192)
                            while (true) {
                                val n = reader.read(block)
                                if (n < 0) break
                                data.append(block, 0, n)
                                if (data.length > MAX_DOWNLOAD_BYTES) return@execute
                            }
                            data.toString()
                        }
                        // Verify that a valid JSON document has arrived before overwriting cache.
                        try { org.json.JSONTokener(text).nextValue() }
                        catch (_: Exception) { return@execute }
                        cached.writeText(text, Charsets.UTF_8)
                        deliver(text, "internet")
                    } finally { connection.disconnect() }
                } catch (_: Exception) {
                    // Offline-first: the 2,500+ local name/version entries remain accessible.
                }
            }
        }

        @JavascriptInterface
        fun openExternalPage(url: String) {
            openUrl(url)
        }
    }

    private fun deliver(jsonText: String, origin: String) {
        val script = "window.receiveCatalog(${JSONObject.quote(jsonText)}, ${JSONObject.quote(origin)});"
        runOnUiThread { if (!isFinishing) browser.evaluateJavascript(script, null) }
    }

    private fun openUrl(url: String) {
        val uri = try { Uri.parse(url) } catch (_: Exception) { return }
        if (uri.scheme != "https") return
        runOnUiThread {
            try { startActivity(Intent(Intent.ACTION_VIEW, uri)) }
            catch (_: Exception) { /* no compatible browser */ }
        }
    }

    @Deprecated("Android framework back-navigation override")
    override fun onBackPressed() {
        browser.evaluateJavascript("String(window.craftBack && window.craftBack())") { value ->
            if (value != "\"true\"") super.onBackPressed()
        }
    }

    override fun onDestroy() {
        browser.removeJavascriptInterface("Native")
        browser.destroy()
        executor.shutdownNow()
        super.onDestroy()
    }
}
