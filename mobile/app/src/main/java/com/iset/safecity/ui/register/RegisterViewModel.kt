package com.iset.safecity.ui.register

import android.util.Patterns
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.iset.safecity.data.AuthRepository
import com.iset.safecity.data.RegisterRequest
import com.iset.safecity.data.RegisterResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class RegisterUiState(
    val loading: Boolean = false,
    val error: String? = null,
    val success: Boolean = false
)

class RegisterViewModel(private val repo: AuthRepository) : ViewModel() {

    private val _state = MutableStateFlow(RegisterUiState())
    val state: StateFlow<RegisterUiState> = _state

    fun register(
        prenom: String,
        nom: String,
        email: String,
        telephone: String,
        password: String,
        confirmation: String
    ) {
        val erreur = valider(prenom, nom, email, password, confirmation)
        if (erreur != null) {
            _state.value = RegisterUiState(error = erreur)
            return
        }
        viewModelScope.launch {
            _state.value = RegisterUiState(loading = true)
            val request = RegisterRequest(
                nom = nom,
                prenom = prenom,
                email = email,
                motDePasse = password,
                telephone = telephone.ifBlank { null }
            )
            _state.value = when (val r = repo.register(request)) {
                is RegisterResult.Success -> RegisterUiState(success = true)
                is RegisterResult.Error -> RegisterUiState(error = r.message)
            }
        }
    }

    private fun valider(
        prenom: String,
        nom: String,
        email: String,
        password: String,
        confirmation: String
    ): String? = when {
        prenom.isBlank() || nom.isBlank() -> "Saisissez votre prénom et votre nom."
        !Patterns.EMAIL_ADDRESS.matcher(email.trim()).matches() -> "Adresse e-mail invalide."
        password.length < 8 -> "Le mot de passe doit contenir au moins 8 caractères."
        // bcrypt ne lit que 72 OCTETS (les accents/emojis comptent pour plusieurs)
        password.toByteArray(Charsets.UTF_8).size > 72 -> "Mot de passe trop long (72 octets maximum)."
        password != confirmation -> "Les mots de passe ne correspondent pas."
        else -> null
    }
}

class RegisterViewModelFactory(private val repo: AuthRepository) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T = RegisterViewModel(repo) as T
}
