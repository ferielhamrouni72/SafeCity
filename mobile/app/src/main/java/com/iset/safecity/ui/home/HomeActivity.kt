package com.iset.safecity.ui.home

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.drawable.Drawable
import android.content.Context
import android.location.Location
import android.location.LocationManager
import android.os.Looper
import android.provider.Settings
import android.os.Bundle
import android.view.MotionEvent
import android.widget.Toast
import androidx.activity.SystemBarStyle
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.ColorRes
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.content.res.AppCompatResources
import androidx.core.content.ContextCompat
import androidx.core.graphics.drawable.DrawableCompat
import androidx.core.location.LocationManagerCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding
import androidx.lifecycle.lifecycleScope
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.gms.location.FusedLocationProviderClient
import com.iset.safecity.R
import com.iset.safecity.data.TokenStore
import com.iset.safecity.databinding.ActivityHomeBinding
import com.iset.safecity.ui.login.LoginActivity
import com.iset.safecity.ui.photo.PhotoActivity
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.CustomZoomButtonsController
import org.osmdroid.views.overlay.CopyrightOverlay
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.Polygon
import java.io.File
import java.util.Locale
import kotlin.math.roundToInt

class HomeActivity : AppCompatActivity() {

    private lateinit var binding: ActivityHomeBinding
    private lateinit var fused: FusedLocationProviderClient
    private var userMarker: Marker? = null
    private var accuracyCircle: Polygon? = null
    private var lastLocation: Location? = null
    private var updating = false
    private var firstFixDone = false
    private var warnedAccuracy = false

    // Centre par défaut (Tunis) UNIQUEMENT tant que la vraie position n'est pas connue
    private val defaultCenter = GeoPoint(36.8065, 10.1815)

