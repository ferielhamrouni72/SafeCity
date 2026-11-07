package com.iset.safecity.data

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST
import java.util.concurrent.TimeUnit

data class ForgotPasswordRequest(val email: String)
data class ResetPasswordRequest(val token: String, val motDePasse: String)
data class PasswordMessage(val message: String?)
data class PasswordApiError(val error: PasswordErrorBody?)
data class PasswordErrorBody(val code: String?, val message: String?)

interface PasswordApi {
    @POST("api/auth/mot-de-passe-oublie")
    suspend fun forgot(@Body body: ForgotPasswordRequest): Response<PasswordMessage>

    @POST("api/auth/reinitialiser-mot-de-passe")
    suspend fun reset(@Body body: ResetPasswordRequest): Response<PasswordMessage>
}

object PasswordClient {
    // Même adresse que le reste de l'app (adb reverse). À unifier avec la config de ta binôme.
    private const val BASE_URL = "http://localhost:3000/"

    // BASIC : jamais BODY, il écrirait les mots de passe dans Logcat
    private val logging = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BASIC
    }

    private val client = OkHttpClient.Builder()
        .addInterceptor(logging)
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .build()

    val api: PasswordApi by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(PasswordApi::class.java)
    }
}