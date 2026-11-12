package com.iset.safecity.data

// Réponse du serveur après l'envoi d'une photo : { id, url, typeMime, taille }
data class PhotoResponse(
    val id: Long,
    val url: String,
    val typeMime: String,
    val taille: Long
)
