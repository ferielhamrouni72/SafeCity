package com.iset.safecity.data

// Réponse du serveur après l'envoi d'une photo : { id, url, typeMime, taille }
data class PhotoResponse(
    val id: Long,
    val url: String,
    val typeMime: String,
    val taille: Long
)

// Réponse du serveur après la création d'un signalement : { id, titre, type, latitude, longitude }
data class IncidentResponse(
    val id: Long,
    val titre: String,
    val type: String,
    val latitude: Double,
    val longitude: Double
)
