package com.iset.safecity.data

import com.google.gson.Gson
import java.io.IOException

sealed class LoginResult {
    object Success : LoginResult()
    data class Error(val message: String) : LoginResult()
}

sealed class RegisterResult {
    object Success : RegisterResult()
    data class Error(val message: String) : RegisterResult()
}

class AuthRepository(
    private val api: AuthApi,
    private val store: TokenStore
) {
    private val gson = Gson()

    suspend fun login(email: String, password: String): LoginResult = try {
        val res = api.login(LoginRequest(email.trim().lowercase(), password))

        if (res.isSuccessful) {
            val body = res.body()
            when {
                body == null ->
                    LoginResult.Error("Réponse invalide du serveur.")
                !body.utilisateur.role.equals("CITOYEN", ignoreCase = true) ->
                    LoginResult.Error("Cette application est réservée aux citoyens.")
                else -> {
                    val u = body.utilisateur
                    val name = listOfNotNull(u.prenom, u.nom).joinToString(" ")
                    store.save(body.token, u.id, name)
                    LoginResult.Success
                }
            }
        } else {
            val code = try {
                gson.fromJson(res.errorBody()?.string(), ApiError::class.java)?.error?.code
            } catch (e: Exception) {
                null
            }
            when (code) {
                "INVALID_CREDENTIALS" -> LoginResult.Error("E-mail ou mot de passe incorrect.")
                "ACCOUNT_SUSPENDED" -> LoginResult.Error("Votre compte est suspendu. Contactez l'administrateur.")
                "VALIDATION_ERROR" -> LoginResult.Error("Données invalides. Vérifiez votre e-mail.")
                else -> LoginResult.Error("Erreur serveur (${res.code()}).")
            }
        }
    } catch (e: IOException) {
        LoginResult.Error("Impossible de joindre le serveur. Vérifiez votre connexion.")
    }

    suspend fun register(request: RegisterRequest): RegisterResult = try {
        val res = api.register(
            request.copy(
                nom = request.nom.trim(),
                prenom = request.prenom.trim(),
                email = request.email.trim().lowercase(),
                telephone = request.telephone?.trim()?.ifEmpty { null }
                // le mot de passe n'est jamais "trimé" : les espaces en font partie
            )
        )
        if (res.isSuccessful) {
            RegisterResult.Success
        } else {
            val code = try {
                gson.fromJson(res.errorBody()?.string(), ApiError::class.java)?.error?.code
            } catch (e: Exception) {
                null
            }
            when (code) {
                "EMAIL_EXISTS" -> RegisterResult.Error("Cet e-mail est déjà utilisé.")
                "VALIDATION_ERROR" -> RegisterResult.Error("Données invalides. Vérifiez les champs saisis.")
                else -> RegisterResult.Error("Erreur serveur (${res.code()}).")
            }
        }
    } catch (e: IOException) {
        RegisterResult.Error("Impossible de joindre le serveur. Vérifiez votre connexion.")
    }
}
