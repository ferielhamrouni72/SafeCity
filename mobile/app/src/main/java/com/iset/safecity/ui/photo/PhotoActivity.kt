package com.iset.safecity.ui.photo

import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.iset.safecity.databinding.ActivityPhotoBinding
import com.iset.safecity.ui.login.LoginActivity
import kotlinx.coroutines.launch
import java.io.File

class PhotoActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPhotoBinding
    private val viewModel: PhotoViewModel by viewModels()

    private var cameraUri: Uri? = null   // où l'appareil photo doit écrire
    private var shownFile: File? = null  // évite de recharger l'aperçu inutilement

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
        binding.btnSend.isEnabled = s.photoFile != null && !busy

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
            binding.tvSuccess.text = "Photo envoyée avec succès ✓\nRéférence : #${sent.id}"
        }
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
