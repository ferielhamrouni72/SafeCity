package com.iset.safecity.data

import okhttp3.MultipartBody
import retrofit2.Response
import retrofit2.http.Header
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part

interface PhotoApi {
    // Le champ multipart doit s'appeler "photo" (c'est ce que lit le serveur)
    @Multipart
    @POST("api/photos")
    suspend fun upload(
        @Header("Authorization") authorization: String,
        @Part photo: MultipartBody.Part
    ): Response<PhotoResponse>

    // Signalement complet : photo + position GPS + type (champs multipart)
    @Multipart
    @POST("api/incidents")
    suspend fun report(
        @Header("Authorization") authorization: String,
        @Part parts: List<MultipartBody.Part>
    ): Response<IncidentResponse>
}
