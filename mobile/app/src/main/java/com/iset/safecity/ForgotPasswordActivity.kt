package com.iset.safecity


import android.graphics.Color
import android.os.Bundle
import android.util.Log
import android.util.Patterns
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.lifecycleScope
import com.iset.safecity.data.ForgotPasswordRequest
import com.iset.safecity.data.ApiClient
import com.iset.safecity.ui.login.LoginActivity
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import kotlinx.coroutines.launch
import java.io.IOException

class ForgotPasswordActivity : AppCompatActivity() {

    private lateinit var tilEmail: TextInputLayout
    private lateinit var etEmail: TextInputEditText
    private lateinit var tvMessage: TextView
    private lateinit var btnEnvoyer: MaterialButton
    private lateinit var progress: ProgressBar

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_forgot_password)

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.scroll)) { v, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            insets
        }

        tilEmail = findViewById(R.id.tilEmail)
        etEmail = findViewById(R.id.etEmail)
        tvMessage = findViewById(R.id.tvMessage)
        btnEnvoyer = findViewById(R.id.btnEnvoyer)
        progress = findViewById(R.id.progress)

        intent.getStringExtra(LoginActivity.EXTRA_EMAIL)?.takeIf { it.isNotBlank() }?.let { etEmail.setText(it) }

        btnEnvoyer.setOnClickListener { envoyer() }
        findViewById<TextView>(R.id.tvRetour).setOnClickListener { finish() }
    }

    private fun envoyer() {
        val email = etEmail.text?.toString()?.trim().orEmpty()
        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            tilEmail.error = "Entrez une adresse e-mail valide."
            return
        }
        tilEmail.error = null
        afficher(null, false)
        chargement(true)

        lifecycleScope.launch {
            try {
                val reponse = ApiClient.passwordApi.forgot(ForgotPasswordRequest(email))
                when {
                    reponse.isSuccessful -> afficher(
                        "Si un compte existe pour cette adresse, un lien de réinitialisation vient d’être envoyé. Pensez à vérifier vos courriers indésirables.",
                        false
                    )
                    reponse.code() == 400 -> afficher("Adresse e-mail invalide.", true)
                    else -> afficher("Une erreur est survenue. Réessayez.", true)
                }
            } catch (e: IOException) {
                Log.e("SafeCityForgot", "Échec réseau", e)
                afficher("Serveur injoignable. Vérifiez votre connexion.", true)
            } finally {
                chargement(false)
            }
        }
    }

    private fun afficher(message: String?, erreur: Boolean) {
        tvMessage.text = message
        tvMessage.setTextColor(Color.parseColor(if (erreur) "#DC2626" else "#0B6469"))
        tvMessage.visibility = if (message == null) View.GONE else View.VISIBLE
    }

    private fun chargement(actif: Boolean) {
        btnEnvoyer.isEnabled = !actif
        progress.visibility = if (actif) View.VISIBLE else View.GONE
    }
}