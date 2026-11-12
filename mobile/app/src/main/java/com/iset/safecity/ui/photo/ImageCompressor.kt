package com.iset.safecity.ui.photo

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.media.ExifInterface
import android.net.Uri
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import kotlin.math.max

/**
 * Prépare une photo avant l'envoi : réduit à 1600 px max, corrige l'orientation (EXIF)
 * et enregistre en JPEG. Une photo d'appareil de 8 Mo devient ~500 Ko : envoi rapide,
 * et jamais au-dessus de la limite du serveur (5 Mo).
 * À appeler hors du thread principal.
 */
object ImageCompressor {

    private const val MAX_SIDE = 1600
    private const val QUALITY = 85

    fun compress(context: Context, source: Uri): File {
        val resolver = context.contentResolver

        // 1) Dimensions, sans charger l'image en mémoire
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        val input = resolver.openInputStream(source)
            ?: throw IOException("Impossible de lire l'image")
        input.use { BitmapFactory.decodeStream(it, null, bounds) }
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) throw IOException("Image invalide")
        // 2) Décodage déjà réduit (évite de saturer la mémoire avec une photo 48 Mpx)
        var sample = 1
        while (max(bounds.outWidth, bounds.outHeight) / (sample * 2) >= MAX_SIDE) sample *= 2
        val options = BitmapFactory.Options().apply { inSampleSize = sample }
        var bitmap: Bitmap = resolver.openInputStream(source)?.use {
            BitmapFactory.decodeStream(it, null, options)
        } ?: throw IOException("Impossible de décoder l'image")

        // 3) Orientation EXIF (sinon les photos prises en portrait apparaissent couchées)
        val orientation = try {
            resolver.openInputStream(source)?.use {
                ExifInterface(it).getAttributeInt(
                    ExifInterface.TAG_ORIENTATION,
                    ExifInterface.ORIENTATION_NORMAL
                )
            } ?: ExifInterface.ORIENTATION_NORMAL
        } catch (e: IOException) {
            ExifInterface.ORIENTATION_NORMAL
        }

        val matrix = Matrix()
        when (orientation) {
            ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
            ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
            ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
            ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.postScale(-1f, 1f)
            ExifInterface.ORIENTATION_FLIP_VERTICAL -> matrix.postScale(1f, -1f)
            ExifInterface.ORIENTATION_TRANSPOSE -> {
                matrix.postRotate(90f); matrix.postScale(-1f, 1f)
            }
            ExifInterface.ORIENTATION_TRANSVERSE -> {
                matrix.postRotate(-90f); matrix.postScale(-1f, 1f)
            }
        }

        // 4) Réduction finale à 1600 px
        val longest = max(bitmap.width, bitmap.height)
        if (longest > MAX_SIDE) {
            val scale = MAX_SIDE.toFloat() / longest
            matrix.postScale(scale, scale)
        }
        if (!matrix.isIdentity) {
            bitmap = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
        }

        // 5) Le JPEG n'a pas de transparence : fond blanc (sinon un PNG transparent devient noir)
        if (bitmap.hasAlpha()) {
            val flat = Bitmap.createBitmap(bitmap.width, bitmap.height, Bitmap.Config.ARGB_8888)
            Canvas(flat).apply {
                drawColor(Color.WHITE)
                drawBitmap(bitmap, 0f, 0f, null)
            }
            bitmap = flat
        }

        // 6) Écriture en JPEG dans le cache de l'application
        val dir = File(context.cacheDir, "uploads").apply { mkdirs() }
        val out = File.createTempFile("photo_", ".jpg", dir)
        FileOutputStream(out).use { bitmap.compress(Bitmap.CompressFormat.JPEG, QUALITY, it) }
        return out
    }
}
