package com.iset.safecity.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "session")

class TokenStore(private val context: Context) {
    private val TOKEN = stringPreferencesKey("jwt")
    private val USER_ID = longPreferencesKey("user_id")
    private val FULL_NAME = stringPreferencesKey("full_name")

    val token: Flow<String?> = context.dataStore.data.map { it[TOKEN] }
    val fullName: Flow<String?> = context.dataStore.data.map { it[FULL_NAME] }

    suspend fun save(token: String, userId: Long, fullName: String) {
        context.dataStore.edit {
            it[TOKEN] = token
            it[USER_ID] = userId
            it[FULL_NAME] = fullName
        }
    }

    suspend fun clear() {
        context.dataStore.edit { it.clear() }
    }
}