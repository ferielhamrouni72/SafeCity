package com.iset.safecity

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.iset.safecity.data.TokenStore
import com.iset.safecity.ui.home.HomeActivity
import com.iset.safecity.ui.login.LoginActivity
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        lifecycleScope.launch {
            val token = TokenStore(applicationContext).token.first()
            val target = if (token != null) HomeActivity::class.java else LoginActivity::class.java
            startActivity(Intent(this@MainActivity, target))
            finish()
        }
    }
}