    private val locationCallback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
            result.lastLocation?.let { onNewLocation(it) }
        }
    }

    private val locationPermission =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { res ->
            val fine = res[Manifest.permission.ACCESS_FINE_LOCATION] == true
            val coarse = res[Manifest.permission.ACCESS_COARSE_LOCATION] == true
            when {
                fine -> ensureLocation()
                coarse -> {
                    toast("Position approximative seulement. Choisissez « Précise » pour plus de précision.")
                    ensureLocation()
                }
                else -> toast("Autorisez la localisation pour voir les incidents près de vous.")
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // IMPORTANT : configurer osmdroid AVANT d'inflater la vue qui contient la MapView
        configureOsmdroid()
        fused = LocationServices.getFusedLocationProviderClient(this)

        // Barre d'état transparente, icônes claires (le bandeau du haut est vert foncé)
        enableEdgeToEdge(statusBarStyle = SystemBarStyle.dark(Color.TRANSPARENT))

        binding = ActivityHomeBinding.inflate(layoutInflater)
        setContentView(binding.root)

        applyInsets()
        loadUser()
        setupMap()
        setupClicks()
        ensureLocation()
    }

    // ------------------------------------------------------------------ UI

    private fun applyInsets() {
        ViewCompat.setOnApplyWindowInsetsListener(binding.root) { _, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            binding.header.updatePadding(top = bars.top + 12.dp())
            binding.bottomBar.updatePadding(bottom = bars.bottom + 8.dp())
            insets
        }
    }

    private fun loadUser() {
        lifecycleScope.launch {
            val full = TokenStore(applicationContext).fullName.first().orEmpty().trim()
            val parts = full.split(" ").filter { it.isNotBlank() }
            val prenom = parts.firstOrNull().orEmpty()
            binding.tvEyebrow.text =
                if (prenom.isEmpty()) "BONJOUR" else "BONJOUR ${prenom.uppercase(Locale.FRENCH)}"
            binding.tvAvatar.text = parts.take(2)
                .map { it.first().uppercaseChar() }
                .joinToString("")
                .ifEmpty { "?" }
        }
    }

    private fun setupClicks() {
        val openReport = { startActivity(Intent(this, PhotoActivity::class.java)) }
        binding.btnReport.setOnClickListener { openReport() }
        binding.fabReport.setOnClickListener { openReport() }

        binding.btnLocate.setOnClickListener { ensureLocation(centerOnUser = true) }

        // Écrans pas encore faits
        val soon = { toast("Bientôt disponible") }
        binding.btnBell.setOnClickListener { soon() }
        binding.tvSeeMap.setOnClickListener { soon() }
        binding.navFollow.setOnClickListener { soon() }

        // Profil / avatar : pour l'instant, on y met la déconnexion
        binding.tvAvatar.setOnClickListener { confirmLogout() }
        binding.navProfile.setOnClickListener { confirmLogout() }
    }

    private fun confirmLogout() {
        MaterialAlertDialogBuilder(this)
            .setTitle("Se déconnecter ?")
            .setNegativeButton("Annuler", null)
            .setPositiveButton("Se déconnecter") { _, _ ->
                lifecycleScope.launch {
                    TokenStore(applicationContext).clear()
                    val intent = Intent(this@HomeActivity, LoginActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    startActivity(intent)
                }
            }
            .show()
    }

    // ----------------------------------------------------------------- MAP

    private fun configureOsmdroid() {
        val cfg = Configuration.getInstance()
        cfg.load(applicationContext, getSharedPreferences("osmdroid", MODE_PRIVATE))
        cfg.userAgentValue = packageName // obligatoire, sinon les tuiles OSM sont refusées
        val base = File(cacheDir, "osmdroid")
        cfg.osmdroidBasePath = base
        cfg.osmdroidTileCache = File(base, "tiles")
    }

    private fun setupMap() {
        val map = binding.mapView
        map.setTileSource(TileSourceFactory.MAPNIK)
        map.setMultiTouchControls(true)
        map.isTilesScaledToDpi = true
        map.zoomController.setVisibility(CustomZoomButtonsController.Visibility.NEVER)
        map.minZoomLevel = 5.0
        map.controller.setZoom(15.5)
        map.controller.setCenter(defaultCenter)

        // Style doux, proche de la maquette : on désature et on éclaircit les tuiles
        val soft = ColorMatrix().apply { setSaturation(0.3f) }
        soft.postConcat(
            ColorMatrix(
                floatArrayOf(
                    0.85f, 0f, 0f, 0f, 38f,
                    0f, 0.85f, 0f, 0f, 38f,
                    0f, 0f, 0.85f, 0f, 38f,
                    0f, 0f, 0f, 1f, 0f
                )
            )
        )
        map.overlayManager.tilesOverlay.setColorFilter(ColorMatrixColorFilter(soft))

        // La carte est dans un ScrollView : on empêche le scroll de voler le déplacement de la carte
        map.setOnTouchListener { v, ev ->
            when (ev.actionMasked) {
                MotionEvent.ACTION_DOWN, MotionEvent.ACTION_MOVE ->
                    v.parent.requestDisallowInterceptTouchEvent(true)
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL ->
                    v.parent.requestDisallowInterceptTouchEvent(false)
            }
            false
        }

        // Mention légale obligatoire d'OpenStreetMap
        map.overlays.add(CopyrightOverlay(this))

        DemoIncidents.list.forEach { inc ->
            val marker = Marker(map).apply {
                position = GeoPoint(inc.latitude, inc.longitude)
                setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
                icon = tintedIcon(R.drawable.ic_pin, inc.statut.pin)
                title = inc.titre
                snippet = inc.rue
            }
            map.overlays.add(marker)
        }
    }

    private fun hasLocationPermission(): Boolean =
        ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) ==
                PackageManager.PERMISSION_GRANTED ||
                ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) ==
                PackageManager.PERMISSION_GRANTED

    private fun ensureLocation(centerOnUser: Boolean = false) {
        if (!hasLocationPermission()) {
            locationPermission.launch(
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                )
            )
            return
        }

        // Localisation désactivée dans les réglages du téléphone ?
        val lm = getSystemService(Context.LOCATION_SERVICE) as LocationManager
        if (!LocationManagerCompat.isLocationEnabled(lm)) {
            MaterialAlertDialogBuilder(this)
                .setTitle("Localisation désactivée")
                .setMessage("Activez la localisation du téléphone pour afficher votre position réelle.")
                .setNegativeButton("Plus tard", null)
                .setPositiveButton("Ouvrir les réglages") { _, _ ->
                    startActivity(Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS))
                }
                .show()
            return
        }

        startLocation()

        if (centerOnUser) {
            val loc = lastLocation
            if (loc != null) {
                binding.mapView.controller.setZoom(16.0)
                binding.mapView.controller.animateTo(GeoPoint(loc.latitude, loc.longitude))
            } else {
                toast("Recherche de votre position…")
            }
        }
    }

    @SuppressLint("MissingPermission")
    private fun startLocation() {
        if (updating || !hasLocationPermission()) return
        updating = true

        // Mises à jour continues (la position suit le téléphone)
        val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 3000L)
            .setMinUpdateIntervalMillis(1500L)
            .build()
        fused.requestLocationUpdates(request, locationCallback, Looper.getMainLooper())

        // Première position le plus vite possible
        fused.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, CancellationTokenSource().token)
            .addOnSuccessListener { loc -> loc?.let { onNewLocation(it) } }
    }

    private fun stopLocation() {
        fused.removeLocationUpdates(locationCallback)
        updating = false
    }

    private fun onNewLocation(loc: Location) {
        lastLocation = loc
        val p = GeoPoint(loc.latitude, loc.longitude)
        showUserOnMap(p, loc.accuracy)

        if (!firstFixDone) {
            firstFixDone = true
            binding.mapView.controller.setZoom(16.0)
            binding.mapView.controller.animateTo(p)
            toast("Position trouvée (± ${loc.accuracy.roundToInt()} m)")
        }
        if (loc.accuracy > 100f && !warnedAccuracy) {
            warnedAccuracy = true
            toast("Position peu précise. Placez-vous près d'une fenêtre ou dehors.")
        }
    }

    /** Point « vous êtes ici » + cercle de précision, déplacés à chaque nouvelle position. */
    private fun showUserOnMap(p: GeoPoint, accuracyMeters: Float) {
        val map = binding.mapView
        if (userMarker == null) {
            val circle = Polygon(map).apply {
                fillPaint.color = 0x220D6670
                outlinePaint.color = 0x550D6670
                outlinePaint.strokeWidth = 2f
                setInfoWindow(null)
            }
            val marker = Marker(map).apply {
                icon = AppCompatResources.getDrawable(this@HomeActivity, R.drawable.ic_user_dot)
                setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_CENTER)
                setInfoWindow(null)
            }
            map.overlays.add(circle)
            map.overlays.add(marker)
            accuracyCircle = circle
            userMarker = marker
        }
        accuracyCircle?.points = Polygon.pointsAsCircle(p, accuracyMeters.toDouble())
        userMarker?.position = p
        map.invalidate()
    }

    private fun tintedIcon(drawableRes: Int, @ColorRes color: Int): Drawable {
        val d = DrawableCompat.wrap(AppCompatResources.getDrawable(this, drawableRes)!!.mutate())
        DrawableCompat.setTint(d, ContextCompat.getColor(this, color))
        return d
    }

    // ------------------------------------------------------------ LIFECYCLE

    override fun onResume() {
        super.onResume()
        binding.mapView.onResume()
        if (hasLocationPermission()) startLocation()
    }

    override fun onPause() {
        stopLocation()
        binding.mapView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        binding.mapView.onDetach()
        super.onDestroy()
    }

    // -------------------------------------------------------------- HELPERS

    private fun Int.dp(): Int = (this * resources.displayMetrics.density).toInt()

    private fun toast(msg: String) = Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
}