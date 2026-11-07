package com.iset.safecity.ui.register

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.iset.safecity.data.ApiClient
import com.iset.safecity.data.AuthRepository
import com.iset.safecity.data.TokenStore
import com.iset.safecity.databinding.ActivityRegisterBinding
import com.iset.safecity.ui.login.LoginActivity
import kotlinx.coroutines.launch

class RegisterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegisterBinding

    private val viewModel: RegisterViewModel by viewModels {
        RegisterViewModelFactory(
            AuthRepository(ApiClient.authApi, TokenStore(applicationContext))
        )
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnRegister.setOnClickListener {
            viewModel.register(
                prenom = binding.etPrenom.text.toString(),
                nom = binding.etNom.text.toString(),
                email = binding.etEmail.text.toString(),
                telephone = binding.etTelephone.text.toString(),
                // jamais "trimé" : les espaces font partie du mot de passe
                password = binding.etPassword.text.toString(),
                confirmation = binding.etConfirm.text.toString()
            )
        }

        binding.tvLogin.setOnClickListener { finish() }

        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.state.collect { s ->
                    binding.progress.visibility = if (s.loading) View.VISIBLE else View.GONE
                    binding.btnRegister.isEnabled = !s.loading
                    binding.tvError.visibility = if (s.error != null) View.VISIBLE else View.GONE
                    binding.tvError.text = s.error

                    if (s.success) {
                        // Retour à la connexion, e-mail pré-rempli
                        val intent = Intent(this@RegisterActivity, LoginActivity::class.java)
                            .putExtra(LoginActivity.EXTRA_EMAIL, binding.etEmail.text.toString().trim())
                            .putExtra(LoginActivity.EXTRA_REGISTERED, true)
                        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                        startActivity(intent)
                        finish()
                    }
                }
            }
        }
    }
}
