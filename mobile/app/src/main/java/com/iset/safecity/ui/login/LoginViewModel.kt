package com.iset.safecity.ui.login

import android.util.Patterns
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.iset.safecity.data.AuthRepository
import com.iset.safecity.data.LoginResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class LoginUiState(
    val loading: Boolean = false,
    val error: String? = null,
    val success: Boolean = false
)

class LoginViewModel(private val repo: AuthRepository) : ViewModel() {

    private val _state = MutableStateFlow(LoginUiState())
    val state: StateFlow<LoginUiState> = _state

    fun login(email: String, password: String) {
        if (!Patterns.EMAIL_ADDRESS.matcher(email.trim()).matches()) {
            _state.value = LoginUiState(error = "Adresse e-mail invalide.")
            return
        }
        if (password.isBlank()) {
            _state.value = LoginUiState(error = "Saisissez votre mot de passe.")
            return
        }
        viewModelScope.launch {
            _state.value = LoginUiState(loading = true)
            _state.value = when (val r = repo.login(email, password)) {
                is LoginResult.Success -> LoginUiState(success = true)
                is LoginResult.Error -> LoginUiState(error = r.message)
            }
        }
    }
}

class LoginViewModelFactory(private val repo: AuthRepository) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T = LoginViewModel(repo) as T
}