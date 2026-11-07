package com.example.safecity

import android.os.Bundle
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.lifecycleScope
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.TextInputEditText
import com.google.gson.Gson
import com.example.safecity.network.ApiClient
import com.example.safecity.network.ApiError
import com.example.safecity.network.RegisterRequest
import kotlinx.coroutines.launch
import java.io.IOException

class RegisterActivity : AppCompatActivity() {

    private lateinit var btnInscription: MaterialButton
    private lateinit var progress: ProgressBar
    private lateinit var tvErreur: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_register)

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.scroll)) { v, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            insets
        }

        btnInscription = findViewById(R.id.btnInscription)
        progress = findViewById(R.id.progress)
        tvErreur = findViewById(R.id.tvErreur)

        btnInscription.setOnClickListener { inscrire() }
    }

    private fun texte(id: Int): String =
        findViewById<TextInputEditText>(id).text?.toString()?.trim().orEmpty()

    private fun inscrire() {
        val request = RegisterRequest(
            nom = texte(R.id.etNom),
            prenom = texte(R.id.etPrenom),
            email = texte(R.id.etEmail),
            // Le mot de passe n'est jamais "trimé" : les espaces en font partie
            motDePasse = findViewById<TextInputEditText>(R.id.etMotDePasse).text?.toString().orEmpty(),
            telephone = texte(R.id.etTelephone).ifEmpty { null }
        )

        afficherErreur(null)
        chargement(true)

        lifecycleScope.launch {
            try {
                val reponse = ApiClient.auth.register(request)
                if (reponse.isSuccessful) {
                    Toast.makeText(this@RegisterActivity, "Compte créé", Toast.LENGTH_LONG).show()
                } else {
                    afficherErreur(messagePour(codeErreur(reponse.errorBody()?.string())))
                }
            } catch (e: IOException) {
                afficherErreur("Serveur injoignable. Vérifiez votre connexion.")
            } finally {
                chargement(false)
            }
        }
    }

    private fun codeErreur(corps: String?): String? = try {
        Gson().fromJson(corps, ApiError::class.java)?.error?.code
    } catch (e: Exception) {
        null
    }

    private fun messagePour(code: String?): String = when (code) {
        "VALIDATION_ERROR" -> "Vérifiez les champs (mot de passe : 8 caractères minimum)."
        "EMAIL_EXISTS" -> "Cet e-mail est déjà utilisé."
        else -> "Une erreur est survenue. Réessayez."
    }

    private fun afficherErreur(message: String?) {
        tvErreur.text = message
        tvErreur.visibility = if (message == null) View.GONE else View.VISIBLE
    }

    private fun chargement(actif: Boolean) {
        btnInscription.isEnabled = !actif
        progress.visibility = if (actif) View.VISIBLE else View.GONE
    }
}