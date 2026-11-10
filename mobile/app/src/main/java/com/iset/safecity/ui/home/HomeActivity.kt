package com.iset.safecity.ui.home

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.iset.safecity.data.TokenStore
import com.iset.safecity.databinding.ActivityHomeBinding
import com.iset.safecity.ui.login.LoginActivity
import com.iset.safecity.ui.photo.PhotoActivity
import kotlinx.coroutines.launch

class HomeActivity : AppCompatActivity() {

    private lateinit var binding: ActivityHomeBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityHomeBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnPhoto.setOnClickListener {
            startActivity(Intent(this, PhotoActivity::class.java))
        }

        binding.btnLogout.setOnClickListener {
            lifecycleScope.launch {
                TokenStore(applicationContext).clear()
                val intent = Intent(this@HomeActivity, LoginActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                startActivity(intent)
            }
        }
    }
}