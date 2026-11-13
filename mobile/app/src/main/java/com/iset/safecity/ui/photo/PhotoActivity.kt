package com.iset.safecity.ui.photo

import android.Manifest
import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import com.iset.safecity.databinding.ActivityPhotoBinding
import com.iset.safecity.ui.login.LoginActivity
import kotlinx.coroutines.launch
import java.io.File
import java.util.Locale

class PhotoActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPhotoBinding
    private val viewModel: PhotoViewModel by viewModels()

    private var cameraUri: Uri? = null   // où l'appareil photo doit écrire
    private var shownFile: File? = null  // évite de recharger l'aperçu inutilement
    private lateinit var fused: FusedLocationProviderClient

    // Valeurs attendues par le serveur (enum de la table incident)
    private val types = listOf(
        "Accident" to "ACCIDENT",
        "Incendie" to "INCENDIE",
        "Inondation" to "INONDATION",
        "Fuite d'eau" to "FUITE_EAU",
        "Arbre tombé" to "ARBRE_TOMBE",
        "Nid-de-poule" to "NID_DE_POULE",
        "Infrastructure endommagée" to "INFRASTRUCTURE",
        "Autre" to "AUTRE"
    )

    private val locationPermission =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { res ->
            val ok = res[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
                res[Manifest.permission.ACCESS_COARSE_LOCATION] == true
            if (ok) fetchLocation()
            else viewModel.onLocationError("Autorisez la localisation pour envoyer un signalement.")
        }

    // Galerie : le sélecteur système n'exige aucune permission
    private val pickFromGallery =
        registerForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
            if (uri != null) viewModel.onImageSelected(uri)
        }

    // Appareil photo : le résultat est écrit dans l'Uri fournie
    private val takePicture =
        registerForActivityResult(ActivityResultContracts.TakePicture()) { saved ->
            val uri = cameraUri
            if (saved && uri != null) viewModel.onImageSelected(uri)
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPhotoBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // L'écran peut être recréé pendant que l'appareil photo est ouvert
        savedInstanceState?.getString(KEY_CAMERA_URI)?.let { cameraUri = Uri.parse(it) }

        fused = LocationServices.getFusedLocationProviderClient(this)

        // Choix du type d'incident
        binding.spType.adapter = ArrayAdapter(
            this, android.R.layout.simple_spinner_dropdown_item, types.map { it.first }
        )
        binding.spType.setSelection(types.size - 1) // « Autre » par défaut
        binding.spType.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(p: AdapterView<*>?, v: View?, position: Int, id: Long) {
                viewModel.onTypeSelected(types[position].second)
            }
            override fun onNothingSelected(p: AdapterView<*>?) {}
        }

        binding.tvLocation.setOnClickListener { requestLocation() }
        if (savedInstanceState == null) requestLocation()

        binding.tvBack.setOnClickListener { finish() }
        binding.btnCamera.setOnClickListener { openCamera() }
        binding.btnGallery.setOnClickListener {
            pickFromGallery.launch(
                PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
            )
        }
        binding.btnSend.setOnClickListener { viewModel.send() }

        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.state.collect { render(it) }
            }
        }
    }

    private fun render(s: PhotoUiState) {
        if (s.sessionExpired) {
            // Jeton expiré (2 h) : retour à la connexion
            val intent = Intent(this, LoginActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            startActivity(intent)
            finish()
            return
        }

        val busy = s.preparing || s.uploading
        binding.progress.visibility = if (busy) View.VISIBLE else View.GONE
        binding.btnCamera.isEnabled = !busy
        binding.btnGallery.isEnabled = !busy
        binding.btnSend.isEnabled = s.photoFile != null && s.latitude != null && !busy
        binding.spType.isEnabled = !busy

        // Position GPS
        binding.tvLocation.text = when {
            s.locating -> "📍 Localisation en cours…"
            s.latitude != null && s.longitude != null -> String.format(
                Locale.FRANCE, "📍 Position : %.5f, %.5f (±%d m) — toucher pour actualiser",
                s.latitude, s.longitude, s.accuracyMeters ?: 0
            )
            else -> "📍 ${s.locationError ?: "Position inconnue"} Touchez pour réessayer."
        }

        // Aperçu
        if (s.photoFile != shownFile) {
            shownFile = s.photoFile
            if (s.photoFile != null) {
                binding.ivPreview.setImageURI(Uri.fromFile(s.photoFile))
            } else {
                binding.ivPreview.setImageDrawable(null)
            }
        }
        binding.tvPlaceholder.visibility = if (s.photoFile == null) View.VISIBLE else View.GONE

        // Messages
        binding.tvError.visibility = if (s.error != null) View.VISIBLE else View.GONE
        binding.tvError.text = s.error

        val sent = s.uploaded
        binding.tvSuccess.visibility = if (sent != null) View.VISIBLE else View.GONE
        if (sent != null) {
            binding.tvSuccess.text = "Signalement envoyé ✓\nRéférence : #${sent.id}\nIl apparaît maintenant sur la carte des agents."
        }
    }

    private fun hasLocationPermission(): Boolean =
        ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED ||
        ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED

    private fun requestLocation() {
        if (hasLocationPermission()) {
            fetchLocation()
        } else {
            locationPermission.launch(
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                )
            )
        }
    }

    @SuppressLint("MissingPermission") // la permission est vérifiée dans requestLocation()
    private fun fetchLocation() {
        viewModel.onLocating()
        val notFound = "Position introuvable. Activez le GPS."
        fused.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, CancellationTokenSource().token)
            .addOnSuccessListener { loc ->
                if (loc != null) {
                    viewModel.onLocation(loc.latitude, loc.longitude, loc.accuracy)
                } else {
                    // Repli : dernière position connue du téléphone
                    fused.lastLocation
                        .addOnSuccessListener { last ->
                            if (last != null) viewModel.onLocation(last.latitude, last.longitude, last.accuracy)
                            else viewModel.onLocationError(notFound)
                        }
                        .addOnFailureListener { viewModel.onLocationError(notFound) }
                }
            }
            .addOnFailureListener { viewModel.onLocationError(notFound) }
    }

    private fun openCamera() {
        try {
            val dir = File(cacheDir, "camera").apply { mkdirs() }
            val file = File.createTempFile("capture_", ".jpg", dir)
            val uri = FileProvider.getUriForFile(this, "$packageName.fileprovider", file)
            cameraUri = uri
            takePicture.launch(uri)
        } catch (e: ActivityNotFoundException) {
            viewModel.showError("Aucune application appareil photo trouvée.")
        } catch (e: Exception) {
            viewModel.showError("Impossible d'ouvrir l'appareil photo.")
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        cameraUri?.let { outState.putString(KEY_CAMERA_URI, it.toString()) }
    }

    override fun onDestroy() {
        super.onDestroy()
        // Nettoyage des captures brutes (lourdes) une fois l'écran fermé
        if (isFinishing) File(cacheDir, "camera").deleteRecursively()
    }

    companion object {
        private const val KEY_CAMERA_URI = "camera_uri"
    }
}
