package com.iset.safecity.data

import com.google.gson.Gson
import kotlinx.coroutines.flow.first
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File
import java.io.IOException
import java.util.Locale

sealed class PhotoResult {
    data class Success(val report: IncidentResponse) : PhotoResult()
    object SessionExpired : PhotoResult()
    data class Error(val message: String) : PhotoResult()
}

class PhotoRepository(
    private val api: PhotoApi,
    private val store: TokenStore
) {
    private val gson = Gson()

    /** Envoie un signalement : la photo, la position GPS et le type d'incident. */
    suspend fun report(file: File, latitude: Double, longitude: Double, type: String): PhotoResult {
        val token = store.token.first() ?: return PhotoResult.SessionExpired
        return try {
            val parts = listOf(
                MultipartBody.Part.createFormData(
                    "photo", "photo.jpg", file.asRequestBody("image/jpeg".toMediaType())
                ),
                // Locale.US : toujours un point décimal, jamais une virgule
                MultipartBody.Part.createFormData("latitude", String.format(Locale.US, "%.6f", latitude)),
                MultipartBody.Part.createFormData("longitude", String.format(Locale.US, "%.6f", longitude)),
                MultipartBody.Part.createFormData("type", type)
            )
            val res = api.report("Bearer $token", parts)

            if (res.isSuccessful) {
                val body = res.body()
                if (body != null) PhotoResult.Success(body)
                else PhotoResult.Error("Réponse vide du serveur.")
            } else {
                val code = try {
                    gson.fromJson(res.errorBody()?.string(), ApiError::class.java)?.error?.code
                } catch (e: Exception) {
                    null
                }
                when {
                    res.code() == 401 -> PhotoResult.SessionExpired
                    code == "ACCOUNT_SUSPENDED" ->
                        PhotoResult.Error("Votre compte est suspendu. Contactez l'administrateur.")
                    code == "FORBIDDEN" ->
                        PhotoResult.Error("Seuls les citoyens peuvent envoyer un signalement.")
                    code == "FILE_TOO_LARGE" -> PhotoResult.Error("Photo trop volumineuse (5 Mo maximum).")
                    code == "UNSUPPORTED_TYPE" -> PhotoResult.Error("Format non supporté (JPEG, PNG ou WebP).")
                    code == "TOO_MANY_UPLOADS" -> PhotoResult.Error("Trop de signalements. Réessayez plus tard.")
                    code == "VALIDATION_ERROR" -> PhotoResult.Error("Position GPS invalide. Actualisez votre position.")
                    else -> PhotoResult.Error("Erreur serveur (${res.code()}).")
                }
            }
        } catch (e: IOException) {
            PhotoResult.Error("Impossible de joindre le serveur. Vérifiez votre connexion.")
        }
    }
}
