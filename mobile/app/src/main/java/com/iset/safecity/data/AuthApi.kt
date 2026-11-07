package com.iset.safecity.data

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface AuthApi {
    @POST("api/auth/login")
    suspend fun login(@Body body: LoginRequest): Response<LoginResponse>

    // Inscription publique : le serveur crée toujours un compte CITOYEN
    @POST("api/auth/register-citoyen")
    suspend fun register(@Body body: RegisterRequest): Response<RegisterResponse>
}
