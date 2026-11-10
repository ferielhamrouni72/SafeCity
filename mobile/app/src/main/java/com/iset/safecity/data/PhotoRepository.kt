package com.iset.safecity.data

import com.google.gson.Gson
import kotlinx.coroutines.flow.first
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File
import java.io.IOException

sealed class PhotoResult {
    data class Success(val photo: PhotoResponse) : PhotoResult()
    object SessionExpired : PhotoResult()
    data class Error(val message: String) : PhotoResult()
}

class PhotoRepository(
    private val api: PhotoApi,
    private val store: TokenStore
) {
    private val gson = Gson()

    suspend fun upload(file: File): PhotoResult {
        val token = store.token.first() ?: return PhotoResult.SessionExpired
        return try {
            val body = file.asRequestBody("image/jpeg".toMediaType())
            val part = MultipartBody.Part.createFormData("photo", "photo.jpg", body)
            val res = api.upload("Bearer $token", part)

            if (res.isSuccessful) {
                val photo = res.body()
                if (photo != null) PhotoResult.Success(photo)
                else PhotoResult.Error("Réponse vide du serveur.")
            } else {
                val code = try {
                    gson.fromJson(res.errorBody()?.string(), ApiError::class.java)?.error?.code
                } catch (e: Exception) {
                    null
                }
                when {
                    // 401 : jeton absent, invalide ou expiré (il dure 2 h)
                    res.code() == 401 -> PhotoResult.SessionExpired
                    code == "ACCOUNT_SUSPENDED" ->
                        PhotoResult.Error("Votre compte est suspendu. Contactez l'administrateur.")
                    code == "FORBIDDEN" ->
                        PhotoResult.Error("Seuls les citoyens peuvent envoyer des photos.")
                    code == "FILE_TOO_LARGE" -> PhotoResult.Error("Photo trop volumineuse (5 Mo maximum).")
                    code == "UNSUPPORTED_TYPE" -> PhotoResult.Error("Format non supporté (JPEG, PNG ou WebP).")
                    code == "TOO_MANY_UPLOADS" -> PhotoResult.Error("Trop d'envois. Réessayez dans une heure.")
                    else -> PhotoResult.Error("Erreur serveur (${res.code()}).")
                }
            }
        } catch (e: IOException) {
            PhotoResult.Error("Impossible de joindre le serveur. Vérifiez votre connexion.")
        }
    }
}
