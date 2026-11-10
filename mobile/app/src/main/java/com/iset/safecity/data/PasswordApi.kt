package com.iset.safecity.data

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

data class ForgotPasswordRequest(val email: String)
data class ResetPasswordRequest(val token: String, val motDePasse: String)
data class PasswordMessage(val message: String?)

interface PasswordApi {
    @POST("api/auth/mot-de-passe-oublie")
    suspend fun forgot(@Body body: ForgotPasswordRequest): Response<PasswordMessage>

    @POST("api/auth/reinitialiser-mot-de-passe")
    suspend fun reset(@Body body: ResetPasswordRequest): Response<PasswordMessage>
}
