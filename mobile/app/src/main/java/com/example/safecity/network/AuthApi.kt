package com.example.safecity.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

data class RegisterRequest(
    val nom: String,
    val prenom: String,
    val email: String,
    val motDePasse: String,
    val telephone: String? = null
)

data class RegisterResponse(val id: Int, val email: String, val role: String)

data class ApiError(val error: ErrorBody?)
data class ErrorBody(val code: String?, val message: String?)

interface AuthApi {
    @POST("api/auth/register-citoyen")
    suspend fun register(@Body body: RegisterRequest): Response<RegisterResponse>
}