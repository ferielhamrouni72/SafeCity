package com.iset.safecity.ui.login

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.iset.safecity.data.ApiClient
import com.iset.safecity.data.AuthRepository
import com.iset.safecity.data.TokenStore
import com.iset.safecity.databinding.ActivityLoginBinding
import com.iset.safecity.ui.home.HomeActivity
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding

    private val viewModel: LoginViewModel by viewModels {
        LoginViewModelFactory(
            AuthRepository(ApiClient.authApi, TokenStore(applicationContext))
        )
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnLogin.setOnClickListener {
            viewModel.login(
                binding.etEmail.text.toString(),
                binding.etPassword.text.toString()
            )
        }

        binding.tvRegister.setOnClickListener {
            // TODO : ouvrir l'écran d'inscription de votre binôme, ex.
            // startActivity(Intent(this, RegisterActivity::class.java))
            Toast.makeText(this, "Inscription : à venir", Toast.LENGTH_SHORT).show()
        }

        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.state.collect { s ->
                    binding.progress.visibility = if (s.loading) View.VISIBLE else View.GONE
                    binding.btnLogin.isEnabled = !s.loading
                    binding.tvError.visibility = if (s.error != null) View.VISIBLE else View.GONE
                    binding.tvError.text = s.error

                    if (s.success) {
                        startActivity(Intent(this@LoginActivity, HomeActivity::class.java))
                        finish()
                    }
                }
            }
        }
    }
}