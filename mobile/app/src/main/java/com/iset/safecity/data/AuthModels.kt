package com.iset.safecity.data

data class LoginRequest(
    val email: String,
    val motDePasse: String
)

data class Utilisateur(
    val id: Long,
    val nom: String?,
    val prenom: String?,
    val email: String?,
    val role: String
)

data class LoginResponse(
    val token: String,
    val utilisateur: Utilisateur
)

// Format des erreurs : { "error": { "code": "...", "message": "..." } }
data class ApiError(val error: ErrorBody?)
data class ErrorBody(val code: String?, val message: String?)