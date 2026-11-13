package com.iset.safecity.ui.photo

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.iset.safecity.data.ApiClient
import com.iset.safecity.data.IncidentResponse
import com.iset.safecity.data.PhotoRepository
import com.iset.safecity.data.PhotoResult
import com.iset.safecity.data.TokenStore
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

data class PhotoUiState(
    val photoFile: File? = null,          // photo prête à être envoyée (déjà réduite)
    val preparing: Boolean = false,       // réduction en cours
    val uploading: Boolean = false,       // envoi en cours
    val error: String? = null,
    val uploaded: IncidentResponse? = null, // dernier signalement envoyé
    val sessionExpired: Boolean = false,
    // Position GPS
    val locating: Boolean = false,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val accuracyMeters: Int? = null,
    val locationError: String? = null,
    // Type d'incident choisi (valeur de l'enum côté serveur)
    val type: String = "AUTRE"
)

class PhotoViewModel(app: Application) : AndroidViewModel(app) {

    private val store = TokenStore(app.applicationContext)
    private val repo = PhotoRepository(ApiClient.photoApi, store)

    private val _state = MutableStateFlow(PhotoUiState())
    val state: StateFlow<PhotoUiState> = _state

    /** Appelé quand le citoyen a pris ou choisi une image. */
    fun onImageSelected(uri: Uri) {
        _state.value.photoFile?.delete() // on remplace l'ancienne photo
        viewModelScope.launch {
            _state.update { it.copy(photoFile = null, preparing = true, error = null, uploaded = null) }
            try {
                val file = withContext(Dispatchers.IO) {
                    ImageCompressor.compress(getApplication<Application>(), uri)
                }
                _state.update { it.copy(photoFile = file, preparing = false) }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                android.util.Log.e("PhotoViewModel", "Échec de préparation de l'image", e)
                _state.update {
                    it.copy(preparing = false, error = "Impossible de lire cette image. Essayez-en une autre.")
                }
            }
        }
    }

    fun onTypeSelected(type: String) {
        _state.update { it.copy(type = type) }
    }

    fun onLocating() {
        _state.update { it.copy(locating = true, locationError = null) }
    }

    fun onLocation(latitude: Double, longitude: Double, accuracy: Float) {
        _state.update {
            it.copy(
                locating = false,
                latitude = latitude,
                longitude = longitude,
                accuracyMeters = accuracy.toInt(),
                locationError = null
            )
        }
    }

    fun onLocationError(message: String) {
        _state.update { it.copy(locating = false, locationError = message) }
    }

    fun send() {
        val current = _state.value
        val file = current.photoFile ?: return
        val lat = current.latitude ?: return
        val lng = current.longitude ?: return
        if (current.uploading) return

        viewModelScope.launch {
            _state.update { it.copy(uploading = true, error = null) }
            when (val r = repo.report(file, lat, lng, current.type)) {
                is PhotoResult.Success -> {
                    file.delete()
                    _state.update { it.copy(photoFile = null, uploading = false, uploaded = r.report) }
                }
                is PhotoResult.SessionExpired -> {
                    store.clear()
                    _state.update { it.copy(uploading = false, sessionExpired = true) }
                }
                is PhotoResult.Error -> {
                    _state.update { it.copy(uploading = false, error = r.message) }
                }
            }
        }
    }

    fun showError(message: String) {
        _state.update { it.copy(error = message) }
    }
}
