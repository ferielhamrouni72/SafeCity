package com.iset.safecity.ui.home

import androidx.annotation.ColorRes
import androidx.annotation.DrawableRes
import com.iset.safecity.R

enum class IncidentStatus(
    val label: String,
    @ColorRes val pin: Int,        // couleur de l'épingle sur la carte
    @ColorRes val chipBg: Int,
    @ColorRes val chipText: Int,
    @ColorRes val iconBg: Int,
    @ColorRes val iconTint: Int,
    @DrawableRes val icon: Int
) {
    NOUVEAU("Nouveau", R.color.sc_alert, R.color.sc_alert_soft, R.color.sc_alert, R.color.sc_alert_soft, R.color.sc_alert, R.drawable.ic_alert),
    EN_COURS("En cours", R.color.sc_warning, R.color.sc_warning_soft, R.color.sc_warning_text, R.color.sc_info_soft, R.color.sc_info, R.drawable.ic_alert),
    RESOLU("Résolu", R.color.sc_success, R.color.sc_success_soft, R.color.sc_success_text, R.color.sc_success_soft, R.color.sc_success, R.drawable.ic_check)
}

data class Incident(
    val id: Long,
    val titre: String,
    val rue: String,
    val latitude: Double,
    val longitude: Double,
    val statut: IncidentStatus
)

/**
 * DONNÉES DE DÉMONSTRATION (autour de Tunis centre).
 * À remplacer plus tard par un appel API : GET /api/signalements?lat=..&lon=..
 */
object DemoIncidents {
    val list = listOf(
        Incident(1, "Fuite d'eau", "Rue de la Poste", 36.8025, 10.1815, IncidentStatus.EN_COURS),
        Incident(2, "Arbre tombé", "Av. H. Bourguiba", 36.7957, 10.1815, IncidentStatus.RESOLU),
        Incident(3, "Lampadaire en panne", "Av. de la Liberté", 36.8085, 10.1790, IncidentStatus.NOUVEAU)
    )
}
